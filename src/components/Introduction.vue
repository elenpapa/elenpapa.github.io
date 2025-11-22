<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { content, type HomeContent } from '@/services/content'

const home = ref<HomeContent | null>(null)

// Education data is provided by `public/content/home.json` via `content.getHome()`

onMounted(async () => {
  home.value = await content.getHome()
})
</script>

<template>
  <section id="intro" v-reveal class="intro-section diagonal--ltr">
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

    <!-- Education Milestones -->
    <div class="container education-milestones">
      <div class="milestone-grid">
        <div
          v-for="(milestone, index) in home?.education || []"
          :key="index"
          class="milestone-card"
        >
          <div class="bubble">
            <div class="bubble-icon">
              <img
                v-if="milestone.icon"
                :src="milestone.icon"
                :alt="milestone.degree + ' icon'"
                class="bubble-svg"
                loading="lazy"
                decoding="async"
              />
              <span v-else class="bubble-fallback">🎓</span>
            </div>
          </div>
          <div class="milestone-content">
            <h3>{{ milestone.degree }}</h3>
            <p class="institution">{{ milestone.institution }}</p>
            <p class="year">{{ milestone.year }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped src="../styles/components/introduction.css"></style>
