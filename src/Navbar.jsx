import React, { useState } from 'react';

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  return (
    <nav className="bg-black text-white">
      <div className="container mx-auto flex justify-between items-center py-4 px-6">
        {/* Logo */}
        <div className="text-2xl font-bold hover:text-blue-400">
          Matias Randazzo
        </div>

        {/* Botón desplegable */}
        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="text-2xl font-bold hover:text-blue-400 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>

          {/* Menú desplegable */}
          {isDropdownOpen && (
            <ul
              className={`absolute top-full right-0 w-full bg-black/90 shadow-lg z-50 
                transition-transform duration-300 ease-in-out transform 
                ${
                  isDropdownOpen
                    ? 'translate-y-0 opacity-100'
                    : '-translate-y-2 opacity-0'
                }
                md:w-48 md:right-0 md:top-12`}
            >
              <li>
                <a
                  onClick={toggleDropdown}
                  href="/"
                  className="block px-4 py-2 hover:bg-gray-600 transition duration-300"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a
                  onClick={toggleDropdown}
                  href="/llamadas"
                  className="block px-4 py-2 hover:bg-gray-600 transition duration-300"
                >
                  Llamadas
                </a>
              </li>
              <li>
                <a
                  onClick={toggleDropdown}
                  href="/ranking"
                  className="block px-4 py-2 hover:bg-gray-600 transition duration-300"
                >
                  Ranking
                </a>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
