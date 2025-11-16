<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Carousel, Slide, Navigation } from 'vue3-carousel'
import 'vue3-carousel/dist/carousel.css'
import { content, type PostsContent } from '@/services/content'

const data = ref<PostsContent | null>(null)

onMounted(async () => {
  data.value = await content.getPosts()
})

const carouselSettings = {
  itemsToShow: 3,
  snapAlign: 'start' as const,
  wrapAround: false,
  transition: 500,
  breakpoints: {
    600: {
      itemsToShow: 2,
      snapAlign: 'center' as const,
    },
    900: {
      itemsToShow: 3,
      snapAlign: 'start' as const,
    },
  },
}
</script>

<template>
  <section id="posts" v-reveal>
    <div class="container">
      <h2 class="visually-hidden">Featured posts</h2>
      <Carousel v-if="data?.items" v-bind="carouselSettings">
        <Slide v-for="(post, idx) in data.items" :key="idx">
          <article class="slide">
            <div class="image-wrapper">
              <img
                :src="post.image"
                :alt="post.title"
                loading="lazy"
                decoding="async"
                width="400"
                height="220"
              />
            </div>
            <h3>
              <a :href="post.url">{{ post.title }}</a>
            </h3>
          </article>
        </Slide>
        <template #addons>
          <Navigation />
        </template>
      </Carousel>
    </div>
  </section>
</template>

<style scoped></style>
