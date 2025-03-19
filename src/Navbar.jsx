import React, { useState, useRef, useEffect } from "react";

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // 🔹 Cerrar el menú al hacer clic fuera
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
        {/* 🔹 Logo */}
        <a href="/dashboard" className="text-xl font-bold hover:text-[#00a79d] transition">
          Matias Randazzo
        </a>

        {/* 🔹 Botón menú hamburguesa (solo en móviles) */}
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

          {/* 🔹 Menú desplegable */}
          {isDropdownOpen && (
            <ul
              className={`absolute top-full right-0 w-48 bg-black/90 shadow-lg rounded-b-md overflow-hidden z-50 transition-transform duration-300 ease-in-out transform
              ${isDropdownOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"}`}
            >
              <li>
                  <a
                    onClick={toggleDropdown}
                    href="/"
                    className="block px-4 py-2 hover:bg-[#E0C040] transition text-white"
                  >
                    Dashboard
                  </a>
                </li>
                <li>
                  <a
                    onClick={toggleDropdown}
                    href="/llamadas"
                    className="block px-4 py-2 hover:bg-[#E0C040] transition text-white"
                  >
                    Llamadas
                  </a>
                </li>
                <li>
                  <a
                    onClick={toggleDropdown}
                    href="/ranking"
                    className="block px-4 py-2 hover:bg-[#E0C040] transition text-white"
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
