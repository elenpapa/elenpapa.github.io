<script setup lang="ts">
import { ref, onMounted, onServerPrefetch, computed } from 'vue'
import { content, type PublishersContent } from '@/services/content'

const data = ref<PublishersContent | null>(null)

const fetchData = async () => {
  data.value = await content.getPublishers()
}

onServerPrefetch(fetchData)
onMounted(fetchData)

const heading = computed(() => data.value?.heading ?? '')
const description = computed(() => data.value?.description ?? '')
const publishers = computed(() => data.value?.items ?? [])
const getPublisherLogoSrc = (logoSrc: string | undefined) => logoSrc || ''
const getPublisherLogoAlt = (logoAlt: string | undefined) => logoAlt || ''

// Generate srcset for publisher logos (displayed at 60-120px)
// Skip srcset for SVG files - they're vector and scale perfectly
const getPublisherLogoSrcset = (logoSrc: string | undefined) => {
  if (!logoSrc || logoSrc.endsWith('.svg')) return ''
  const basePath = logoSrc.replace(/\.[^.]+$/, '')
  const encodedPath = encodeURI(basePath)
  return `${encodedPath}-120w.webp 120w, ${encodedPath}-240w.webp 240w`
}
</script>

<template>
  <section
    id="publishers"
    v-reveal
    aria-labelledby="publishers-title"
    class="publishers-section diagonal--top-rtl diagonal-padding--both"
  >
    <div class="container">
      <header class="publishers-header">
        <h2 id="publishers-title">{{ heading }}</h2>
        <p v-if="description" class="publishers-description">{{ description }}</p>
      </header>
      <ul class="publishers-grid">
        <li v-for="publisher in publishers" :key="publisher.name" class="publisher-card">
          <div v-if="publisher.logo" class="publisher-logo">
            <img
              :src="getPublisherLogoSrc(publisher.logo.src)"
              :srcset="getPublisherLogoSrcset(publisher.logo.src)"
              sizes="(max-width: 768px) 80px, 120px"
              :alt="getPublisherLogoAlt(publisher.logo.alt)"
              loading="lazy"
              decoding="async"
              width="120"
              height="120"
            />
          </div>
          <div class="publisher-info">
            <h3>{{ publisher.name }}</h3>
            <p v-if="publisher.description" class="publisher-description">
              {{ publisher.description }}
            </p>
            <ul v-if="publisher.services?.length" class="publisher-services">
              <li v-for="(service, idx) in publisher.services" :key="idx">{{ service }}</li>
            </ul>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped src="@/styles/components/publishers.css"></style>
