/**
 * Why this exists:
 * Image indexing, uploads, optimization triggers, and replacement cleanup are
 * grouped here so asset lifecycle logic stays isolated from request routing.
 */
import { execFile } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'
import { mkdir, readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import { ALLOWED_IMAGE_EXTENSIONS, IMAGE_FOLDER_BY_FILE } from '../constants.mjs'
import { paths } from '../config.mjs'
import { listJsonFiles } from './content-files.mjs'
import { getSafeContentPath, getSafeImagePath } from '../utils/path-guards.mjs'

const execFileAsync = promisify(execFile)

export async function listImageFiles(dir = paths.imagesDir, baseDir = dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await listImageFiles(absolutePath, baseDir)))
      continue
    }

    const extension = path.extname(entry.name).toLowerCase()
    if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) continue

    files.push(path.relative(baseDir, absolutePath).split(path.sep).join('/'))
  }

  return files.sort((left, right) => left.localeCompare(right))
}

function collectImageUsages(value, jsonPath, output = []) {
  if (typeof value === 'string' && value.startsWith('/images/')) {
    output.push({ imagePath: value, jsonPath })
    return output
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectImageUsages(item, `${jsonPath}[${index}]`, output))
    return output
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      const nextPath = jsonPath ? `${jsonPath}.${key}` : key
      collectImageUsages(item, nextPath, output)
    })
  }

  return output
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function normalizeSearchTerm(value) {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase()
}

function imageMatchesQuery(image, query) {
  if (!query) return true
  const usageHaystack = image.usages
    .map((usage) => `${usage.file} ${usage.jsonPath}`.toLocaleLowerCase())
    .join(' ')
  const haystack =
    `${image.name} ${image.relativePath} ${image.publicPath} ${image.section} ${usageHaystack}`.toLocaleLowerCase()
  return haystack.includes(query)
}

export async function buildImageIndex(searchTerm = '') {
  const query = normalizeSearchTerm(searchTerm)
  const files = await listJsonFiles(paths.contentDir)
  const usageByImage = new Map()

  for (const file of files) {
    const fullPath = getSafeContentPath(file)
    const rawContent = await readFile(fullPath, 'utf-8')
    const parsed = JSON.parse(rawContent)
    const usages = collectImageUsages(parsed, '')
    usages.forEach((usage) => {
      if (!usageByImage.has(usage.imagePath)) {
        usageByImage.set(usage.imagePath, [])
      }
      usageByImage.get(usage.imagePath).push({ file, jsonPath: usage.jsonPath })
    })
  }

  const imageFiles = await listImageFiles(paths.imagesDir)
  const images = []

  for (const relativePath of imageFiles) {
    const fullPath = path.join(paths.imagesDir, relativePath)
    const fileStats = await stat(fullPath)
    const section = relativePath.includes('/') ? relativePath.split('/')[0] : 'root'
    const publicPath = `/images/${relativePath}`.replace(/\\/g, '/')
    const image = {
      section,
      name: path.basename(relativePath),
      relativePath,
      publicPath,
      bytes: fileStats.size,
      sizeLabel: formatBytes(fileStats.size),
      usages: usageByImage.get(publicPath) ?? [],
    }
    if (imageMatchesQuery(image, query)) images.push(image)
  }

  return images
}

function sanitizeFileName(filename) {
  const parsed = path.parse(filename)
  const safeName = parsed.name
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}._-]+/gu, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '')
  const safeExt = parsed.ext.toLowerCase()

  if (!ALLOWED_IMAGE_EXTENSIONS.has(safeExt)) {
    throw new Error(`Unsupported image extension "${parsed.ext}".`)
  }

  return `${safeName || 'upload'}${safeExt}`
}

function getImageFolderForFile(activeFile) {
  const fileName = path.basename(activeFile || '')
  const folder = IMAGE_FOLDER_BY_FILE[fileName]
  if (!folder) throw new Error('Unsupported content file for image uploads.')
  return folder
}

function getRelativeOptimizerPath(absoluteImagePath) {
  return path.relative(paths.imagesDir, absoluteImagePath).split(path.sep).join('/')
}

async function runOptimizerForImage(absoluteImagePath) {
  const relativePath = getRelativeOptimizerPath(absoluteImagePath)
  const scriptPath = path.join(paths.projectRoot, 'scripts', 'optimize-images.js')
  await execFileAsync(process.execPath, [scriptPath, '--file', relativePath], {
    cwd: paths.projectRoot,
    maxBuffer: 1024 * 1024,
  })
}

export async function uploadImage(body) {
  const activeFile = String(body.activeFile ?? '')
  const originalName = String(body.fileName ?? '')
  const fileDataBase64 = String(body.fileDataBase64 ?? '')
  const folder = getImageFolderForFile(activeFile)
  const safeFileName = sanitizeFileName(originalName)
  const uniqueName = `${path.parse(safeFileName).name}-${Date.now()}${path.parse(safeFileName).ext}`
  const outputDir = folder === 'root' ? paths.imagesDir : path.join(paths.imagesDir, folder)
  const outputPath = path.join(outputDir, uniqueName)
  const relativeForPublic = folder === 'root' ? uniqueName : `${folder}/${uniqueName}`
  const publicImagePath = `/images/${relativeForPublic}`.replace(/\\/g, '/')

  if (!fileDataBase64) throw new Error('Image data is missing.')

  const rawBuffer = Buffer.from(fileDataBase64, 'base64')
  if (!rawBuffer.byteLength) throw new Error('Image payload is empty.')

  await mkdir(outputDir, { recursive: true })
  await writeFile(outputPath, rawBuffer)
  try {
    await runOptimizerForImage(outputPath)
  } catch {
    await unlink(outputPath).catch(() => {})
    throw new Error('Image uploaded, but optimization failed.')
  }

  return { imagePath: publicImagePath }
}

export async function deleteImageWithVariants(publicPath) {
  if (!publicPath || typeof publicPath !== 'string' || !publicPath.startsWith('/images/')) return

  const targetPath = getSafeImagePath(publicPath)
  const directory = path.dirname(targetPath)
  const basename = path.parse(targetPath).name
  const ext = path.extname(targetPath)
  const candidates = new Set([
    targetPath,
    path.join(directory, `${basename}.webp`),
    path.join(directory, `${basename}${ext}`),
  ])

  try {
    const filesInDir = await readdir(directory)
    const escapedBaseName = basename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const responsiveVariantPattern = new RegExp(`^${escapedBaseName}-\\d+w\\.webp$`, 'i')
    for (const fileName of filesInDir) {
      if (responsiveVariantPattern.test(fileName)) {
        candidates.add(path.join(directory, fileName))
      }
    }
  } catch {
    // Directory read errors can be ignored because individual deletes below are idempotent.
  }

  await Promise.all(
    Array.from(candidates).map(async (filePath) => {
      try {
        await unlink(filePath)
      } catch {
        // Ignore missing files to keep cleanup idempotent.
      }
    }),
  )
}
