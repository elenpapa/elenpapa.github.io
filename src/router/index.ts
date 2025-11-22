import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/views/HomePage.vue'
import TimelinePage from '@/views/TimelinePage.vue'
import PostPage from '@/views/PostPage.vue'
import BookPage from '@/views/BookPage.vue'
import MoonlightPage from '@/views/MoonlightPage.vue'
import PaintedBooksPage from '@/views/PaintedBooksPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/timeline',
      name: 'timeline',
      component: TimelinePage,
    },
    {
      path: '/book',
      name: 'book',
      component: BookPage,
    },
    {
      path: '/moonlight',
      name: 'moonlight',
      component: MoonlightPage,
    },
    {
      path: '/painted-books',
      name: 'painted-books',
      component: PaintedBooksPage,
    },
    {
      path: '/posts/:id',
      name: 'post',
      component: PostPage,
    },
  ],
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0 }
  },
})

export default router
