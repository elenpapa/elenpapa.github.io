/**
 * Why this exists:
 * HTTP response and body parsing helpers are reused by multiple endpoints; this
 * module avoids repeated low-level request/response boilerplate.
 */
import { MIME_TYPES } from '../constants.mjs'

/**
 * Why this exists:
 * API handlers need predictable error-to-status mapping so validation issues
 * return clear client feedback without turning every failure into a 500.
 */
export class HttpError extends Error {
  constructor(statusCode, message) {
    super(message)
    this.name = 'HttpError'
    this.statusCode = statusCode
  }
}

export function isHttpError(error) {
  return error instanceof HttpError
}

export function assertJsonRequest(req) {
  const header = String(req.headers['content-type'] ?? '').toLowerCase()
  if (!header.includes('application/json')) {
    throw new HttpError(415, 'Request content type must be application/json.')
  }
}

export function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'content-type': MIME_TYPES['.json'] })
  res.end(JSON.stringify(payload))
}

export function sendText(res, statusCode, message) {
  res.writeHead(statusCode, { 'content-type': 'text/plain; charset=utf-8' })
  res.end(message)
}

export function readJsonBody(req, bodyLimitBytes) {
  return new Promise((resolve, reject) => {
    let body = ''
    let completed = false

    const fail = (error) => {
      if (completed) return
      completed = true
      reject(error)
    }

    req.on('data', (chunk) => {
      if (completed) return
      body += chunk
      if (Buffer.byteLength(body) > bodyLimitBytes) {
        req.destroy()
        fail(new HttpError(413, 'Payload too large.'))
      }
    })

    req.on('end', () => {
      if (completed) return
      try {
        if (!body.trim()) {
          completed = true
          resolve({})
          return
        }
        completed = true
        resolve(JSON.parse(body))
      } catch {
        fail(new HttpError(400, 'Request body must be valid JSON.'))
      }
    })

    req.on('error', () => fail(new HttpError(400, 'Failed to read request body.')))
  })
}
