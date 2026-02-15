/**
 * Why this exists:
 * Shared state creation and state-derived helpers live here so controller logic
 * stays focused on behavior rather than object bootstrapping details.
 */
export function createState() {
  return {
    mode: 'content',
    files: [],
    images: [],
    imageSearchQuery: '',
    collapsedImageSections: new Set(),
    activeFile: '',
    originalValue: null,
    draftValue: null,
    dirty: false,
    deletedImages: new Set(),
  }
}

export function isSectionCollapsed(state, sectionName) {
  return state.collapsedImageSections.has(sectionName)
}

export function setSectionCollapsed(state, sectionName, collapsed) {
  if (collapsed) {
    state.collapsedImageSections.add(sectionName)
  } else {
    state.collapsedImageSections.delete(sectionName)
  }
}
