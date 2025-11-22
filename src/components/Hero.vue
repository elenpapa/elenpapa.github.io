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

<style scoped src="../styles/components/hero.css"></style>
