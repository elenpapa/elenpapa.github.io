/**
 * Why this exists:
 * Shared immutable utilities keep value-shape logic reusable across editor and
 * controller modules as the backoffice UI expands.
 */
export function cloneValue(value) {
  return globalThis.structuredClone
    ? globalThis.structuredClone(value)
    : JSON.parse(JSON.stringify(value))
}

export function getValueType(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

export function toEmptyTemplate(value) {
  const valueType = getValueType(value)
  if (valueType === 'string') return ''
  if (valueType === 'number') return 0
  if (valueType === 'boolean') return false
  if (valueType === 'null') return null
  if (valueType === 'array') return []
  if (valueType === 'object') {
    const next = {}
    for (const [key, child] of Object.entries(value)) {
      next[key] = toEmptyTemplate(child)
    }
    return next
  }
  return ''
}

export function makeTemplateFromArray({ arrayValue, nodePath, activeFile, templateOverrides }) {
  const key = `${activeFile}:${nodePath.join('.')}`
  if (templateOverrides[key]) {
    return cloneValue(templateOverrides[key])
  }
  if (arrayValue.length > 0) {
    return toEmptyTemplate(arrayValue[0])
  }
  return {}
}

export function isLikelyImageField(fieldKey, value) {
  if (typeof value !== 'string') return false
  if (value.startsWith('/images/')) return true
  return /(src|cover|image|thumbnail)/i.test(fieldKey || '')
}

export function collectImagePaths(value, output = []) {
  const valueType = getValueType(value)
  if (valueType === 'string' && value.startsWith('/images/')) {
    output.push(value)
    return output
  }

  if (valueType === 'array') {
    value.forEach((item) => collectImagePaths(item, output))
    return output
  }

  if (valueType === 'object') {
    Object.values(value).forEach((item) => collectImagePaths(item, output))
    return output
  }

  return output
}

export function toRepoPathFromPublicImagePath(publicPath) {
  if (typeof publicPath !== 'string' || !publicPath.startsWith('/images/')) return ''
  return `public${publicPath}`.replace(/\\/g, '/')
}
