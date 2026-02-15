/**
 * Why this exists:
 * This local-only server is the core of the backoffice subproject. It exposes
 * controlled CRUD endpoints for `public/content/*.json` and controlled image
 * uploads to `public/images`, so non-technical users can manage content safely.
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { createServer } from 'node:http'
import { mkdir, readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HOST = process.env.BACKOFFICE_HOST ?? '127.0.0.1'
const PORT = Number(process.env.BACKOFFICE_PORT ?? 4310)
const BODY_LIMIT_BYTES = 20 * 1024 * 1024

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(currentDir, '..')
const staticDir = path.join(currentDir, 'public')
const contentDir = path.join(projectRoot, 'public', 'content')
const imagesDir = path.join(projectRoot, 'public', 'images')
const execFileAsync = promisify(execFile)

/**
 * Why this mapping exists:
 * Each content JSON usually owns a specific image folder. Uploading based on
 * the active JSON file keeps assets organized and predictable.
 */
const IMAGE_FOLDER_BY_FILE = {
  'book.json': 'books',
  'contact.json': 'common',
  'home.json': 'root',
  'moonlight.json': 'moonlight',
  'painted-books.json': 'painted-books',
  'posts.json': 'posts',
  'publishers.json': 'publishers',
  'services.json': 'services',
  'site.json': 'root',
  'timeline.json': 'books',
}

const ALLOWED_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.jfif', '.webp', '.svg'])

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'content-type': MIME_TYPES['.json'] })
  res.end(JSON.stringify(payload))
}

function sendText(res, statusCode, message) {
  res.writeHead(statusCode, { 'content-type': 'text/plain; charset=utf-8' })
  res.end(message)
}

function getSafeContentPath(relativePath) {
  const requestedPath = decodeURIComponent(relativePath).replace(/^\/+/, '')
  if (!requestedPath.endsWith('.json')) {
    throw new Error('Only .json files are supported.')
  }

  const fullPath = path.resolve(contentDir, requestedPath)
  if (!fullPath.startsWith(`${contentDir}${path.sep}`) && fullPath !== contentDir) {
    throw new Error('Invalid file path.')
  }

  return fullPath
}

function getSafeImagePath(publicImagePath) {
  const requestedPath = decodeURIComponent(publicImagePath).replace(/^\/+/, '')
  const normalizedPath = requestedPath.startsWith('images/')
    ? requestedPath
    : `images/${requestedPath}`
  const fullPath = path.resolve(path.join(projectRoot, 'public'), normalizedPath)

  if (!fullPath.startsWith(`${imagesDir}${path.sep}`) && fullPath !== imagesDir) {
    throw new Error('Invalid image path.')
  }

  return fullPath
}

async function listJsonFiles(dir, baseDir = dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...(await listJsonFiles(absolutePath, baseDir)))
      continue
    }

    if (!entry.name.endsWith('.json')) continue

    const relativePath = path.relative(baseDir, absolutePath)
    files.push(relativePath.split(path.sep).join('/'))
  }

  return files.sort((left, right) => left.localeCompare(right))
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

  const finalName = safeName || 'upload'
  return `${finalName}${safeExt}`
}

function getImageFolderForFile(activeFile) {
  const fileName = path.basename(activeFile || '')
  const folder = IMAGE_FOLDER_BY_FILE[fileName]
  if (!folder) throw new Error('Unsupported content file for image uploads.')
  return folder
}

function getRelativeOptimizerPath(absoluteImagePath) {
  return path.relative(imagesDir, absoluteImagePath).split(path.sep).join('/')
}

async function runOptimizerForImage(absoluteImagePath) {
  const relativePath = getRelativeOptimizerPath(absoluteImagePath)
  const scriptPath = path.join(projectRoot, 'scripts', 'optimize-images.js')
  await execFileAsync(process.execPath, [scriptPath, '--file', relativePath], {
    cwd: projectRoot,
    maxBuffer: 1024 * 1024,
  })
}

async function deleteImageWithVariants(publicPath) {
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
    // Ignore directory read errors because the primary file deletion still runs below.
  }

  await Promise.all(
    Array.from(candidates).map(async (filePath) => {
      try {
        await unlink(filePath)
      } catch {
        // Ignore missing files to keep replacement idempotent.
      }
    }),
  )
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''

    req.on('data', (chunk) => {
      body += chunk

      if (Buffer.byteLength(body) > BODY_LIMIT_BYTES) {
        reject(new Error('Payload too large.'))
      }
    })

    req.on('end', () => {
      try {
        resolve(JSON.parse(body))
      } catch {
        reject(new Error('Request body must be valid JSON.'))
      }
    })

    req.on('error', () => reject(new Error('Failed to read request body.')))
  })
}

async function uploadImage(body) {
  const activeFile = String(body.activeFile ?? '')
  const originalName = String(body.fileName ?? '')
  const fileDataBase64 = String(body.fileDataBase64 ?? '')
  const folder = getImageFolderForFile(activeFile)
  const safeFileName = sanitizeFileName(originalName)
  const uniqueName = `${path.parse(safeFileName).name}-${Date.now()}${path.parse(safeFileName).ext}`
  const outputDir = folder === 'root' ? imagesDir : path.join(imagesDir, folder)
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

async function serveStaticFile(res, requestPath) {
  const normalizedPath = requestPath === '/' ? '/index.html' : requestPath
  const safePath = normalizedPath.replace(/^\/+/, '')
  const absolutePath = path.join(staticDir, safePath)

  if (!absolutePath.startsWith(`${staticDir}${path.sep}`) && absolutePath !== staticDir) {
    sendText(res, 400, 'Invalid path.')
    return
  }

  try {
    const fileMeta = await stat(absolutePath)
    if (!fileMeta.isFile()) {
      sendText(res, 404, 'Not found.')
      return
    }

    const ext = path.extname(absolutePath)
    const mimeType = MIME_TYPES[ext] ?? 'application/octet-stream'
    const fileContent = await readFile(absolutePath)
    res.writeHead(200, { 'content-type': mimeType })
    res.end(fileContent)
  } catch {
    sendText(res, 404, 'Not found.')
  }
}

const server = createServer(async (req, res) => {
  if (!req.url || !req.method) {
    sendText(res, 400, 'Bad request.')
    return
  }

  const url = new URL(req.url, `http://${req.headers.host ?? `${HOST}:${PORT}`}`)
  const pathname = url.pathname
  const method = req.method.toUpperCase()

  try {
    if (method === 'GET' && pathname === '/api/files') {
      const files = await listJsonFiles(contentDir)
      sendJson(res, 200, { files })
      return
    }

    if (pathname.startsWith('/api/files/')) {
      const relativePath = pathname.replace('/api/files/', '')
      const filePath = getSafeContentPath(relativePath)

      if (method === 'GET') {
        const fileContent = await readFile(filePath, 'utf-8')
        const parsed = JSON.parse(fileContent)
        sendJson(res, 200, { file: relativePath, content: parsed })
        return
      }

      if (method === 'PUT') {
        const body = await readJsonBody(req)
        const hasContentEnvelope =
          body &&
          typeof body === 'object' &&
          !Array.isArray(body) &&
          Object.hasOwn(body, 'content')
        const nextContent = hasContentEnvelope ? body.content : body
        const deletedImages =
          body && typeof body === 'object' && Array.isArray(body.deletedImages)
            ? body.deletedImages
            : []
        const serialized = `${JSON.stringify(nextContent, null, 2)}\n`
        await writeFile(filePath, serialized, 'utf-8')
        await Promise.all(deletedImages.map((imagePath) => deleteImageWithVariants(imagePath)))
        sendJson(res, 200, { ok: true, file: relativePath })
        return
      }
    }

    if (method === 'POST' && pathname === '/api/upload-image') {
      const body = await readJsonBody(req)
      const uploaded = await uploadImage(body)
      sendJson(res, 200, uploaded)
      return
    }

    if (pathname.startsWith('/api/')) {
      sendJson(res, 404, { error: 'Not found.' })
      return
    }

    await serveStaticFile(res, pathname)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    sendJson(res, 400, { error: message })
  }
})

server.listen(PORT, HOST, () => {
  console.log(`Backoffice running on http://${HOST}:${PORT}`)
})
