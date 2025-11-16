<script setup lang="ts">
import Hero from '@/components/Hero.vue'
import Introduction from '@/components/Introduction.vue'
import Services from '@/components/Services.vue'
import PostsCarousel from '@/components/PostsCarousel.vue'
import ContactForm from '@/components/ContactForm.vue'
</script>

<template>
  <main id="content" role="main">
    <Hero />
    <Introduction />
    <Services />
    <PostsCarousel />
    <ContactForm />
  </main>
</template>

<style scoped>
main {
  display: block;
}
</style>
