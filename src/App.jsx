// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Llamadas from './Llamadas';
import Dash from './Dashboard';
import Ranking from './Ranking';
import Comisiones from './Comisiones';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path='/' element={<Dash />} />
        <Route path="/llamadas" element={<Llamadas />} />
        <Route path="/Ranking" element={<Ranking />} />
        <Route path="/Comisiones" element={<Comisiones />} />

      </Routes>
    </Router>
  );
}

export default App;
