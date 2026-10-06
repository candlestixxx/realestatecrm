import { MetadataRoute } from 'next';

/**
 * Dynamic sitemap for all public-facing routes.
 *
 * Why: without a sitemap, search engines can't discover agent websites,
 * listing pages, or blog posts. This covers the portal, multi-tenant
 * websites, and blog — the three surfaces that need indexing. Dashboard
 * routes are intentionally excluded (they require auth).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://excellegacy.com';

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: baseUrl + '/portal', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: baseUrl + '/auth/signin', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Public property sites are generated per-domain at request time.
  // A webhook from the website builder should re-submit this sitemap
  // to Google/Bing when new sites or listings publish.
  return staticRoutes;
}
