import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import ErrandCard from '../components/ErrandCard';
import LocationPicker from '../components/LocationPicker';
import { useApp } from '../context/AppContext';
import { errMsg } from '../utils';

export default function Browse() {
  const { loc, setLoc, tick, toast } = useApp();
  const [radius, setRadius] = useState(3);
  const [list, setList] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    api.getNearby({ lat: loc.lat, lng: loc.lng, radius })
      .then(setList)
      .catch((e) => toast(errMsg(e), 'error'));
  }, [loc, radius, tick, toast]);

  const accept = async (id) => {
    setBusyId(id);
    try {
      await api.acceptErrand(id);
      toast('Errand accepted. Update its status from My errands.', 'ok');
      nav('/my-errands?tab=running');
    } catch (e) {
      toast(errMsg(e), 'error');
      setBusyId(null);
    }
  };

  return (
    <div className="pt-10">
      <h1 className="text-4xl font-extrabold">Errands near {loc.label}</h1>
      <div className="panel mt-6 space-y-4 p-5">
        <div>
          <p className="mb-2 text-sm text-sage">Where are you? Search, use your location, or click the map.</p>
          <LocationPicker value={loc} onChange={setLoc} markers={list || []} radiusKm={radius} />
        </div>
        <label className="block">
          <span className="mb-2 flex justify-between text-sm text-sage">Search radius <b className="text-mist">{radius} km</b></span>
          <input type="range" min="1" max="10" value={radius} onChange={(e) => setRadius(+e.target.value)}
            className="w-full accent-[#ffb320]" />
        </label>
      </div>

      {list && (
        <p className="mt-6 text-sm text-sage">
          {list.length} {list.length === 1 ? 'errand' : 'errands'} within {radius} km. Errands you posted yourself are not listed here; find them in My errands.
        </p>
      )}

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        {list === null && <p className="text-sage">Looking nearby…</p>}
        {list?.map((e) => (
          <ErrandCard key={e._id} e={e}>
            <button className="btn-dark" disabled={busyId === e._id} onClick={() => accept(e._id)}>
              {busyId === e._id ? 'Accepting…' : 'Accept errand'}
            </button>
          </ErrandCard>
        ))}
      </div>

      {list?.length === 0 && (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-line p-8 text-center">
          <p className="text-lg font-semibold">Nothing within {radius} km.</p>
          <p className="mt-1 text-sage">Widen the radius, or post the first errand in this area.</p>
          <Link to="/post" className="btn mt-4">Post an errand</Link>
        </div>
      )}
    </div>
  );
}
