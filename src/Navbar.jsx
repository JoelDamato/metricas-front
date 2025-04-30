import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => setIsDropdownOpen((prev) => !prev);

  return (
    <nav className="bg-black text-white h-[14vh] shadow-md">
      <div className="container mx-auto flex justify-between items-center h-full px-6">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold hover:text-[#E0C040] transition">
          Matias Randazzo
        </Link>

        {/* Menú hamburguesa */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={toggleDropdown}
            aria-expanded={isDropdownOpen}
            className="text-white focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
              className="w-8 h-8 md:w-10 md:h-10"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {isDropdownOpen && (
            <ul className="absolute top-full right-0 w-48 bg-black/90 shadow-lg rounded-b-md overflow-hidden z-50 transition-transform duration-300 ease-in-out transform">
              <li>
                <Link
                  onClick={toggleDropdown}
                  to="/"
                  className="block px-4 py-2 hover:bg-[#E0C040] transition text-white"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  onClick={toggleDropdown}
                  to="/llamadas"
                  className="block px-4 py-2 hover:bg-[#E0C040] transition text-white"
                >
                  Llamadas
                </Link>
              </li>
              <li>
                <Link
                  onClick={toggleDropdown}
                  to="/ranking"
                  className="block px-4 py-2 hover:bg-[#E0C040] transition text-white"
                >
                  Ranking
                </Link>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
