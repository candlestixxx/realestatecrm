'use client';

import React, { useState, useEffect } from 'react';

interface Listing {
  id: string;
  mlsNumber: string | null;
  status: string;
  listPrice: number | null;
  address: string;
  city: string | null;
  state: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  propertyType: string | null;
  photos: string | null;
  offers: any[];
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  SOLD: 'bg-blue-100 text-blue-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
  WITHDRAWN: 'bg-red-100 text-red-800',
};

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    fetch('/api/listings?workspaceId=excel-legacy-team')
      .then(r => r.json())
      .then(setListings)
      .catch(console.error);
  }, []);

  const filtered = filter === 'ALL' ? listings : listings.filter(l => l.status === filter);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
        <div className="flex gap-2">
          {['ALL', 'ACTIVE', 'PENDING', 'SOLD'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded text-sm font-medium ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(l => {
          const photos = l.photos ? JSON.parse(l.photos) : [];
          return (
            <div key={l.id} className="bg-white rounded-lg shadow border overflow-hidden">
              <div className="h-40 bg-gray-200 flex items-center justify-center">
                {photos[0] ? (
                  <img src={photos[0]} alt={l.address} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-400 text-sm">No photo</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[l.status]}`}>{l.status}</span>
                  {l.mlsNumber && <span className="text-xs text-gray-400">MLS #{l.mlsNumber}</span>}
                </div>
                <h3 className="font-semibold text-gray-900">{l.address}</h3>
                <p className="text-sm text-gray-500">{l.city}, {l.state}</p>
                <p className="text-lg font-bold text-blue-600 mt-2">
                  ${l.listPrice?.toLocaleString() || 'N/A'}
                </p>
                <div className="flex gap-3 text-xs text-gray-500 mt-2">
                  {l.bedrooms && <span>{l.bedrooms} bd</span>}
                  {l.bathrooms && <span>{l.bathrooms} ba</span>}
                  {l.squareFeet && <span>{l.squareFeet.toLocaleString()} sqft</span>}
                </div>
                {l.offers?.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">{l.offers.length} offer{l.offers.length > 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-400">
            <p>No listings found. Import from MLS or add manually.</p>
          </div>
        )}
      </div>
    </div>
  );
}
