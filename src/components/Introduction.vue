<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { content, type HomeContent } from '@/services/content'

const home = ref<HomeContent | null>(null)

// Education data is provided by `public/content/home.json` via `content.getHome()`

onMounted(async () => {
  home.value = await content.getHome()
})
</script>

<template>
  <section id="intro" v-reveal class="intro-section diagonal--ltr">
    <div class="container intro">
      <div class="text">
        <h2>{{ home?.intro.title }}</h2>
        <p v-html="home?.intro.text"></p>
        <RouterLink to="/timeline" class="cta-button">Δείτε την Εργογραφία μου</RouterLink>
      </div>
      <div class="image">
        <div class="backdrop"></div>
        <img
          v-if="home"
          :src="home.intro.image.src"
          :alt="home.intro.image.alt"
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>

    <!-- Education Milestones -->
    <div class="container education-milestones">
      <div class="milestone-grid">
        <div
          v-for="(milestone, index) in home?.education || []"
          :key="index"
          class="milestone-card"
        >
          <div class="bubble">
            <div class="bubble-icon">
              <img
                v-if="milestone.icon"
                :src="milestone.icon"
                :alt="milestone.degree + ' icon'"
                class="bubble-svg"
                loading="lazy"
                decoding="async"
              />
              <span v-else class="bubble-fallback">🎓</span>
            </div>
          </div>
          <div class="milestone-content">
            <h3>{{ milestone.degree }}</h3>
            <p class="institution">{{ milestone.institution }}</p>
            <p class="year">{{ milestone.year }}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.intro-section {
  background: var(--color-bg);
  padding-bottom: 100px;
}

.intro {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 32px;
  align-items: center;
}
.text h2 {
  font-family: var(--font-serif);
  font-size: clamp(1.75rem, 3.5vw, 2.5rem);
  font-weight: 600;
  line-height: 1.3;
  margin: 0 0 16px;
}
.text p {
  font-family: var(--font-serif);
  font-size: var(--font-size-2xl);
  line-height: 1.7;
  color: var(--color-light-gray);
  margin: 0 0 24px;
}
.cta-button {
  display: inline-block;
  padding: 12px 24px;
  background: var(--color-primary-600);
  color: white;
  font-family: var(--font-sans);
  font-size: var(--font-size-lg);
  font-weight: 600;
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
}
.cta-button:hover,
.cta-button:focus-visible {
  background: var(--color-primary-700, #7c5ba1);
  outline: 2px solid var(--color-primary-600);
  outline-offset: 2px;
}
.image {
  position: relative;
}
.backdrop {
  position: absolute;
  inset: 10% 8% 8% 12%;
  background: rgba(179, 157, 219, 0.2);
  filter: blur(20px);
  border-radius: var(--radius-lg);
}
.image img {
  position: relative;
  width: 75%;
  object-fit: cover;
  border-radius: var(--radius-lg);
}

@media (max-width: 768px) {
  .image img {
    width: 100%;
  }
}
@media (max-width: 900px) {
  .intro {
    grid-template-columns: 1fr;
  }
}

/* Education Milestones */
.education-milestones {
  margin-top: 80px;
  padding-bottom: 40px;
}

.milestone-grid {
  --bubble-size: 150px;
  display: grid;
  grid-template-columns: repeat(4, minmax(220px, 1fr));
  gap: 32px 24px;
  max-width: 1200px;
  margin: 0 auto;
  justify-items: center;
  align-items: start;
}

.milestone-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  opacity: 0;
  animation: fadeInUp 0.6s ease forwards;
  width: 100%;
  max-width: 300px;
  box-sizing: border-box;
  padding: 12px 8px;
  height: 320px; /* equal card heights on desktop */
}

.milestone-card:nth-child(1) {
  animation-delay: 0.1s;
}
.milestone-card:nth-child(2) {
  animation-delay: 0.2s;
}
.milestone-card:nth-child(3) {
  animation-delay: 0.3s;
}
.milestone-card:nth-child(4) {
  animation-delay: 0.4s;
}

@keyframes fadeInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
  from {
    opacity: 0;
    transform: translateY(20px);
  }
}

.bubble {
  position: relative;
  width: var(--bubble-size);
  height: var(--bubble-size);
  margin-bottom: 18px;
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
}

.bubble::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--color-surface);
  border-radius: 50%;
  transition: all 0.4s ease;
}

.bubble::after {
  content: '';
  position: absolute;
  inset: -8px;
  background: linear-gradient(
    135deg,
    var(--color-primary-300, #d1c4e9),
    var(--color-primary-500, #9575cd)
  );
  border-radius: 50%;
  opacity: 0;
  filter: blur(20px);
  transition: all 0.4s ease;
  z-index: -1;
}

.bubble-icon {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  z-index: 1;
  transition: all 0.4s ease;
}

.bubble-svg {
  width: calc(var(--bubble-size) * 0.65);
  height: calc(var(--bubble-size) * 0.65);
  object-fit: contain;
  filter: drop-shadow(0 6px 12px rgba(149, 117, 205, 0.18));
}
.bubble-fallback {
  display: inline-block;
  font-size: 48px;
}

.milestone-card:hover .bubble {
  transform: translateY(-8px) scale(1.05);
}

.milestone-card:hover .bubble::after {
  opacity: 0.6;
}

.milestone-card:hover .bubble-icon {
  transform: scale(1.1) rotate(5deg);
}

.milestone-content {
  transition: all 0.3s ease;
}

.milestone-content h3 {
  font-family: var(--font-sans);
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 8px;
  line-height: 1.4;
}

.milestone-content .institution {
  font-family: var(--font-serif);
  font-size: var(--font-size-base);
  color: var(--color-light-gray);
  margin: 0 0 4px;
  line-height: 1.5;
}

.milestone-content .year {
  font-family: var(--font-sans);
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-primary-600, #9575cd);
  margin: 0;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .milestone-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 48px 32px;
  }
}

@media (max-width: 640px) {
  .milestone-grid {
    grid-template-columns: 1fr;
    gap: 56px;
  }

  .bubble {
    width: 140px;
    height: 140px;
  }

  .bubble-icon {
    font-size: 56px;
  }

  .education-milestones {
    margin-top: 60px;
  }
}
</style>
