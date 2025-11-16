<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import emblaCarouselVue from 'embla-carousel-vue'
import { content, type PostsContent } from '@/services/content'

const data = ref<PostsContent | null>(null)
const [emblaRef, emblaApi] = emblaCarouselVue({
  align: 'start',
  loop: true,
  skipSnaps: true,
  breakpoints: {
    '(min-width: 768px)': { slidesToScroll: 2 },
    '(min-width: 1024px)': { slidesToScroll: 3 },
  },
})

const canScrollPrev = ref(false)
const canScrollNext = ref(false)
let detachEmblaListeners: (() => void) | null = null

onMounted(async () => {
  data.value = await content.getPosts()
  await nextTick()
  // Manually trigger reInit after data loads
  if (emblaApi.value) {
    console.log('[Embla] Manual reInit after data load')
    emblaApi.value.reInit()
  }
})

// React when Embla becomes available (happens after the carousel renders)
watch(
  emblaApi,
  (api) => {
    detachEmblaListeners?.()
    if (!api) {
      console.log('[Embla] API not available yet')
      return
    }

    console.log('[Embla] API initialized')

    const updateButtons = () => {
      const prev = api.canScrollPrev()
      const next = api.canScrollNext()
      canScrollPrev.value = prev
      canScrollNext.value = next

      console.log('[Embla] Button state:', {
        canScrollPrev: prev,
        canScrollNext: next,
        selectedScrollSnap: api.selectedScrollSnap(),
        scrollSnapList: api.scrollSnapList(),
        slideCount: api.slideNodes().length,
      })
    }

    api.on('select', updateButtons)
    api.on('reInit', updateButtons)
    updateButtons()

    detachEmblaListeners = () => {
      api.off('select', updateButtons)
      api.off('reInit', updateButtons)
    }
  },
  { immediate: true },
)

// Reinitialize Embla when the number of slides changes (async data load or future dynamic updates)
watch(
  () => data.value?.items.length,
  async (len, prev) => {
    console.log('[Embla] Slides length changed:', { prev, len, hasApi: !!emblaApi.value })
    if (!emblaApi.value || !len || len === prev) return
    await nextTick()
    console.log('[Embla] Calling reInit...')
    emblaApi.value.reInit()
  },
)

onBeforeUnmount(() => {
  detachEmblaListeners?.()
})

const scrollPrev = () => {
  console.log('[Embla] scrollPrev called')
  emblaApi.value?.scrollPrev()
}
const scrollNext = () => {
  console.log('[Embla] scrollNext called')
  emblaApi.value?.scrollNext()
}
</script>

<template>
  <section id="posts" v-reveal>
    <div class="container">
      <h2 class="visually-hidden">Featured posts</h2>

      <div class="carousel-wrapper">
        <button
          class="nav nav-prev"
          @click="scrollPrev"
          :disabled="!canScrollPrev"
          aria-label="Previous posts"
        >
          ‹
        </button>

        <div class="embla" ref="emblaRef">
          <div class="embla__container">
            <RouterLink
              v-for="(post, idx) in data?.items || []"
              :key="idx"
              class="embla__slide"
              :to="`/posts/${idx}`"
              :aria-label="`Read post ${idx + 1} of ${data?.items?.length || 0}: ${post.title}`"
            >
              <div class="image-wrapper">
                <img
                  :src="post.image"
                  :alt="post.title"
                  loading="lazy"
                  decoding="async"
                  width="400"
                  height="220"
                />
              </div>
              <h3>
                {{ post.title }}
              </h3>
              <p v-if="post.summary" class="summary">{{ post.summary }}</p>
            </RouterLink>
          </div>
        </div>

        <button
          class="nav nav-next"
          @click="scrollNext"
          :disabled="!canScrollNext"
          aria-label="Next posts"
        >
          ›
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.carousel-wrapper {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 12px;
  align-items: center;
}

.embla {
  overflow: hidden;
  border-radius: var(--radius-lg);
}

.embla__container {
  display: flex;
  gap: 16px;
  touch-action: pan-y pinch-zoom;
}

.embla__slide {
  flex: 0 0 100%;
  min-width: 0;
  padding: 12px;
  background: var(--color-surface);
  border-radius: var(--radius-md);
  display: block; /* ensure the link fills the slide card */
  text-decoration: none;
  color: inherit;
}

.image-wrapper {
  position: relative;
  width: 100%;
  height: 220px;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--color-bg-alt, #f5f5f5);
}

.embla__slide img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  box-shadow: var(--shadow-sm);
  transform: translateZ(0);
}

.embla__slide h3 {
  font-family: var(--font-serif);
  font-size: var(--font-size-3xl);
  font-weight: 600;
  line-height: 1.4;
  margin: 12px 6px 0;
  transition: color 0.2s ease;
}

.embla__slide:hover,
.embla__slide:focus-visible {
  outline: 2px solid var(--color-primary-600);
  outline-offset: 2px;
}

.embla__slide:hover h3,
.embla__slide:focus-visible h3 {
  color: var(--color-primary-600);
}

.summary {
  font-size: var(--font-size-lg, 0.9rem);
  line-height: 1.45;
  margin: 6px 6px 0;
  color: var(--color-text-secondary, #555);
}

.nav {
  background: var(--color-surface);
  font-family: var(--font-sans);
  font-size: 24px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: inherit;
}

.nav:hover:not(:disabled),
.nav:focus-visible:not(:disabled) {
  border-color: var(--color-primary-600);
  outline: 2px solid var(--color-primary-600);
  outline-offset: 2px;
}

.nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

@media (min-width: 768px) {
  .embla__slide {
    flex: 0 0 calc(50% - 8px);
  }
}

@media (min-width: 1024px) {
  .embla__slide {
    flex: 0 0 calc(33.333% - 11px);
  }
}

@media (max-width: 600px) {
  .image-wrapper {
    height: 160px;
  }

  .nav {
    width: 36px;
    height: 36px;
    font-size: 20px;
  }
}
</style>
