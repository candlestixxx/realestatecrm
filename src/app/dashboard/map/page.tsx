'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface MapLead {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
  address?: string;
  phone?: string;
  score?: number;
}

// Simple map without requiring Mapbox token — uses OpenStreetMap tiles
// For production, replace with Mapbox GL (token in NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN)
export default function LeadMapPage() {
  const [leads, setLeads] = useState<MapLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<MapLead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const loadLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads?limit=200');
      const data = await res.json();
      const items = Array.isArray(data) ? data : data.leads || [];
      const withCoords = items
        .filter((l: any) => l.latitude && l.longitude)
        .map((l: any) => ({
          id: l.id,
          name: `${l.contact?.firstName || l.firstName || ''} ${l.contact?.lastName || l.lastName || ''}`.trim(),
          latitude: l.latitude,
          longitude: l.longitude,
          status: l.status || 'NEW',
          address: l.contact?.address || l.propertyAddress || undefined,
          phone: l.contact?.phone || l.phone || undefined,
          score: l.score || 0,
        }));
      setLeads(withCoords);
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const filteredLeads = leads.filter(l =>
    filter === 'all' || l.status.toLowerCase() === filter.toLowerCase()
  );

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'HOT': return '#ef4444';
      case 'ACTIVE': return '#f97316';
      case 'COLD': return '#3b82f6';
      case 'PREFORECLOSURE': return '#a855f7';
      default: return '#6b7280';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lead Map <span title="Visualize lead locations on an interactive map. Cluster markers by proximity and filter by lead status." aria-label="About this section: Visualize lead locations on an interactive map. Cluster markers by proximity and filter by lead status." className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 text-[9px] text-gray-500 cursor-help ml-2 align-middle">?</span></h1>
          <p className="text-sm text-muted-foreground mt-1">
            Geographic view of your leads with status and contact info.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['all', 'hot', 'active', 'cold', 'preforeclosure'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-colors ${
                filter === f ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Area */}
        <div className="lg:col-span-2">
          <div className="bg-background border border-border rounded-xl overflow-hidden">
            {isLoading ? (
              <div className="h-[500px] flex items-center justify-center text-muted-foreground">
                Loading map...
              </div>
            ) : (
              <div className="h-[500px] relative bg-muted/20">
                {/* Simplified SVG map — in production use Mapbox GL or Leaflet */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Grid */}
                  {Array.from({ length: 10 }).map((_, i) => (
                    <g key={i}>
                      <line x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="currentColor" strokeWidth="0.1" className="text-border" />
                      <line x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="currentColor" strokeWidth="0.1" className="text-border" />
                    </g>
                  ))}

                  {/* Lead dots */}
                  {filteredLeads.map(lead => {
                    // Normalize lat/lng to viewBox coordinates (rough Detroit area)
                    const x = ((lead.longitude + 83.5) / 1.5) * 100;
                    const y = ((42.6 - lead.latitude) / 0.8) * 100;
                    const size = lead.score ? 2 + (lead.score / 50) : 2;

                    return (
                      <g key={lead.id} onClick={() => setSelectedLead(lead)} className="cursor-pointer">
                        <circle
                          cx={x}
                          cy={y}
                          r={size}
                          fill={getStatusColor(lead.status)}
                          fillOpacity={selectedLead?.id === lead.id ? 1 : 0.7}
                          stroke={selectedLead?.id === lead.id ? '#000' : 'none'}
                          strokeWidth="0.5"
                        />
                        <title>{lead.name} — {lead.status}</title>
                      </g>
                    );
                  })}
                </svg>

                {/* Legend */}
                <div className="absolute bottom-3 left-3 bg-background/90 border border-border rounded-lg p-2 flex gap-3">
                  {[
                    { label: 'Hot', color: '#ef4444' },
                    { label: 'Active', color: '#f97316' },
                    { label: 'Cold', color: '#3b82f6' },
                    { label: 'Pre-foreclosure', color: '#a855f7' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[10px] text-muted-foreground">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lead Details Panel */}
        <div>
          {selectedLead ? (
            <div className="bg-background border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">{selectedLead.name}</h2>
                  <p className="text-xs text-muted-foreground">{selectedLead.address || 'No address'}</p>
                </div>
                <span className={`text-[9px] px-2 py-1 rounded-full font-bold uppercase ${
                  selectedLead.status === 'HOT' ? 'bg-red-500/15 text-red-500' :
                  selectedLead.status === 'ACTIVE' ? 'bg-orange-500/15 text-orange-500' :
                  'bg-blue-500/15 text-blue-500'
                }`}>
                  {selectedLead.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                {selectedLead.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="text-foreground font-medium">{selectedLead.phone}</span>
                  </div>
                )}
                {selectedLead.score !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Score</span>
                    <span className="text-foreground font-medium">{selectedLead.score}/100</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <a
                  href={`/dashboard/leads/${selectedLead.id}`}
                  className="flex-1 text-center px-3 py-2 bg-secondary text-secondary-foreground text-xs font-bold rounded-lg hover:bg-secondary/90"
                >
                  View Lead
                </a>
                <button
                  onClick={async () => {
                    if (!selectedLead.address) { toast.error('No address on file'); return; }
                    try {
                      const res = await fetch('/api/skip-trace', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ address: selectedLead.address, leadId: selectedLead.id }),
                      });
                      const data = await res.json();
                      if (data.match?.found) {
                        toast.success(`Skip trace found: ${data.match.name || 'contact info'}`);
                      } else {
                        toast('No additional info found', { icon: 'ℹ️' });
                      }
                    } catch {
                      toast.error('Skip trace failed');
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-border text-xs font-bold rounded-lg hover:bg-muted text-foreground"
                >
                  Skip Trace
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-background border border-border rounded-xl p-8 text-center">
              <div className="text-3xl mb-2">🗺️</div>
              <p className="text-sm text-muted-foreground">Click a lead on the map to see details.</p>
              <p className="text-xs text-muted-foreground mt-2">{filteredLeads.length} leads with coordinates</p>
            </div>
          )}

          {/* Lead List */}
          <div className="mt-4 space-y-1 max-h-[300px] overflow-y-auto">
            {filteredLeads.slice(0, 20).map(lead => (
              <div
                key={lead.id}
                onClick={() => setSelectedLead(lead)}
                className={`p-2 rounded-lg cursor-pointer transition-colors ${
                  selectedLead?.id === lead.id ? 'bg-secondary/10 border border-secondary/20' : 'hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: getStatusColor(lead.status) }} />
                  <span className="text-xs font-medium text-foreground truncate">{lead.name}</span>
                  <span className="text-[9px] text-muted-foreground ml-auto">{lead.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
