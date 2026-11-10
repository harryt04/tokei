import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/freestyle', '/routine/', '/routines'],
    },
    sitemap: 'https://tokei.harryt.dev/sitemap.xml',
  }
}
