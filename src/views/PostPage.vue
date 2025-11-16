<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { content, type PostsContent } from '@/services/content'

const route = useRoute()
const router = useRouter()
const data = ref<PostsContent | null>(null)

const postId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? parseInt(id, 10) : 0
})

const post = computed(() => {
  if (!data.value?.items || isNaN(postId.value)) return null
  return data.value.items[postId.value]
})

onMounted(async () => {
  data.value = await content.getPosts()
  // Redirect if post doesn't exist
  if (!post.value) {
    router.push('/')
  }
})

const goBack = () => {
  router.back()
}
</script>

<template>
  <main id="content" role="main" class="post-page">
    <article v-if="post" class="container" v-reveal>
      <button @click="goBack" class="back-button" aria-label="Go back">← Πίσω</button>

      <div class="post-header">
        <div class="image-wrapper">
          <img :src="post.image" :alt="post.title" loading="eager" decoding="async" />
        </div>
        <h1>{{ post.title }}</h1>
      </div>

      <div class="post-content" v-html="post.contentHtml"></div>
    </article>
  </main>
</template>

<style scoped>
.post-page {
  display: block;
  padding-top: 80px;
  min-height: 100vh;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem clamp(1rem, 5vw, 2.75rem);
}

.back-button {
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: var(--radius-md);
  padding: 8px 16px;
  font-family: var(--font-sans);
  font-size: var(--font-size-md);
  font-weight: 500;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 2rem;
}

.back-button:hover,
.back-button:focus-visible {
  background: var(--color-surface);
  border-color: var(--color-primary-600);
  outline: 2px solid var(--color-primary-600);
  outline-offset: 2px;
}

.post-header {
  margin-bottom: 3rem;
  text-align: center;
}

.image-wrapper {
  position: relative;
  text-align: justify;
  width: 100%;
  max-width: 600px;
  margin: 0 auto 2rem;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-bg-alt, #f5f5f5);
}

.image-wrapper img {
  width: 100%;
  height: auto;
  display: block;
  object-fit: contain;
}

.post-header h1 {
  font-family: var(--font-serif);
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 600;
  line-height: 1.2;
  margin: 0 0 1rem;
  color: var(--color-text);
}

.summary {
  font-family: var(--font-serif);
  font-size: var(--font-size-xl);
  line-height: 1.6;
  color: var(--color-text-secondary, #555);
  margin: 0;
  font-style: italic;
}

.post-content {
  font-family: var(--font-serif);
  font-size: var(--font-size-lg);
  line-height: 1.8;
  color: var(--color-text);
}

/* Style the rendered HTML content */
.post-content :deep(p) {
  margin: 1.5em 0;
}

.post-content :deep(p:first-child) {
  margin-top: 0;
}

.post-content :deep(p:last-child) {
  margin-bottom: 0;
}

.post-content :deep(strong) {
  font-weight: 600;
  color: var(--color-text);
}

.post-content :deep(em) {
  font-style: italic;
}

.post-content :deep(a) {
  color: var(--color-primary-600);
  text-decoration: underline;
  transition: color 0.2s ease;
}

.post-content :deep(a:hover),
.post-content :deep(a:focus-visible) {
  color: var(--color-primary-700, #7c5ba1);
}

.post-content :deep(ul),
.post-content :deep(ol) {
  margin: 1.5em 0;
  padding-left: 2em;
}

.post-content :deep(li) {
  margin: 0.5em 0;
}

.post-content :deep(blockquote) {
  margin: 2em 0;
  padding: 1em 1.5em;
  border-left: 4px solid var(--color-primary-600);
  background: rgba(179, 157, 219, 0.05);
  border-radius: var(--radius-md);
  font-style: italic;
}

.post-content :deep(h2) {
  font-size: var(--font-size-2xl);
  font-weight: 600;
  margin: 2.5em 0 1em;
  line-height: 1.3;
}

.post-content :deep(h3) {
  font-size: var(--font-size-xl);
  font-weight: 600;
  margin: 2em 0 0.75em;
  line-height: 1.4;
}

.post-content :deep(code) {
  font-family: 'Courier New', monospace;
  background: rgba(0, 0, 0, 0.05);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
}

.post-content :deep(pre) {
  background: rgba(0, 0, 0, 0.05);
  padding: 1em;
  border-radius: var(--radius-md);
  overflow-x: auto;
  margin: 1.5em 0;
}

.post-content :deep(pre code) {
  background: none;
  padding: 0;
}

@media (max-width: 768px) {
  .post-page {
    padding-top: 60px;
  }

  .container {
    padding: 1.5rem 1rem;
  }

  .post-header h1 {
    font-size: 1.75rem;
  }
}
</style>
