import { ViteSSG } from 'vite-ssg'
import { routes } from './router'
import App from './App.vue'
import './styles/base.css'
import reveal from './directives/reveal'

export const createApp = ViteSSG(
  App,
  {
    routes,
    base: import.meta.env.BASE_URL,
    scrollBehavior(to, _from, savedPosition) {
      if (savedPosition) {
        return savedPosition
      }
      if (to.hash) {
        return { el: to.hash, behavior: 'smooth' }
      }
      return { top: 0 }
    },
  },
  ({ app }) => {
    // Register reveal directive for both SSR and client
    // The directive has getSSRProps for server rendering
    app.directive('reveal', reveal)
  },
)
