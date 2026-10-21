// Free OpenStreetMap geocoder (no API key). Fair use: one request per user action, never per keystroke.
const NOMINATIM = 'https://nominatim.openstreetmap.org';
const short = (s) => s.split(',').slice(0, 3).join(',').trim().slice(0, 80); // errand label max is 80 chars

export async function searchPlace(q) {
  try {
    const r = await fetch(`${NOMINATIM}/search?format=jsonv2&limit=5&q=${encodeURIComponent(q)}`);
    if (!r.ok) throw new Error();
    return (await r.json()).map((x) => ({ label: short(x.display_name), lat: Number(x.lat), lng: Number(x.lon) }));
  } catch {
    throw new Error('Place search is not available right now. Click the map to drop a pin instead.');
  }
}

export async function nameFor(lat, lng) {
  try {
    const r = await fetch(`${NOMINATIM}/reverse?format=jsonv2&zoom=17&lat=${lat}&lon=${lng}`);
    const j = await r.json();
    return j.display_name ? short(j.display_name) : 'Dropped pin';
  } catch {
    return 'Dropped pin';
  }
}
