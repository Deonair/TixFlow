// In component: Navbar (React.FC)
import React from 'react'

const Navbar: React.FC = () => {
  return (
    <div className="bg-base-200 px-4 pt-4">
      <div className="navbar navbar-floating bg-base-100 shadow-lg mx-auto max-w-5xl text-black bg-[#009FE3] overflow-hidden rounded-lg">
        <div className="navbar-start">
          <a className="navbar-item font-semibold text-gray-900" href="#">
            TixFlow
          </a>
        </div>
        <div className="navbar-end">
          <a className="navbar-item text-black hover:font-bold" href="#">Home</a>
          <a className="navbar-item text-black hover:font-bold" href="#">Events</a>
          {/* Ripple UI avatar + dropdown (alleen Account settings) */}
          <div className="avatar avatar-ring avatar-md">
            <div className="dropdown-container">
              <div className="dropdown">
                <label className="btn btn-ghost flex cursor-pointer px-0 text-white hover:font-bold" tabIndex={0}>
                  <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="avatar" />
                </label>
                <div className="dropdown-menu dropdown-menu-bottom-left bg-white">
                  <a className="dropdown-item text-sm text-black hover:font-bold" tabIndex={-1}>
                    Account settings
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default Navbar
