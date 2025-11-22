<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { content, type TimelineContent } from '@/services/content'

const data = ref<TimelineContent | null>(null)
onMounted(async () => {
  data.value = await content.getTimeline()
})
</script>

<template>
  <section id="timeline" class="timeline-section">
    <div class="container timeline">
      <h2 class="section-title">Εργογραφία</h2>
      <div class="timeline-grid" aria-hidden="false">
        <div class="timeline-column timeline-column--left">
          <article
            v-for="(item, idx) in (data?.items || []).filter((_, i) => i % 2 === 0)"
            :key="`left-${idx}`"
            class="entry reveal--pageflip-left"
            v-reveal="{ threshold: 0.2, rootMargin: '0px 0px -10% 0px', once: true }"
          >
            <span class="branch" aria-hidden="true"></span>
            <img
              class="cover"
              :src="item.cover"
              :alt="item.title"
              loading="lazy"
              decoding="async"
            />
            <div class="meta">
              <h3>{{ item.title }}</h3>
              <span class="year">{{ item.year }}</span>
              <p class="blurb">{{ item.blurb }}</p>
              <p class="actions">{{ item.actions }}</p>
            </div>
          </article>
        </div>
        <div class="timeline-divider" aria-hidden="true"></div>
        <div class="timeline-column timeline-column--right">
          <article
            v-for="(item, idx) in (data?.items || []).filter((_, i) => i % 2 === 1)"
            :key="`right-${idx}`"
            class="entry entry--right reveal--pageflip-right"
            v-reveal="{ threshold: 0.2, rootMargin: '0px 0px -10% 0px', once: true }"
          >
            <span class="branch" aria-hidden="true"></span>
            <img
              class="cover"
              :src="item.cover"
              :alt="item.title"
              loading="lazy"
              decoding="async"
            />
            <div class="meta">
              <h3>{{ item.title }}</h3>
              <span class="year">{{ item.year }}</span>
              <p class="blurb">{{ item.blurb }}</p>
              <p class="actions">{{ item.actions }}</p>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped src="../styles/components/book-timeline.css"></style>
