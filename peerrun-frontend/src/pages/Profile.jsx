import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useApp } from '../context/AppContext';
import { errMsg, timeAgo } from '../utils';

const Stars = ({ n }) => <span className="text-gold" aria-label={`${n} out of 5`}>{'★'.repeat(n)}<span className="text-line">{'★'.repeat(5 - n)}</span></span>;

export default function Profile() {
  const { logout, toast, tick } = useApp();
  const [p, setP] = useState(null);
  const nav = useNavigate();

  useEffect(() => {
    api.getProfile().then(setP).catch((e) => toast(errMsg(e), 'error'));
  }, [tick, toast]);

  if (!p) return <p className="pt-10 text-sage">Loading…</p>;
  const { user, stats, reviews } = p;

  return (
    <div className="pt-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold">{user.name}</h1>
          <p className="mt-1 text-sage">{user.email}</p>
        </div>
        <button className="btn-ghost" onClick={() => { logout(); nav('/'); }}>Log out</button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <div className="panel p-5">
          <p className="font-display text-4xl font-extrabold text-gold">{user.avgRating ? `★ ${user.avgRating}` : 'New'}</p>
          <p className="mt-1 text-sm text-sage">{stats.ratingsCount} {stats.ratingsCount === 1 ? 'rating' : 'ratings'}</p>
        </div>
        {[['Errands posted', stats.posted], ['Errands completed', stats.completedRuns], ['Earned', `₹${stats.earned}`]].map(([l, v]) => (
          <div key={l} className="panel p-5">
            <p className="font-display text-4xl font-extrabold">{v}</p>
            <p className="mt-1 text-sm text-sage">{l}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-2xl font-extrabold">Ratings you received</h2>
      {reviews.length === 0 ? (
        <p className="mt-3 text-sage">No ratings yet. They appear here after you complete or post an errand.</p>
      ) : (
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {reviews.map((r) => (
            <li key={r._id} className="panel p-4">
              <div className="flex items-center justify-between"><Stars n={r.score} /><span className="text-xs text-sage">{timeAgo(r.createdAt)}</span></div>
              {r.comment && <p className="mt-2">{r.comment}</p>}
              <p className="mt-2 text-sm text-sage">from {r.fromName}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
