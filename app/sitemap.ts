// app/sitemap.ts
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://canadabeaver.pro'
  const locales = ['en', 'ko', 'zh']
  const lastModified = new Date()

  // 주요 페이지 목록
  const pages = [
    { path: '', priority: 1, changeFrequency: 'daily' as const },
    { path: '/quote-request', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/contractors', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/login', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/signup', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/contractor-login', priority: 0.5, changeFrequency: 'monthly' as const },
    { path: '/contractor-signup', priority: 0.5, changeFrequency: 'monthly' as const },
  ]

  // 각 locale별로 모든 페이지 생성
  const sitemapEntries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    for (const page of pages) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${page.path}`,
        lastModified,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      })
    }
  }

  return sitemapEntries
}
