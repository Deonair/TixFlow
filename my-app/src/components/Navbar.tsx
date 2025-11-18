import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch('/api/users/me');
        if (!cancelled) setAuthed(res.ok);
      } catch {
        if (!cancelled) setAuthed(false);
      }
    };
    check();
    return () => { cancelled = true; };
  }, [location.pathname]);
  const isAdminRoute = location.pathname.startsWith('/admin')
  const isEventsIndex = location.pathname === '/admin/events'
  const isEventNew = location.pathname === '/admin/event/new'
  const eventsActive = isEventsIndex || isEventNew || location.pathname.startsWith('/admin/event/')
  const isUserSettings = location.pathname === '/admin/settings'

  return (
    <header className="flex flex-wrap sm:justify-start sm:flex-nowrap w-full bg-white text-sm py-3">
      <nav className="max-w-[85rem] w-full mx-auto px-4 sm:flex sm:items-center sm:justify-between">
        <Link
          to="/"
          className="flex-none font-semibold text-xl text-black hover:text-blue-600 focus:outline-none focus:text-blue-600"
        >
          TixFlow
        </Link>
        <div className="flex flex-row items-center gap-5 mt-5 sm:justify-end sm:mt-0 sm:ps-5">
          {authed && (
            <>
              <Link
                to="/admin"
                className={`font-medium ${
                  location.pathname === '/admin' || location.pathname === '/admin/dashboard'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                } focus:outline-none`}
              >
                Dashboard
              </Link>
              <div className="relative group">
                <button
                  type="button"
                  className={`font-medium ${
                  eventsActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                  } focus:outline-none`}
                >
                  Events
                </button>
                <div className="absolute right-0 top-full min-w-[12rem] rounded-lg border border-gray-200 bg-white shadow-md hidden group-hover:block group-focus-within:block hover:block z-50">
                  <Link
                    to="/admin/events"
                    className={`block px-4 py-2 text-sm ${
                      isEventsIndex ? 'text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Alle events
                  </Link>
                  <Link
                    to="/admin/event/new"
                    className={`block px-4 py-2 text-sm ${
                      isEventNew ? 'text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Nieuw event
                  </Link>
                </div>
              </div>
            </>
          )}
          {authed ? (
            <div className="relative group">
              <button
                type="button"
                className={`font-medium ${
                  isUserSettings ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'
                } focus:outline-none`}
              >
                Profiel
              </button>
              <div className="absolute right-0 top-full min-w-[12rem] rounded-lg border border-gray-200 bg-white shadow-md hidden group-hover:block group-focus-within:block hover:block z-50">
                <Link
                  to="/admin/settings"
                  className={`block px-4 py-2 text-sm ${
                    isUserSettings ? 'text-blue-600' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  User settings
                </Link>
                <button
                  onClick={async () => {
                    try { await fetch('/api/users/logout', { method: 'POST' }); } catch {}
                    setAuthed(false);
                    navigate('/login');
                  }}
                  className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-center"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <>
              <Link
                to={'/login'}
                className={`font-medium ${
                  location.pathname === '/login'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                } focus:outline-none`}
              >
                Login
              </Link>
              <Link
                to={'/register'}
                className={`font-medium ${
                  location.pathname === '/register'
                    ? 'text-blue-600'
                    : 'text-gray-600 hover:text-blue-600'
                } focus:outline-none`}
              >
                Registreer
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
