import { fmtDist, timeAgo } from '../utils';

export const STATUSES = ['posted', 'accepted', 'in-progress', 'completed'];

export function Stepper({ status }) {
  const i = STATUSES.indexOf(status);
  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs" aria-label={`Status: ${status}`}>
      {STATUSES.map((s, n) => (
        <li key={s} className="flex items-center gap-1">
          <span className={`h-2.5 w-2.5 rounded-full border border-ink/30 ${n <= i ? 'bg-gold' : 'bg-transparent'}`} />
          <span className={n <= i ? 'font-semibold' : 'text-ink/45'}>{s}</span>
          {n < STATUSES.length - 1 && <span className="mx-1 h-px w-4 bg-ink/25" />}
        </li>
      ))}
    </ol>
  );
}

const Pin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Zm0-9.4a2.6 2.6 0 1 1 0-5.2 2.6 2.6 0 0 1 0 5.2Z" />
  </svg>
);

export default function ErrandCard({ e, showStepper, className = '', style, children }) {
  return (
    <article className={`chit ${className}`} style={style}>
      <div className="chit-stub">
        <span className="text-xs text-ink/60">Reward</span>
        <strong className="font-display text-3xl leading-none">₹{e.reward}</strong>
        {e.distanceKm != null && (
          <span className="mt-auto pt-3 text-xs font-semibold text-ink/70">{fmtDist(e.distanceKm)} away</span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="font-display text-xl font-bold leading-tight">{e.title}</h3>
          <p className="mt-1 text-sm text-ink/70">{e.description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink/60">
          <span className="inline-flex items-center gap-1"><Pin /> {e.location.label}</span>
          <span>Posted by {e.requester.name}</span>
          <span>{timeAgo(e.createdAt)}</span>
        </div>
        {showStepper && <Stepper status={e.status} />}
        {children && <div className="flex flex-wrap items-center gap-2 pt-1">{children}</div>}
      </div>
    </article>
  );
}
