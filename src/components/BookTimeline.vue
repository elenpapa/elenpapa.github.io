<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { content, type TimelineContent } from '@/services/content'

const data = ref<TimelineContent | null>(null)
onMounted(async () => {
  data.value = await content.getTimeline()
})
</script>

<template>
  <section id="timeline" class="timeline-section">
    <div class="container timeline">
      <h2 class="section-title">Εργογραφία</h2>
      <div class="timeline-grid" aria-hidden="false">
        <div class="timeline-column timeline-column--left">
          <article
            v-for="(item, idx) in (data?.items || []).filter((_, i) => i % 2 === 0)"
            :key="`left-${idx}`"
            class="entry reveal--pageflip-left"
            v-reveal="{ threshold: 0.2, rootMargin: '0px 0px -10% 0px', once: true }"
          >
            <span class="branch" aria-hidden="true"></span>
            <img
              class="cover"
              :src="item.cover"
              :alt="item.title"
              loading="lazy"
              decoding="async"
            />
            <div class="meta">
              <h3>{{ item.title }}</h3>
              <span class="year">{{ item.year }}</span>
              <p class="blurb">{{ item.blurb }}</p>
              <p class="actions">{{ item.actions }}</p>
            </div>
          </article>
        </div>
        <div class="timeline-divider" aria-hidden="true"></div>
        <div class="timeline-column timeline-column--right">
          <article
            v-for="(item, idx) in (data?.items || []).filter((_, i) => i % 2 === 1)"
            :key="`right-${idx}`"
            class="entry entry--right reveal--pageflip-right"
            v-reveal="{ threshold: 0.2, rootMargin: '0px 0px -10% 0px', once: true }"
          >
            <span class="branch" aria-hidden="true"></span>
            <img
              class="cover"
              :src="item.cover"
              :alt="item.title"
              loading="lazy"
              decoding="async"
            />
            <div class="meta">
              <h3>{{ item.title }}</h3>
              <span class="year">{{ item.year }}</span>
              <p class="blurb">{{ item.blurb }}</p>
              <p class="actions">{{ item.actions }}</p>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.timeline-section {
  background: var(--color-surface);
  padding: 60px 0;
}
.timeline {
  position: relative;
}
.timeline-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 32px;
  align-items: flex-start;
  /* provide perspective for 3D page-flip */
  perspective: 1200px;
}
.timeline-divider {
  width: 4px;
  background: rgba(0, 0, 0, 0.1);
  align-self: stretch;
  min-height: 100%;
  position: relative;
  z-index: 0;
}
.timeline-column {
  display: flex;
  flex-direction: column;
}
.entry .branch {
  position: absolute;
  top: 53%;
  transform: translateY(-50%);
  height: 2px;
  background: rgba(0, 0, 0, 0.08);
  width: 33px;
  z-index: 2;
  border-radius: 2px;
}
.timeline-column--left .entry .branch {
  right: -33px;
}
.timeline-column--right .entry .branch {
  left: -33px;
}
.entry .branch::after {
  content: '';
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-primary-600);
  z-index: 2;
}
.timeline-column--left .entry .branch::after {
  right: -7px;
}
.timeline-column--right .entry .branch::after {
  left: -7px;
}
.entry {
  display: grid;
  grid-template-columns: 220px auto;
  gap: 16px;
  padding: 24px;
  position: relative;
  margin-bottom: var(--timeline-space);
  align-items: center;
  transform-style: preserve-3d;
  /* Book-page background */
  background: linear-gradient(180deg, #fffef7 0%, #f6f2e6 100%);
  border-radius: var(--radius-md);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 8px 20px rgba(11, 13, 15, 0.06);
  overflow: visible;
  /* subtle paper grain / ruled-lines effect */
  background-image:
    radial-gradient(rgba(0, 0, 0, 0.01) 1px, transparent 1px),
    linear-gradient(180deg, transparent, transparent);
  background-size:
    180px 180px,
    auto;
}
.entry--right {
  grid-template-columns: auto 220px;
  margin-top: var(--timeline-space);
  margin-bottom: 0px;
}
.entry--right .meta {
  order: 1;
  text-align: right;
}
.entry--right .cover {
  order: 2;
}
.cover {
  width: 100%;
  height: auto;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
.meta {
  height: 100%;
  align-content: center;
}

.meta h3 {
  font-family: var(--font-serif);
  font-size: var(--font-size-2xl);
  font-weight: 600;
  line-height: 1.3;
  margin: 0 0 8px;
}

.meta .year {
  font-family: var(--font-sans);
  font-size: var(--font-size-xl);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-primary-600);
  font-weight: 700;
}
.meta .blurb {
  font-family: var(--font-serif);
  font-size: var(--font-size-lg);
  line-height: 1.6;
  margin: 10px 0 0;
  color: var(--color-muted);
}
.meta .actions {
  font-family: var(--font-sans);
  font-size: var(--font-size-xl);
  line-height: 1.5;
  margin: 8px 0 0;
  color: var(--color-primary-600);
  font-weight: 600;
  font-style: italic;
}
@media (max-width: 900px) {
  .timeline-grid {
    grid-template-columns: 1fr;
  }
  .timeline-divider {
    display: none;
  }
  .timeline-column {
    border-left: 2px solid rgba(0, 0, 0, 0.1);
    padding-left: 16px;
  }
  .entry,
  .entry--right {
    grid-template-columns: 240px auto;
  }
  .entry--right .meta {
    text-align: left;
  }
  .entry .branch {
    display: none;
  }
}

.section-title {
  font-family: var(--font-serif);
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  font-weight: 600;
  line-height: 1.3;
  margin: 0 0 16px;
  text-align: center;
}

/* Page flip reveal effect */
/* Base reveal utility adds .reveal and .reveal--shown via v-reveal */
.entry.reveal--pageflip-left,
.entry.reveal--pageflip-right {
  /* Override the global .reveal defaults with a 3D flip */
  transform: perspective(1200px) rotateY(var(--_flip-initial, -65deg));
  opacity: 0;
  transition:
    transform 700ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 500ms ease-out,
    box-shadow 400ms ease-out;
  z-index: 1;
}

.entry.reveal--pageflip-left {
  --_flip-initial: -65deg;
  transform-origin: right center;
}

.entry.reveal--pageflip-right {
  --_flip-initial: 65deg;
  transform-origin: left center;
}

.entry.reveal--pageflip-left.reveal--shown,
.entry.reveal--pageflip-right.reveal--shown {
  transform: perspective(1200px) rotateY(0deg);
  opacity: 1;
}

/* Soft moving shadow during flip for depth */
.entry.reveal--pageflip-left::after,
.entry.reveal--pageflip-right::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.02));
  opacity: 0.25;
  transition: opacity 500ms ease-out;
  border-radius: var(--radius-md);
}
.entry.reveal--pageflip-right::after {
  background: linear-gradient(to left, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.02));
}
.entry.reveal--pageflip-left.reveal--shown::after,
.entry.reveal--pageflip-right.reveal--shown::after {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .entry.reveal--pageflip-left,
  .entry.reveal--pageflip-right {
    transform: none;
    opacity: 1;
    transition: none;
  }
  .entry.reveal--pageflip-left::after,
  .entry.reveal--pageflip-right::after {
    display: none;
  }
}
</style>
