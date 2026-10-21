import { Link, NavLink } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const link = ({ isActive }) =>
  `px-3 py-1.5 rounded-full text-sm whitespace-nowrap ${isActive ? 'bg-line text-mist' : 'text-sage hover:text-mist'}`;

export default function Navbar() {
  const { user } = useApp();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ground/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" fill="#ffb320" />
            <circle cx="12" cy="10" r="2.6" fill="#0b2420" />
          </svg>
          PeerRun
        </Link>
        <nav className="ml-auto flex items-center gap-1 overflow-x-auto">
          {user ? (
            <>
              <NavLink to="/browse" className={link}>Browse</NavLink>
              <NavLink to="/post" className={link}>Post errand</NavLink>
              <NavLink to="/my-errands" className={link}>My errands</NavLink>
              <NavLink to="/profile" className={link}>{user.name}</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/auth" className={link}>Log in</NavLink>
              <Link to="/auth?mode=register" className="btn ml-1">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
