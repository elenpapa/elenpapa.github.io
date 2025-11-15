<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { content, type ServicesContent } from '@/services/content'

const data = ref<ServicesContent | null>(null)
onMounted(async () => {
  data.value = await content.getServices()
})
</script>

<template>
  <section id="services" v-reveal>
    <div class="container services">
      <div v-for="(srv, idx) in data?.items" :key="idx" class="card" v-reveal>
        <div class="icon" aria-hidden="true">★</div>
        <h3>{{ srv.title }}</h3>
        <p>{{ srv.description }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.services {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}
.card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
  outline: none;
}
.card:hover,
.card:focus-visible {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}
.icon {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  background: rgba(179, 157, 219, 0.25);
  color: var(--color-primary-600);
  margin-bottom: 12px;
}
.card h3 {
  font-family: var(--font-serif);
  font-size: var(--font-size-xl);
  font-weight: 600;
  line-height: 1.3;
  margin: 0 0 10px;
}
.card p {
  font-family: var(--font-serif);
  font-size: var(--font-size-base);
  line-height: 1.6;
  margin: 0;
  color: var(--color-muted);
}
@media (max-width: 900px) {
  .services {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 600px) {
  .services {
    grid-template-columns: 1fr;
  }
}
</style>
