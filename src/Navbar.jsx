import React, { useState } from 'react';

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  return (
    <nav className="bg-gray-800 text-white">
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
            Panel de Métricas
          </button>

          {/* Menú desplegable */}
          {isDropdownOpen && (
            <ul className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-md shadow-lg">
                <li>
                <a
                  href="/"
                  className="block px-4 py-2 hover:bg-gray-600 transition duration-300"
                >
                  Dashboard
                </a>
              </li>
              <li>
                <a
                  href="/facturacion"
                  className="block px-4 py-2 hover:bg-gray-600 transition duration-300"
                >
                  Facturación
                </a>
              </li>
              <li>
                <a
                  href="/llamadas"
                  className="block px-4 py-2 hover:bg-gray-600 transition duration-300"
                >
                  Llamadas
                </a>
              </li>
              <li>
                <a
                  href="/Interacciones"
                  className="block px-4 py-2 hover:bg-gray-600 transition duration-300"
                >
                  Interacciones
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
