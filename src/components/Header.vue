<script setup lang="ts">
import { computed, onMounted, onUnmounted, nextTick, ref, watch } from 'vue'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
import { content, type SiteContent } from '@/services/content'

const site = ref<SiteContent | null>(null)
const open = ref(false)
const headerEl = ref<HTMLElement | null>(null)
const spacerEl = ref<HTMLElement | null>(null)
const logoEl = ref<HTMLImageElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

// Bubble state (desktop only): morph to floating bubble on scroll, expand on hover/focus
const isBubble = ref(false)
const isExpanded = ref(false)

const navItems = computed(() => site.value?.nav ?? [])

// Focus trap for mobile menu
const { activate, deactivate } = useFocusTrap(menuRef, {
  immediate: false,
})

// Activate/deactivate focus trap when menu opens/closes
// Also lock body scroll on mobile when menu is open
watch(open, (isOpen) => {
  if (isOpen) {
    nextTick(() => activate())
    // Lock body scroll on mobile
    if (!isDesktop()) {
      document.body.style.overflow = 'hidden'
    }
  } else {
    deactivate()
    // Unlock body scroll
    document.body.style.overflow = ''
  }
})

onMounted(async () => {
  site.value = await content.getSite()
  // recompute header height once content (logo) is rendered
  await nextTick()
  setHeaderHeight()
  if (logoEl.value) {
    if (logoEl.value.complete) setHeaderHeight()
    else logoEl.value.addEventListener('load', setHeaderHeight, { once: true })
  }
  globalThis.addEventListener('resize', onResize)
  // Scroll listener for bubble state (passive + rAF)
  globalThis.addEventListener('scroll', onScroll, { passive: true })
  // Escape to collapse expanded state
  globalThis.addEventListener('keydown', onKeyDown)
})

const setHeaderHeight = async () => {
  await nextTick()
  const header = headerEl.value
  const spacer = spacerEl.value
  if (!header || !spacer) return

  // If a logo is present, use its displayed height to set the header height
  let headerHeight = header.offsetHeight
  if (logoEl.value && logoEl.value.naturalWidth && logoEl.value.naturalHeight) {
    headerHeight = Math.max(headerHeight, logoEl.value.offsetHeight)
  }

  // Apply CSS custom property and spacer inline height so other elements can read it
  header.style.setProperty('--site-header-height', `${headerHeight}px`)
  spacer.style.height = `${headerHeight}px`
}

// recompute on resize and after images load
let resizeTimer: number | undefined
const onResize = () => {
  clearTimeout(resizeTimer)
  resizeTimer = globalThis.setTimeout(setHeaderHeight, 100)
}

onUnmounted(() => {
  globalThis.removeEventListener('resize', onResize)
  globalThis.removeEventListener('scroll', onScroll as EventListener)
  globalThis.removeEventListener('keydown', onKeyDown as EventListener)
  // Clean up body scroll lock
  document.body.style.overflow = ''
  deactivate()
})

function toggle() {
  open.value = !open.value
}
function close() {
  open.value = false
}

// Desktop check
const isDesktop = () => globalThis.innerWidth >= 1024

// Update bubble state based on scroll position and header height
const updateBubble = () => {
  if (!headerEl.value) return
  if (!isDesktop()) {
    isBubble.value = false
    isExpanded.value = false
    return
  }
  const threshold = headerEl.value.offsetHeight || 0
  const shouldBubble = globalThis.scrollY > threshold

  // Always collapse when transitioning states
  if (isBubble.value !== shouldBubble) {
    isExpanded.value = false
  }

  isBubble.value = shouldBubble
}

let ticking = false
const onScroll = () => {
  if (!ticking) {
    ticking = true
    globalThis.requestAnimationFrame(() => {
      updateBubble()
      ticking = false
    })
  }
}

// Hover/focus expansion handlers
function onEnter() {
  if (!isDesktop()) return
  if (isBubble.value) isExpanded.value = true
}
function onLeave() {
  if (!isDesktop()) return
  if (isBubble.value) isExpanded.value = false
}
function onFocusIn() {
  if (!isDesktop()) return
  if (isBubble.value) isExpanded.value = true
}
function onFocusOut(e: FocusEvent) {
  if (!isDesktop()) return
  // Collapse when focus leaves the header entirely
  const related = e.relatedTarget as Node | null
  if (isBubble.value && headerEl.value && related && !headerEl.value.contains(related)) {
    isExpanded.value = false
  }
}

// Close expansion with Escape (desktop) or close mobile menu
const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (isDesktop()) {
      isExpanded.value = false
    } else {
      close()
    }
  }
}
</script>

<template>
  <header
    class="site-header"
    :class="{ bubble: isBubble, expanded: isExpanded }"
    ref="headerEl"
    role="banner"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @focusin="onFocusIn"
    @focusout="onFocusOut"
  >
    <div class="container bar">
      <a href="#home" class="brand" @click="close" aria-label="Home">
        <img v-if="site?.logo" ref="logoEl" :src="site.logo.src" :alt="site.logo.alt" />
      </a>
      <nav class="nav" aria-label="Primary navigation" ref="menuRef">
        <button
          class="hamburger"
          @click="toggle"
          aria-label="Toggle navigation menu"
          :aria-expanded="open"
          aria-controls="primary-navigation"
        >
          <span class="sr-only">{{ open ? 'Close' : 'Open' }} navigation</span>
          <span class="hamburger-box">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        <ul :id="'primary-navigation'" :class="['links', { open }]">
          <li v-for="item in navItems" :key="item.href">
            <RouterLink
              v-if="item.href.startsWith('/')"
              :to="item.href"
              @click="close"
              class="nav-link"
            >
              {{ item.label }}
            </RouterLink>
            <a v-else :href="item.href" @click="close">{{ item.label }}</a>
          </li>
        </ul>
      </nav>
    </div>
  </header>
  <div class="spacer" aria-hidden="true" ref="spacerEl"></div>
</template>

<style scoped src="../styles/components/header.css"></style>
