import { useEffect, useRef, useState } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PLACES } from '../utils';
import { nameFor, searchPlace } from '../geo';

// CSS pins (no image files, so nothing breaks when bundled)
const pin = (cls) => L.divIcon({ className: '', html: `<span class="pin ${cls}"></span>`, iconSize: [22, 22], iconAnchor: [11, 26], popupAnchor: [0, -24] });
const YOU = pin('pin-you');
const ERRAND = pin('pin-errand');

// Moves the map when a place is chosen from search / GPS / quick spots, or when the radius changes.
function View({ at, radiusKm }) {
  const map = useMap();
  useEffect(() => {
    if (radiusKm) map.fitBounds(L.latLng(at.lat, at.lng).toBounds(radiusKm * 2200));
    else map.flyTo([at.lat, at.lng], Math.max(map.getZoom(), 15), { duration: 0.6 });
  }, [at, radiusKm, map]);
  return null;
}

function Clicks({ onPick }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

export default function LocationPicker({ value, onChange, markers = [], radiusKm, height = 300, nameField = false }) {
  const [focus, setFocus] = useState(value);
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');
  const timer = useRef();
  const edited = useRef(false);
  const latest = useRef(value);
  latest.current = value;

  // A ready-made place: quick spot, search result
  const place = (p) => {
    edited.current = false;
    onChange(p);
    setFocus(p);
    setResults([]);
    setMsg('');
  };

  // Map click or GPS: move the pin now, then fetch a readable name a moment later
  const drop = (lat, lng) => {
    edited.current = false;
    onChange({ label: 'Dropped pin', lat, lng });
    setResults([]);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const label = await nameFor(lat, lng);
      const cur = latest.current;
      if (!edited.current && cur.lat === lat && cur.lng === lng) onChange({ lat, lng, label });
    }, 500);
  };

  const search = async () => {
    if (!q.trim()) return;
    setBusy('search'); setMsg('');
    try {
      const r = await searchPlace(q.trim());
      if (!r.length) {
        setResults([]);
        setMsg('No place found. Search works best with a landmark, area or city name (for example "Connaught Place"). For an exact spot, click the map.');
        return;
      }
      edited.current = false;
      onChange(r[0]); // the pin jumps to the best match straight away
      setFocus(r[0]);
      setResults(r.slice(1)); // the rest are alternatives
    } catch (err) {
      setMsg(err.message);
    } finally { setBusy(''); }
  };

  const gps = () => {
    if (!navigator.geolocation) return setMsg('Your browser cannot share location. Search or click the map instead.');
    setBusy('gps'); setMsg('');
    navigator.geolocation.getCurrentPosition(
      (p) => { drop(p.coords.latitude, p.coords.longitude); setFocus({ lat: p.coords.latitude, lng: p.coords.longitude }); setBusy(''); },
      () => { setMsg('Could not get your location. Allow location access, or search or click the map.'); setBusy(''); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      {/* A div, not a <form>: this picker sits inside the Post errand form, and a nested form would also submit the errand */}
      <div className="flex flex-wrap gap-2">
        <input className="field min-w-48 flex-1" value={q} onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } }}
          placeholder="Search a place or address" aria-label="Search a place or address" />
        <button type="button" className="btn-ghost" onClick={search} disabled={busy === 'search'}>
          {busy === 'search' ? 'Searching…' : 'Search'}
        </button>
        <button type="button" className="btn-ghost" onClick={gps} disabled={busy === 'gps'}>
          {busy === 'gps' ? 'Locating…' : 'Use my location'}
        </button>
      </div>

      {msg && <p role="alert" className="text-sm text-chili">{msg}</p>}
      {results.length > 0 && <p className="text-sm text-sage">Not the right one? Other matches:</p>}
      {results.length > 0 && (
        <ul className="panel divide-y divide-line overflow-hidden text-sm">
          {results.map((r, i) => (
            <li key={i}>
              <button type="button" className="w-full px-3 py-2 text-left hover:bg-line" onClick={() => place(r)}>{r.label}</button>
            </li>
          ))}
        </ul>
      )}

      <div className="map-box overflow-hidden rounded-xl border border-line" style={{ height }}>
        <MapContainer center={[value.lat, value.lng]} zoom={15} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer attribution="© OpenStreetMap contributors" url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={19} />
          <Clicks onPick={drop} />
          <View at={focus} radiusKm={radiusKm} />
          {radiusKm && (
            <Circle center={[value.lat, value.lng]} radius={radiusKm * 1000}
              pathOptions={{ color: '#ffb320', weight: 1.5, fillOpacity: 0.06 }} />
          )}
          {markers.map((m) => (
            <Marker key={m._id} position={[m.location.coordinates[1], m.location.coordinates[0]]} icon={ERRAND}>
              <Popup>₹{m.reward} for {m.title}</Popup>
            </Marker>
          ))}
          <Marker position={[value.lat, value.lng]} icon={YOU} />
        </MapContainer>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-sage">Quick spots</span>
        {PLACES.map((p) => (
          <button key={p.label} type="button" onClick={() => place(p)} className="chip">{p.label}</button>
        ))}
      </div>

      {nameField && (
        <label className="block text-sm">Place name (shown to runners)
          <input className="field mt-1" maxLength={80} value={value.label}
            onChange={(e) => { edited.current = true; onChange({ ...value, label: e.target.value }); }} />
          <span className="mt-1 block text-xs text-sage">This is only the name runners see. To move the pin, search above or click the map.</span>
        </label>
      )}
    </div>
  );
}
