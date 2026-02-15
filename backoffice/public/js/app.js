/**
 * Why this exists:
 * This controller coordinates backoffice state, mode transitions, API calls,
 * and view rendering; isolating it keeps feature modules composable as scope grows.
 */
import {
  fetchGitPreview,
  fetchGitStatus,
  fetchFileContent,
  fetchFiles,
  fetchImages,
  finalizeGitReview,
  saveFileContent,
  uploadImageAsset,
} from './api.js'
import { getFileUsageLabel } from './constants.js'
import { createState, isSectionCollapsed, setSectionCollapsed } from './state.js'
import { cloneValue, toRepoPathFromPublicImagePath } from './utils.js'
import { renderContentEditor } from './views/content-editor.js'
import { renderImagesLibrary } from './views/images-library.js'

export function createBackofficeApp(elements) {
  const state = createState()
  let imageSearchDebounceTimer = null
  let reviewCanFinalize = false

  function setGitBusy(nextBusy) {
    state.gitBusy = nextBusy
    syncToolbarState()
  }

  function setStatus(message, mode = '') {
    elements.statusText.textContent = message
    elements.statusText.className = ''
    if (mode) elements.statusText.classList.add(`status-${mode}`)
  }

  function formatGitStatusText(status) {
    if (!status) return 'Git status: unavailable.'

    const syncAction = status.sync?.action ?? 'unknown'
    const syncDetails = status.sync?.details ? ` (${status.sync.details})` : ''
    const cleanliness = status.worktreeDirty ? `dirty (${status.changeCount})` : 'clean'

    return [
      `Branch: ${status.currentBranch}`,
      `main ahead: ${status.mainAhead}`,
      `main behind: ${status.mainBehind}`,
      `worktree: ${cleanliness}`,
      `sync: ${syncAction}${syncDetails}`,
    ].join(' | ')
  }

  function renderGitStatus() {
    elements.gitStatusText.textContent = formatGitStatusText(state.gitStatus)
  }

  function markSessionPath(repoPath) {
    if (!repoPath) return
    state.sessionTouchedPaths.add(repoPath)
    state.hasSessionChanges = true
    syncToolbarState()
  }

  function renderReviewPreview(preview) {
    elements.reviewSummary.textContent = preview.summary || 'No diff summary available.'
    elements.reviewChangesList.innerHTML = ''

    if (!preview.entries.length) {
      const empty = document.createElement('li')
      empty.textContent = 'No changes found for this session.'
      elements.reviewChangesList.append(empty)
      reviewCanFinalize = false
      syncToolbarState()
      return
    }

    preview.entries.forEach((entry) => {
      const item = document.createElement('li')
      item.textContent = `${entry.code} ${entry.path}`
      elements.reviewChangesList.append(item)
    })
    reviewCanFinalize = true
    syncToolbarState()
  }

  function openModal(modal) {
    modal.hidden = false
  }

  function closeModal(modal) {
    modal.hidden = true
  }

  function syncDirtyState() {
    if (!state.activeFile) {
      state.dirty = false
      return
    }
    state.dirty = JSON.stringify(state.draftValue) !== JSON.stringify(state.originalValue)
  }

  function syncToolbarState() {
    const isContentMode = state.mode === 'content'
    const hasFile = Boolean(state.activeFile)
    elements.reloadFile.disabled = !isContentMode || !hasFile
    elements.saveFile.disabled = !isContentMode || !hasFile || !state.dirty
    elements.refreshGitStatus.disabled = state.gitBusy
    elements.openReviewFlow.disabled = !state.hasSessionChanges || state.dirty || state.gitBusy
    elements.finalizeReviewFlow.disabled = state.gitBusy || !reviewCanFinalize
  }

  function renderFileList() {
    elements.fileList.innerHTML = ''

    if (state.mode !== 'content') {
      elements.fileList.hidden = true
      return
    }

    elements.fileList.hidden = false
    state.files.forEach((filePath) => {
      const listItem = document.createElement('li')
      const button = document.createElement('button')
      button.type = 'button'
      button.classList.toggle('is-active', filePath === state.activeFile)

      const title = document.createElement('span')
      title.className = 'file-item-title'
      title.textContent = filePath

      const usage = document.createElement('span')
      usage.className = 'file-item-usage'
      usage.textContent = getFileUsageLabel(filePath)

      button.append(title, usage)
      button.addEventListener('click', () => openFile(filePath))
      listItem.append(button)
      elements.fileList.append(listItem)
    })
  }

  function renderEditor() {
    if (!state.activeFile) {
      elements.editorRoot.hidden = true
      elements.emptyState.hidden = false
      return
    }

    elements.emptyState.hidden = true
    elements.editorRoot.hidden = false
    elements.imagesTools.hidden = true
    elements.imagesRoot.hidden = true

    renderContentEditor({
      mount: elements.editorRoot,
      value: state.draftValue,
      activeFile: state.activeFile,
      onReplaceRoot: (nextValue, { rerender = true } = {}) => {
        state.draftValue = nextValue
        syncDirtyState()
        syncToolbarState()

        if (state.dirty) {
          setStatus('Unsaved changes.', 'dirty')
        }

        if (rerender) renderEditor()
      },
      onStatus: setStatus,
      onMarkImageForDeletion: (imagePath) => state.deletedImages.add(imagePath),
      uploadImage: async ({ file, fieldPath, previousImagePath }) => {
        const imagePath = await uploadImageAsset({
          file,
          activeFile: state.activeFile,
          fieldPath,
          previousImagePath,
        })
        markSessionPath(toRepoPathFromPublicImagePath(imagePath))
        return imagePath
      },
    })
  }

  function renderImages() {
    elements.editorRoot.hidden = true
    elements.emptyState.hidden = true
    elements.imagesTools.hidden = false
    elements.imagesRoot.hidden = false

    renderImagesLibrary({
      mount: elements.imagesRoot,
      images: state.images,
      isSectionCollapsed: (sectionName) => isSectionCollapsed(state, sectionName),
      setSectionCollapsed: (sectionName, collapsed) =>
        setSectionCollapsed(state, sectionName, collapsed),
      onOpenUsage: async (usage) => {
        await switchMode('content')
        await openFile(usage.file, { force: true })
        setStatus(`Image reference at ${usage.file} -> ${usage.jsonPath}`, 'ok')
      },
    })
  }

  async function loadFiles() {
    state.files = await fetchFiles()
    renderFileList()
  }

  async function loadImages() {
    state.images = await fetchImages(state.imageSearchQuery)
  }

  async function openFile(filePath, { force = false } = {}) {
    if (!force && state.dirty) {
      const confirmed = globalThis.confirm(
        'You have unsaved changes. Discard them and switch file?',
      )
      if (!confirmed) return
    }

    const content = await fetchFileContent(filePath)
    state.activeFile = filePath
    state.originalValue = cloneValue(content)
    state.draftValue = cloneValue(content)
    state.deletedImages.clear()
    syncDirtyState()
    renderFileList()
    elements.currentFile.textContent = filePath
    renderEditor()
    syncToolbarState()
    setStatus(`File loaded. ${getFileUsageLabel(filePath)}`, 'ok')
  }

  async function saveActiveFile() {
    if (!state.activeFile) return

    const deletedImagesSnapshot = Array.from(state.deletedImages)
    await saveFileContent({
      filePath: state.activeFile,
      content: state.draftValue,
      deletedImages: deletedImagesSnapshot,
    })

    state.originalValue = cloneValue(state.draftValue)
    state.deletedImages.clear()
    markSessionPath(`public/content/${state.activeFile}`)
    deletedImagesSnapshot.forEach((publicPath) =>
      markSessionPath(toRepoPathFromPublicImagePath(publicPath)),
    )
    syncDirtyState()
    syncToolbarState()
    setStatus('Saved. Commit and push when ready.', 'ok')
    await refreshGitStatus()
  }

  async function refreshGitStatus({ reloadActiveOnPull = true } = {}) {
    setGitBusy(true)
    try {
      const status = await fetchGitStatus()
      state.gitStatus = status
      renderGitStatus()
      if (
        reloadActiveOnPull &&
        status.sync?.action === 'pulled' &&
        state.activeFile &&
        !state.dirty &&
        state.mode === 'content'
      ) {
        await openFile(state.activeFile, { force: true })
      }
    } finally {
      setGitBusy(false)
    }
  }

  async function openReviewFlow() {
    if (state.dirty) {
      setStatus('Save your current edits before creating a review branch.', 'error')
      return
    }

    const sessionPaths = Array.from(state.sessionTouchedPaths)
    if (!sessionPaths.length) {
      setStatus('No session changes available for review flow.', 'error')
      return
    }

    setGitBusy(true)
    try {
      reviewCanFinalize = false
      const preview = await fetchGitPreview(sessionPaths)
      renderReviewPreview(preview)
      openModal(elements.reviewModal)
      setStatus('Review preview loaded. Finalize to create and push a branch.', 'ok')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to build review preview.', 'error')
    } finally {
      setGitBusy(false)
    }
  }

  async function finalizeReviewFlow() {
    const sessionPaths = Array.from(state.sessionTouchedPaths)
    if (!sessionPaths.length) {
      setStatus('No session changes found for finalize flow.', 'error')
      return
    }

    setGitBusy(true)
    try {
      const result = await finalizeGitReview(sessionPaths)
      closeModal(elements.reviewModal)
      reviewCanFinalize = false
      elements.createdBranchName.textContent = result.branchName
      openModal(elements.successModal)
      state.sessionTouchedPaths.clear()
      state.hasSessionChanges = false
      syncToolbarState()
      await refreshGitStatus({ reloadActiveOnPull: false })
      setStatus(`Review branch created: ${result.branchName}`, 'ok')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Finalize flow failed.', 'error')
    } finally {
      setGitBusy(false)
    }
  }

  async function switchMode(nextMode) {
    state.mode = nextMode
    elements.modeContent.classList.toggle('is-active', nextMode === 'content')
    elements.modeImages.classList.toggle('is-active', nextMode === 'images')
    elements.refreshFiles.textContent = nextMode === 'images' ? 'Refresh images' : 'Refresh files'

    if (nextMode === 'content') {
      elements.imagesTools.hidden = true
      elements.currentFile.textContent = state.activeFile || 'Choose a file'
      renderFileList()
      if (state.activeFile) {
        renderEditor()
        setStatus('Content editor active.', 'ok')
      } else {
        elements.imagesRoot.hidden = true
        elements.editorRoot.hidden = true
        elements.emptyState.hidden = false
        setStatus('Load a JSON file from the left panel.', 'ok')
      }
    } else {
      elements.currentFile.textContent = 'Image library'
      renderFileList()
      await loadImages()
      renderImages()
      setStatus(`Loaded ${state.images.length} image(s) with usage references.`, 'ok')
    }

    syncToolbarState()
  }

  function bindEvents() {
    elements.refreshFiles.addEventListener('click', async () => {
      try {
        await refreshGitStatus()
        if (state.mode === 'images') {
          await loadImages()
          renderImages()
          setStatus(`Loaded ${state.images.length} image(s).`, 'ok')
        } else {
          await loadFiles()
          setStatus(`Loaded ${state.files.length} content file(s).`, 'ok')
        }
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Refresh failed.', 'error')
      }
    })

    elements.modeContent.addEventListener('click', async () => {
      try {
        await switchMode('content')
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Unable to switch mode.', 'error')
      }
    })

    elements.modeImages.addEventListener('click', async () => {
      try {
        await switchMode('images')
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Unable to switch mode.', 'error')
      }
    })

    elements.imageSearch.addEventListener('input', () => {
      state.imageSearchQuery = elements.imageSearch.value
      if (imageSearchDebounceTimer) clearTimeout(imageSearchDebounceTimer)
      imageSearchDebounceTimer = setTimeout(async () => {
        if (state.mode !== 'images') return
        try {
          await loadImages()
          renderImages()
          setStatus(
            `Found ${state.images.length} image(s) for "${state.imageSearchQuery.trim()}".`,
            'ok',
          )
        } catch (error) {
          setStatus(error instanceof Error ? error.message : 'Image search failed.', 'error')
        }
      }, 250)
    })

    elements.clearImageSearch.addEventListener('click', async () => {
      elements.imageSearch.value = ''
      state.imageSearchQuery = ''
      if (state.mode !== 'images') return
      try {
        await loadImages()
        renderImages()
        setStatus(`Loaded ${state.images.length} image(s).`, 'ok')
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Unable to clear image search.', 'error')
      }
    })

    elements.reloadFile.addEventListener('click', async () => {
      if (!state.activeFile) return
      try {
        await openFile(state.activeFile, { force: true })
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Reload failed.', 'error')
      }
    })

    elements.saveFile.addEventListener('click', async () => {
      try {
        await saveActiveFile()
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Save failed.', 'error')
      }
    })

    elements.refreshGitStatus.addEventListener('click', async () => {
      try {
        await refreshGitStatus()
        setStatus('Git status refreshed.', 'ok')
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Git refresh failed.', 'error')
      }
    })

    elements.openReviewFlow.addEventListener('click', async () => {
      await openReviewFlow()
    })

    elements.cancelReviewFlow.addEventListener('click', () => {
      reviewCanFinalize = false
      syncToolbarState()
      closeModal(elements.reviewModal)
    })

    elements.finalizeReviewFlow.addEventListener('click', async () => {
      await finalizeReviewFlow()
    })

    elements.copyBranchName.addEventListener('click', async () => {
      try {
        const branchName = elements.createdBranchName.textContent.trim()
        if (!branchName) return
        await navigator.clipboard.writeText(branchName)
        setStatus('Branch name copied to clipboard.', 'ok')
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Unable to copy branch name.', 'error')
      }
    })

    elements.closeSuccessModal.addEventListener('click', () => {
      closeModal(elements.successModal)
    })
  }

  async function init() {
    bindEvents()
    try {
      await refreshGitStatus({ reloadActiveOnPull: false })
      await loadFiles()
      renderFileList()
      setStatus(`Loaded ${state.files.length} content file(s).`, 'ok')
      await switchMode('content')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Initialization failed.', 'error')
    }
  }

  return { init }
}
