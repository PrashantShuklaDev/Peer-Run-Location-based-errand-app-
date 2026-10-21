import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Browse from './pages/Browse';
import PostErrand from './pages/PostErrand';
import MyErrands from './pages/MyErrands';
import Profile from './pages/Profile';
import { useApp } from './context/AppContext';

function Protected({ children }) {
  const { user, booting } = useApp();
  if (booting) return <p className="p-10 text-sage">Loading…</p>;
  return user ? children : <Navigate to="/auth" replace />;
}

const kindBar = { live: 'bg-gold', error: 'bg-chili', ok: 'bg-sage', info: 'bg-line' };

function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="panel flex overflow-hidden text-sm shadow-xl">
          <span className={`w-1.5 shrink-0 ${kindBar[t.kind]}`} />
          <p className="p-3">{t.msg}</p>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-20">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/browse" element={<Protected><Browse /></Protected>} />
          <Route path="/post" element={<Protected><PostErrand /></Protected>} />
          <Route path="/my-errands" element={<Protected><MyErrands /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toasts />
    </>
  );
}
