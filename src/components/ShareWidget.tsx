'use client';

// ShareWidget — social share buttons for public property/portal pages.
// Why: property listings and blog posts need one-click sharing to social
// platforms to drive organic traffic. Buttons use the Web Share API on
// mobile (native share sheet) and fall back to direct share URLs on
// desktop. Open Graph meta tags (set in the page's generateMetadata)
// ensure shared links render with rich previews.

import { useState } from 'react';

interface ShareWidgetProps {
  url: string;
  title: string;
  description?: string;
}

export default function ShareWidget({ url, title, description = '' }: ShareWidgetProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDesc = encodeURIComponent(description);

  const shares = [
    {
      name: 'Facebook',
      icon: '📘',
      href: 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl,
    },
    {
      name: 'X / Twitter',
      icon: '🐦',
      href: 'https://twitter.com/intent/tweet?url=' + encodedUrl + '&text=' + encodedTitle,
    },
    {
      name: 'LinkedIn',
      icon: '💼',
      href: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodedUrl,
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      href: 'https://wa.me/?text=' + encodedTitle + '%20' + encodedUrl,
    },
    {
      name: 'Email',
      icon: '✉️',
      href: 'mailto:?subject=' + encodedTitle + '&body=' + encodedDesc + '%0A%0A' + encodedUrl,
    },
  ];

  // On devices that support the native share sheet, prefer that
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url });
      } catch {
        // User cancelled — do nothing
      }
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — fallback prompt
      window.prompt('Copy this link:', url);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Share
      </span>

      {/* Native share button — visible only on devices with Web Share API */}
      <button
        onClick={handleNativeShare}
        className="hidden md:hidden items-center gap-1 px-3 py-1.5 rounded-full border border-border text-xs font-medium hover:bg-muted transition-colors"
        aria-label="Open native share sheet"
        id="native-share-btn"
      >
        📤 Share
      </button>

      {shares.map((s) => (
        <a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-xs font-medium hover:bg-muted transition-colors"
          title={'Share on ' + s.name}
          aria-label={'Share on ' + s.name}
        >
          <span>{s.icon}</span>
          <span className="hidden sm:inline">{s.name}</span>
        </a>
      ))}

      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-border text-xs font-medium hover:bg-muted transition-colors"
        title="Copy link"
        aria-label="Copy link to clipboard"
      >
        {copied ? '✅ Copied!' : '🔗 Copy Link'}
      </button>
    </div>
  );
}
