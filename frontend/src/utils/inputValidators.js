// Pure validation/sanitization helpers for form fields (Transporter-Pro)
// All filters run on every keystroke to block invalid input in real time.

export const sanitizeName = (v) => (v || '').replace(/[^A-Za-zÀ-ÿ\s\-]/g, '');
export const sanitizePhone = (v) => (v || '').replace(/\D/g, '');
export const sanitizeEmailLocal = (v) =>
  (v || '').toLowerCase().replace(/[^a-z0-9._+-]/g, '');
export const sanitizePlate = (v) =>
  (v || '').toUpperCase().replace(/[^A-Z0-9\-]/g, '');

// Verify a postal address via Nominatim OSM. Returns { ok, lat, lng, displayName } or { ok:false }.
export const verifyAddressOSM = async (address) => {
  if (!address || address.trim().length < 5) {
    return { ok: false, reason: 'too_short' };
  }
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    const resp = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!resp.ok) return { ok: false, reason: 'network' };
    const data = await resp.json();
    if (!Array.isArray(data) || data.length === 0) return { ok: false, reason: 'not_found' };
    const hit = data[0];
    return {
      ok: true,
      lat: parseFloat(hit.lat),
      lng: parseFloat(hit.lon),
      displayName: hit.display_name,
    };
  } catch {
    return { ok: false, reason: 'network' };
  }
};
