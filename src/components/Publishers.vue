<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { content, type PublishersContent } from '@/services/content'

const data = ref<PublishersContent | null>(null)

onMounted(async () => {
  data.value = await content.getPublishers()
})

const heading = computed(() => data.value?.heading ?? '')
const description = computed(() => data.value?.description ?? '')
const publishers = computed(() => data.value?.items ?? [])
const getPublisherLogoSrc = (logoSrc: string | undefined) => logoSrc || ''
const getPublisherLogoAlt = (logoAlt: string | undefined) => logoAlt || ''
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
