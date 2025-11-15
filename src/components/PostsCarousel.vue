<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { content, type PostsContent } from '@/services/content'

const data = ref<PostsContent | null>(null)
onMounted(async () => {
  data.value = await content.getPosts()
})

const current = ref(0)
function prev() {
  if (!data.value) return
  current.value = (current.value - 1 + data.value.items.length) % data.value.items.length
}
function next() {
  if (!data.value) return
  current.value = (current.value + 1) % data.value.items.length
}
</script>

<template>
  <section id="posts" v-reveal>
    <div class="container carousel">
      <h2 class="visually-hidden">Featured posts</h2>
      <button class="nav" @click="prev" aria-label="Previous">‹</button>
      <div class="viewport">
        <div class="track" :style="{ transform: `translateX(-${current * 100}%)` }">
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
}
.track {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 100%;
  transition: transform 0.3s ease;
}
.slide {
  padding: 8px;
  background: var(--color-surface);
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
  .slide img {
    height: 160px;
  }
}
</style>
