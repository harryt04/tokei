import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://tokei.app',
      lastModified: new Date(),
    },
    {
      url: 'https://tokei.app/login',
      lastModified: new Date(),
    },
  ]
}
