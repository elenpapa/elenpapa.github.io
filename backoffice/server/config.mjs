/**
 * Why this exists:
 * Centralized runtime configuration keeps the server entrypoint thin and
 * prevents scattering environment/path logic across route handlers.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const HOST = process.env.BACKOFFICE_HOST ?? '127.0.0.1'
export const PORT = Number(process.env.BACKOFFICE_PORT ?? 4310)
export const BODY_LIMIT_BYTES = 20 * 1024 * 1024

const currentDir = path.dirname(fileURLToPath(import.meta.url))

export const paths = {
  currentDir,
  projectRoot: path.resolve(currentDir, '..', '..'),
  staticDir: path.join(currentDir, '..', 'public'),
}

paths.publicDir = path.join(paths.projectRoot, 'public')
paths.contentDir = path.join(paths.publicDir, 'content')
paths.imagesDir = path.join(paths.publicDir, 'images')
