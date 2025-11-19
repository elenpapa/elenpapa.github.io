import { z } from 'zod'

// Zod schemas for runtime validation
const NavItemSchema = z.object({
  label: z.string(),
  href: z.string(),
})

const SocialItemSchema = z.object({
  label: z.string(),
  href: z.string(),
})

const SiteContentSchema = z.object({
  logo: z.object({
    src: z.string(),
    alt: z.string(),
  }),
  nav: z.array(NavItemSchema),
  socials: z.array(SocialItemSchema),
  footer: z.object({
    copyright: z.string(),
  }),
})

const HomeContentSchema = z.object({
  hero: z.object({
    title: z.string(),
    subtitle: z.string(),
    cta: z
      .object({
        label: z.string(),
        href: z.string(),
      })
      .optional(),
    backgroundImage: z.string(),
  }),
  intro: z.object({
    title: z.string(),
    text: z.string(),
    image: z.object({
      src: z.string(),
      alt: z.string(),
    }),
  }),
  education: z
    .array(
      z.object({
        degree: z.string(),
        institution: z.string(),
        year: z.string(),
        icon: z.string().optional(),
      }),
    )
    .optional(),
})

const TimelineItemSchema = z.object({
  year: z.number(),
  title: z.string(),
  cover: z.string(),
  blurb: z.string(),
  actions: z.string(),
})

const TimelineContentSchema = z.object({
  items: z.array(TimelineItemSchema),
})

const ServiceItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  focus: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  icon: z.string().optional(),
  image: z
    .object({
      src: z.string(),
      alt: z.string(),
    })
    .optional(),
})

const ServicesContentSchema = z.object({
  heading: z.string().optional(),
  description: z.string().optional(),
  items: z.array(ServiceItemSchema),
})

const PostItemSchema = z.object({
  title: z.string(),
  image: z.string(),
  url: z.string(),
  summary: z.string(),
  contentHtml: z.string(),
})

const PostsContentSchema = z.object({
  heading: z.string().optional(),
  description: z.string().optional(),
  items: z.array(PostItemSchema),
})

const ContactContentSchema = z.object({
  title: z.string(),
  description: z.string(),
  fields: z.object({
    name: z.object({
      label: z.string(),
      placeholder: z.string().optional(),
    }),
    email: z.object({
      label: z.string(),
      placeholder: z.string().optional(),
    }),
    message: z.object({
      label: z.string(),
      placeholder: z.string().optional(),
    }),
  }),
  submit: z.object({
    label: z.string(),
  }),
  mailto: z.string().optional(),
})

// Infer TypeScript types from schemas
export type NavItem = z.infer<typeof NavItemSchema>
export type SocialItem = z.infer<typeof SocialItemSchema>
export type SiteContent = z.infer<typeof SiteContentSchema>
export type HomeContent = z.infer<typeof HomeContentSchema>
export type TimelineItem = z.infer<typeof TimelineItemSchema>
export type TimelineContent = z.infer<typeof TimelineContentSchema>
export type ServiceItem = z.infer<typeof ServiceItemSchema>
export type ServicesContent = z.infer<typeof ServicesContentSchema>
export type PostItem = z.infer<typeof PostItemSchema>
export type PostsContent = z.infer<typeof PostsContentSchema>
export type ContactContent = z.infer<typeof ContactContentSchema>

// Simple in-memory cache to avoid duplicate fetches
const cache = new Map<string, unknown>()

async function fetchAndParse<T>(url: string, schema: z.ZodSchema<T>): Promise<T> {
  if (cache.has(url)) return schema.parse(cache.get(url))

  const res = await fetch(url, { headers: { 'cache-control': 'no-cache' } })
  if (!res.ok) throw new Error(`Failed to load content: ${url} (${res.status})`)
  const json = await res.json()
  const parsed = schema.parse(json)
  cache.set(url, parsed)
  return parsed
}

// Return validated data (throws if validation fails)
export const content = {
  getSite: async (): Promise<SiteContent> => fetchAndParse('/content/site.json', SiteContentSchema),
  getHome: async (): Promise<HomeContent> => fetchAndParse('/content/home.json', HomeContentSchema),
  getTimeline: async (): Promise<TimelineContent> =>
    fetchAndParse('/content/timeline.json', TimelineContentSchema),
  getServices: async (): Promise<ServicesContent> =>
    fetchAndParse('/content/services.json', ServicesContentSchema),
  getPosts: async (): Promise<PostsContent> =>
    fetchAndParse('/content/posts.json', PostsContentSchema),
  getContact: async (): Promise<ContactContent> =>
    fetchAndParse('/content/contact.json', ContactContentSchema),
}
