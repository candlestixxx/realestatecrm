/**
 * Address geocoding via OpenStreetMap Nominatim (no API key required).
 *
 * Why: the Lead Map plots leads by coordinates, but the CRM schema had no
 * coordinate fields and no geocoding step — the map could never show
 * anything. This module resolves an address to lat/lng at write time so
 * leads appear on the map immediately.
 *
 * Nominatim usage policy: max 1 request/second, custom User-Agent. Callers
 * should geocode on create/update only (never in loops without throttling).
 */

export interface GeoResult {
  latitude: number;
  longitude: number;
}

export async function geocodeAddress(address: string): Promise<GeoResult | null> {
  const q = address?.trim();
  if (!q) return null;

  try {
    const params = new URLSearchParams({
      q,
      format: 'json',
      limit: '1',
      countrycodes: 'us', // real-estate CRM is US-market
    });

    const resp = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: {
        // Nominatim requires an identifying User-Agent per its usage policy.
        'User-Agent': 'ExcelLegacyCRM/1.0 (geocoding; contact: ops@excellegacyrealtygroup.site)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!resp.ok) {
      console.warn('[geocode] Nominatim HTTP', resp.status, 'for', q);
      return null;
    }

    const results = await resp.json();
    const hit = Array.isArray(results) ? results[0] : null;
    if (!hit?.lat || !hit?.lon) return null;

    return {
      latitude: parseFloat(hit.lat),
      longitude: parseFloat(hit.lon),
    };
  } catch (e: any) {
    // Geocoding is best-effort — a failure must never block lead creation.
    console.warn('[geocode] failed for', q, e?.message);
    return null;
  }
}
