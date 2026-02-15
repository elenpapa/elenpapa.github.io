/**
 * Why this exists:
 * Centralized DOM lookup avoids selector duplication and makes it easier to
 * evolve the backoffice layout without hunting down hard-coded queries.
 */
export function getElements() {
  return {
    fileList: document.querySelector('#file-list'),
    refreshFiles: document.querySelector('#refresh-files'),
    modeContent: document.querySelector('#mode-content'),
    modeImages: document.querySelector('#mode-images'),
    imagesTools: document.querySelector('#images-tools'),
    imageSearch: document.querySelector('#image-search'),
    clearImageSearch: document.querySelector('#clear-image-search'),
    currentFile: document.querySelector('#current-file'),
    statusText: document.querySelector('#status-text'),
    reloadFile: document.querySelector('#reload-file'),
    saveFile: document.querySelector('#save-file'),
    editorRoot: document.querySelector('#editor-root'),
    imagesRoot: document.querySelector('#images-root'),
    emptyState: document.querySelector('#empty-state'),
  }
}
