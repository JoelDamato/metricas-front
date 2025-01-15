// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Llamadas from './Llamadas';
import Interacciones from './Interacciones';
import Facturacion from './Facturacion';
import Dash from './Dashboard';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
      <Route path='/' element={<Dash/>} />
        <Route path="/llamadas" element={<Llamadas />} />
        <Route path="/interacciones" element={<Interacciones />} />
        <Route path="/facturacion" element={<Facturacion />} />
      </Routes>
    </Router>
  );
}

export default App;
