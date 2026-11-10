import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://tokei.harryt.dev',
      lastModified: new Date(),
    },
    {
      url: 'https://tokei.harryt.dev/sign-in',
      lastModified: new Date(),
    },
    {
      url: 'https://tokei.harryt.dev/sign-up',
      lastModified: new Date(),
    },
  ]
}
