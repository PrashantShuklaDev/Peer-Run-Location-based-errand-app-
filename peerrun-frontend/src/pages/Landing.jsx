import { Link } from 'react-router-dom';
import ErrandCard from '../components/ErrandCard';
import { useApp } from '../context/AppContext';
import { USE_MOCK } from '../config';

const ago = (m) => new Date(Date.now() - m * 60000).toISOString();
const samples = [
  { title: 'Pick up my printouts', description: 'Two pages waiting at the copy shop near the library.', reward: 30, distanceKm: 0.4, location: { label: 'Library' }, requester: { name: 'Meera' }, createdAt: ago(5), r: '-2deg', shift: '' },
  { title: 'Two chai from the canteen', description: 'Less sugar in one. Bring them while they are hot.', reward: 25, distanceKm: 0.6, location: { label: 'Canteen' }, requester: { name: 'Rohan' }, createdAt: ago(12), r: '1.5deg', shift: 'lg:ml-12' },
  { title: 'Collect a parcel at the gate', description: 'The courier cannot enter campus. Carry it in for me.', reward: 40, distanceKm: 0.9, location: { label: 'Main Gate' }, requester: { name: 'Aarav' }, createdAt: ago(33), r: '-1deg', shift: 'lg:ml-4' },
];

const steps = [
  ['Post it', 'Describe the errand, set a reward and pick where it happens.'],
  ['Get matched', 'People inside your radius see it, closest errands first.'],
  ['Follow along', 'Accepted, in progress, completed. You get a live notice at every step.'],
  ['Rate each other', 'Once it is done, both sides leave a rating.'],
];

const gets = [
  ['Nearby first', 'Errands are searched by distance, so the closest ones show up on top.'],
  ['Live updates', 'The moment someone accepts your errand, you are told. No refreshing.'],
  ['A clear lifecycle', 'Every errand moves through posted, accepted, in progress and completed. Nothing gets lost in a chat thread.'],
  ['Ratings both ways', 'Requesters and runners rate each other, so trust builds over time.'],
];

export default function Landing() {
  const { user } = useApp();
  return (
    <>
      <section className="grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-24">
        <div>
          <h1 className="text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl">
            Small errands, done by people nearby.
          </h1>
          <p className="mt-6 max-w-md text-lg text-sage">
            Need a parcel collected or chai carried across campus? Post it, set a reward, and a neighbour with spare time picks it up.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={user ? '/post' : '/auth?mode=register'} className="btn !px-6 !py-3 !text-base">Post an errand</Link>
            <Link to={user ? '/browse' : '/auth'} className="btn-ghost !px-6 !py-3 !text-base">See what is nearby</Link>
          </div>
        </div>
        <div className="flex flex-col gap-4" aria-hidden="true">
          {samples.map((s, i) => (
            <ErrandCard key={s.title} e={s} className={`drop ${s.shift}`} style={{ '--r': s.r, '--i': i }} />
          ))}
        </div>
      </section>

      <section className="border-t border-line py-16">
        <h2 className="text-3xl font-extrabold md:text-4xl">How an errand moves</h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-4">
          {steps.map(([t, d], i) => (
            <li key={t}>
              <span className="grid h-9 w-9 place-items-center rounded-full border border-gold font-display font-bold text-gold">{i + 1}</span>
              <h3 className="mt-4 text-xl font-bold">{t}</h3>
              <p className="mt-1 text-sage">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-10 border-t border-line py-16 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h2 className="text-3xl font-extrabold md:text-4xl">What you get</h2>
          <dl className="mt-8">
            {gets.map(([t, d]) => (
              <div key={t} className="grid gap-1 border-t border-line py-5 md:grid-cols-3 md:gap-6">
                <dt className="font-display text-lg font-bold">{t}</dt>
                <dd className="text-sage md:col-span-2">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
        <aside className="h-fit rounded-2xl border-2 border-dashed border-line p-6 lg:col-span-2">
          <h3 className="text-xl font-bold">Left out on purpose</h3>
          <ul className="mt-3 space-y-2 text-sage">
            <li>Real payments. Rewards are settled directly, and the requester marks the errand as paid.</li>
            <li>Live GPS tracking of the runner.</li>
            <li>In-app chat between requester and runner.</li>
            <li>A native mobile app. PeerRun runs in the browser.</li>
          </ul>
        </aside>
      </section>

      <footer className="border-t border-line pt-6 text-sm text-sage">
        {USE_MOCK && <p>You are viewing sample data stored in this browser. The backend replaces it in the next step.</p>}
      </footer>
    </>
  );
}
