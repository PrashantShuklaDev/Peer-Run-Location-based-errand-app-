import { useState } from 'react';

export default function RatingModal({ who, onClose, onSubmit }) {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try { await onSubmit({ score, comment }); } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="panel w-full max-w-sm space-y-4 p-6">
        <h3 className="font-display text-2xl font-bold">Rate {who}</h3>
        <div className="flex gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button type="button" key={n} onClick={() => setScore(n)} aria-label={`${n} stars`}
              className={`text-4xl leading-none ${n <= score ? 'text-gold' : 'text-line'}`}>★</button>
          ))}
        </div>
        <textarea className="field" rows="3" maxLength={200} placeholder="How did it go? (optional)"
          value={comment} onChange={(e) => setComment(e.target.value)} />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button className="btn" disabled={busy}>Submit rating</button>
        </div>
      </form>
    </div>
  );
}
