/**
 * OG Image Generator
 * Generates beautiful Open Graph images for blog posts at build time
 */

import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import sharp from 'sharp'
import { readFile, writeFile, mkdir, access } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

// OG Image dimensions (standard)
const WIDTH = 1200
const HEIGHT = 630

/**
 * Convert image file to base64 data URI
 * @param {string} imagePath - Path to the image file
 * @param {number} size - Size to resize to (default 160)
 * @returns {Promise<string|null>} Base64 data URI or null on failure
 */
async function imageToDataUri(imagePath, size = 160) {
  try {
    // Check if file exists first
    await access(imagePath)
    
    // Resize image to optimize memory usage
    const resizedBuffer = await sharp(imagePath)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .png()
      .toBuffer()

    const base64 = resizedBuffer.toString('base64')
    return `data:image/png;base64,${base64}`
  } catch (error) {
    console.warn(`Failed to load image ${imagePath}:`, error.message)
    return null
  }
}

/**
 * Create the OG image as a React-like JSX object for satori
 * Using JSX objects instead of satori-html to avoid HTML escaping issues
 */
function createOgTemplate(title, description, siteName, accentColor = '#b39ddb', imageDataUri = null) {
  // Truncate description if too long
  const maxDescLength = 140
  const truncatedDesc =
    description.length > maxDescLength ? description.substring(0, maxDescLength) + '...' : description

  // Truncate title if too long
  const maxTitleLength = 90
  const truncatedTitle = title.length > maxTitleLength ? title.substring(0, maxTitleLength) + '...' : title

  // Create avatar element - either image or initials fallback
  const avatarElement = imageDataUri
    ? {
        type: 'img',
        props: {
          src: imageDataUri,
          width: 160,
          height: 160,
          style: {
            borderRadius: '10%',
            marginRight: '20px',
            border: `3px solid ${accentColor}`,
            objectFit: 'cover',
          },
        },
      }
    : {
        type: 'div',
        props: {
          style: {
            display: 'flex',
            width: '160px',
            height: '160px',
            background: accentColor,
            borderRadius: '10%',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '20px',
          },
          children: {
            type: 'span',
            props: {
              style: {
                fontSize: '36px',
                color: 'white',
                fontWeight: 600,
              },
              children: 'ΕΠ',
            },
          },
        },
      }

  return {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #fafafa 0%, #f0f0f0 100%)',
        fontFamily: 'EB Garamond, serif',
      },
      children: [
        // Top accent bar
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              width: '100%',
              height: '8px',
              background: accentColor,
            },
          },
        },
        // Main content area
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '60px 70px',
              justifyContent: 'space-between',
            },
            children: [
              // Title and description section
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    flexDirection: 'column',
                  },
                  children: [
                    // Title
                    {
                      type: 'h1',
                      props: {
                        style: {
                          fontSize: '52px',
                          fontWeight: 600,
                          color: '#2c3e50',
                          margin: '0 0 24px 0',
                          lineHeight: 1.2,
                          letterSpacing: '-0.5px',
                        },
                        children: truncatedTitle,
                      },
                    },
                    // Description
                    {
                      type: 'p',
                      props: {
                        style: {
                          fontSize: '26px',
                          color: '#5a6c7d',
                          margin: '0 0 20px 0',
                          lineHeight: 1.5,
                          maxWidth: '900px',
                        },
                        children: truncatedDesc,
                      },
                    },
                    // Call to action button
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px 28px',
                          background: accentColor,
                          borderRadius: '8px',
                          fontSize: '22px',
                          fontWeight: 600,
                          color: 'white',
                          alignSelf: 'flex-start',
                        },
                        children: 'Διαβάστε περισσότερα →',
                      },
                    },
                  ],
                },
              },
              // Footer with branding
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  },
                  children: [
                    // Avatar and name section
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          alignItems: 'center',
                        },
                        children: [
                          avatarElement,
                          // Name and title
                          {
                            type: 'div',
                            props: {
                              style: {
                                display: 'flex',
                                flexDirection: 'column',
                              },
                              children: [
                                {
                                  type: 'span',
                                  props: {
                                    style: {
                                      fontSize: '28px',
                                      fontWeight: 600,
                                      color: '#2c3e50',
                                    },
                                    children: siteName,
                                  },
                                },
                                {
                                  type: 'span',
                                  props: {
                                    style: {
                                      fontSize: '18px',
                                      color: '#7f8c8d',
                                    },
                                    children: 'Συγγραφέας & Επιμελήτρια',
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                    // Decorative element
                    {
                      type: 'div',
                      props: {
                        style: {
                          display: 'flex',
                          width: '120px',
                          height: '120px',
                          background: accentColor,
                          opacity: 0.15,
                          borderRadius: '50%',
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        // Bottom accent bar
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              width: '100%',
              height: '4px',
              background: accentColor,
            },
          },
        },
      ],
    },
  }
}

/**
 * Generate OG image for a single post or page
 */
async function generateOgImage(title, description, siteName, outputPath, fontData, imageDataUri = null) {
  const template = createOgTemplate(title, description, siteName, '#b39ddb', imageDataUri)

  // Generate SVG with satori (using JSX objects directly)
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
  const siteName = siteData.seo?.siteName || 'Έλενα Παπαδοπούλου'
  const pagesMeta = siteData.seo?.pages ?? {}

  // Load home data for intro image (used for non-post pages)
  const homePath = join(rootDir, 'public', 'content', 'home.json')
  const homeData = JSON.parse(await readFile(homePath, 'utf-8'))
  const introImagePath = join(rootDir, 'public', homeData.intro.image.src)
  const introImageDataUri = await imageToDataUri(introImagePath, 160)

  if (introImageDataUri) {
    console.log('✓ Loaded intro image for avatar')
  } else {
    console.warn('⚠ Could not load intro image, will use initials fallback')
  }

  // Load font - using a Google Font that's publicly available
  let fontData
  try {
    // Try to load local font first
    const localFontPath = join(rootDir, 'src', 'styles', 'fonts', 'EBGaramond-Regular.ttf')
    fontData = await readFile(localFontPath)
    console.log('✓ Using local EB Garamond font')
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

  // Generate OG image for each post (using post's own image)
  console.log('\n📝 Generating post OG images...')
  for (let i = 0; i < postsData.items.length; i++) {
    const post = postsData.items[i]
    const outputPath = join(outputDir, `post-${i}.png`)

    // Load the post's image as the avatar
    let postImageDataUri = null
    if (post.image) {
      const postImagePath = join(rootDir, 'public', post.image)
      postImageDataUri = await imageToDataUri(postImagePath, 160)
      if (!postImageDataUri) {
        console.warn(`  ⚠ Could not load image for post ${i}, using intro image fallback`)
        postImageDataUri = introImageDataUri
      }
    } else {
      postImageDataUri = introImageDataUri
    }

    await generateOgImage(post.title, post.summary, siteName, outputPath, fontData, postImageDataUri)
  }

  // Generate default OG image for the site (using intro image as avatar)
  console.log('\n🌐 Generating site default OG image...')
  const defaultOutputPath = join(outputDir, 'default.png')
  await generateOgImage(
    'Έλενα Παπαδοπούλου - Συγγραφέας, Επιμελήτρια & Σύμβουλος Εκδόσεων',
    'Συμβουλές για συγγραφείς, υπηρεσίες επιμέλειας και εργογραφία. Αξιολόγηση, μετάφραση, επιμέλεια και διόρθωση βιβλίων.',
    siteName,
    defaultOutputPath,
    fontData,
    introImageDataUri
  )

  // Generate OG images for main pages
  console.log('\n📄 Generating page-specific OG images...')
  
  const getPageMeta = (pageKey, fallbackTitle, fallbackDescription) => {
    const page = pagesMeta[pageKey]
    return {
      title: page?.title || fallbackTitle,
      description: page?.description || fallbackDescription,
    }
  }

  const pageDefinitions = [
    {
      key: 'home',
      filename: 'home.png',
      fallbackTitle: 'Έλενα Παπαδοπούλου - Συγγραφέας & Επιμελήτρια',
      fallbackDescription:
        'Υπηρεσίες επιμέλειας κειμένων, αξιολόγησης χειρογράφων και συμβουλευτικής για συγγραφείς. Επαγγελματική καθοδήγηση προς έκδοση.',
    },
    {
      key: 'timeline',
      filename: 'timeline.png',
      fallbackTitle: 'Εργογραφία - Έλενα Παπαδοπούλου',
      fallbackDescription:
        'Η πλήρης εργογραφία της Έλενας Παπαδοπούλου: βιβλία, μεταφράσεις, επιμέλειες και συνεργασίες με εκδοτικούς οίκους.',
    },
    {
      key: 'book',
      filename: 'book.png',
      fallbackTitle: 'Ένα μόνο γράμμα - Έλενα Παπαδοπούλου',
      fallbackDescription:
        "Ανακαλύψτε το βιβλίο 'Ένα μόνο γράμμα' της Έλενας Παπαδοπούλου. Διαθέσιμο στα μεγαλύτερα βιβλιοπωλεία.",
    },
    {
      key: 'moonlight',
      filename: 'moonlight.png',
      fallbackTitle: 'Moonlight Tales - Έλενα Παπαδοπούλου',
      fallbackDescription:
        'Moonlight Tales: Μια συλλογή ιστοριών από την Έλενα Παπαδοπούλου που εξερευνά το μυστήριο και τη μαγεία.',
    },
    {
      key: 'paintedBooks',
      filename: 'painted-books.png',
      fallbackTitle: 'Ζωγραφισμένα Βιβλία - Έλενα Παπαδοπούλου',
      fallbackDescription:
        'Ανακαλύψτε τα ζωγραφισμένα βιβλία: μια μοναδική συλλογή όπου η τέχνη συναντά τη λογοτεχνία.',
    },
  ]

  for (const page of pageDefinitions) {
    const { title, description } = getPageMeta(page.key, page.fallbackTitle, page.fallbackDescription)
    const pageOgPath = join(outputDir, page.filename)

    await generateOgImage(title, description, siteName, pageOgPath, fontData, introImageDataUri)
  }

  console.log('\n✅ OG image generation complete!')
}

main().catch(console.error)
