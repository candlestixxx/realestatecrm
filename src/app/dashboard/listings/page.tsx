'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getClientWorkspaceSlug, withWorkspace } from '@/lib/workspace-client';

interface Listing {
  id: string;
  mlsNumber: string | null;
  status: string;
  listPrice: number | null;
  soldPrice: number | null;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  lotSize: number | null;
  yearBuilt: number | null;
  propertyType: string | null;
  description: string | null;
  photos: string | null;
  listDate: string | null;
  offers: { id: string; amount: number; status: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  SOLD: 'bg-blue-100 text-blue-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
  WITHDRAWN: 'bg-red-100 text-red-800',
};

const PROPERTY_TYPES = ['SINGLE_FAMILY', 'CONDO', 'TOWNHOUSE', 'MULTI_FAMILY', 'LAND', 'COMMERCIAL'];

function CompsAnalysis({ address, city, zip }: { address: string; city: string | null; zip: string | null }) {
  const [comps, setComps] = useState<{ id: string; address: string; soldPrice: number | null; soldDate: string | null; bedrooms: number | null; bathrooms: number | null; squareFeet: number | null }[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!address && !city && !zip) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (address) params.set('address', address);
    if (city) params.set('city', city);
    if (zip) params.set('zip', zip);
    params.set('limit', '5');
    fetch('/api/mls/historical?' + params.toString())
      .then(r => r.json())
      .then(d => setComps(d.listings || d || []))
      .catch(() => setComps([]))
      .finally(() => setLoading(false));
  }, [address, city, zip]);

  return (
    <div className="mb-4">
      <h3 className="font-semibold mb-2">Comparable Sales</h3>
      {loading ? (
        <p className="text-sm text-gray-500">Loading comps...</p>
      ) : comps.length === 0 ? (
        <p className="text-sm text-gray-500">No historical comps found for this area.</p>
      ) : (
        <div className="space-y-2">
          {comps.map(c => (
            <div key={c.id} className="flex items-center justify-between text-sm border-b pb-2">
              <div>
                <div className="font-medium">{c.address}</div>
                <div className="text-xs text-gray-500">{c.bedrooms || '—'} bd / {c.bathrooms || '—'} ba / {c.squareFeet?.toLocaleString() || '—'} sqft</div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{c.soldPrice ? '$' + c.soldPrice.toLocaleString() : '—'}</div>
                <div className="text-xs text-gray-500">{c.soldDate ? new Date(c.soldDate).toLocaleDateString() : ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);

  // MLS search filters
  const [filters, setFilters] = useState({
    status: 'ALL',
    propertyType: '',
    minPrice: '',
    maxPrice: '',
    minBeds: '',
    minBaths: '',
    minSqft: '',
    city: '',
    zip: '',
  });

  const [entryForm, setEntryForm] = useState({
    address: '', city: '', state: 'MI', zip: '', listPrice: '',
    bedrooms: '', bathrooms: '', squareFeet: '', lotSize: '', yearBuilt: '',
    propertyType: 'SINGLE_FAMILY', mlsNumber: '', description: '', workspaceId: getClientWorkspaceSlug(),
  });

  const [offerForm, setOfferForm] = useState({
    amount: '', buyerContactId: '', contingencies: '', closingDate: '', earnestMoney: '', notes: '',
  });

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = withWorkspace({  });
      if (filters.status !== 'ALL') params.set('status', filters.status);
      if (filters.propertyType) params.set('propertyType', filters.propertyType);
      if (filters.minPrice) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
      const res = await fetch('/api/listings?' + params);
      let data = await res.json();
      // Client-side filtering for fields not in API
      if (filters.minBeds) data = data.filter((l: Listing) => (l.bedrooms || 0) >= Number(filters.minBeds));
      if (filters.minBaths) data = data.filter((l: Listing) => (l.bathrooms || 0) >= Number(filters.minBaths));
      if (filters.minSqft) data = data.filter((l: Listing) => (l.squareFeet || 0) >= Number(filters.minSqft));
      if (filters.city) data = data.filter((l: Listing) => l.city?.toLowerCase().includes(filters.city.toLowerCase()));
      if (filters.zip) data = data.filter((l: Listing) => l.zip?.includes(filters.zip));
      setListings(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [filters]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const submitEntry = async () => {
    try {
      await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...entryForm,
          listPrice: entryForm.listPrice ? parseFloat(entryForm.listPrice) : null,
          bedrooms: entryForm.bedrooms ? parseInt(entryForm.bedrooms) : null,
          bathrooms: entryForm.bathrooms ? parseFloat(entryForm.bathrooms) : null,
          squareFeet: entryForm.squareFeet ? parseInt(entryForm.squareFeet) : null,
          lotSize: entryForm.lotSize ? parseFloat(entryForm.lotSize) : null,
          yearBuilt: entryForm.yearBuilt ? parseInt(entryForm.yearBuilt) : null,
        }),
      });
      setShowEntryForm(false);
      fetchListings();
    } catch (e) { console.error(e); }
  };

  const submitOffer = async () => {
    if (!selected) return;
    try {
      await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...offerForm,
          amount: parseFloat(offerForm.amount),
          listingId: selected.id,
          earnestMoney: offerForm.earnestMoney ? parseFloat(offerForm.earnestMoney) : null,
          closingDate: offerForm.closingDate || null,
          contingencies: offerForm.contingencies ? offerForm.contingencies.split(',').map(s => s.trim()) : null,
          workspaceId: getClientWorkspaceSlug(),
        }),
      });
      setShowOfferForm(false);
      fetchListings();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">MLS Listing Search <span title="Search MLS listings by location, price, and property type. Create offers and track listing activity." aria-label="About this section: Search MLS listings by location, price, and property type. Create offers and track listing activity." className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-500 cursor-help ml-2 align-middle">?</span></h1>
        <button onClick={() => setShowEntryForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + New Listing
        </button>
      </div>

      {/* MLS Search Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="border rounded px-3 py-2 text-sm">
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SOLD">Sold</option>
            <option value="EXPIRED">Expired</option>
          </select>
          <select value={filters.propertyType} onChange={e => setFilters(f => ({ ...f, propertyType: e.target.value }))} className="border rounded px-3 py-2 text-sm">
            <option value="">All Types</option>
            {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
          <input placeholder="Min Price" type="number" value={filters.minPrice} onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Max Price" type="number" value={filters.maxPrice} onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Min Beds" type="number" value={filters.minBeds} onChange={e => setFilters(f => ({ ...f, minBeds: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Min Baths" type="number" value={filters.minBaths} onChange={e => setFilters(f => ({ ...f, minBaths: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
          <input placeholder="Min Sqft" type="number" value={filters.minSqft} onChange={e => setFilters(f => ({ ...f, minSqft: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
          <input placeholder="City" value={filters.city} onChange={e => setFilters(f => ({ ...f, city: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
          <input placeholder="ZIP" value={filters.zip} onChange={e => setFilters(f => ({ ...f, zip: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
          <button onClick={() => setFilters({ status: 'ALL', propertyType: '', minPrice: '', maxPrice: '', minBeds: '', minBaths: '', minSqft: '', city: '', zip: '' })} className="text-sm text-gray-500 hover:text-gray-700">Reset</button>
        </div>
      </div>

      {/* Listing Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading listings...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No listings match your criteria.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map(l => (
            <div key={l.id} onClick={() => setSelected(l)} className="bg-white rounded-lg border hover:shadow-md cursor-pointer transition-shadow">
              <div className="h-48 bg-gray-100 rounded-t-lg flex items-center justify-center text-gray-400">
                {l.photos ? <img src={JSON.parse(l.photos)[0]} alt="" className="h-full w-full object-cover rounded-t-lg" /> : 'No Photo'}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={'px-2 py-1 rounded-full text-xs font-medium ' + (STATUS_COLORS[l.status] || 'bg-gray-100')}>{l.status}</span>
                  {l.mlsNumber && <span className="text-xs text-gray-400">MLS #{l.mlsNumber}</span>}
                </div>
                <div className="text-lg font-semibold text-gray-900">{l.listPrice ? '$' + l.listPrice.toLocaleString() : 'Price TBD'}</div>
                <div className="text-sm text-gray-600">{l.address}</div>
                <div className="text-sm text-gray-500">{l.city}, {l.state} {l.zip}</div>
                <div className="flex gap-3 mt-2 text-xs text-gray-500">
                  {l.bedrooms && <span>{l.bedrooms} bd</span>}
                  {l.bathrooms && <span>{l.bathrooms} ba</span>}
                  {l.squareFeet && <span>{l.squareFeet.toLocaleString()} sqft</span>}
                </div>
                {l.offers.length > 0 && (
                  <div className="mt-2 text-xs text-blue-600">{l.offers.length} offer{l.offers.length > 1 ? 's' : ''}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Listing Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{selected.address}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><span className="text-sm text-gray-500">Price</span><div className="text-lg font-semibold">{selected.listPrice ? '$' + selected.listPrice.toLocaleString() : 'TBD'}</div></div>
              <div><span className="text-sm text-gray-500">Status</span><div><span className={'px-2 py-1 rounded-full text-xs ' + (STATUS_COLORS[selected.status] || '')}>{selected.status}</span></div></div>
              <div><span className="text-sm text-gray-500">Beds / Baths</span><div>{selected.bedrooms || '—'} / {selected.bathrooms || '—'}</div></div>
              <div><span className="text-sm text-gray-500">Square Feet</span><div>{selected.squareFeet?.toLocaleString() || '—'}</div></div>
              <div><span className="text-sm text-gray-500">Year Built</span><div>{selected.yearBuilt || '—'}</div></div>
              <div><span className="text-sm text-gray-500">Property Type</span><div>{selected.propertyType?.replace('_', ' ') || '—'}</div></div>
            </div>
            {selected.description && <div className="mb-4 text-sm text-gray-600">{selected.description}</div>}

            {/* Comps Analysis */}
            <CompsAnalysis address={selected.address} city={selected.city} zip={selected.zip} />

            {/* Offers */}
            {selected.offers.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Offers</h3>
                {selected.offers.map(o => (
                  <div key={o.id} className="flex items-center justify-between border rounded p-2 mb-1">
                    <span>{'$' + o.amount.toLocaleString()}</span>
                    <span className={'px-2 py-1 rounded text-xs ' + (o.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : o.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800')}>{o.status}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => { setShowOfferForm(true); setSelected(null); }} className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Write Offer
            </button>
          </div>
        </div>
      )}

      {/* Listing Entry Form Modal */}
      {showEntryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEntryForm(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">New Listing Entry</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'address', label: 'Address', col: 2 },
                { key: 'city', label: 'City' },
                { key: 'state', label: 'State' },
                { key: 'zip', label: 'ZIP' },
                { key: 'mlsNumber', label: 'MLS #' },
                { key: 'listPrice', label: 'List Price', type: 'number' },
                { key: 'bedrooms', label: 'Bedrooms', type: 'number' },
                { key: 'bathrooms', label: 'Bathrooms', type: 'number' },
                { key: 'squareFeet', label: 'Square Feet', type: 'number' },
                { key: 'lotSize', label: 'Lot Size (acres)', type: 'number' },
                { key: 'yearBuilt', label: 'Year Built', type: 'number' },
              ].map(f => (
                <div key={f.key} className={f.col === 2 ? 'col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    type={f.type || 'text'}
                    value={(entryForm as any)[f.key]}
                    onChange={e => setEntryForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
              ))}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <select value={entryForm.propertyType} onChange={e => setEntryForm(p => ({ ...p, propertyType: e.target.value }))} className="w-full border rounded px-3 py-2 text-sm">
                  {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={entryForm.description} onChange={e => setEntryForm(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full border rounded px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowEntryForm(false)} className="flex-1 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={submitEntry} className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Create Listing</button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Writing Form Modal */}
      {showOfferForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowOfferForm(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Write Offer</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Offer Amount ($)</label>
                <input type="number" value={offerForm.amount} onChange={e => setOfferForm(p => ({ ...p, amount: e.target.value }))} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buyer Contact ID</label>
                <input value={offerForm.buyerContactId} onChange={e => setOfferForm(p => ({ ...p, buyerContactId: e.target.value }))} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Earnest Money ($)</label>
                <input type="number" value={offerForm.earnestMoney} onChange={e => setOfferForm(p => ({ ...p, earnestMoney: e.target.value }))} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Closing Date</label>
                <input type="date" value={offerForm.closingDate} onChange={e => setOfferForm(p => ({ ...p, closingDate: e.target.value }))} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contingencies (comma-separated)</label>
                <input value={offerForm.contingencies} onChange={e => setOfferForm(p => ({ ...p, contingencies: e.target.value }))} placeholder="Inspection, Financing, Appraisal" className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea value={offerForm.notes} onChange={e => setOfferForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full border rounded px-3 py-2" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowOfferForm(false)} className="flex-1 py-2 border rounded-lg text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={submitOffer} className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Submit Offer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
