import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Providers from '@/components/Providers';
import ClientInit from '@/components/ClientInit';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'RealEstateCRM | Excel Legacy Realty Group',
    template: '%s | Excel Legacy CRM',
  },
  description:
    'A modular TypeScript real estate operating system with workflow shells for offers, listings, and future MLS-connected automation.',
  // Open Graph — drives link previews on Facebook, LinkedIn, Slack, iMessage
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Excel Legacy CRM',
    title: 'RealEstateCRM | Excel Legacy Realty Group',
    description:
      'AI-powered real estate CRM with lead management, transaction workflows, marketing automation, and voice agents.',
  },
  // Twitter/X card — summary_large_image requires an image; we use the summary type
  twitter: {
    card: 'summary',
    title: 'RealEstateCRM | Excel Legacy Realty Group',
    description:
      'AI-powered real estate CRM with lead management, transaction workflows, and marketing automation.',
  },
  // Explicit robots meta as a safety net alongside robots.ts
  robots: {
    index: false,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        <ClientInit />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
