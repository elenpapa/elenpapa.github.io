import { createRouter, createWebHistory } from 'vue-router'

// Eager load HomePage for fastest initial render
import HomePage from '@/views/HomePage.vue'

// Lazy load secondary pages to reduce initial bundle size
const TimelinePage = () => import('@/views/TimelinePage.vue')
const PostPage = () => import('@/views/PostPage.vue')
const BookPage = () => import('@/views/BookPage.vue')
const MoonlightPage = () => import('@/views/MoonlightPage.vue')
const PaintedBooksPage = () => import('@/views/PaintedBooksPage.vue')

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
