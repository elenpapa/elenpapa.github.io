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
const IMAGE_INDEX_CONCURRENCY = 10
const OPTIMIZER_TIMEOUT_MS = 120_000
const MAX_UPLOAD_BYTES = 12 * 1024 * 1024
const ORIGINAL_PATH_RULES = [
  { file: 'site.json', pattern: /^logo\.src$/ },
  { file: 'site.json', pattern: /^seo\./ },
]
const FOLDER_OVERRIDE_RULES = [
  { file: 'site.json', pattern: /^seo\.pages\.[^.]+\.image$/, folder: 'og' },
]

/**
 * Why this exists:
 * Backoffice indexing can touch many files, so bounded concurrency improves
 * responsiveness without opening an unbounded number of file descriptors.
 */
async function mapWithConcurrency(items, concurrency, mapper) {
  if (!items.length) return []
  const safeConcurrency = Math.max(1, Math.min(concurrency, items.length))
  const results = new Array(items.length)
  let cursor = 0

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await mapper(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: safeConcurrency }, () => worker()))
  return results
}

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
  const allUsagesByFile = await mapWithConcurrency(files, IMAGE_INDEX_CONCURRENCY, async (file) => {
    const fullPath = getSafeContentPath(file)
    try {
      const rawContent = await readFile(fullPath, 'utf-8')
      const parsed = JSON.parse(rawContent)
      return { file, usages: collectImageUsages(parsed, '') }
    } catch {
      // Ignore unreadable/invalid files here so one broken JSON does not block image browsing.
      return { file, usages: [] }
    }
  })

  allUsagesByFile.forEach(({ file, usages }) => {
    usages.forEach((usage) => {
      if (!usageByImage.has(usage.imagePath)) {
        usageByImage.set(usage.imagePath, [])
      }
      usageByImage.get(usage.imagePath).push({ file, jsonPath: usage.jsonPath })
    })
  })

  const imageFiles = await listImageFiles(paths.imagesDir)
  const images = await mapWithConcurrency(
    imageFiles,
    IMAGE_INDEX_CONCURRENCY,
    async (relativePath) => {
      const fullPath = path.join(paths.imagesDir, relativePath)
      try {
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
        return imageMatchesQuery(image, query) ? image : null
      } catch {
        return null
      }
    },
  )

  return images.filter(Boolean)
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

function isRuleMatch({ rules, fileName, fieldPath }) {
  return rules.some((rule) => rule.file === fileName && rule.pattern.test(fieldPath))
}

function resolveFolderFromPreviousPath(previousImagePath) {
  if (typeof previousImagePath !== 'string' || !previousImagePath.startsWith('/images/')) {
    return ''
  }

  const relativePath = previousImagePath.replace(/^\/images\//, '')
  const normalizedPath = path.posix.normalize(relativePath)
  if (!normalizedPath || normalizedPath.startsWith('../') || normalizedPath.includes('/../')) {
    return ''
  }

  const directory = path.posix.dirname(normalizedPath)
  return directory === '.' ? 'root' : directory
}

/**
 * Why this exists:
 * Image destinations are mostly inferred from the active JSON file, but a few
 * fields (for example SEO OpenGraph images) need explicit folder overrides.
 */
function resolveUploadFolder({ activeFile, fieldPath, previousImagePath }) {
  const fileName = path.basename(activeFile || '')
  const normalizedFieldPath = String(fieldPath ?? '').trim()
  const previousFolder = resolveFolderFromPreviousPath(previousImagePath)
  if (previousFolder) return previousFolder

  const matchingOverride = FOLDER_OVERRIDE_RULES.find(
    (rule) => rule.file === fileName && rule.pattern.test(normalizedFieldPath),
  )
  if (matchingOverride) return matchingOverride.folder

  return getImageFolderForFile(activeFile)
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
    timeout: OPTIMIZER_TIMEOUT_MS,
  })
}

function toWebpPublicPath(publicPath) {
  const parsed = path.posix.parse(publicPath)
  return path.posix.join(parsed.dir, `${parsed.name}.webp`)
}

async function hasImageAtPublicPath(publicPath) {
  try {
    await stat(getSafeImagePath(publicPath))
    return true
  } catch {
    return false
  }
}

/**
 * Why this exists:
 * Some JSON fields must keep original files (SEO/logo compatibility), while
 * most content images should reference optimized `.webp` outputs by default.
 */
function shouldKeepOriginalPath({ activeFile, fieldPath }) {
  const fileName = path.basename(activeFile || '')
  const normalizedFieldPath = String(fieldPath ?? '').trim()
  return isRuleMatch({
    rules: ORIGINAL_PATH_RULES,
    fileName,
    fieldPath: normalizedFieldPath,
  })
}

function stripQueryAndHash(value) {
  return String(value ?? '')
    .split('#')[0]
    .split('?')[0]
}

function isSupportedPublicImagePath(value) {
  if (typeof value !== 'string' || !value.startsWith('/')) return false
  if (value.startsWith('/content/')) return false
  return /\.(png|jpe?g|jfif|webp|svg)$/i.test(stripQueryAndHash(value))
}

/**
 * Why this exists:
 * Deletions must support both `/images/*` and root-level public images such as
 * `/logo.png`, while still preventing traversal outside `public/`.
 */
function resolveSafeImageDeletePath(publicPath) {
  const cleanPath = stripQueryAndHash(publicPath)
  if (!isSupportedPublicImagePath(cleanPath)) {
    throw new Error('Invalid image path for deletion.')
  }
  if (cleanPath.startsWith('/images/')) {
    return getSafeImagePath(cleanPath)
  }

  const relativePath = cleanPath.replace(/^\/+/, '')
  const fullPath = path.resolve(paths.publicDir, relativePath)
  if (!fullPath.startsWith(`${paths.publicDir}${path.sep}`) && fullPath !== paths.publicDir) {
    throw new Error('Invalid image path.')
  }
  if (fullPath.startsWith(`${paths.contentDir}${path.sep}`) || fullPath === paths.contentDir) {
    throw new Error('Cannot delete content files as images.')
  }
  return fullPath
}

export async function uploadImage(body) {
  const activeFile = String(body.activeFile ?? '')
  const fieldPath = String(body.fieldPath ?? '')
  const previousImagePath = String(body.previousImagePath ?? '')
  const originalName = String(body.fileName ?? '')
  const fileDataBase64 = String(body.fileDataBase64 ?? '')
  const folder = resolveUploadFolder({ activeFile, fieldPath, previousImagePath })
  const safeFileName = sanitizeFileName(originalName)
  const uniqueName = `${path.parse(safeFileName).name}-${Date.now()}${path.parse(safeFileName).ext}`
  const outputDir = folder === 'root' ? paths.imagesDir : path.join(paths.imagesDir, folder)
  const outputPath = path.join(outputDir, uniqueName)
  const relativeForPublic = folder === 'root' ? uniqueName : `${folder}/${uniqueName}`
  const publicImagePath = `/images/${relativeForPublic}`.replace(/\\/g, '/')

  if (!fileDataBase64) throw new Error('Image data is missing.')

  const rawBuffer = Buffer.from(fileDataBase64, 'base64')
  if (!rawBuffer.byteLength) throw new Error('Image payload is empty.')
  if (rawBuffer.byteLength > MAX_UPLOAD_BYTES) {
    throw new Error('Image is too large. Maximum upload size is 12 MB.')
  }

  await mkdir(outputDir, { recursive: true })
  await writeFile(outputPath, rawBuffer)
  try {
    await runOptimizerForImage(outputPath)
  } catch {
    await unlink(outputPath).catch(() => {})
    throw new Error('Image uploaded, but optimization failed.')
  }

  const keepOriginalPath = shouldKeepOriginalPath({ activeFile, fieldPath })
  if (keepOriginalPath || publicImagePath.endsWith('.svg') || publicImagePath.endsWith('.webp')) {
    return { imagePath: publicImagePath }
  }

  const optimizedPublicPath = toWebpPublicPath(publicImagePath)
  if (await hasImageAtPublicPath(optimizedPublicPath)) {
    return { imagePath: optimizedPublicPath }
  }

  return { imagePath: publicImagePath }
}

export async function deleteImageWithVariants(publicPath) {
  if (!isSupportedPublicImagePath(publicPath)) return
  const targetPath = resolveSafeImageDeletePath(publicPath)
  const directory = path.dirname(targetPath)
  const basename = path.parse(targetPath).name
  const candidates = new Set([targetPath])
  ALLOWED_IMAGE_EXTENSIONS.forEach((ext) => {
    candidates.add(path.join(directory, `${basename}${ext}`))
  })

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
