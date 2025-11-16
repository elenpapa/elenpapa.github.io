<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { content, type PostsContent } from '@/services/content'

const data = ref<PostsContent | null>(null)
onMounted(async () => {
  data.value = await content.getPosts()
})
const viewport = ref<HTMLDivElement | null>(null)
function prev() {
  const el = viewport.value
  if (!el) return
  el.scrollBy({ left: -el.clientWidth, behavior: 'smooth' })
}
function next() {
  const el = viewport.value
  if (!el) return
  el.scrollBy({ left: el.clientWidth, behavior: 'smooth' })
}
</script>

<template>
  <section id="posts" v-reveal>
    <div class="container carousel">
      <h2 class="visually-hidden">Featured posts</h2>
      <button class="nav" @click="prev" aria-label="Previous">‹</button>
      <div class="viewport" ref="viewport">
        <div class="track">
          <article v-for="(post, idx) in data?.items" :key="idx" class="slide">
            <img :src="post.image" :alt="post.title" loading="lazy" decoding="async" />
            <h3>
              <a :href="post.url">{{ post.title }}</a>
            </h3>
          </article>
        </div>
      </div>
      <button class="nav" @click="next" aria-label="Next">›</button>
    </div>
  </section>
</template>

<style scoped>
.carousel {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8px;
  align-items: center;
}
.viewport {
  overflow: hidden;
  border-radius: var(--radius-lg);
  scroll-snap-type: x mandatory;
}
.track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: calc(100% / 3);
  gap: 12px;
}
.slide {
  padding: 8px;
  background: var(--color-surface);
  scroll-snap-align: start;
}
.slide img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
.slide h3 {
  font-family: var(--font-serif);
  font-size: var(--font-size-lg);
  font-weight: 600;
  line-height: 1.4;
  margin: 12px 6px 0;
}
.slide h3 a {
  transition: color 0.2s ease;
}
.slide h3 a:hover,
.slide h3 a:focus-visible {
  color: var(--color-primary-600);
  outline: none;
}
.nav {
  background: var(--color-surface);
  font-family: var(--font-sans);
  font-size: 24px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 999px;
  width: 36px;
  height: 36px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.nav:hover,
.nav:focus-visible {
  border-color: var(--color-primary-600);
  outline: none;
}
@media (max-width: 600px) {
  .track {
    grid-auto-columns: 100%;
  }
  .slide img {
    height: 160px;
  }
}
@media (max-width: 900px) and (min-width: 601px) {
  .track {
    grid-auto-columns: 50%;
  }
}
</style>
