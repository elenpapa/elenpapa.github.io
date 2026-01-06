<script setup lang="ts">
import BookTimeline from '@/components/BookTimeline.vue'
import { usePageSeo } from '@/composables/usePageSeo'

// SEO: Set up meta tags and ItemList schema for Timeline/Bibliography
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { siteUrl } = usePageSeo({
  pageKey: 'timeline',
  path: '/timeline',
  type: 'website',
  structuredData: [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Εργογραφία - Έλενα Παπαδοπούλου',
      description: 'Η πλήρης εργογραφία: βιβλία, μεταφράσεις, επιμέλειες και συνεργασίες',
      itemListElement: [],
    },
  ],
})
</script>

<template>
  <main id="content" role="main">
    <BookTimeline />
  </main>
</template>

<style scoped src="@/styles/views/timeline-page.css"></style>
