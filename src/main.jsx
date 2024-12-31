// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Asegúrate de que los estilos estén correctamente importados
import FOOTER from './Footer';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <FOOTER/>
  </React.StrictMode>
);
