import { MetadataRoute } from 'next';

/**
 * Robots.txt — allow public property/blog pages, block auth/dashboard.
 *
 * Why: agent websites and blogs should be indexed for SEO; the CRM
 * dashboard must never appear in search results (contains PII).
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://excellegacy.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/portal', '/site/'],
        disallow: ['/dashboard', '/api/', '/auth/', '/workflows'],
      },
    ],
    sitemap: baseUrl + '/sitemap.xml',
  };
}
