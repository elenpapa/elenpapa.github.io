<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { content, type TimelineContent } from '@/services/content'

const data = ref<TimelineContent | null>(null)
onMounted(async () => {
  data.value = await content.getTimeline()
})
</script>

<template>
  <section id="timeline" v-reveal>
    <div class="container timeline">
      <h2 class="visually-hidden">Book timeline</h2>
      <div class="line" aria-hidden="true"></div>
      <article
        v-for="(item, idx) in data?.items"
        :key="idx"
        :class="['entry', { right: idx % 2 === 1 }]"
      >
        <img class="cover" :src="item.cover" :alt="item.title" loading="lazy" decoding="async" />
        <div class="meta">
          <h3>{{ item.title }}</h3>
          <span class="year">{{ item.year }}</span>
          <p class="blurb">{{ item.blurb }}</p>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.timeline {
  position: relative;
}
.line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: rgba(0, 0, 0, 0.1);
}
.entry {
  display: grid;
  grid-template-columns: 120px auto;
  gap: 16px;
  padding: 24px 0;
  position: relative;
}
.entry.right {
  grid-template-columns: auto 120px;
  justify-items: end;
}
.entry.right .meta {
  grid-column: 1 / 2;
  text-align: right;
}
.entry.right .cover {
  grid-column: 2 / 3;
}
.cover {
  width: 120px;
  height: 160px;
  object-fit: cover;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
.meta h3 {
  font-family: var(--font-serif);
  font-size: var(--font-size-xl);
  font-weight: 600;
  line-height: 1.3;
  margin: 0 0 8px;
}
.meta .year {
  font-family: var(--font-sans);
  font-size: var(--font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-primary-600);
  font-weight: 700;
}
.meta .blurb {
  font-family: var(--font-serif);
  font-size: var(--font-size-base);
  line-height: 1.6;
  margin: 10px 0 0;
  color: var(--color-muted);
}
@media (max-width: 900px) {
  .line {
    left: 8px;
  }
  .entry,
  .entry.right {
    grid-template-columns: 120px auto;
  }
  .entry.right .meta {
    text-align: left;
  }
}
</style>
