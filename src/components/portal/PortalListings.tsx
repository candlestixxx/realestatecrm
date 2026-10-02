'use client';

import React, { useState, useEffect } from 'react';
import { getClientWorkspaceSlug, withWorkspace } from '@/lib/workspace-client';

interface Listing {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  listPrice: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  propertyType: string | null;
  photos: string | null;
  status: string;
}

export default function PortalListingsClient() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ACTIVE');

  useEffect(() => {
    fetch(`/api/listings?workspaceId=${getClientWorkspaceSlug()}&status=${filter}`)
      .then(r => r.json())
      .then(data => setListings(Array.isArray(data) ? data.slice(0, 6) : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading listings...</div>;
  if (listings.length === 0) return <div className="text-sm text-muted-foreground">No listings available.</div>;

  return (
    <>
      {listings.map(l => (
        <div key={l.id} className="border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          <div className="h-40 bg-muted flex items-center justify-center text-muted-foreground text-sm">
            {l.photos ? (
              <img src={JSON.parse(l.photos)[0]} alt="" className="h-full w-full object-cover" />
            ) : (
              'No Photo'
            )}
          </div>
          <div className="p-4">
            <div className="font-semibold text-lg">
              {l.listPrice ? '$' + l.listPrice.toLocaleString() : 'Price TBD'}
            </div>
            <div className="text-sm text-muted-foreground">{l.address}</div>
            <div className="text-sm text-muted-foreground">{l.city}, {l.state}</div>
            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
              {l.bedrooms && <span>{l.bedrooms} bd</span>}
              {l.bathrooms && <span>{l.bathrooms} ba</span>}
              {l.squareFeet && <span>{l.squareFeet.toLocaleString()} sqft</span>}
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
