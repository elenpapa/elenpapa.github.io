/**
 * OG Image Generator
 * Generates beautiful Open Graph images for blog posts at build time
 */

import satori from 'satori'
import { html } from 'satori-html'
import { Resvg } from '@resvg/resvg-js'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

// OG Image dimensions (standard)
const WIDTH = 1200
const HEIGHT = 630

/**
 * Create the OG image HTML template
 */
function createOgTemplate(title, description, siteName, accentColor = '#b39ddb') {
  // Truncate description if too long
  const maxDescLength = 120
  const truncatedDesc =
    description.length > maxDescLength ? description.substring(0, maxDescLength) + '...' : description

  // Truncate title if too long
  const maxTitleLength = 80
  const truncatedTitle = title.length > maxTitleLength ? title.substring(0, maxTitleLength) + '...' : title

  return html`
    <div
      style="
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%);
        font-family: 'EB Garamond', serif;
      "
    >
      <!-- Accent bar at top -->
      <div
        style="
          display: flex;
          width: 100%;
          height: 8px;
          background: ${accentColor};
        "
      ></div>

      <!-- Main content area -->
      <div
        style="
          display: flex;
          flex-direction: column;
          flex: 1;
          padding: 60px 70px;
          justify-content: space-between;
        "
      >
        <!-- Title and description -->
        <div style="display: flex; flex-direction: column;">
          <h1
            style="
              font-size: 52px;
              font-weight: 600;
              color: #2c3e50;
              margin: 0 0 24px 0;
              line-height: 1.2;
              letter-spacing: -0.5px;
            "
          >
            ${truncatedTitle}
          </h1>
          <p
            style="
              font-size: 26px;
              color: #5a6c7d;
              margin: 0;
              line-height: 1.5;
              max-width: 900px;
            "
          >
            ${truncatedDesc}
          </p>
        </div>

        <!-- Footer with branding -->
        <div
          style="
            display: flex;
            align-items: center;
            justify-content: space-between;
          "
        >
          <div style="display: flex; align-items: center;">
            <!-- Logo circle -->
            <div
              style="
                display: flex;
                width: 56px;
                height: 56px;
                background: ${accentColor};
                border-radius: 50%;
                align-items: center;
                justify-content: center;
                margin-right: 16px;
              "
            >
              <span style="font-size: 28px; color: white; font-weight: 600;">ΕΠ</span>
            </div>
            <div style="display: flex; flex-direction: column;">
              <span style="font-size: 24px; font-weight: 600; color: #2c3e50;">${siteName}</span>
              <span style="font-size: 16px; color: #7f8c8d;">Συγγραφέας & Επιμελήτρια</span>
            </div>
          </div>

          <!-- Decorative element -->
          <div
            style="
              display: flex;
              width: 120px;
              height: 120px;
              background: ${accentColor};
              opacity: 0.15;
              border-radius: 50%;
            "
          ></div>
        </div>
      </div>

      <!-- Bottom accent bar -->
      <div
        style="
          display: flex;
          width: 100%;
          height: 4px;
          background: ${accentColor};
        "
      ></div>
    </div>
  `
}

/**
 * Generate OG image for a single post
 */
async function generateOgImage(title, description, siteName, outputPath, fontData) {
  const template = createOgTemplate(title, description, siteName)

  // Generate SVG with satori
  const svg = await satori(template, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      {
        name: 'EB Garamond',
        data: fontData,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'EB Garamond',
        data: fontData,
        weight: 600,
        style: 'normal',
      },
    ],
  })

  // Convert SVG to PNG using resvg
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: WIDTH,
    },
  })

  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()

  // Ensure output directory exists
  await mkdir(dirname(outputPath), { recursive: true })

  // Write PNG file
  await writeFile(outputPath, pngBuffer)

  console.log(`✓ Generated: ${outputPath}`)
}

/**
 * Main function to generate all OG images
 */
async function main() {
  console.log('🎨 Generating OG images...\n')

  // Load posts data
  const postsPath = join(rootDir, 'public', 'content', 'posts.json')
  const postsData = JSON.parse(await readFile(postsPath, 'utf-8'))

  // Load site data for branding
  const sitePath = join(rootDir, 'public', 'content', 'site.json')
  const siteData = JSON.parse(await readFile(sitePath, 'utf-8'))
  const siteName = siteData.seo?.siteName || 'Ελένη Παπαδοπούλου'

  // Load font - using a Google Font that's publicly available
  // We'll fetch EB Garamond from Google Fonts
  let fontData
  try {
    // Try to load local font first
    const localFontPath = join(rootDir, 'src', 'styles', 'fonts', 'EBGaramond-Regular.ttf')
    fontData = await readFile(localFontPath)
  } catch {
    // Fallback: fetch from Google Fonts
    console.log('📥 Fetching font from Google Fonts...')
    const response = await fetch(
      'https://cdn.jsdelivr.net/fontsource/fonts/eb-garamond@latest/greek-400-normal.woff'
    )
    if (!response.ok) {
      // Use a fallback font that's always available
      const fallbackResponse = await fetch(
        'https://cdn.jsdelivr.net/npm/@fontsource/inter/files/inter-latin-400-normal.woff'
      )
      fontData = await fallbackResponse.arrayBuffer()
    } else {
      fontData = await response.arrayBuffer()
    }
  }

  // Output directory for OG images
  const outputDir = join(rootDir, 'public', 'images', 'og')

  // Generate OG image for each post
  for (let i = 0; i < postsData.items.length; i++) {
    const post = postsData.items[i]
    const outputPath = join(outputDir, `post-${i}.png`)

    await generateOgImage(post.title, post.summary, siteName, outputPath, fontData)
  }

  // Generate default OG image for the site
  const defaultOutputPath = join(outputDir, 'default.png')
  await generateOgImage(
    'Ελένη Παπαδοπούλου',
    'Συγγραφέας, επιμελήτρια και σύμβουλος εκδόσεων. Συμβουλές για συγγραφείς, υπηρεσίες επιμέλειας και εργογραφία.',
    siteName,
    defaultOutputPath,
    fontData
  )

  console.log('\n✅ OG image generation complete!')
}

main().catch(console.error)
