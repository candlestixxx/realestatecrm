'use client';
// Marketing — consolidated single page (hub + SMS text codes).
// The /dashboard/marketing/text-codes route redirects here for bookmarks.

import TextCodes from '@/components/dashboard/TextCodes';

export default function MarketingPage() {
  return (
    <div className="p-6">
      <TextCodes />
    </div>
  );
}
