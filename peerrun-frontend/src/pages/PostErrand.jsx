import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import LocationPicker from '../components/LocationPicker';
import { useApp } from '../context/AppContext';
import { USE_MOCK } from '../config';
import { errMsg } from '../utils';

export default function PostErrand() {
  const { loc, toast } = useApp();
  const [form, setForm] = useState({ title: '', description: '', reward: '' });
  const [place, setPlace] = useState(loc);
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createErrand({
        ...form,
        reward: Number(form.reward),
        location: { type: 'Point', coordinates: [place.lng, place.lat], label: place.label.trim() || 'Pinned location' },
      });
      toast('Errand posted. You will be told the moment someone accepts it.', 'ok');
      nav('/my-errands');
    } catch (err) {
      toast(errMsg(err), 'error');
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl pt-10">
      <h1 className="text-4xl font-extrabold">Post an errand</h1>
      <p className="mt-2 text-sage">Say what needs doing, where, and what it is worth.</p>
      <form onSubmit={submit} className="panel mt-8 space-y-5 p-6">
        <label className="block text-sm">What needs doing?
          <input className="field mt-1" required maxLength={80} placeholder="Pick up my printouts" value={form.title} onChange={set('title')} />
        </label>
        <label className="block text-sm">Details
          <textarea className="field mt-1" required rows="3" maxLength={300}
            placeholder="Where to collect it, what to bring back, anything the runner should know."
            value={form.description} onChange={set('description')} />
        </label>
        <label className="block text-sm">Reward in ₹
          <input className="field mt-1" type="number" required min="5" max="5000" placeholder="30" value={form.reward} onChange={set('reward')} />
        </label>
        <div className="text-sm">
          <p className="mb-1">Where does the runner need to go? Search, use your location, or click the map.</p>
          <LocationPicker value={place} onChange={setPlace} nameField />
        </div>
        <button className="btn w-full" disabled={busy}>{busy ? 'Posting…' : 'Post errand'}</button>
        {USE_MOCK && <p className="text-xs text-sage">Sample mode: a sample runner accepts your errand after a few seconds so you can watch the live updates.</p>}
      </form>
    </div>
  );
}
