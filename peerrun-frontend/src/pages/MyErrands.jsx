import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import ErrandCard from '../components/ErrandCard';
import RatingModal from '../components/RatingModal';
import { useApp } from '../context/AppContext';
import { errMsg } from '../utils';

export default function MyErrands() {
  const { tick, refresh, toast } = useApp();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'running' ? 'running' : 'posted';
  const [data, setData] = useState(null);
  const [rating, setRating] = useState(null); // { id, who }

  useEffect(() => {
    api.getMyErrands().then(setData).catch((e) => toast(errMsg(e), 'error'));
  }, [tick, toast]);

  const run = async (fn, ok) => {
    try { await fn(); toast(ok, 'ok'); refresh(); } catch (e) { toast(errMsg(e), 'error'); }
  };

  const submitRating = async (body) => {
    try {
      await api.rateErrand(rating.id, body);
      toast('Rating submitted. Thanks.', 'ok');
      setRating(null); refresh();
    } catch (e) { toast(errMsg(e), 'error'); }
  };

  const list = data?.[tab];

  const actionsFor = (e) => {
    const rate = (who) => !e.rated && (
      <button className="btn-outline-dark" onClick={() => setRating({ id: e._id, who })}>Rate {who}</button>
    );
    if (tab === 'posted') {
      if (e.status === 'posted') return <p className="text-sm text-ink/60">Waiting for someone nearby to accept.</p>;
      if (e.status !== 'completed') return <p className="text-sm text-ink/60">{e.runner.name} is on it.</p>;
      return (
        <>
          {e.paid
            ? <span className="text-sm font-semibold">Paid</span>
            : <button className="btn-dark" onClick={() => run(() => api.markPaid(e._id), 'Marked as paid.')}>Mark as paid</button>}
          {rate(e.runner.name)}
        </>
      );
    }
    if (e.status === 'accepted') return <button className="btn-dark" onClick={() => run(() => api.updateStatus(e._id, 'in-progress'), 'Errand started.')}>Start errand</button>;
    if (e.status === 'in-progress') return <button className="btn-dark" onClick={() => run(() => api.updateStatus(e._id, 'completed'), 'Errand completed.')}>Mark completed</button>;
    return (
      <>
        <span className="text-sm text-ink/60">{e.paid ? 'Paid by requester' : 'Waiting for the requester to pay'}</span>
        {rate(e.requester.name)}
      </>
    );
  };

  return (
    <div className="pt-10">
      <h1 className="text-4xl font-extrabold">My errands</h1>
      <div className="mt-6 flex gap-6 border-b border-line">
        {[['posted', 'Posted by me'], ['running', 'Running for others']].map(([k, label]) => (
          <button key={k} onClick={() => setParams(k === 'posted' ? {} : { tab: k })}
            className={`-mb-px border-b-2 pb-3 font-semibold ${tab === k ? 'border-gold text-mist' : 'border-transparent text-sage hover:text-mist'}`}>
            {label} {data && <span className="text-sage">({data[k].length})</span>}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {!data && <p className="text-sage">Loading…</p>}
        {list?.map((e) => <ErrandCard key={e._id} e={e} showStepper>{actionsFor(e)}</ErrandCard>)}
      </div>

      {list?.length === 0 && (
        <div className="mt-8 rounded-2xl border-2 border-dashed border-line p-8 text-center">
          <p className="text-lg font-semibold">{tab === 'posted' ? 'You have not posted an errand yet.' : 'You are not running any errands.'}</p>
          <Link to={tab === 'posted' ? '/post' : '/browse'} className="btn mt-4">{tab === 'posted' ? 'Post an errand' : 'Browse nearby errands'}</Link>
        </div>
      )}

      {rating && <RatingModal who={rating.who} onClose={() => setRating(null)} onSubmit={submitRating} />}
    </div>
  );
}
