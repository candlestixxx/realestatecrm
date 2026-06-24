'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createSearchAlertAction, deleteSearchAlertAction } from '@/lib/actions/alert';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    google: any;
  }
}

type AlertData = {
  id: string;
  leadId: string;
  criteria: string; // JSON
  type: string;
  frequency: string;
  isActive: boolean;
};

export default function SearchAlertsWidget({
  leadId,
  alerts,
}: {
  leadId: string;
  alerts: AlertData[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [mapShape, setMapShape] = useState<{ type: 'circle' | 'polygon' | 'none'; coordinates: any; radius?: number }>({ type: 'none', coordinates: null });
  const [channels, setChannels] = useState({ email: true, sms: false, portal: true });

  const router = useRouter();

  useEffect(() => {
    if (!isOpen) return;

    let checkInterval: any = null;

    const initMap = () => {
      if (typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.drawing) {
        return false;
      }

      const mapContainer = document.getElementById('alert-map');
      if (!mapContainer) return false;

      const defaultCenter = { lat: 42.5801, lng: -83.1302 }; // Troy, MI
      const map = new window.google.maps.Map(mapContainer, {
        center: defaultCenter,
        zoom: 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      const drawingManager = new window.google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: true,
        drawingControlOptions: {
          position: window.google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [
            window.google.maps.drawing.OverlayType.CIRCLE,
            window.google.maps.drawing.OverlayType.POLYGON,
          ],
        },
        circleOptions: {
          fillColor: '#6366f1',
          fillOpacity: 0.15,
          strokeWeight: 2,
          strokeColor: '#6366f1',
          clickable: true,
          editable: true,
          zIndex: 1,
        },
        polygonOptions: {
          fillColor: '#10b981',
          fillOpacity: 0.15,
          strokeWeight: 2,
          strokeColor: '#10b981',
          clickable: true,
          editable: true,
          zIndex: 1,
        },
      });

      drawingManager.setMap(map);

      let currentOverlay: any = null;

      const clearOverlay = () => {
        if (currentOverlay) {
          currentOverlay.setMap(null);
          currentOverlay = null;
        }
        setMapShape({ type: 'none', coordinates: null });
      };

      window.google.maps.event.addListener(drawingManager, 'overlaycomplete', function (event: any) {
        if (currentOverlay) {
          currentOverlay.setMap(null);
        }
        currentOverlay = event.overlay;
        drawingManager.setDrawingMode(null);

        if (event.type === window.google.maps.drawing.OverlayType.CIRCLE) {
          const circle = event.overlay;
          const center = circle.getCenter();
          const radius = circle.getRadius();
          setMapShape({
            type: 'circle',
            coordinates: { lat: center.lat(), lng: center.lng() },
            radius: Math.round(radius),
          });

          window.google.maps.event.addListener(circle, 'radius_changed', () => {
            setMapShape(prev => ({ ...prev, radius: Math.round(circle.getRadius()) }));
          });
          window.google.maps.event.addListener(circle, 'center_changed', () => {
            const newCenter = circle.getCenter();
            setMapShape(prev => ({ ...prev, coordinates: { lat: newCenter.lat(), lng: newCenter.lng() } }));
          });

        } else if (event.type === window.google.maps.drawing.OverlayType.POLYGON) {
          const polygon = event.overlay;
          const getPathCoords = () => {
            const path = polygon.getPath();
            const coords = [];
            for (let i = 0; i < path.getLength(); i++) {
              const xy = path.getAt(i);
              coords.push({ lat: xy.lat(), lng: xy.lng() });
            }
            return coords;
          };

          setMapShape({
            type: 'polygon',
            coordinates: getPathCoords(),
          });

          window.google.maps.event.addListener(polygon.getPath(), 'set_at', () => {
            setMapShape(prev => ({ ...prev, coordinates: getPathCoords() }));
          });
          window.google.maps.event.addListener(polygon.getPath(), 'insert_at', () => {
            setMapShape(prev => ({ ...prev, coordinates: getPathCoords() }));
          });
        }
      });

      const clearBtn = document.getElementById('clear-draw-btn');
      if (clearBtn) {
        clearBtn.onclick = clearOverlay;
      }

      return true;
    };

    if (!initMap()) {
      checkInterval = setInterval(() => {
        if (initMap()) {
          clearInterval(checkInterval);
        }
      }, 250);
    }

    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    };
  }, [isOpen]);

  async function handleSubmit(formData: FormData) {
    setError(null);
    // Append shapes and notification channels manually to the FormData
    formData.append('shapeType', mapShape.type);
    if (mapShape.coordinates) {
      formData.append('shapeCoordinates', JSON.stringify(mapShape.coordinates));
    }
    if (mapShape.radius) {
      formData.append('circleRadius', String(mapShape.radius));
    }
    formData.append('notifyEmail', String(channels.email));
    formData.append('notifySms', String(channels.sms));
    formData.append('notifyPortal', String(channels.portal));

    const res = await createSearchAlertAction(formData);
    if (res && res.error) {
      setError(res.error);
    } else {
      toast.success('Search alert configured successfully!');
      setIsOpen(false);
      // Reset local states
      setMapShape({ type: 'none', coordinates: null });
      setChannels({ email: true, sms: false, portal: true });
      router.refresh();
    }
  }

  async function handleDelete(alertId: string) {
    setIsDeleting(alertId);
    try {
      const res = await deleteSearchAlertAction(alertId, leadId);
      if (res && res.error) {
        toast.error(res.error);
      } else {
        toast.success('Alert removed.');
        router.refresh();
      }
    } catch (err) {
      toast.error('Failed to delete alert.');
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <div className="bg-background border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold">Automated MLS Search Alerts</h3>
          <p className="text-xs text-muted-foreground">Instantly alert this lead when matching MLS properties hit the market.</p>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="px-3 py-1.5 bg-secondary/15 text-secondary hover:bg-secondary/20 text-xs font-bold rounded-lg border border-secondary/30 transition-colors uppercase tracking-wider"
        >
          + Setup Alert
        </button>
      </div>

      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="p-8 bg-muted/10 border border-dashed border-border rounded-xl text-center text-sm text-muted-foreground">
            No automated searches configured yet. Set up one to notify the client about matches.
          </div>
        ) : (
          alerts.map(alert => {
            let parsedCriteria: { 
              city?: string; 
              minPrice?: number; 
              maxPrice?: number; 
              beds?: number; 
              baths?: number;
              channels?: { email: boolean; sms: boolean; portal: boolean };
              shape?: { type: 'circle' | 'polygon' | 'none'; coordinates: any; radius?: number };
            } = {};
            try {
              parsedCriteria = JSON.parse(alert.criteria);
            } catch (e) {}

            const activeChannels = [];
            if (parsedCriteria.channels?.email) activeChannels.push('Email');
            if (parsedCriteria.channels?.sms) activeChannels.push('Text');
            if (parsedCriteria.channels?.portal) activeChannels.push('Portal');

            return (
              <div key={alert.id} className="p-4 border border-border rounded-xl flex items-center justify-between hover:bg-muted/5 transition-colors">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      📍 {parsedCriteria.city || 'All Cities'}
                      {parsedCriteria.shape?.type && parsedCriteria.shape.type !== 'none' && (
                        <span className="text-xs text-muted-foreground font-medium ml-1.5">
                          ({parsedCriteria.shape.type === 'circle' ? 'Circle boundary' : 'Custom boundary'})
                        </span>
                      )}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[9px] font-bold uppercase tracking-tight">
                      {alert.type}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      ({alert.frequency})
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {parsedCriteria.minPrice || parsedCriteria.maxPrice ? (
                      `Price: $${parsedCriteria.minPrice?.toLocaleString() || '0'} - $${parsedCriteria.maxPrice?.toLocaleString() || 'Any'} • `
                    ) : null}
                    Beds: {parsedCriteria.beds || 'Any'} • Baths: {parsedCriteria.baths || 'Any'}
                  </p>
                  {activeChannels.length > 0 && (
                    <p className="text-[10px] text-primary font-semibold pt-1">
                      📢 Notifications via: {activeChannels.join(', ')}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(alert.id)}
                  disabled={isDeleting === alert.id}
                  className="px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20 disabled:opacity-50"
                >
                  {isDeleting === alert.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            );
          })
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-background rounded-2xl border border-border shadow-2xl p-6 w-full max-w-lg my-8 animate-in zoom-in-95 duration-200 text-left space-y-4">
            <div>
              <h3 className="font-bold text-lg text-foreground">Setup MLS Property Alert</h3>
              <p className="text-xs text-muted-foreground">Identify properties matching these criteria and alert the lead using preferred channels.</p>
            </div>
            
            {error && <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg">{error}</div>}
            
            <form action={handleSubmit} className="space-y-4">
              <input type="hidden" name="leadId" value={leadId} />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Location / City</label>
                  <input required name="city" placeholder="e.g. Troy, MI" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alert Match Intent</label>
                  <select name="type" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="VIEW">View Property Details</option>
                    <option value="SHOWING">Schedule showing alert</option>
                    <option value="OFFER">Draft buy-side offer</option>
                  </select>
                </div>
              </div>

              {/* Map drawing area */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Draw Custom Search Boundary (Optional)</label>
                  {mapShape.type !== 'none' && (
                    <button
                      type="button"
                      id="clear-draw-btn"
                      className="text-[10px] font-bold text-red-500 hover:underline"
                    >
                      Clear boundary
                    </button>
                  )}
                </div>
                <div id="alert-map" className="w-full h-48 bg-muted rounded-lg border border-border overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                    Loading map...
                  </div>
                </div>
                {mapShape.type !== 'none' && (
                  <p className="text-[10px] text-green-500 font-semibold">
                    ✓ Custom boundary defined ({mapShape.type === 'circle' ? `circle: radius ${mapShape.radius}m` : `polygon: ${mapShape.coordinates?.length || 0} points`})
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Min Price ($)</label>
                  <input type="number" name="minPrice" placeholder="e.g. 250000" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Max Price ($)</label>
                  <input type="number" name="maxPrice" placeholder="e.g. 500000" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Beds</label>
                  <select name="beds" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                    <option value="5">5+</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Baths</label>
                  <select name="baths" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="">Any</option>
                    <option value="1">1+</option>
                    <option value="1.5">1.5+</option>
                    <option value="2">2+</option>
                    <option value="2.5">2.5+</option>
                    <option value="3">3+</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Frequency</label>
                  <select name="frequency" className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="INSTANT">Real-time</option>
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                  </select>
                </div>
              </div>

              {/* Channels checkboxes */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">Notification Delivery Channels</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-foreground cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={channels.email} 
                      onChange={e => setChannels(prev => ({ ...prev, email: e.target.checked }))} 
                      className="rounded border-border focus:ring-primary text-primary w-4 h-4 cursor-pointer"
                    />
                    <span>✉️ Email</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-foreground cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={channels.sms} 
                      onChange={e => setChannels(prev => ({ ...prev, sms: e.target.checked }))} 
                      className="rounded border-border focus:ring-primary text-primary w-4 h-4 cursor-pointer"
                    />
                    <span>📱 Text / SMS</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-foreground cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={channels.portal} 
                      onChange={e => setChannels(prev => ({ ...prev, portal: e.target.checked }))} 
                      className="rounded border-border focus:ring-primary text-primary w-4 h-4 cursor-pointer"
                    />
                    <span>💻 Portal Login</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-lg"
                >
                  Save Alert Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
