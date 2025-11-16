<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { content, type HomeContent } from '@/services/content'

const home = ref<HomeContent | null>(null)
onMounted(async () => {
  home.value = await content.getHome()
})
</script>

<template>
  <section id="intro" v-reveal>
    <div class="container intro">
      <div class="text">
        <h2>{{ home?.intro.title }}</h2>
        <p v-html="home?.intro.text"></p>
        <RouterLink to="/timeline" class="cta-button">Δείτε την Εργογραφία μου</RouterLink>
      </div>
      <div class="image">
        <div class="backdrop"></div>
        <img
          v-if="home"
          :src="home.intro.image.src"
          :alt="home.intro.image.alt"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  </section>
</template>

<style scoped>
.intro {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 32px;
  align-items: center;
}
.text h2 {
  font-family: var(--font-serif);
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  font-weight: 600;
  line-height: 1.3;
  margin: 0 0 16px;
}
.text p {
  font-family: var(--font-serif);
  font-size: var(--font-size-2xl);
  line-height: 1.7;
  color: var(--color-light-gray);
  margin: 0 0 24px;
}
.cta-button {
  display: inline-block;
  padding: 12px 24px;
  background: var(--color-primary-600);
  color: white;
  font-family: var(--font-sans);
  font-size: var(--font-size-lg);
  font-weight: 600;
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}
.cta-button:hover,
.cta-button:focus-visible {
  background: var(--color-primary-700, #7c5ba1);
  outline: 2px solid var(--color-primary-600);
  outline-offset: 2px;
}
.image {
  position: relative;
}
.backdrop {
  position: absolute;
  inset: 10% 8% 8% 12%;
  background: rgba(179, 157, 219, 0.2);
  filter: blur(20px);
  border-radius: var(--radius-lg);
}
.image img {
  position: relative;
  width: 75%;
  object-fit: cover;
  border-radius: var(--radius-lg);
}

@media (max-width: 768px) {
  .image img {
    width: 100%;
  }
}
@media (max-width: 900px) {
  .intro {
    grid-template-columns: 1fr;
  }
}
</style>
