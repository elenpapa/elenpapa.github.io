<script setup lang="ts">
import { ref, onMounted, onServerPrefetch, watch, nextTick, computed } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'
import { Swiper, SwiperSlide } from 'swiper/vue'
import type { Swiper as SwiperType } from 'swiper/types'
import { A11y } from 'swiper/modules'
import { content, type PostsContent } from '@/services/content'
import 'swiper/css'

const data = ref<PostsContent | null>(null)
const heading = computed(() => data.value?.heading ?? 'Featured Posts')
const description = computed(() => data.value?.description ?? '')
const canScrollPrev = ref(false)
const canScrollNext = ref(false)
const swiperInstance = ref<SwiperType>()
const swiperModules = [A11y]

const updateButtons = (swiper?: SwiperType | null) => {
  if (!swiper) {
    canScrollPrev.value = false
    canScrollNext.value = false
    return
  }

  const locked = swiper.isLocked
  canScrollPrev.value = !locked && !swiper.isBeginning
  canScrollNext.value = !locked && !swiper.isEnd
}

const onSwiperReady = (swiper: SwiperType) => {
  swiperInstance.value = swiper
  updateButtons(swiper)
}

const handleStateChange = (swiper: SwiperType) => {
  updateButtons(swiper)
}

const fetchData = async () => {
  data.value = await content.getPosts()
}

onServerPrefetch(fetchData)
onMounted(fetchData)

watch(
  () => data.value?.items?.length,
  async () => {
    await nextTick()
    swiperInstance.value?.update()
    updateButtons(swiperInstance.value)
  },
)

const scrollPrev = () => {
  swiperInstance.value?.slidePrev()
}

const scrollNext = () => {
  swiperInstance.value?.slideNext()
}

const getImagePriority = (idx: number): 'high' | 'low' => {
  // Prioritize first 3 images (visible on desktop)
  return idx < 3 ? 'high' : 'low'
}

const getImageLoading = (idx: number): 'eager' | 'lazy' => {
  // Eagerly load first 3 images, lazy load the rest
  return idx < 3 ? 'eager' : 'lazy'
}

const posts = computed(() => data.value?.items ?? [])
const getPostImageSrc = (imageSrc: string | undefined) => imageSrc || ''
</script>

<template>
  <section
    id="posts"
    aria-labelledby="posts-title"
    class="posts-section diagonal--both-ltr-rtl diagonal-padding--both"
  >
    <div class="container">
      <header class="posts-header" v-reveal>
        <h2 id="posts-title">{{ heading }}</h2>
        <p v-if="description">{{ description }}</p>
      </header>

      <div v-if="!data" class="loading-skeleton">
        <div class="skeleton-slide" v-for="n in 3" :key="n">
          <div class="skeleton-image"></div>
          <div class="skeleton-title"></div>
          <div class="skeleton-text"></div>
        </div>
      </div>

      <div v-else class="carousel-wrapper">
        <button
          class="nav nav-prev"
          @click="scrollPrev"
          :disabled="!canScrollPrev"
          aria-label="Previous posts"
          title="Previous posts"
        >
          <SvgIcon name="chevron-left" class="icon" :width="20" :height="20" ariaHidden />
          <span class="sr-only">Previous</span>
        </button>

        <Swiper
          class="carousel"
          :modules="swiperModules"
          :slides-per-view="1"
          :space-between="16"
          :loop="false"
          :watch-overflow="true"
          :breakpoints="{ 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }"
          @swiper="onSwiperReady"
          @slideChange="handleStateChange"
          @resize="handleStateChange"
          @breakpoint="handleStateChange"
          @toEdge="handleStateChange"
          @fromEdge="handleStateChange"
        >
          <SwiperSlide
            v-for="(post, idx) in posts"
            :key="idx"
            class="carousel__slide"
            :aria-label="`Read post ${idx + 1} of ${posts.length}: ${post.title}`"
          >
            <RouterLink :to="`/posts/${idx}`" class="slide-link">
              <div class="image-wrapper">
                <img
                  :src="getPostImageSrc(post.image)"
                  :alt="post.title"
                  :loading="getImageLoading(idx)"
                  :fetchpriority="getImagePriority(idx)"
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
          </SwiperSlide>
        </Swiper>

        <button
          class="nav nav-next"
          @click="scrollNext"
          :disabled="!canScrollNext"
          aria-label="Next posts"
          title="Next posts"
        >
          <SvgIcon name="chevron-right" class="icon" :width="20" :height="20" ariaHidden />
          <span class="sr-only">Next</span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped src="../styles/components/posts-carousel.css"></style>
