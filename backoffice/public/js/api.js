/**
 * Why this exists:
 * Network calls are isolated in one module so endpoint changes and payload
 * evolution do not cascade through view/controller code.
 */
const API_TIMEOUT_MS = 30_000

export async function apiRequest(url, options = {}) {
  /**
   * Why this exists:
   * Timeouts prevent the UI from getting stuck indefinitely when a network
   * request or server-side git/image operation hangs unexpectedly.
   */
  const controller = new AbortController()
  const timeoutHandle = setTimeout(() => controller.abort(), API_TIMEOUT_MS)
  let response

  try {
    response = await fetch(url, { ...options, signal: controller.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw error
  } finally {
    clearTimeout(timeoutHandle)
  }

  let payload = {}

  try {
    payload = await response.json()
  } catch {
    payload = {}
  }

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.')
  }

  return payload
}

export async function fetchFiles() {
  const payload = await apiRequest('/api/files')
  return Array.isArray(payload.files) ? payload.files : []
}

export async function fetchImages(query) {
  const trimmedQuery = query.trim()
  const url = trimmedQuery ? `/api/images?q=${encodeURIComponent(trimmedQuery)}` : '/api/images'
  const payload = await apiRequest(url)
  return Array.isArray(payload.images) ? payload.images : []
}

export async function fetchFileContent(filePath) {
  const encodedFile = encodeURIComponent(filePath)
  const payload = await apiRequest(`/api/files/${encodedFile}`)
  return payload.content
}

export async function saveFileContent({ filePath, content, deletedImages }) {
  const encodedFile = encodeURIComponent(filePath)
  await apiRequest(`/api/files/${encodedFile}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      content,
      deletedImages,
    }),
  })
}

export async function uploadImageAsset({ file, activeFile, fieldPath, previousImagePath }) {
  const fileDataBase64 = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Unable to read selected image.'))
        return
      }
      const commaIndex = reader.result.indexOf(',')
      resolve(reader.result.slice(commaIndex + 1))
    }
    reader.onerror = () => reject(new Error('Unable to read selected image.'))
    reader.readAsDataURL(file)
  })

  const payload = await apiRequest('/api/upload-image', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      activeFile,
      fieldPath,
      previousImagePath,
      fileName: file.name,
      fileDataBase64,
    }),
  })

  return payload.imagePath
}

export async function fetchGitStatus() {
  const payload = await apiRequest('/api/git/status')
  return payload.status
}

export async function fetchGitPreview(sessionPaths) {
  const payload = await apiRequest('/api/git/preview', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionPaths }),
  })
  return payload.preview
}

export async function finalizeGitReview(sessionPaths) {
  const payload = await apiRequest('/api/git/finalize', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionPaths }),
  })
  return payload.result
}
