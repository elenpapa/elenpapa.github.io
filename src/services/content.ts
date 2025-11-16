// Import JSON files at build time instead of runtime fetch
import { z } from 'zod'
import siteData from '../../public/content/site.json'
import homeData from '../../public/content/home.json'
import timelineData from '../../public/content/timeline.json'
import servicesData from '../../public/content/services.json'
import postsData from '../../public/content/posts.json'
import contactData from '../../public/content/contact.json'

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

// Return validated data (throws if validation fails)
export const content = {
  getSite: async (): Promise<SiteContent> => SiteContentSchema.parse(siteData),
  getHome: async (): Promise<HomeContent> => HomeContentSchema.parse(homeData),
  getTimeline: async (): Promise<TimelineContent> => TimelineContentSchema.parse(timelineData),
  getServices: async (): Promise<ServicesContent> => ServicesContentSchema.parse(servicesData),
  getPosts: async (): Promise<PostsContent> => PostsContentSchema.parse(postsData),
  getContact: async (): Promise<ContactContent> => ContactContentSchema.parse(contactData),
}
