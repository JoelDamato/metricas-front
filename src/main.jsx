import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import FOOTER from './Footer';

import { DataProvider } from '../components/DataContext'; // ✅ ruta correcta
import GlobalLoaderModal from '../components/GlobalLoaderModal'; // ✅ asegurate que exista este archivo

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <DataProvider>
      <GlobalLoaderModal /> {/* 👈 esto mostrará el loader al inicio de toda la app */}
      <App />
      <FOOTER />
    </DataProvider>
  </React.StrictMode>
);
