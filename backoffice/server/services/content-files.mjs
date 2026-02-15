/**
 * Why this exists:
 * Content JSON operations (listing, reading, writing) are separated from HTTP
 * routing so future validation and per-file business rules can be added cleanly.
 */
import path from 'node:path'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { paths } from '../config.mjs'
import { getSafeContentPath } from '../utils/path-guards.mjs'

export async function listJsonFiles(dir = paths.contentDir, baseDir = dir) {
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

export async function readContentFile(relativePath) {
  const filePath = getSafeContentPath(relativePath)
  const fileContent = await readFile(filePath, 'utf-8')
  return JSON.parse(fileContent)
}

export async function writeContentFile(relativePath, nextContent) {
  const filePath = getSafeContentPath(relativePath)
  const serialized = `${JSON.stringify(nextContent, null, 2)}\n`
  await writeFile(filePath, serialized, 'utf-8')
}
