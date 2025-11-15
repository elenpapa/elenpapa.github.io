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
        <p>{{ home?.intro.text }}</p>
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
  font-size: var(--font-size-lg);
  line-height: 1.7;
  color: var(--color-muted);
  margin: 0;
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
  width: 100%;
  height: 550px;
  object-fit: cover;
  border-radius: var(--radius-lg);
}
@media (max-width: 900px) {
  .intro {
    grid-template-columns: 1fr;
  }
}
</style>
