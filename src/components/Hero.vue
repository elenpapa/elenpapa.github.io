<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { content, type HomeContent } from '@/services/content'

const home = ref<HomeContent | null>(null)
const heroBackgroundImage = computed(() => home.value?.hero.backgroundImage || '')
const heroTitle = computed(() => home.value?.hero.title || '')
const heroSubtitle = computed(() => home.value?.hero.subtitle || '')

onMounted(async () => {
  home.value = await content.getHome()
})
</script>

<template>
  <section
    id="home"
    class="hero"
    v-reveal
    :style="home ? { backgroundImage: `url(${heroBackgroundImage})` } : {}"
  >
    <div class="overlay">
      <div class="container inner">
        <h1 class="title">{{ heroTitle }}</h1>
        <p class="subtitle">{{ heroSubtitle }}</p>
      </div>
    </div>
  </section>
</template>

<style scoped src="../styles/components/hero.css"></style>
