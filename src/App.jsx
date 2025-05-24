import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Llamadas from './Llamadas';
import Dash from './Dashboard';
import Ranking from './Ranking';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path='/' element={<Dash key="dashboard" />} />
        <Route path="/llamadas" element={<Llamadas key="llamadas" />} />
        <Route path="/ranking" element={<Ranking key="ranking" />} />
      </Routes>
    </Router>
  );
}

export default App;
