<script setup lang="ts">
import { ref, onMounted, onServerPrefetch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'
import { content, type PostsContent, type SiteContent } from '@/services/content'

const route = useRoute()
const router = useRouter()
const data = ref<PostsContent | null>(null)
const siteData = ref<SiteContent | null>(null)

const postId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? parseInt(id, 10) : 0
})

const post = computed(() => {
  if (!data.value?.items || isNaN(postId.value)) return null
  return data.value.items[postId.value]
})

const postImageSrc = computed(() => post.value?.image || '')

// SEO: Use site configuration for base URL
const siteUrl = computed(() => siteData.value?.seo.siteUrl || '')
const defaultImage = computed(() => siteData.value?.seo.defaultImage || '/images/intro.png')
const siteName = computed(() => siteData.value?.seo.siteName || 'Ελένη Παπαδοπούλου')

const canonicalUrl = computed(() => `${siteUrl.value}/posts/${postId.value}`)
const absoluteImageUrl = computed(() => {
  const imagePath = postImageSrc.value || defaultImage.value
  // If image starts with /, make it absolute
  return imagePath.startsWith('/') ? `${siteUrl.value}${imagePath}` : imagePath
})

// Dynamic head meta tags for SEO and social sharing
useHead(
  computed(() => ({
    title: post.value?.title || 'Άρθρο',
    meta: [
      // Basic SEO
      {
        name: 'description',
        content: post.value?.summary || 'Συμβουλές για συγγραφείς από την Ελένη Παπαδοπούλου',
      },
      { name: 'robots', content: 'index, follow' },
      { name: 'author', content: 'Ελένη Παπαδοπούλου' },

      // Open Graph (Facebook, LinkedIn, etc.)
      { property: 'og:type', content: 'article' },
      { property: 'og:title', content: post.value?.title || 'Άρθρο' },
      {
        property: 'og:description',
        content: post.value?.summary || 'Συμβουλές για συγγραφείς από την Ελένη Παπαδοπούλου',
      },
      { property: 'og:image', content: absoluteImageUrl.value },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:url', content: canonicalUrl.value },
      { property: 'og:site_name', content: siteName.value },
      { property: 'og:locale', content: siteData.value?.seo.locale || 'el_GR' },

      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: post.value?.title || 'Άρθρο' },
      {
        name: 'twitter:description',
        content: post.value?.summary || 'Συμβουλές για συγγραφείς από την Ελένη Παπαδοπούλου',
      },
      { name: 'twitter:image', content: absoluteImageUrl.value },
    ],
    link: [{ rel: 'canonical', href: canonicalUrl.value }],
  })),
)

const fetchData = async () => {
  const [postsData, site] = await Promise.all([content.getPosts(), content.getSite()])
  data.value = postsData
  siteData.value = site
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
