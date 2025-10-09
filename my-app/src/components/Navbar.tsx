import React from 'react'

const Navbar: React.FC = () => {
  return (
    <div className="bg-base-200 px-4 pt-4">
      <div className="navbar navbar-rounded bg-base-100 shadow-lg mx-auto max-w-5xl">
        <div className="navbar-start">
          <a className="navbar-item font-semibold text-gray-900" href="#">
            TixFlow
          </a>
        </div>
        <div className="navbar-end gap-2">
          <a className="navbar-item" href="#">Home</a>
          <a className="navbar-item" href="#">Events</a>
          <div className="navbar-item relative group">
            <button className="flex items-center gap-2" aria-haspopup="true" aria-expanded="false">
              <span className="inline-grid place-items-center rounded-full bg-blue-600 text-white w-8 h-8 text-sm font-medium">TF</span>
              <svg className="w-4 h-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 011.08 1.04l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white shadow-lg hidden group-hover:block">
              <ul className="py-2">
                <li>
                  <a href="#" className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                    Account settings
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Navbar