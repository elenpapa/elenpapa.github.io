<script setup lang="ts">
import { computed, onMounted, onUnmounted, nextTick, ref } from 'vue'
import { content, type SiteContent } from '@/services/content'

const site = ref<SiteContent | null>(null)
const open = ref(false)
const headerEl = ref<HTMLElement | null>(null)
const spacerEl = ref<HTMLElement | null>(null)
const logoEl = ref<HTMLImageElement | null>(null)

const navItems = computed(() => site.value?.nav ?? [])

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

/* replaced by combined onMounted above */

onUnmounted(() => {
  globalThis.removeEventListener('resize', onResize)
})

function toggle() {
  open.value = !open.value
}
function close() {
  open.value = false
}
</script>

<template>
  <header class="site-header" ref="headerEl">
    <div class="container bar">
      <a href="#home" class="brand" @click="close">
        <img v-if="site?.logo" ref="logoEl" :src="site.logo.src" :alt="site.logo.alt" />
      </a>
      <nav class="nav" aria-label="Primary">
        <button
          class="hamburger"
          @click="toggle"
          aria-label="Toggle navigation"
          :aria-expanded="open"
          aria-controls="primary-navigation"
        >
          <span class="sr-only">Toggle navigation</span>
          <span class="hamburger-box" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        <ul :id="'primary-navigation'" :class="['links', { open }]">
          <li v-for="item in navItems" :key="item.href">
            <a :href="item.href" @click="close">{{ item.label }}</a>
          </li>
        </ul>
      </nav>
    </div>
  </header>
  <div class="spacer" aria-hidden="true" ref="spacerEl"></div>
</template>

<style scoped>
@keyframes headerReveal {
  from {
    opacity: 0;
    transform: translateY(-16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pillPulse {
  0% {
    opacity: 0;
    transform: scale(0.92);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  backdrop-filter: blur(18px);
  background: linear-gradient(135deg, rgba(179, 157, 219, 0.42), rgba(255, 255, 255, 0.94));
  border-bottom: 1px solid rgba(179, 157, 219, 0.35);
  box-shadow: 0 16px 35px rgba(38, 22, 64, 0.12);
  z-index: 50;
  animation: headerReveal 0.55s ease 0.05s both;
}
.spacer {
  height: var(--site-header-height, 76px);
}
.bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem clamp(1rem, 5vw, 2.75rem);
  gap: 1rem;
  min-height: 68px;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: inherit;
}
.brand img {
  height: clamp(48px, 12vw, 96px);
  width: auto;
  object-fit: contain;
  display: block;
  padding: 6px;
  border-radius: var(--radius-md);
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08));
}
.brand-copy {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}
.brand-copy .eyebrow {
  margin: 0;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.7);
}
.brand-copy .title {
  margin: 0;
  font-size: clamp(1rem, 3vw, 1.35rem);
  font-weight: 600;
}
.nav {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.25rem 0;
}
.hamburger {
  display: none;
  background: rgba(179, 157, 219, 0.12);
  border: 1px solid rgba(179, 157, 219, 0.5);
  border-radius: 999px;
  width: 44px;
  height: 44px;
  padding: 0;
  position: relative;
  color: inherit;
}
.hamburger:focus-visible {
  outline: 2px solid rgba(179, 157, 219, 0.8);
  outline-offset: 3px;
}
.hamburger-box {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  gap: 6px;
}
.hamburger-box span {
  width: 22px;
  height: 2px;
  background: currentColor;
  border-radius: 999px;
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}
.hamburger[aria-expanded='true'] .hamburger-box span:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}
.hamburger[aria-expanded='true'] .hamburger-box span:nth-child(2) {
  opacity: 0;
}
.hamburger[aria-expanded='true'] .hamburger-box span:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}
.links {
  display: flex;
  flex-wrap: wrap;
  list-style: none;
  gap: 0.65rem 0.85rem;
  margin: 0;
  padding: 0;
}
.links a {
  color: var(--color-text);
  font-family: var(--font-serif);
  font-size: var(--font-size-lg);
  font-weight: 500;
  padding: 10px 16px;
  border-radius: 999px;
  position: relative;
  border: 1px solid transparent;
  box-shadow: inset 0 0 0 rgba(179, 157, 219, 0.2);
  isolation: isolate;
  overflow: hidden;
  transition:
    color 0.2s ease,
    border 0.2s ease,
    box-shadow 0.2s ease;
}
.links a::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  inset: 0;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.4), rgba(179, 157, 219, 0.2));
  opacity: 0;
  transform: scale(0.92);
  z-index: -1;
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}
.links a::before {
  content: '';
  position: absolute;
  left: 14px;
  right: 14px;
  bottom: 6px;
  height: 2px;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-600));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.25s ease;
}
.links a:hover,
.links a:focus-visible {
  border-color: var(--color-text);
  box-shadow: 0 10px 18px rgba(179, 157, 219, 0.25);
  outline: none;
}
.links a:hover::after,
.links a:focus-visible::after {
  opacity: 1;
  transform: scale(1);
  animation: pillPulse 0.4s ease;
}
.links a:hover::before,
.links a:focus-visible::before {
  transform: scaleX(1);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 1023px) {
  .links {
    gap: 0.5rem;
  }
}

@media (max-width: 767px) {
  .bar {
    align-items: flex-start;
  }
  .brand-copy .title {
    font-size: 1rem;
  }
  .nav {
    flex-direction: column;
    align-items: flex-end;
  }
  .hamburger {
    display: inline-flex;
  }
  .links {
    position: absolute;
    top: var(--site-header-height, 72px);
    right: clamp(1rem, 6vw, 2rem);
    left: clamp(1rem, 6vw, 2rem);
    flex-direction: column;
    background: rgba(255, 255, 255, 0.97);
    border-radius: var(--radius-md);
    border: 1px solid rgba(179, 157, 219, 0.3);
    box-shadow: 0 28px 60px rgba(28, 24, 45, 0.2);
    max-height: 0;
    overflow: hidden;
    padding: 0;
    transition:
      max-height 0.3s ease,
      padding 0.3s ease;
  }
  .links li {
    width: 100%;
  }
  .links a {
    display: block;
    width: 100%;
    padding: 12px 16px;
  }
  .links.open {
    max-height: 350px;
    padding: 0.5rem 0;
  }
}

@media (max-width: 479px) {
  .brand {
    gap: 0.5rem;
  }
  .brand img {
    height: 56px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-header,
  .links a,
  .links,
  .hamburger-box span {
    animation: none !important;
    transition: none !important;
  }
}
</style>
