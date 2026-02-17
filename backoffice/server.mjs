/**
 * Why this exists:
 * Server bootstrap is intentionally minimal so all operational logic lives in
 * dedicated modules under `backoffice/server/` as the project scales.
 */
/**
 * Why this exists:
 * Use Node's built-in env-file support so `.env` values are loaded before any
 * config module reads `process.env`, without custom parsing logic.
 */
if (typeof process.loadEnvFile === 'function') {
  process.loadEnvFile('.env')
}

import { createServer } from 'node:http'
import { HOST, PORT } from './server/config.mjs'
import { handleRequest } from './server/request-handler.mjs'
import { getGitStatusSummary } from './server/services/git.mjs'

/**
 * Why this exists:
 * On every server restart (including watch-mode refresh), we proactively run
 * the git sync check so content editors start from the latest main branch state.
 */
getGitStatusSummary().catch(() => {
  // Ignore startup sync errors; runtime status endpoint still reports details.
})

const server = createServer(handleRequest)

server.listen(PORT, HOST, () => {
  console.log(`Backoffice running on http://${HOST}:${PORT}`)
})
