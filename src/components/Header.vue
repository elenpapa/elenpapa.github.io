<script setup lang="ts">
import { computed, onMounted, onServerPrefetch, onUnmounted, nextTick, ref, watch } from 'vue'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
import { content, type SiteContent } from '@/services/content'
import { useHeaderAnimation } from '@/composables/useHeaderAnimation'

const site = ref<SiteContent | null>(null)
const open = ref(false)
const headerEl = ref<HTMLElement | null>(null)
const spacerEl = ref<HTMLElement | null>(null)
const logoEl = ref<HTMLImageElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const linksEl = ref<HTMLElement | null>(null)

// Use the header animation composable for desktop bubble behavior
const {
  isBubble,
  isExpanded,
  onScroll,
  onEnter,
  onLeave,
  onFocusIn,
  onFocusOut,
  onEscapeKey,
  isDesktop,
} = useHeaderAnimation({ headerEl, logoEl, linksEl })

const navItems = computed(() => site.value?.nav ?? [])
const logoSrc = computed(() => site.value?.logo.src || '')
const logoAlt = computed(() => site.value?.logo.alt || 'Site logo')

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

const fetchData = async () => {
  site.value = await content.getSite()
}

onServerPrefetch(fetchData)

onMounted(async () => {
  await fetchData()
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
let resizeTimer: ReturnType<typeof setTimeout> | undefined
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

// Close expansion with Escape (desktop) or close mobile menu
const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    if (isDesktop()) {
      onEscapeKey()
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
        <picture v-if="site?.logo">
          <source :srcset="logoSrc.replace('.png', '.webp')" type="image/webp" />
          <img
            ref="logoEl"
            :src="logoSrc"
            :alt="logoAlt"
            width="40"
            height="40"
            fetchpriority="high"
          />
        </picture>
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
        <ul ref="linksEl" :id="'primary-navigation'" :class="['links', { open }]">
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
