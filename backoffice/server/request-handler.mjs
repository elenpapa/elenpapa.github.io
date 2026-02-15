/**
 * Why this exists:
 * Request routing is centralized here so endpoint growth stays manageable and
 * service modules can be tested/reused independently from HTTP wiring.
 */
import { BODY_LIMIT_BYTES, HOST, PORT, paths } from './config.mjs'
import { listJsonFiles, readContentFile, writeContentFile } from './services/content-files.mjs'
import { buildImageIndex, deleteImageWithVariants, uploadImage } from './services/images.mjs'
import { serveFileFromBaseDir } from './services/static-files.mjs'
import { sendJson, sendText, readJsonBody } from './utils/http.mjs'

function extractContentPayload(body) {
  const hasContentEnvelope =
    body && typeof body === 'object' && !Array.isArray(body) && Object.hasOwn(body, 'content')
  return hasContentEnvelope ? body.content : body
}

function extractDeletedImages(body) {
  if (body && typeof body === 'object' && Array.isArray(body.deletedImages)) {
    return body.deletedImages
  }
  return []
}

export async function handleRequest(req, res) {
  if (!req.url || !req.method) {
    sendText(res, 400, 'Bad request.')
    return
  }

  const url = new URL(req.url, `http://${req.headers.host ?? `${HOST}:${PORT}`}`)
  const pathname = url.pathname
  const method = req.method.toUpperCase()

  try {
    if (method === 'GET' && pathname === '/api/files') {
      const files = await listJsonFiles(paths.contentDir)
      sendJson(res, 200, { files })
      return
    }

    if (method === 'GET' && pathname === '/api/images') {
      const query = url.searchParams.get('q') ?? ''
      const images = await buildImageIndex(query)
      sendJson(res, 200, { images })
      return
    }

    if (pathname.startsWith('/api/files/')) {
      const relativePath = pathname.replace('/api/files/', '')

      if (method === 'GET') {
        const content = await readContentFile(relativePath)
        sendJson(res, 200, { file: relativePath, content })
        return
      }

      if (method === 'PUT') {
        const body = await readJsonBody(req, BODY_LIMIT_BYTES)
        const nextContent = extractContentPayload(body)
        const deletedImages = extractDeletedImages(body)
        await writeContentFile(relativePath, nextContent)
        await Promise.all(deletedImages.map((imagePath) => deleteImageWithVariants(imagePath)))
        sendJson(res, 200, { ok: true, file: relativePath })
        return
      }
    }

    if (method === 'POST' && pathname === '/api/upload-image') {
      const body = await readJsonBody(req, BODY_LIMIT_BYTES)
      const uploaded = await uploadImage(body)
      sendJson(res, 200, uploaded)
      return
    }

    if (pathname.startsWith('/api/')) {
      sendJson(res, 404, { error: 'Not found.' })
      return
    }

    if (pathname.startsWith('/images/')) {
      const servedFromPublic = await serveFileFromBaseDir(res, paths.publicDir, pathname)
      if (!servedFromPublic) sendText(res, 404, 'Not found.')
      return
    }

    const servedFromBackoffice = await serveFileFromBaseDir(res, paths.staticDir, pathname)
    if (!servedFromBackoffice) sendText(res, 404, 'Not found.')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    sendJson(res, 400, { error: message })
  }
}
