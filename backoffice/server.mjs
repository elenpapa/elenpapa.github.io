/**
 * Why this exists:
 * Server bootstrap is intentionally minimal so all operational logic lives in
 * dedicated modules under `backoffice/server/` as the project scales.
 */
import { createServer } from 'node:http'
import { HOST, PORT } from './server/config.mjs'
import { handleRequest } from './server/request-handler.mjs'

const server = createServer(handleRequest)

server.listen(PORT, HOST, () => {
  console.log(`Backoffice running on http://${HOST}:${PORT}`)
})
