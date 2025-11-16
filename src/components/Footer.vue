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

<style scoped>
.site-footer {
  padding: 32px 0;
  background: var(--color-surface);
  border-top: 5px solid rgba(0, 0, 0, 0.06);
}
.socials {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.socials a {
  font-family: var(--font-sans);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-muted);
  transition: color 0.2s ease;
}
.socials a:hover,
.socials a:focus-visible {
  color: var(--color-primary-600);
  outline: none;
}
.copy {
  font-family: var(--font-serif);
  font-size: var(--font-size-sm);
  font-style: italic;
  margin: 12px 0 0;
  color: var(--color-muted);
}
</style>
