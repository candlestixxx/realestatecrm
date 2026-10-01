'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface Listing {
  id: string;
  mlsNumber: string | null;
  listPrice: number | null;
  address: string;
  city: string | null;
  state: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  propertyType: string | null;
  photos: string | null;
}

/**
 * IDX Search Widget for agent websites.
 * Embeddable component with search filters and listing grid.
 */
export default function IDXSearchWidget({ domain = '' }: { domain?: string }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    q: '', city: '', minPrice: '', maxPrice: '', beds: '', baths: '', propertyType: '',
  });

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '12' });
      if (domain) params.set('domain', domain);
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await fetch(`/api/idx/search?${params}`);
      const data = await res.json();
      setListings(data.listings || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [filters, page, domain]);

  useEffect(() => { search(); }, [search]);

  return (
    <div className="space-y-6">
      {/* Search Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <input placeholder="Search address, city, zip..." value={filters.q} onChange={e => setFilters(f => ({ ...f, q: e.target.value }))} className="col-span-2 border rounded-lg px-4 py-2" />
        <select value={filters.propertyType} onChange={e => setFilters(f => ({ ...f, propertyType: e.target.value }))} className="border rounded-lg px-3 py-2">
          <option value="">All Types</option>
          <option value="SINGLE_FAMILY">Single Family</option>
          <option value="CONDO">Condo</option>
          <option value="TOWNHOUSE">Townhouse</option>
          <option value="MULTI_FAMILY">Multi Family</option>
        </select>
        <select value={filters.beds} onChange={e => setFilters(f => ({ ...f, beds: e.target.value }))} className="border rounded-lg px-3 py-2">
          <option value="">Any Beds</option>
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}+ beds</option>)}
        </select>
        <input placeholder="Min Price" type="number" value={filters.minPrice} onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))} className="border rounded-lg px-3 py-2" />
        <input placeholder="Max Price" type="number" value={filters.maxPrice} onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))} className="border rounded-lg px-3 py-2" />
        <select value={filters.baths} onChange={e => setFilters(f => ({ ...f, baths: e.target.value }))} className="border rounded-lg px-3 py-2">
          <option value="">Any Baths</option>
          {[1,1.5,2,2.5,3,3.5,4].map(n => <option key={n} value={n}>{n}+ baths</option>)}
        </select>
        <button onClick={() => setPage(1)} className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700">Search</button>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Searching properties...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No properties found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(l => (
            <div key={l.id} className="border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-52 bg-gray-100 flex items-center justify-center text-gray-400">
                {l.photos ? <img src={JSON.parse(l.photos)[0]} alt="" className="h-full w-full object-cover" /> : 'No Photo'}
              </div>
              <div className="p-5">
                <div className="text-2xl font-bold text-gray-900">{l.listPrice ? '$' + l.listPrice.toLocaleString() : 'Call for Price'}</div>
                <div className="text-gray-600 mt-1">{l.address}</div>
                <div className="text-gray-500 text-sm">{l.city}, {l.state}</div>
                <div className="flex gap-4 mt-3 text-sm text-gray-600">
                  <span>{l.bedrooms || '—'} beds</span>
                  <span>{l.bathrooms || '—'} baths</span>
                  <span>{l.squareFeet?.toLocaleString() || '—'} sqft</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-4 py-2 border rounded-lg disabled:opacity-50">Previous</button>
          <span className="px-4 py-2 text-gray-600">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-4 py-2 border rounded-lg disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
