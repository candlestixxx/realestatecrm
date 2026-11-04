'use client';
// Websites — consolidated single page (hub + builder).
// The /dashboard/websites/builder route redirects here for bookmarks.

import WebsiteBuilder from '@/components/dashboard/WebsiteBuilder';

export default function WebsitesPage() {
  return (
    <div className="p-6">
      <WebsiteBuilder />
    </div>
  );
}
