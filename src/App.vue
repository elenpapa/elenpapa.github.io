<script setup lang="ts">
import Header from '@/components/Header.vue'
import Footer from '@/components/Footer.vue'
import Hero from '@/components/Hero.vue'
import Introduction from '@/components/Introduction.vue'
import BookTimeline from '@/components/BookTimeline.vue'
import Services from '@/components/Services.vue'
import PostsCarousel from '@/components/PostsCarousel.vue'
import ContactForm from '@/components/ContactForm.vue'
</script>

<template>
  <a href="#content" class="skip-link">Skip to main content</a>
  <Header />
  <main id="content" role="main">
    <Hero />
    <Introduction />
    <BookTimeline />
    <Services />
    <PostsCarousel />
    <ContactForm />
  </main>
  <Footer />
</template>

<style scoped>
main {
  display: block;
}
</style>
