<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { content, type SiteContent } from '@/services/content'

const site = ref<SiteContent | null>(null)
onMounted(async () => {
  site.value = await content.getSite()
})
</script>

<template>
  <footer class="site-footer">
    <div class="container">
      <nav aria-label="Social links" class="socials">
        <a
          v-for="s in site?.socials"
          :key="s.href"
          :href="s.href"
          target="_blank"
          rel="noopener noreferrer nofollow"
          >{{ s.label }}</a
        >
      </nav>
      <p class="copy">{{ site?.footer?.copyright }}</p>
    </div>
  </footer>
</template>

<style scoped src="../styles/components/footer.css"></style>
