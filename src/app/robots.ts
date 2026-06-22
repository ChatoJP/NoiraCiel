import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/scholarship/admin'],
      },
    ],
    sitemap: 'https://noiraciel.com/sitemap.xml',
    host: 'https://noiraciel.com',
  }
}
