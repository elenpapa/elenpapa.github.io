<script setup lang="ts">
import { ref, onMounted, onServerPrefetch, computed } from 'vue'
import { content, type ServicesContent } from '@/services/content'

const data = ref<ServicesContent | null>(null)

const fetchData = async () => {
  data.value = await content.getServices()
}

onServerPrefetch(fetchData)
onMounted(fetchData)

const heading = computed(() => data.value?.heading ?? 'Services')
// const description = computed(() => data.value?.description ?? '')
const services = computed(() => data.value?.items ?? [])
const getServiceImageSrc = (imageSrc: string | undefined) => imageSrc || ''
const getServiceImageAlt = (imageAlt: string | undefined) => imageAlt || ''

// Generate srcset for responsive images
const getServiceImageSrcset = (imageSrc: string | undefined) => {
  if (!imageSrc) return ''
  // Extract base name without extension and encode for URLs with spaces
  const basePath = imageSrc.replace(/\.[^.]+$/, '')
  const encodedPath = encodeURI(basePath)
  return `${encodedPath}-300w.webp 300w, ${encodedPath}-600w.webp 600w`
}
</script>

<template>
  <section id="services" v-reveal aria-labelledby="services-title" class="services-section">
    <div class="container">
      <header class="services-header" v-reveal>
        <h2 id="services-title">{{ heading }}</h2>
        <!-- <p class="services-description" v-if="description">{{ description }}</p> -->
      </header>
      <div class="services-grid">
        <article
          v-for="(srv, idx) in services"
          :key="idx"
          class="card"
          v-reveal
          :style="{ '--card-index': idx }"
        >
          <div class="card-media">
            <img
              v-if="srv.image"
              class="thumb"
              :src="getServiceImageSrc(srv.image.src)"
              :srcset="getServiceImageSrcset(srv.image.src)"
              sizes="(max-width: 768px) 100vw, 300px"
              :alt="getServiceImageAlt(srv.image.alt)"
              loading="lazy"
              decoding="async"
              width="300"
              height="200"
            />
            <div v-else class="icon" aria-hidden="true">{{ srv.icon ?? '★' }}</div>
          </div>
          <div class="card-body">
            <p v-if="srv.focus" class="card-focus">{{ srv.focus }}</p>
            <h3>{{ srv.title }}</h3>
            <p class="card-description">{{ srv.description }}</p>
            <ul v-if="srv.highlights?.length" class="card-highlights">
              <li v-for="(item, hIdx) in srv.highlights" :key="hIdx">{{ item }}</li>
            </ul>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped src="../styles/components/services.css"></style>
