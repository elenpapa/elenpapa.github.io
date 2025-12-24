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

// Export includedRoutes for vite-ssg to generate dynamic post routes
export async function includedRoutes(paths: string[]): Promise<string[]> {
  // During SSG build, read posts.json to generate post routes
  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  const postsPath = path.join(process.cwd(), 'public', 'content', 'posts.json')
  const postsData = JSON.parse(await fs.readFile(postsPath, 'utf-8'))
  const postRoutes = postsData.items.map((_: unknown, index: number) => `/posts/${index}`)

  return [...paths, ...postRoutes]
}
