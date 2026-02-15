/**
 * Why this exists:
 * Request routing is centralized here so endpoint growth stays manageable and
 * service modules can be tested/reused independently from HTTP wiring.
 */
import { BODY_LIMIT_BYTES, HOST, PORT, paths } from './config.mjs'
import { listJsonFiles, readContentFile, writeContentFile } from './services/content-files.mjs'
import {
  createReviewBranchAndPush,
  getGitStatusSummary,
  getSessionChangePreview,
} from './services/git.mjs'
import { buildImageIndex, deleteImageWithVariants, uploadImage } from './services/images.mjs'
import { serveFileFromBaseDir } from './services/static-files.mjs'
import {
  HttpError,
  assertJsonRequest,
  isHttpError,
  readJsonBody,
  sendJson,
  sendText,
} from './utils/http.mjs'

function extractContentPayload(body) {
  const hasContentEnvelope =
    body && typeof body === 'object' && !Array.isArray(body) && Object.hasOwn(body, 'content')
  return hasContentEnvelope ? body.content : body
}

function extractDeletedImages(body) {
  if (body && typeof body === 'object' && Array.isArray(body.deletedImages)) {
    const unique = new Set()
    body.deletedImages.forEach((item) => {
      if (typeof item !== 'string') return
      if (!item.startsWith('/images/')) return
      unique.add(item)
    })
    return Array.from(unique)
  }
  return []
}

/**
 * Why this exists:
 * Backoffice endpoints mutate repository files and can run on shared networks,
 * so mutating API calls are restricted to same-origin browser requests.
 */
function assertSameOriginForMutation(req, method, pathname) {
  if (!pathname.startsWith('/api/')) return
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return

  const originHeader = String(req.headers.origin ?? '').trim()
  if (!originHeader) return
  const hostHeader = String(req.headers.host ?? '').trim()
  if (!hostHeader) return

  let originHost = ''
  try {
    originHost = new URL(originHeader).host
  } catch {
    throw new HttpError(403, 'Invalid request origin.')
  }

  if (originHost !== hostHeader) {
    throw new HttpError(403, 'Cross-origin mutation requests are blocked.')
  }
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
    assertSameOriginForMutation(req, method, pathname)

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

    if (method === 'GET' && pathname === '/api/git/status') {
      const status = await getGitStatusSummary()
      sendJson(res, 200, { status })
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
        assertJsonRequest(req)
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
      assertJsonRequest(req)
      const body = await readJsonBody(req, BODY_LIMIT_BYTES)
      const uploaded = await uploadImage(body)
      sendJson(res, 200, uploaded)
      return
    }

    if (method === 'POST' && pathname === '/api/git/preview') {
      assertJsonRequest(req)
      const body = await readJsonBody(req, BODY_LIMIT_BYTES)
      const preview = await getSessionChangePreview(body.sessionPaths)
      sendJson(res, 200, { preview })
      return
    }

    if (method === 'POST' && pathname === '/api/git/finalize') {
      assertJsonRequest(req)
      const body = await readJsonBody(req, BODY_LIMIT_BYTES)
      const result = await createReviewBranchAndPush(body.sessionPaths)
      sendJson(res, 200, { result })
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
    if (isHttpError(error)) {
      sendJson(res, error.statusCode, { error: message })
      return
    }
    console.error('Backoffice request error:', error)
    sendJson(res, 400, { error: message })
  }
}
