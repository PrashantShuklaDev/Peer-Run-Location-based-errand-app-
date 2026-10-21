// Centre of the demo map. Change this to your own campus coordinates.
export const CENTER = { lat: 28.6139, lng: 77.209 };
const at = (label, dLat, dLng) => ({ label, lat: CENTER.lat + dLat, lng: CENTER.lng + dLng });

export const PLACES = [
  at('Main Gate', 0, 0),
  at('Library', 0.003, 0.002),
  at('Hostel Block A', -0.004, 0.003),
  at('Canteen', 0.002, -0.003),
  at('Metro Station', 0.012, 0.008),
  at('Market Road', -0.015, -0.01),
];

// Haversine distance in km
export function km(a, b) {
  const R = 6371, rad = (x) => (x * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const fmtDist = (d) => (d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`);

export function timeAgo(iso) {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

export const errMsg = (e) => e?.response?.data?.message || e?.message || 'Something went wrong';
