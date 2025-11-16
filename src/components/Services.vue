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

<style scoped>
.services-section {
  background: var(--color-surface);
}
.services-header {
  max-width: 720px;
  margin: 0 auto 40px;
  text-align: center;
}
.services-header h2 {
  font-size: clamp(2rem, 2.5vw, 2.5rem);
  margin-bottom: 12px;
}
.services-header p {
  margin: 0;
  color: var(--color-muted);
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 24px;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(255, 255, 255, 0.05);
  outline: none;
  background: var(--color-bg);
}
.card.reveal {
  transition: none;
}
.card.reveal.reveal--shown {
  animation: card-rise 0.7s ease-out both;
  animation-delay: calc(var(--card-index, 0) * 120ms);
}
.card:hover,
.card:focus-visible {
  box-shadow: var(--shadow-md);
}
.card-media {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.icon {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 16px;
  background: rgba(179, 157, 219, 0.25);
  color: var(--color-primary-600);
  font-size: 1.5rem;
}
.thumb {
  width: 250px;
  height: 250px;
  object-fit: cover;
  border-radius: var(--radius-xl);
}
.card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.card-focus {
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.08em;
  color: var(--color-primary-400);
  margin: 0;
}
.card h3 {
  font-family: var(--font-serif);
  font-size: var(--font-size-4xl);
  font-weight: 600;
  line-height: 1.3;
  margin: 0;
}
.card-description {
  margin: 0;
  color: var(--color-muted);
  font-size: var(--font-size-2xl);
}
.card-highlights {
  display: grid;
  gap: 8px;
  /* list-style: none; */
  margin: 0;
  /* padding: 0; */
}
.card-highlights li {
  /* padding-left: 1.2rem; */
  position: relative;
  color: var(--color-text);
  font-size: var(--font-size-2xl);
}

@keyframes card-rise {
  0% {
    opacity: 0;
    transform: translateY(24px) scale(0.97);
  }
  60% {
    opacity: 1;
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 600px) {
  .card {
    padding: 20px;
  }
  .thumb {
    width: 72px;
    height: 72px;
  }
}
</style>
