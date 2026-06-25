import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireWorkspaceAccess } from '@/lib/workspace-access';
import prisma from '@/lib/prisma';
import WebsitesClient from '@/components/websites/WebsitesClient';

export default async function AgentWebsitesPage() {
  const session = await getServerSession(authOptions);
  const access = await requireWorkspaceAccess(session);
  const workspaceId = access.workspaceId;

  // 1. Auto-seed listings if none exist
  let listings = await prisma.propertyListing.findMany({
    where: { workspaceId },
  });

  if (listings.length === 0) {
    const mockListingsData = [
      {
        mlsNumber: 'MLS-6026',
        address: '6026 Via Toscana Street',
        city: 'Troy',
        state: 'MI',
        zip: '48085',
        price: 649725,
        bedrooms: 4,
        bathroomsFull: 3,
        bathroomsHalf: 1,
        squareFeet: 2850,
        yearBuilt: 2018,
        propertyType: 'SingleFamily',
        status: 'ACTIVE',
        description: 'Stunning luxury colonial home in Troy, Michigan. Features gorgeous open layout, premium chef kitchen, custom deck, and beautifully landscaped front yard.',
        images: JSON.stringify(['/toscana_listing.png']),
        workspaceId,
        agentId: access.userId,
        source: 'RESO',
      },
      {
        mlsNumber: 'MLS-2024',
        address: '2024 Manchester Boulevard',
        city: 'Troy',
        state: 'MI',
        zip: '48084',
        price: 495000,
        bedrooms: 3,
        bathroomsFull: 2,
        bathroomsHalf: 1,
        squareFeet: 2100,
        yearBuilt: 2012,
        propertyType: 'SingleFamily',
        status: 'ACTIVE',
        description: 'Charming colonial-style brick house with modern amenities, beautifully landscaped gardens, custom interiors, and proximity to award-winning schools.',
        images: JSON.stringify(['/manchester_listing.png']),
        workspaceId,
        agentId: access.userId,
        source: 'RESO',
      },
      {
        mlsNumber: 'MLS-4784',
        address: '47840 Greenview Road',
        city: 'Troy',
        state: 'MI',
        zip: '48085',
        price: 785000,
        bedrooms: 5,
        bathroomsFull: 4,
        bathroomsHalf: 1,
        squareFeet: 3400,
        yearBuilt: 2021,
        propertyType: 'SingleFamily',
        status: 'ACTIVE',
        description: 'Gorgeous modern farmhouse design with high-end fixtures, wrap-around porch, soaring ceilings, and professional landscaping in premium area.',
        images: JSON.stringify(['/greenview_listing.png']),
        workspaceId,
        agentId: access.userId,
        source: 'RESO',
      },
    ];

    for (const listing of mockListingsData) {
      await prisma.propertyListing.upsert({
        where: { mlsNumber: listing.mlsNumber },
        create: listing,
        update: {},
      });
    }

    listings = await prisma.propertyListing.findMany({
      where: { workspaceId },
    });
  }

  // 2. Automatically ensure each MLS listing has a corresponding ready-to-use landing page
  const landingPages = await prisma.landingPage.findMany({
    where: { workspaceId },
  });

  for (const listing of listings) {
    const slug = listing.address.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-promo';
    const hasPage = landingPages.some(page => page.slug === slug || page.title.includes(listing.address));
    
    if (!hasPage) {
      const defaultBlocks = [
        {
          id: 'settings',
          type: 'SETTINGS',
          pageStyle: 'With simple header, no footer',
          leadSource: 'Website',
          leadType: 'Buyer',
          registrationTrigger: 'Require registration based on Browsing Time',
          browsingTime: 8,
          youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          customVideoUrl: '',
          videoType: 'YOUTUBE',
        },
        {
          id: 'header',
          type: 'HEADER',
          title: listing.address,
          subtitle: `Beautiful ${listing.propertyType} property located in ${listing.city}, ${listing.state}. Priced at $${listing.price?.toLocaleString()}.`,
        },
        {
          id: 'property',
          type: 'PROPERTY',
          address: `${listing.address}, ${listing.city}, ${listing.state} ${listing.zip}`,
          price: listing.price,
          beds: listing.bedrooms,
          baths: listing.bathroomsFull,
          remarks: listing.description,
          image: listing.images ? JSON.parse(listing.images)[0] : '',
        },
        {
          id: 'video',
          type: 'VIDEO',
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          title: 'Watch the Property Walkthrough Video',
        },
        {
          id: 'leadCapture',
          type: 'LEAD_CAPTURE',
          ctaText: 'Register to Schedule a Tour',
        }
      ];

      const newPage = await prisma.landingPage.create({
        data: {
          title: `${listing.address} (Promotion)`,
          slug,
          blocks: JSON.stringify(defaultBlocks),
          workspaceId,
          ownerId: access.userId,
        }
      });
      landingPages.push(newPage);
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <WebsitesClient landingPages={landingPages} listings={listings} workspaceId={workspaceId} />
    </div>
  );
}

