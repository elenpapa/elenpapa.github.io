<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { content, type ServiceItem, type ServicesContent } from '@/services/content'

const data = ref<ServicesContent | null>(null)
onMounted(async () => {
  data.value = await content.getServices()
})

const getVisualAlt = (srv: ServiceItem) => srv.image?.alt ?? ''
const heading = computed(() => data.value?.heading ?? 'Services')
const description = computed(() => data.value?.description ?? '')
const services = computed(() => data.value?.items ?? [])
</script>

<template>
  <section id="services" v-reveal aria-labelledby="services-title" class="services-section">
    <div class="container">
      <header class="services-header" v-reveal>
        <h2 id="services-title">{{ heading }}</h2>
        <p v-if="description">{{ description }}</p>
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
              :src="srv.image.src"
              :alt="getVisualAlt(srv)"
              loading="lazy"
              decoding="async"
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
