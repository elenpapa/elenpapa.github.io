/**
 * Why this exists:
 * Some uploaded images do not have every responsive variant generated
 * (for example missing `-800w.webp` when source is smaller). This helper
 * builds srcset values using only files that actually exist.
 */
const srcsetPromiseCache = new Map<string, Promise<string>>()

function toCandidateUrl(imageSrc: string, width: number) {
  const basePath = imageSrc.replace(/\.[^.]+$/, '')
  const encodedPath = encodeURI(basePath)
  return `${encodedPath}-${width}w.webp`
}

async function imageExistsClient(url: string) {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve(true)
    image.onerror = () => resolve(false)
    image.src = url
  })
}

async function imageExistsSsr(url: string) {
  const path = await import('node:path')
  const fs = await import('node:fs/promises')
  const publicRelative = url.replace(/^\//, '')
  const absolutePath = path.join(process.cwd(), 'public', publicRelative)
  try {
    await fs.access(absolutePath)
    return true
  } catch {
    return false
  }
}

async function imageExists(url: string) {
  if (typeof window === 'undefined') return imageExistsSsr(url)
  return imageExistsClient(url)
}

export async function resolveResponsiveSrcset(imageSrc: string, candidateWidths: number[]) {
  if (!imageSrc) return ''
  const cacheKey = `${imageSrc}|${candidateWidths.join(',')}`
  if (srcsetPromiseCache.has(cacheKey)) {
    return srcsetPromiseCache.get(cacheKey)
  }

  const load = (async () => {
    const entries: string[] = []
    for (const width of candidateWidths) {
      const candidateUrl = toCandidateUrl(imageSrc, width)
      if (await imageExists(candidateUrl)) {
        entries.push(`${candidateUrl} ${width}w`)
      }
    }
    return entries.join(', ')
  })()

  srcsetPromiseCache.set(cacheKey, load)
  return load
}
