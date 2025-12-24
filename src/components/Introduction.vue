<script setup lang="ts">
import { ref, onMounted, onServerPrefetch, computed } from 'vue'
import { content, type HomeContent } from '@/services/content'

const home = ref<HomeContent | null>(null)
const introImageSrc = computed(() => home.value?.intro.image.src || '')
const introImageAlt = computed(() => home.value?.intro.image.alt || 'Intro image')

// Helper for milestone icons
const getMilestoneIconSrc = (iconSrc: string | undefined) => iconSrc || ''

const fetchData = async () => {
  home.value = await content.getHome()
}

onServerPrefetch(fetchData)
onMounted(fetchData)
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
          :src="introImageSrc"
          :alt="introImageAlt"
          loading="lazy"
          decoding="async"
          width="400"
          height="500"
        />
      </div>
    </div>

    <!-- Education Milestones -->
    <div class="container education-milestones">
      <div class="milestone-grid">
        <div
          v-for="(milestone, index) in home?.education || []"
          :key="milestone.degree + '-' + (milestone.year ?? index)"
          class="milestone-card"
        >
          <div class="bubble">
            <div class="bubble-icon">
              <img
                :src="getMilestoneIconSrc(milestone.icon)"
                :alt="milestone.degree + ' icon'"
                class="bubble-svg"
                loading="eager"
                fetchpriority="high"
                decoding="async"
                width="98"
                height="98"
              />
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
