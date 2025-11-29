<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { content, type BookContent } from '@/services/content'

const data = ref<BookContent | null>(null)

const hero = computed(() => data.value?.hero)
const heroCoverSrc = computed(() => hero.value?.cover || '')
const about = computed(() => data.value?.about)
const events = computed(() => data.value?.events ?? [])
const preview = computed(() => data.value?.preview)

type BookEvent = NonNullable<BookContent['events']>[number]
const eventMedia = (event: BookEvent) => event.image

onMounted(async () => {
  data.value = await content.getBook()
})
</script>

<template>
  <main id="content" role="main" class="book-page">
    <!-- Hero / Cover -->
    <section v-if="hero" class="book-hero diagonal-padding--bottom diagonal--ltr" v-reveal>
      <div class="container hero-inner">
        <div class="hero-text">
          <h1>{{ hero.title }}</h1>
          <p class="subtitle">{{ hero.subtitle }}</p>
          <p v-if="hero.tagline" class="tagline">{{ hero.tagline }}</p>
        </div>
        <div class="hero-cover">
          <div class="cover-backdrop"></div>
          <div class="cover-frame">
            <img
              :src="heroCoverSrc"
              alt="Εξώφυλλο βιβλίου"
              loading="eager"
              decoding="async"
              width="300"
              height="450"
              fetchpriority="high"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- About the book -->
    <section v-if="about" class="book-about diagonal--both-ltr diagonal-padding--both" v-reveal>
      <div class="container about-inner">
        <div class="about-copy">
          <h2>{{ about.heading }}</h2>
          <p class="body-text">{{ about.body }}</p>
          <div class="hero-actions">
            <a
              v-if="hero?.goodreadsUrl"
              class="primary-button"
              :href="hero?.goodreadsUrl"
              target="_blank"
              rel="noreferrer noopener"
            >
              Δείτε το στο Goodreads
            </a>
            <a
              v-if="hero?.moonlighttalesUrl"
              class="primary-button"
              :href="hero?.moonlighttalesUrl"
              target="_blank"
              rel="noreferrer noopener"
            >
              Διαβάστε τη συνέντευξη
            </a>
          </div>
        </div>
        <aside v-if="about.pullQuote" class="about-quote" aria-label="Book highlight quote">
          <p class="quote">{{ about.pullQuote }}</p>
        </aside>
      </div>
    </section>

    <!-- Events / photos strip -->
    <section
      v-if="events.length"
      class="book-events"
      aria-labelledby="book-events-heading"
      v-reveal
    >
      <div class="container">
        <header class="section-header">
          <h2 id="book-events-heading">Στιγμιότυπα &amp; εκδηλώσεις</h2>
          <p class="section-subtitle">
            Μερικές ενδεικτικές στιγμές που θα αποτυπωθούν με πραγματικές φωτογραφίες από
            παρουσιάσεις, εργαστήρια και συναντήσεις.
          </p>
        </header>

        <ul class="events-grid">
          <li v-for="event in events" :key="event.id" class="event-card">
            <div class="event-image-wrapper">
              <div class="event-image-backdrop"></div>
              <img
                :src="eventMedia(event).src"
                :alt="eventMedia(event).alt"
                loading="lazy"
                decoding="async"
                width="400"
                height="300"
              />
            </div>
            <div class="event-content">
              <p v-if="event.date || event.location" class="event-meta">
                <span v-if="event.date" class="event-date">{{ event.date }}</span>
                <span v-if="event.date && event.location" aria-hidden="true"> · </span>
                <span v-if="event.location" class="event-location">{{ event.location }}</span>
              </p>
              <h3 class="event-title">{{ event.title }}</h3>
              <p class="event-description">{{ event.description }}</p>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- Text preview -->
    <section v-if="preview" class="book-preview diagonal--top-ltr diagonal-padding--both" v-reveal>
      <div class="container preview-inner">
        <header class="section-header">
          <h2>{{ preview.heading }}</h2>
          <p v-if="preview.lede" class="section-subtitle">{{ preview.lede }}</p>
        </header>
        <div class="preview-body">
          <p class="preview-excerpt">{{ preview.excerpt }}</p>
          <p v-if="preview.note && preview.previewUrl" class="preview-note">
            <a :href="preview.previewUrl" target="_blank" rel="noopener noreferrer">{{
              preview.note
            }}</a>
          </p>
          <p v-else-if="preview.note" class="preview-note">{{ preview.note }}</p>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped src="../styles/views/book-page.css"></style>
