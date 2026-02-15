/**
 * Why this exists:
 * HTTP response and body parsing helpers are reused by multiple endpoints; this
 * module avoids repeated low-level request/response boilerplate.
 */
import { MIME_TYPES } from '../constants.mjs'

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

    req.on('data', (chunk) => {
      body += chunk
      if (Buffer.byteLength(body) > bodyLimitBytes) {
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
