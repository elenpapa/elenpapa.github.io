<script setup lang="ts">
import { ref, onMounted, onServerPrefetch, computed } from 'vue'
import { content, type HomeContent } from '@/services/content'

const home = ref<HomeContent | null>(null)
const isLoading = ref(true)
const introImageSrc = computed(() => home.value?.intro.image.src || '')
const introImageAlt = computed(() => home.value?.intro.image.alt || 'Intro image')

// Helper for milestone icons
const getMilestoneIconSrc = (iconSrc: string | undefined) => iconSrc || ''

// Generate srcset for milestone icons (displayed at 98px)
const getMilestoneIconSrcset = (iconSrc: string | undefined) => {
  if (!iconSrc) return ''
  const basePath = iconSrc.replace(/\.[^.]+$/, '')
  const encodedPath = encodeURI(basePath)
  return `${encodedPath}-100w.webp 100w, ${encodedPath}-200w.webp 200w`
}

// Generate srcset for intro image (displayed at ~400px)
const getIntroImageSrcset = computed(() => {
  const src = introImageSrc.value
  if (!src) return ''
  const basePath = src.replace(/\.[^.]+$/, '')
  const encodedPath = encodeURI(basePath)
  return `${encodedPath}-400w.webp 400w, ${encodedPath}-800w.webp 800w`
})

// Placeholder items to prevent CLS during initial load
const placeholderEducation = [
  { degree: '', institution: '', year: '', icon: '' },
  { degree: '', institution: '', year: '', icon: '' },
  { degree: '', institution: '', year: '', icon: '' },
  { degree: '', institution: '', year: '', icon: '' },
]

const displayedEducation = computed(
  () => home.value?.education || (isLoading.value ? placeholderEducation : []),
)

const fetchData = async () => {
  home.value = await content.getHome()
  isLoading.value = false
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
          :srcset="getIntroImageSrcset"
          sizes="(max-width: 768px) 100vw, 400px"
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
          v-for="(milestone, index) in displayedEducation"
          :key="milestone.degree + '-' + (milestone.year ?? index)"
          class="milestone-card"
          :class="{ 'milestone-card--loading': isLoading }"
        >
          <div class="bubble">
            <div class="bubble-icon">
              <img
                v-if="milestone.icon"
                :src="getMilestoneIconSrc(milestone.icon)"
                :srcset="getMilestoneIconSrcset(milestone.icon)"
                sizes="98px"
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
