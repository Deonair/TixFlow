import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

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
          <Link
            to="/admin/events"
            className={`font-medium ${
              location.pathname === '/admin/events'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            } focus:outline-none`}
          >
            Events
          </Link>
          <Link
            to="/admin/event/new"
            className={`font-medium ${
              location.pathname === '/admin/event/new'
                ? 'text-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            } focus:outline-none`}
          >
            Nieuw Event
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
