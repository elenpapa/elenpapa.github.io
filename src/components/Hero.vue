<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { content, type HomeContent } from '@/services/content'

const home = ref<HomeContent | null>(null)

onMounted(async () => {
  home.value = await content.getHome()
})
</script>

<template>
  <section
    id="home"
    class="hero"
    v-reveal
    :style="home ? { backgroundImage: `url(${home.hero.backgroundImage})` } : {}"
  >
    <div class="overlay">
      <div class="container inner">
        <h1 class="title">{{ home?.hero.title }}</h1>
        <p class="subtitle">{{ home?.hero.subtitle }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.title {
  background-color: #1a143323;
  border-radius: 10px 12px;
  padding: 10px 25px;
}
.subtitle {
  border-radius: 10px 12px;
  padding: 10px 25px;
  background-color: #1a143323;
  color: #f1f1f8;
  font-family: var(--font-serif);
  font-size: var(--font-size-2xl);
  font-weight: 400;
  margin: 0 0 32px;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.25);
}

.hero {
  min-height: 400px;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  position: relative;
  padding-top: 0;
  overflow: hidden;
}
.overlay {
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.25));
  /* Make the overlay cover the entire hero so the background image stays behind content */
  position: absolute;
  inset: 0;
}
.inner {
  display: grid;
  place-items: center;
  text-align: center;
  padding: 96px 0;
  height: 100%;
}
h1 {
  color: white;
  font-family: var(--font-serif);
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 600;
  line-height: 1.2;
  margin: 0 0 16px;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}

.cta {
  display: inline-block;
  background: var(--color-primary);
  color: #1a1433;
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
  font-weight: 600;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}
.cta:hover,
.cta:focus-visible {
  background: var(--color-primary-600);
  outline: none;
}

@media (max-width: 768px) {
  .hero {
    aspect-ratio: 4 / 3;
    min-height: 300px;
  }
}
</style>
