// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Llamadas from './Llamadas';
import Interacciones from './Interacciones';
import Facturacion from './Facturacion';
import Marketing from './Marketing';
import RankingComponent from './Ranking';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Llamadas />} />
        <Route path="/interacciones" element={<Interacciones />} />
        <Route path="/facturacion" element={<Facturacion />} />
        <Route path="/marketing" element={<Marketing />} />
        <Route path='/ranking' element={<RankingComponent/>} />
      </Routes>
    </Router>
  );
}

export default App;
