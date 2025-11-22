<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { content, type MoonlightContent } from '@/services/content'

const data = ref<MoonlightContent | null>(null)

type MoonlightEvent = NonNullable<MoonlightContent['events']>[number]

const hero = computed(() => data.value?.hero)
const mission = computed(() => data.value?.mission)
const bubbles = computed(() => data.value?.bubbles)
const events = computed<MoonlightEvent[]>(() => data.value?.events ?? [])
const releases = computed(() => data.value?.releases)
const cta = computed(() => data.value?.cta)

const eventMedia = (event: MoonlightEvent) => event.image

onMounted(async () => {
  data.value = await content.getMoonlight()
})
</script>

<template>
  <main id="content" role="main" class="moonlight-page">
    <!-- Hero -->
    <section v-if="hero" class="moonlight-hero diagonal--both-rtl" v-reveal>
      <div class="container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">Moonlight Tales</p>
          <h1>{{ hero.title }}</h1>
          <p class="subtitle">{{ hero.subtitle }}</p>
          <p class="description">{{ hero.description }}</p>

          <ul v-if="hero.badges?.length" class="hero-badges">
            <li v-for="badge in hero.badges" :key="badge.label">
              <a v-if="badge.href" :href="badge.href" target="_blank" rel="noreferrer noopener">
                {{ badge.label }}
              </a>
              <span v-else>{{ badge.label }}</span>
            </li>
          </ul>

          <div v-if="hero.stats?.length" class="hero-stats">
            <article v-for="stat in hero.stats" :key="stat.label" class="stat-pill">
              <span class="stat-value">{{ stat.value }}</span>
              <span class="stat-label">{{ stat.label }}</span>
              <span v-if="stat.description" class="stat-description">{{ stat.description }}</span>
            </article>
          </div>

          <div v-if="hero.buttons?.length" class="hero-buttons">
            <template v-for="button in hero.buttons" :key="button.label + button.href">
              <a
                v-if="!button.href.startsWith('/')"
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

        <div class="hero-media" aria-label="Moonlight Tales media preview">
          <div class="media-primary">
            <div class="media-glow"></div>
            <img
              :src="hero.media.primary.src"
              :alt="hero.media.primary.alt"
              loading="eager"
              decoding="async"
            />
          </div>
          <div v-if="hero.media.secondary" class="media-secondary">
            <img
              :src="hero.media.secondary.src"
              :alt="hero.media.secondary.alt"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- Mission -->
    <section v-if="mission" class="moonlight-mission" v-reveal>
      <div class="container mission-grid">
        <div class="mission-copy">
          <p class="eyebrow">Η αποστολή μας</p>
          <h2>{{ mission.heading }}</h2>
          <p class="body-text">{{ mission.body }}</p>
        </div>
        <ul class="mission-pillars">
          <li v-for="pillar in mission.pillars" :key="pillar.title" class="pillar-card">
            <h3>{{ pillar.title }}</h3>
            <p>{{ pillar.description }}</p>
          </li>
        </ul>
      </div>
    </section>

    <!-- Bubble stats -->
    <section v-if="bubbles?.items?.length" class="moonlight-bubbles diagonal--ltr" v-reveal>
      <div class="container">
        <header class="section-header">
          <h2>{{ bubbles.heading }}</h2>
        </header>
        <div class="bubble-grid">
          <article v-for="item in bubbles.items" :key="item.label" class="bubble-card">
            <div class="bubble">
              <div class="bubble-core">
                <span class="bubble-value">{{ item.value }}</span>
              </div>
            </div>
            <p class="bubble-label">{{ item.label }}</p>
            <p v-if="item.description" class="bubble-description">{{ item.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Events -->
    <section v-if="events.length" class="moonlight-events diagonal--both-ltr" v-reveal>
      <div class="container">
        <header class="section-header">
          <h2>Στιγμές από την κοινότητα</h2>
          <p class="section-subtitle">
            Mock φωτογραφίες από παρουσιάσεις, book clubs, lives και συνεργασίες με δημιουργούς στο
            Instagram και το TikTok.
          </p>
        </header>
        <ul class="events-grid">
          <li v-for="event in events" :key="event.id" class="event-card">
            <div class="event-media">
              <div class="event-glow"></div>
              <img
                :src="eventMedia(event).src"
                :alt="eventMedia(event).alt"
                loading="lazy"
                decoding="async"
              />
            </div>
            <div class="event-body">
              <p v-if="event.date || event.location" class="event-meta">
                <span v-if="event.date">{{ event.date }}</span>
                <span v-if="event.date && event.location" aria-hidden="true"> · </span>
                <span v-if="event.location">{{ event.location }}</span>
              </p>
              <h3>{{ event.title }}</h3>
              <p>{{ event.description }}</p>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- Releases -->
    <section v-if="releases" class="moonlight-releases" v-reveal>
      <div class="container">
        <header class="section-header">
          <h2>{{ releases.heading }}</h2>
          <p class="section-subtitle">{{ releases.description }}</p>
        </header>
        <div class="release-grid">
          <article v-for="book in releases.books" :key="book.id" class="release-card">
            <div class="release-cover">
              <img :src="book.cover" :alt="book.title" loading="lazy" decoding="async" />
            </div>
            <div class="release-body">
              <p class="release-genre">{{ book.genre }}</p>
              <h3>{{ book.title }}</h3>
              <p class="release-tagline">{{ book.tagline }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section v-if="cta" class="moonlight-cta diagonal--top-rtl" v-reveal>
      <div class="container cta-inner">
        <div class="cta-copy">
          <h2>{{ cta.heading }}</h2>
          <p class="body-text">{{ cta.body }}</p>
        </div>
        <div v-if="cta.buttons?.length" class="cta-buttons">
          <template v-for="button in cta.buttons" :key="button.label + button.href">
            <a
              v-if="!button.href.startsWith('/')"
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

<style scoped src="@/styles/views/moonlight-page.css"></style>
