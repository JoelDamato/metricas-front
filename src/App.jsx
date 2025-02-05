// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Llamadas from './Llamadas';
import Dash from './Dashboard';

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
      <Route path='/' element={<Dash/>} />
        <Route path="/llamadas" element={<Llamadas />} />
</Routes>
    </Router>
  );
}

export default App;
