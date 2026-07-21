import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import LandingPagePortalClient from '@/components/websites/LandingPagePortalClient';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PublicLandingPage(props: PageProps) {
  const resolvedParams = await props.params;
  const { slug } = resolvedParams;

  // Handle agent seats dynamic routing simulation
  if (slug.startsWith('agent-')) {
    const agentNameMap: Record<string, { name: string; email: string; phone: string; role: string }> = {
      'agent-hank-mendez': {
        name: 'Hank Mendez',
        email: 'hankrealtyexec@gmail.com',
        phone: '586-405-3333',
        role: 'Broker / Team Leader',
      },
      'agent-harry-kourlos': {
        name: 'Harry Kourlos',
        email: 'harryrealtyexec@gmail.com',
        phone: '586-883-3333',
        role: 'Realtor Associate',
      },
      'agent-don-sobieski': {
        name: 'Don Sobieski',
        email: 'realtordon26@gmail.com',
        phone: '586-306-0051',
        role: 'Listing Agent',
      },
    };

    const agent = agentNameMap[slug];

    if (!agent) {
      notFound();
    }

    // Default agent blocks layout
    const agentBlocks = [
      {
        id: 'header',
        type: 'HEADER',
        title: `${agent.name} - Excel Legacy Realty Group`,
        subtitle: `Connect directly with ${agent.name} (${agent.role}) for custom property marketing, listings sync, and virtual walkthroughs.`,
      },
      {
        id: 'video',
        type: 'VIDEO',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        title: 'Excel Legacy Client Testimonial Tour',
      },
      {
        id: 'property',
        type: 'PROPERTY',
        address: 'Featured Listing Detroit Area, MI',
        price: 395000,
        beds: 3,
        baths: 2,
        remarks: `Connect with our Excel Legacy team member. Call cell: ${agent.phone} or email: ${agent.email}.`,
      },
      {
        id: 'leadCapture',
        type: 'LEAD_CAPTURE',
        ctaText: `Schedule Consultation with ${agent.name}`,
      },
    ];

    // Grab first workspace as default
    const workspaces = await prisma.workspace.findMany({ take: 1 });
    const workspaceId = workspaces[0]?.id || 'default';

    return (
      <LandingPagePortalClient
        pageTitle={`${agent.name} Site`}
        blocksJson={JSON.stringify(agentBlocks)}
        workspaceId={workspaceId}
      />
    );
  }

  const landingPage = await prisma.landingPage.findUnique({
    where: { slug },
  });

  if (!landingPage) {
    notFound();
  }

  return (
    <>
      {landingPage.fbPixelId && (
        <script
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
              fbq('init', '${landingPage.fbPixelId}');
              fbq('track', 'PageView');
            `
          }}
        />
      )}
      <LandingPagePortalClient
        pageTitle={landingPage.title}
        blocksJson={landingPage.blocks}
        workspaceId={landingPage.workspaceId}
      />
    </>
  );
}
export const revalidate = 0;
