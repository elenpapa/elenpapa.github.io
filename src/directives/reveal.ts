import type { ObjectDirective } from 'vue'

type RevealOptions = {
  rootMargin?: string
  threshold?: number
  once?: boolean
}

const observerMap = new WeakMap<HTMLElement, IntersectionObserver>()

const revealDirective: ObjectDirective<HTMLElement, RevealOptions | undefined> = {
  // SSR support - add classes during server-side rendering
  getSSRProps() {
    return {
      class: 'reveal reveal--shown',
    }
  },

  mounted(el, binding) {
    // SSR safety: only run on client
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      el.classList.add('reveal', 'reveal--shown')
      return
    }

    const opts = binding.value ?? {}
    const once = opts.once ?? true
    const threshold = opts.threshold ?? 0.15
    const rootMargin = opts.rootMargin ?? '0px 0px -10% 0px'

    const prefersReduced = globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.classList.add('reveal')
    if (prefersReduced) {
      el.classList.add('reveal--shown')
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('reveal--shown')
            if (once) observer.unobserve(el)
          }
        }
      },
      { root: null, threshold, rootMargin },
    )

    observer.observe(el)
    observerMap.set(el, observer)
  },

  unmounted(el) {
    const obs = observerMap.get(el)
    obs?.unobserve(el)
    observerMap.delete(el)
  },
}

export default revealDirective
