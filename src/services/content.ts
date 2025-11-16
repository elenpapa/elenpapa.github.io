export type NavItem = { label: string; href: string }
export type SocialItem = { label: string; href: string }

export type SiteContent = {
  logo: { src: string; alt: string }
  nav: NavItem[]
  socials: SocialItem[]
  footer: { copyright: string }
}

export type HomeContent = {
  hero: {
    title: string
    subtitle: string
    cta: { label: string; href: string }
    backgroundImage: string
  }
  intro: {
    title: string
    text: string
    image: { src: string; alt: string }
  }
}

export type TimelineItem = {
  year: number
  title: string
  cover: string
  blurb: string
  actions: string
}
export type TimelineContent = { items: TimelineItem[] }

export type ServiceItem = {
  title: string
  description: string
  focus?: string
  highlights?: string[]
  icon?: string
  image?: { src: string; alt: string }
}
export type ServicesContent = {
  heading?: string
  description?: string
  items: ServiceItem[]
}

export type PostItem = { title: string; image: string; url: string }
export type PostsContent = { items: PostItem[] }

export type ContactContent = {
  title: string
  description: string
  fields: {
    name: { label: string; placeholder?: string }
    email: { label: string; placeholder?: string }
    message: { label: string; placeholder?: string }
  }
  submit: { label: string }
  mailto?: string
}

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: 'no-cache' })
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`)
  return (await res.json()) as T
}

export const content = {
  getSite: () => fetchJson<SiteContent>('/content/site.json'),
  getHome: () => fetchJson<HomeContent>('/content/home.json'),
  getTimeline: () => fetchJson<TimelineContent>('/content/timeline.json'),
  getServices: () => fetchJson<ServicesContent>('/content/services.json'),
  getPosts: () => fetchJson<PostsContent>('/content/posts.json'),
  getContact: () => fetchJson<ContactContent>('/content/contact.json'),
}
