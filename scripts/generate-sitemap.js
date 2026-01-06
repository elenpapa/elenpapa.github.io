import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const siteUrl = 'https://elenpapa.github.io'

// Define all routes with their SEO priority and change frequency
const routes = [
  // Main pages (highest priority)
  { path: '/', priority: 1.0, changefreq: 'monthly' },
  { path: '/timeline', priority: 0.9, changefreq: 'monthly' },
  { path: '/book', priority: 0.9, changefreq: 'monthly' },

  // Secondary pages
  { path: '/moonlight', priority: 0.8, changefreq: 'monthly' },
  { path: '/painted-books', priority: 0.8, changefreq: 'monthly' },

  // Blog posts (lower priority, updated more frequently)
  ...Array.from({ length: 10 }, (_, i) => ({
    path: `/posts/${i}`,
    priority: 0.6,
    changefreq: 'monthly',
  })),
]

// Generate XML sitemap
const generateSitemap = () => {
  const lastmod = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

  const urlEntries = routes
    .map(
      (route) => `  <url>
    <loc>${siteUrl}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`
}

// Write sitemap to public directory
const writeSitemap = async () => {
  const xml = generateSitemap()
  const outputPath = join(process.cwd(), 'public/sitemap.xml')

  try {
    await writeFile(outputPath, xml, 'utf-8')
    console.log('✅ Sitemap generated successfully at public/sitemap.xml')
    console.log(`   Total URLs: ${routes.length}`)
  } catch (error) {
    console.error('❌ Failed to generate sitemap:', error)
    process.exit(1)
  }
}

writeSitemap()
