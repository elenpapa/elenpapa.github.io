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
  const gitBusyByAction = new Map()
  const DEFAULT_BUTTON_LABELS = {
    refresh: 'Refresh git',
    preview: 'Create Review Branch',
    finalize: 'Finalize & Push',
  }

  /**
   * Why this exists:
   * Git operations can nest (for example finalize -> refresh status), so we
   * track busy state per action to keep button states and labels accurate.
   */
  function setGitBusy(nextBusy, action = 'general') {
    const current = gitBusyByAction.get(action) ?? 0
    if (nextBusy) {
      gitBusyByAction.set(action, current + 1)
    } else if (current <= 1) {
      gitBusyByAction.delete(action)
    } else {
      gitBusyByAction.set(action, current - 1)
    }
    state.gitBusy = Array.from(gitBusyByAction.values()).some((count) => count > 0)
    syncToolbarState()
  }

  function isGitActionBusy(action) {
    return (gitBusyByAction.get(action) ?? 0) > 0
  }

  async function runGitTask(action, task) {
    setGitBusy(true, action)
    try {
      return await task()
    } finally {
      setGitBusy(false, action)
    }
  }

  function setStatus(message, mode = '') {
    elements.statusText.textContent = message
    elements.statusText.className = ''
    if (mode) elements.statusText.classList.add(`status-${mode}`)
  }

  function formatGitStatusText(status) {
    if (!status) return 'Git status: unavailable.'

    const syncLabelByAction = {
      blocked: 'Status: update available from production (needs manual action)',
      error: 'Status: could not check production updates',
      pulled: 'Status: latest production updates were applied',
      'up-to-date': 'Status: up to date with production',
    }
    const syncAction = status.sync?.action ?? 'error'
    const syncLabel = syncLabelByAction[syncAction] || 'Status: unknown'

    const changesLabel = status.changeCount
      ? `Current changes done: ${status.changeCount}`
      : 'Current changes done: none'
    const deployLabel = status.mainAhead
      ? `Commits ready to deploy to production: ${status.mainAhead}`
      : 'Commits ready to deploy to production: none'
    const incomingLabel = status.mainBehind
      ? `New production updates available: ${status.mainBehind}`
      : 'New production updates available: none'
    const branchLabel = `Editing branch: ${status.currentBranch}`

    return [branchLabel, syncLabel, changesLabel, deployLabel, incomingLabel].join(' | ')
  }

  function renderGitStatus() {
    elements.gitStatusText.textContent = formatGitStatusText(state.gitStatus)
  }

  function markSessionPath(repoPath) {
    if (!repoPath || typeof repoPath !== 'string') return
    const normalized = repoPath.replace(/\\/g, '/')
    if (!isManagedContentPath(normalized)) return
    state.sessionTouchedPaths.add(normalized)
    state.hasSessionChanges = true
    syncToolbarState()
  }

  function isManagedContentPath(repoPath) {
    return repoPath.startsWith('public/content/') || repoPath.startsWith('public/images/')
  }

  function seedSessionPathsFromGitStatus(status) {
    if (!status || !Array.isArray(status.changes)) return
    status.changes.forEach((entry) => {
      if (!entry || typeof entry.path !== 'string') return
      markSessionPath(entry.path)
    })
  }

  function renderReviewPreview(preview) {
    elements.reviewErrorText.hidden = true
    elements.reviewErrorText.textContent = ''
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
    document.body.classList.add('modal-open')
  }

  function closeModal(modal) {
    modal.hidden = true
    if (elements.reviewModal.hidden && elements.successModal.hidden) {
      document.body.classList.remove('modal-open')
    }
  }

  function setReviewError(errorMessage) {
    const message = errorMessage || 'Unknown review flow error.'
    elements.reviewErrorText.textContent = message
    elements.reviewErrorText.hidden = false
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
    elements.refreshGitStatus.textContent = isGitActionBusy('refresh')
      ? 'Refreshing...'
      : DEFAULT_BUTTON_LABELS.refresh
    elements.openReviewFlow.textContent = isGitActionBusy('preview')
      ? 'Preparing...'
      : DEFAULT_BUTTON_LABELS.preview
    elements.finalizeReviewFlow.textContent = isGitActionBusy('finalize')
      ? 'Finalizing...'
      : DEFAULT_BUTTON_LABELS.finalize
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
  }

  async function refreshGitStatus({ reloadActiveOnPull = true } = {}) {
    await runGitTask('refresh', async () => {
      const status = await fetchGitStatus()
      state.gitStatus = status
      seedSessionPathsFromGitStatus(status)
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
    })
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

    try {
      await runGitTask('preview', async () => {
        reviewCanFinalize = false
        elements.reviewErrorText.hidden = true
        elements.reviewErrorText.textContent = ''
        const preview = await fetchGitPreview(sessionPaths)
        renderReviewPreview(preview)
        openModal(elements.reviewModal)
        setStatus('Review preview loaded. Finalize to create and push a branch.', 'ok')
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to build review preview.'
      setReviewError(message)
      setStatus(message, 'error')
      console.error('Review preview error:', error)
      openModal(elements.reviewModal)
    }
  }

  async function finalizeReviewFlow() {
    const sessionPaths = Array.from(state.sessionTouchedPaths)
    if (!sessionPaths.length) {
      setStatus('No session changes found for finalize flow.', 'error')
      return
    }

    try {
      await runGitTask('finalize', async () => {
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
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Finalize flow failed.'
      setReviewError(message)
      setStatus(message, 'error')
      console.error('Finalize review flow error:', error)
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
        await refreshGitStatus({ reloadActiveOnPull: false })
      } catch (error) {
        setStatus(error instanceof Error ? error.message : 'Reload failed.', 'error')
      }
    })

    elements.saveFile.addEventListener('click', async () => {
      try {
        await saveActiveFile()
        await refreshGitStatus({ reloadActiveOnPull: false })
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
      try {
        await openReviewFlow()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected review flow error.'
        setReviewError(message)
        setStatus(message, 'error')
        console.error('Open review flow fatal error:', error)
      }
    })

    elements.cancelReviewFlow.addEventListener('click', () => {
      reviewCanFinalize = false
      syncToolbarState()
      closeModal(elements.reviewModal)
    })

    elements.finalizeReviewFlow.addEventListener('click', async () => {
      try {
        await finalizeReviewFlow()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unexpected finalize flow error.'
        setReviewError(message)
        setStatus(message, 'error')
        console.error('Finalize review flow fatal error:', error)
      }
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

    /**
     * Why this exists:
     * Modal interactions should follow standard UX expectations: escape key and
     * backdrop click dismiss dialogs when no blocking git action is running.
     */
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || state.gitBusy) return
      if (!elements.reviewModal.hidden) {
        reviewCanFinalize = false
        syncToolbarState()
        closeModal(elements.reviewModal)
      } else if (!elements.successModal.hidden) {
        closeModal(elements.successModal)
      }
    })

    elements.reviewModal.addEventListener('click', (event) => {
      if (event.target !== elements.reviewModal || state.gitBusy) return
      reviewCanFinalize = false
      syncToolbarState()
      closeModal(elements.reviewModal)
    })

    elements.successModal.addEventListener('click', (event) => {
      if (event.target !== elements.successModal || state.gitBusy) return
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
