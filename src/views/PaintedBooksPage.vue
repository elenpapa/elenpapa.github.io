<script setup lang="ts">
import { ref, onMounted, onServerPrefetch, computed } from 'vue'
import { content, type PaintedBooksContent } from '@/services/content'

const data = ref<PaintedBooksContent | null>(null)

const hero = computed(() => data.value?.hero)
const heroMediaSrc = computed(() => hero.value?.media.src || '')
const heroMediaAlt = computed(() => hero.value?.media.alt || '')
const about = computed(() => data.value?.about)
const process = computed(() => data.value?.process)
const gallery = computed(() => data.value?.gallery)
const commission = computed(() => data.value?.commission)
const cta = computed(() => data.value?.cta)

const fetchData = async () => {
  data.value = await content.getPaintedBooks()
}

onServerPrefetch(fetchData)
onMounted(fetchData)
</script>

<template>
  <main id="content" role="main" class="painted-books-page">
    <!-- Hero -->
    <section v-if="hero" class="painted-hero diagonal-padding--bottom diagonal--ltr" v-reveal>
      <div class="container hero-inner">
        <div class="hero-copy">
          <h1>{{ hero.title }}</h1>
          <p class="subtitle">{{ hero.subtitle }}</p>
          <p class="description">{{ hero.description }}</p>
        </div>
        <div class="hero-image">
          <div class="image-glow"></div>
          <img
            :src="heroMediaSrc"
            :alt="heroMediaAlt"
            loading="eager"
            decoding="async"
            width="500"
            height="400"
            fetchpriority="high"
          />
        </div>
      </div>
    </section>

    <!-- About -->
    <section v-if="about" class="painted-about diagonal--both-rtl diagonal-padding--both" v-reveal>
      <div class="container about-inner">
        <div class="about-copy">
          <h2>{{ about.heading }}</h2>
          <p class="body-text">{{ about.body }}</p>
        </div>
        <div v-if="about.stats" class="about-stats">
          <article v-for="stat in about.stats" :key="stat.label" class="stat-card">
            <span class="stat-value">{{ stat.value }}</span>
            <span class="stat-label">{{ stat.label }}</span>
          </article>
        </div>
      </div>
    </section>

    <!-- Process -->
    <section v-if="process" class="painted-process" v-reveal>
      <div class="container">
        <header class="section-header">
          <h2>{{ process.heading }}</h2>
        </header>
        <ol class="process-steps">
          <li v-for="(step, idx) in process.steps" :key="step.title" class="step-card">
            <div class="step-number">{{ idx + 1 }}</div>
            <div class="step-content">
              <h3>{{ step.title }}</h3>
              <p>{{ step.description }}</p>
            </div>
          </li>
        </ol>
      </div>
    </section>

    <!-- Gallery -->
    <section
      v-if="gallery"
      class="painted-gallery diagonal--both-ltr diagonal-padding--both"
      v-reveal
    >
      <div class="container">
        <header class="section-header">
          <h2>{{ gallery.heading }}</h2>
          <p v-if="gallery.description" class="section-subtitle">{{ gallery.description }}</p>
        </header>
        <ul class="gallery-grid">
          <li v-for="item in gallery.items" :key="item.id" class="gallery-card">
            <div class="gallery-image">
              <div class="gallery-glow"></div>
              <img
                :src="item.media.src"
                :alt="item.media.alt"
                loading="lazy"
                decoding="async"
                width="300"
                height="400"
              />
            </div>
            <div class="gallery-info">
              <h3>{{ item.title }}</h3>
              <p class="author">{{ item.author }}</p>
              <p class="theme">{{ item.theme }}</p>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- Commission info -->
    <section v-if="commission" class="painted-commission" v-reveal>
      <div class="container commission-inner">
        <div class="commission-copy">
          <h2>{{ commission.heading }}</h2>
          <p class="body-text">{{ commission.body }}</p>
        </div>
        <ul v-if="commission.features" class="commission-features">
          <li v-for="feature in commission.features" :key="feature.title" class="feature-card">
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.description }}</p>
          </li>
        </ul>
        <div v-if="commission.pricing?.note" class="pricing-note">
          <p>{{ commission.pricing.note }}</p>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section v-if="cta" class="painted-cta diagonal-padding--top diagonal--top-rtl" v-reveal>
      <div class="container cta-inner">
        <div class="cta-copy">
          <h2>{{ cta.heading }}</h2>
          <p class="body-text">{{ cta.body }}</p>
        </div>
        <div v-if="cta.buttons?.length" class="cta-actions">
          <template v-for="button in cta.buttons" :key="button.label + button.href">
            <a
              v-if="button.href.startsWith('http')"
              :href="button.href"
              :class="button.variant === 'ghost' ? 'ghost-button' : 'primary-button'"
              target="_blank"
              rel="noreferrer noopener"
            >
              {{ button.label }}
            </a>
            <RouterLink
              v-else
              :to="button.href"
              :class="button.variant === 'ghost' ? 'ghost-button' : 'primary-button'"
            >
              {{ button.label }}
            </RouterLink>
          </template>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped src="../styles/views/painted-books-page.css"></style>
