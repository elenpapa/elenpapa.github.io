/**
 * Why this exists:
 * This editor now enforces value-only editing (no key renames), provides
 * template-based list entry creation, and supports direct image uploads that
 * follow the active JSON context and asset replacement workflow.
 */
const elements = {
  fileList: document.querySelector('#file-list'),
  refreshFiles: document.querySelector('#refresh-files'),
  currentFile: document.querySelector('#current-file'),
  statusText: document.querySelector('#status-text'),
  reloadFile: document.querySelector('#reload-file'),
  saveFile: document.querySelector('#save-file'),
  editorRoot: document.querySelector('#editor-root'),
  emptyState: document.querySelector('#empty-state'),
}

const state = {
  files: [],
  activeFile: '',
  originalValue: null,
  draftValue: null,
  dirty: false,
  deletedImages: new Set(),
}

const TEMPLATE_OVERRIDES = {
  'book.json:events': {
    id: '',
    instagramEmbedHtml: '',
    image: { src: '', alt: '' },
  },
  'moonlight.json:hero.stats': {
    label: '',
    value: '',
  },
  'moonlight.json:mission.pillars': {
    firstName: '',
    lastName: '',
    href: '',
    image: { src: '', alt: '' },
  },
  'moonlight.json:bubbles.items': {
    label: '',
    value: '',
    description: '',
  },
  'moonlight.json:releases.books': {
    id: '',
    title: '',
    tagline: '',
    genre: '',
    cover: '',
  },
  'painted-books.json:gallery.items': {
    id: '',
    title: '',
    author: '',
    media: { src: '', alt: '' },
  },
  'posts.json:items': {
    title: '',
    image: '',
    url: '',
    summary: '',
    contentHtml: '',
    devOnly: false,
  },
  'publishers.json:items': {
    name: '',
    description: '',
    logo: { src: '', alt: '' },
    services: [],
  },
  'services.json:items': {
    title: '',
    description: '',
    focus: '',
    highlights: [],
    icon: '',
    image: { src: '', alt: '' },
  },
  'timeline.json:items': {
    year: new Date().getFullYear(),
    title: '',
    cover: '',
    blurb: '',
    actions: '',
  },
}

function cloneValue(value) {
  return globalThis.structuredClone
    ? globalThis.structuredClone(value)
    : JSON.parse(JSON.stringify(value))
}

function getValueType(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function setStatus(message, mode = '') {
  elements.statusText.textContent = message
  elements.statusText.className = ''
  if (mode) elements.statusText.classList.add(`status-${mode}`)
}

function syncDirtyState() {
  if (!state.activeFile) {
    state.dirty = false
    return
  }

  state.dirty = JSON.stringify(state.draftValue) !== JSON.stringify(state.originalValue)
}

function syncToolbarState() {
  const hasFile = Boolean(state.activeFile)
  elements.reloadFile.disabled = !hasFile
  elements.saveFile.disabled = !hasFile || !state.dirty
}

function toEmptyTemplate(value) {
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

function makeTemplateFromArray(arrayValue, nodePath) {
  const key = `${state.activeFile}:${nodePath.join('.')}`
  if (TEMPLATE_OVERRIDES[key]) {
    return cloneValue(TEMPLATE_OVERRIDES[key])
  }
  if (arrayValue.length > 0) {
    return toEmptyTemplate(arrayValue[0])
  }
  return {}
}

function isLikelyImageField(fieldKey, value) {
  if (typeof value !== 'string') return false
  if (value.startsWith('/images/')) return true
  return /(src|cover|image|thumbnail)/i.test(fieldKey || '')
}

function collectImagePaths(value, output = []) {
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

async function uploadImage(file, fieldPath, previousImagePath) {
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
      activeFile: state.activeFile,
      fieldPath,
      previousImagePath,
      fileName: file.name,
      fileDataBase64,
    }),
  })

  return payload.imagePath
}

function renderNode(value, onReplace, context) {
  const { depth, pathSegments, fieldKey, isRoot } = context
  const wrapper = document.createElement('div')
  wrapper.className = 'node'
  wrapper.style.setProperty('--depth', String(depth))

  const currentType = getValueType(value)

  const head = document.createElement('div')
  head.className = 'node-head'

  const kind = document.createElement('span')
  kind.className = 'node-kind'
  kind.textContent = currentType

  head.append(kind)
  wrapper.append(head)

  if (currentType === 'object') {
    const entries = Object.entries(value)
    entries.forEach(([key, childValue]) => {
      const entry = document.createElement('div')
      entry.className = 'entry'

      const entryHead = document.createElement('div')
      entryHead.className = 'entry-head'

      const keyLabel = document.createElement('span')
      keyLabel.className = 'key-label'
      keyLabel.textContent = key
      entryHead.append(keyLabel)
      entry.append(entryHead)

      entry.append(
        renderNode(
          childValue,
          (nextValue, options) => {
            value[key] = nextValue
            onReplace(value, options)
          },
          {
            depth: depth + 1,
            pathSegments: [...pathSegments, key],
            fieldKey: key,
            isRoot: false,
          },
        ),
      )

      wrapper.append(entry)
    })
  }

  if (currentType === 'array') {
    value.forEach((item, index) => {
      const entry = document.createElement('div')
      entry.className = 'entry'

      const entryHead = document.createElement('div')
      entryHead.className = 'entry-head'

      const indexLabel = document.createElement('span')
      indexLabel.className = 'index'
      indexLabel.textContent = `#${index}`

      const moveUp = document.createElement('button')
      moveUp.type = 'button'
      moveUp.textContent = 'Up'
      moveUp.disabled = index === 0
      moveUp.addEventListener('click', () => {
        const temp = value[index - 1]
        value[index - 1] = value[index]
        value[index] = temp
        onReplace(value, { rerender: true })
      })

      const moveDown = document.createElement('button')
      moveDown.type = 'button'
      moveDown.textContent = 'Down'
      moveDown.disabled = index === value.length - 1
      moveDown.addEventListener('click', () => {
        const temp = value[index + 1]
        value[index + 1] = value[index]
        value[index] = temp
        onReplace(value, { rerender: true })
      })

      const deleteButton = document.createElement('button')
      deleteButton.type = 'button'
      deleteButton.className = 'delete'
      deleteButton.textContent = 'Delete'
      deleteButton.addEventListener('click', () => {
        collectImagePaths(value[index]).forEach((imagePath) => state.deletedImages.add(imagePath))
        value.splice(index, 1)
        onReplace(value, { rerender: true })
      })

      entryHead.append(indexLabel, moveUp, moveDown, deleteButton)
      entry.append(entryHead)
      entry.append(
        renderNode(
          item,
          (nextValue, options) => {
            value[index] = nextValue
            onReplace(value, options)
          },
          {
            depth: depth + 1,
            pathSegments: [...pathSegments, String(index)],
            fieldKey: String(index),
            isRoot: false,
          },
        ),
      )

      wrapper.append(entry)
    })

    const addControls = document.createElement('div')
    addControls.className = 'add-controls'

    const addButton = document.createElement('button')
    addButton.type = 'button'
    addButton.textContent = 'Add entry'
    addButton.addEventListener('click', () => {
      value.push(makeTemplateFromArray(value, pathSegments))
      onReplace(value, { rerender: true })
    })

    addControls.append(addButton)
    wrapper.append(addControls)
  }

  if (!isRoot && ['string', 'number', 'boolean', 'null'].includes(currentType)) {
    const primitiveControls = document.createElement('div')
    primitiveControls.className = 'add-controls'

    if (currentType === 'string') {
      const input = document.createElement('input')
      input.className = 'primitive-value'
      input.value = String(value)
      input.addEventListener('input', () => {
        onReplace(input.value, { rerender: false })
      })
      primitiveControls.append(input)

      if (isLikelyImageField(fieldKey, value)) {
        const uploadButton = document.createElement('button')
        uploadButton.type = 'button'
        uploadButton.textContent = 'Upload image'
        const picker = document.createElement('input')
        picker.type = 'file'
        picker.accept = '.png,.jpg,.jpeg,.jfif,.webp,.svg'
        picker.hidden = true

        uploadButton.addEventListener('click', () => picker.click())
        picker.addEventListener('change', async () => {
          const selected = picker.files && picker.files[0]
          if (!selected) return

          uploadButton.disabled = true
          setStatus('Uploading image and running optimizer...', 'dirty')

          try {
            const imagePath = await uploadImage(selected, pathSegments.join('.'), input.value)
            if (input.value.startsWith('/images/') && input.value !== imagePath) {
              state.deletedImages.add(input.value)
            }
            input.value = imagePath
            onReplace(imagePath, { rerender: false })
            setStatus('Image uploaded. Save to finalize replacement cleanup.', 'dirty')
          } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Image upload failed.', 'error')
          } finally {
            uploadButton.disabled = false
            picker.value = ''
          }
        })

        primitiveControls.append(uploadButton, picker)
      }
    }

    if (currentType === 'number') {
      const input = document.createElement('input')
      input.className = 'primitive-value'
      input.type = 'number'
      input.value = Number.isFinite(value) ? String(value) : '0'
      input.addEventListener('input', () => {
        const parsed = Number(input.value)
        onReplace(Number.isFinite(parsed) ? parsed : 0, { rerender: false })
      })
      primitiveControls.append(input)
    }

    if (currentType === 'boolean') {
      const input = document.createElement('select')
      input.className = 'primitive-value'
      const trueOption = document.createElement('option')
      trueOption.value = 'true'
      trueOption.textContent = 'true'
      trueOption.selected = value === true
      const falseOption = document.createElement('option')
      falseOption.value = 'false'
      falseOption.textContent = 'false'
      falseOption.selected = value === false
      input.append(trueOption, falseOption)
      input.addEventListener('change', () => onReplace(input.value === 'true', { rerender: false }))
      primitiveControls.append(input)
    }

    if (currentType === 'null') {
      const info = document.createElement('span')
      info.textContent = 'null value'
      primitiveControls.append(info)
    }

    wrapper.append(primitiveControls)
  }

  return wrapper
}

function renderEditor() {
  if (!state.activeFile) {
    elements.editorRoot.hidden = true
    elements.emptyState.hidden = false
    return
  }

  elements.emptyState.hidden = true
  elements.editorRoot.hidden = false
  elements.editorRoot.innerHTML = ''
  elements.editorRoot.append(
    renderNode(
      state.draftValue,
      (nextValue, { rerender = true } = {}) => {
        state.draftValue = nextValue
        syncDirtyState()
        syncToolbarState()

        if (state.dirty) {
          setStatus('Unsaved changes.', 'dirty')
        }

        if (rerender) renderEditor()
      },
      {
        depth: 0,
        pathSegments: [],
        fieldKey: '',
        isRoot: true,
      },
    ),
  )
}

function renderFileList() {
  elements.fileList.innerHTML = ''

  state.files.forEach((filePath) => {
    const listItem = document.createElement('li')
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = filePath
    button.classList.toggle('is-active', filePath === state.activeFile)
    button.addEventListener('click', () => openFile(filePath))
    listItem.append(button)
    elements.fileList.append(listItem)
  })
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options)
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

async function loadFiles() {
  try {
    const payload = await apiRequest('/api/files')
    state.files = Array.isArray(payload.files) ? payload.files : []
    renderFileList()
    setStatus(`Loaded ${state.files.length} content file(s).`, 'ok')
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Failed to load files.', 'error')
  }
}

async function openFile(filePath, { force = false } = {}) {
  if (!force && state.dirty) {
    const confirmed = globalThis.confirm('You have unsaved changes. Discard them and switch file?')
    if (!confirmed) return
  }

  try {
    const encodedFile = encodeURIComponent(filePath)
    const payload = await apiRequest(`/api/files/${encodedFile}`)
    state.activeFile = filePath
    state.originalValue = cloneValue(payload.content)
    state.draftValue = cloneValue(payload.content)
    state.deletedImages.clear()
    syncDirtyState()
    elements.currentFile.textContent = filePath
    renderFileList()
    renderEditor()
    syncToolbarState()
    setStatus('File loaded.', 'ok')
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Failed to open file.', 'error')
  }
}

async function saveActiveFile() {
  if (!state.activeFile) return

  try {
    const encodedFile = encodeURIComponent(state.activeFile)
    await apiRequest(`/api/files/${encodedFile}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        content: state.draftValue,
        deletedImages: Array.from(state.deletedImages),
      }),
    })

    state.originalValue = cloneValue(state.draftValue)
    state.deletedImages.clear()
    syncDirtyState()
    syncToolbarState()
    setStatus('Saved. Commit and push when ready.', 'ok')
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Failed to save file.', 'error')
  }
}

function bindEvents() {
  elements.refreshFiles.addEventListener('click', () => loadFiles())
  elements.reloadFile.addEventListener('click', () => {
    if (!state.activeFile) return
    openFile(state.activeFile, { force: true })
  })
  elements.saveFile.addEventListener('click', () => saveActiveFile())
}

bindEvents()
loadFiles()
