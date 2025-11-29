<script setup lang="ts">
import { computed, onMounted, onUnmounted, nextTick, ref, watch } from 'vue'
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap'
import { content, type SiteContent } from '@/services/content'
import gsap from 'gsap'

const site = ref<SiteContent | null>(null)
const open = ref(false)
const headerEl = ref<HTMLElement | null>(null)
const spacerEl = ref<HTMLElement | null>(null)
const logoEl = ref<HTMLImageElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)
const linksEl = ref<HTMLElement | null>(null)

// Bubble state (desktop only): morph to floating bubble on scroll, expand on hover/focus
const isBubble = ref(false)
const isExpanded = ref(false)
// Track if we're currently animating (to prevent scroll jitter during animation)
const isAnimating = ref(false)

const navItems = computed(() => site.value?.nav ?? [])
const logoSrc = computed(() => site.value?.logo.src || '')
const logoAlt = computed(() => site.value?.logo.alt || 'Site logo')

// Focus trap for mobile menu
const { activate, deactivate } = useFocusTrap(menuRef, {
  immediate: false,
})

// Desktop check
const isDesktop = () => globalThis.innerWidth >= 1024

// Check if we should use GSAP transitions (desktop only, respects reduced motion)
const shouldAnimate = () => {
  if (typeof window === 'undefined') return false
  return isDesktop() && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

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

// Watch isBubble state changes and trigger GSAP animations
watch(
  isBubble,
  (newVal, oldVal) => {
    if (!headerEl.value || !shouldAnimate()) return
    if (newVal === oldVal) return

    if (newVal) {
      // Transitioning TO bubble (scroll down)
      // IMMEDIATELY hide links before any animation or class change takes effect
      if (linksEl.value) {
        gsap.set(linksEl.value, {
          opacity: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
        })
      }
      animateToBubble()
    } else {
      // Transitioning FROM bubble to full nav (scroll up)
      animateToFull()
    }
  },
  { flush: 'sync' },
) // flush: 'sync' ensures this runs synchronously before DOM updates

// Animate header collapsing into bubble
function animateToBubble() {
  if (!headerEl.value) return
  isAnimating.value = true

  const header = headerEl.value
  const brandImg = logoEl.value

  // Kill any existing animations
  gsap.killTweensOf([header, linksEl.value, brandImg])

  // Timeline: shrink header to bubble
  const tl = gsap.timeline({
    onComplete: () => {
      isAnimating.value = false
      // Clear inline styles on links so CSS hover states work
      if (linksEl.value) {
        gsap.set(linksEl.value, { clearProps: 'all' })
      }
    },
  })

  // Shrink header to bubble
  tl.to(
    header,
    {
      duration: 0.5,
      top: 'clamp(0.75rem, 2.5vh, 1.5rem)',
      left: 60,
      right: 'auto',
      width: 120,
      height: 120,
      borderRadius: 999,
      ease: 'power3.out',
    },
    0,
  )

  // Shrink logo
  if (brandImg) {
    tl.to(
      brandImg,
      {
        duration: 0.4,
        height: 67,
        padding: 0,
        ease: 'power2.out',
      },
      0,
    )
  }
}

// Animate header expanding from bubble to full nav bar
function animateToFull() {
  if (!headerEl.value) return
  isAnimating.value = true

  const header = headerEl.value
  const links = linksEl.value
  const brandImg = logoEl.value

  // IMMEDIATELY hide links before expansion starts
  if (links) {
    gsap.set(links, {
      opacity: 0,
      visibility: 'hidden',
      pointerEvents: 'none',
    })
  }

  // Kill any existing animations
  gsap.killTweensOf([header, links, brandImg])

  // Timeline: expand header from left to right, then fade in links
  const tl = gsap.timeline({
    onComplete: () => {
      isAnimating.value = false
      // Clear inline styles so CSS takes over
      gsap.set(header, { clearProps: 'all' })
      if (links) gsap.set(links, { clearProps: 'all' })
      if (brandImg) gsap.set(brandImg, { clearProps: 'all' })
    },
  })

  // Expand header from left to right
  // First animate left to 0, then width expands, creating left-to-right effect
  tl.to(header, {
    duration: 0.2,
    top: 0,
    ease: 'power2.out',
  })

  tl.to(
    header,
    {
      duration: 0.5,
      left: 0,
      width: '100%',
      ease: 'power2.inOut',
    },
    '-=0.1',
  )

  tl.to(
    header,
    {
      duration: 0.4,
      height: '113px',
      borderRadius: 0,
      right: 0,
      ease: 'power2.out',
    },
    '-=0.3',
  )

  // Grow logo back
  if (brandImg) {
    tl.to(
      brandImg,
      {
        duration: 0.4,
        height: 'clamp(48px, 12vw, 96px)',
        padding: 6,
        ease: 'power2.out',
      },
      '-=0.4',
    )
  }

  // Fade in links after header fully expanded
  if (links) {
    tl.to(links, {
      duration: 0.3,
      opacity: 1,
      visibility: 'visible',
      pointerEvents: 'auto',
      ease: 'power2.out',
    })
  }
}

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

// Update bubble state based on scroll position and header height
const updateBubble = () => {
  if (!headerEl.value) return
  // Skip state updates while animating to prevent jitter
  if (isAnimating.value) return
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
        <img
          v-if="site?.logo"
          ref="logoEl"
          :src="logoSrc"
          :alt="logoAlt"
          width="40"
          height="40"
          fetchpriority="high"
        />
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
