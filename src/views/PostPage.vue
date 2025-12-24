<script setup lang="ts">
import { ref, onMounted, onServerPrefetch, computed } from 'vue'
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

const postImageSrc = computed(() => post.value?.image || '')

const fetchData = async () => {
  data.value = await content.getPosts()
}

onServerPrefetch(fetchData)

onMounted(async () => {
  await fetchData()
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
          <img
            :src="postImageSrc"
            :alt="post.title"
            loading="eager"
            decoding="async"
            fetchpriority="high"
            width="800"
            height="440"
          />
        </div>
        <h1>{{ post.title }}</h1>
      </div>

      <div class="post-content" v-html="post.contentHtml"></div>
    </article>
  </main>
</template>

<style scoped src="@/styles/views/post-page.css"></style>
