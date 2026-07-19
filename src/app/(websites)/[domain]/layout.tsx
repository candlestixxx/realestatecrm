import { ReactNode } from 'react';
import prisma from '@/lib/prisma';
import Script from 'next/script';

export default async function TenantLayout({ children, params }: { children: ReactNode, params: Promise<{ domain: string }> }) {
  const { domain } = await params;

  // Retrieve the site tracking pixels
  const tenantSite = await prisma.landingPage.findFirst({
    where: {
      OR: [
        { customDomain: domain },
        { subdomain: domain },
        { slug: domain }
      ]
    },
    select: {
      gtmId: true,
      fbPixelId: true
    }
  });

  // Sanitize pixel IDs to prevent Stored XSS inside dangerouslySetInnerHTML blocks
  const safeGtmId = tenantSite?.gtmId?.replace(/[^A-Za-z0-9-]/g, '');
  const safeFbPixelId = tenantSite?.fbPixelId?.replace(/[^0-9]/g, '');

  return (
    <>
      {/* Inject Google Tag Manager dynamically if configured */}
      {safeGtmId && (
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${safeGtmId}');
            `,
          }}
        />
      )}

      {/* Inject Facebook CAPI Pixel dynamically if configured */}
      {safeFbPixelId && (
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${safeFbPixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}


      {/* Fallback GTM noscript iframe injected near body via global layout if needed */}
      {children}
    </>
  );
}
