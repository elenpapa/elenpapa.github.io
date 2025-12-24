<script setup lang="ts">
import { ref, onMounted, onServerPrefetch, computed } from 'vue'
import { content, type SiteContent } from '@/services/content'

const site = ref<SiteContent | null>(null)
const socials = computed(() => site.value?.socials ?? [])
const getSocialIconSrc = (iconSrc: string | undefined) => iconSrc || ''

const fetchData = async () => {
  site.value = await content.getSite()
}

onServerPrefetch(fetchData)
onMounted(fetchData)
</script>

<template>
  <footer class="site-footer">
    <div class="container footer-section">
      <nav aria-label="Social links" class="socials">
        <a
          v-for="s in socials"
          :key="s.href"
          :href="s.href"
          target="_blank"
          rel="noopener noreferrer nofollow"
          :aria-label="s.label"
        >
          <img
            :src="getSocialIconSrc(s.icon)"
            :alt="s.label"
            class="social-icon"
            width="24"
            height="24"
            loading="lazy"
            decoding="async"
          />
        </a>
      </nav>
      <p class="copy">{{ site?.footer?.copyright }}</p>
      <p class="developer">{{ site?.footer?.developer }}</p>
    </div>
  </footer>
</template>

<style scoped src="../styles/components/footer.css"></style>
