import React, { useEffect, useState } from "react";
import { useData } from "./DataContext";

const frases = [
  "Coordinando base de datos...",
  "Renderizando métricas...",
  "Sincronizando ventas...",
  "Levantando dashboard...",
  "Verificando datos del CRM...",
];

export default function GlobalLoaderModal() {
  const { loading } = useData();
  const [progress, setProgress] = useState(0);
  const [forceVisible, setForceVisible] = useState(false);
  const [fraseIndex, setFraseIndex] = useState(0);

  // Correr el progreso siempre que loading o forceVisible sea true
  useEffect(() => {
    if (!loading && !forceVisible) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [loading, forceVisible]);

  // Asegurar visibilidad mínima de 10 segundos
  useEffect(() => {
    let timeout;

    if (loading) {
      setForceVisible(true);
      setProgress(0); // reiniciar progreso al iniciar carga

      timeout = setTimeout(() => {
        // si ya no está cargando, cerrar al pasar los 10 segundos
        if (!loading) {
          setProgress(100);
          setTimeout(() => setForceVisible(false), 500); // corta después de mostrar 100%
        }
      }, 10000);
    } else if (forceVisible) {
      setProgress(100); // si deja de cargar antes de los 10s, igual subimos a 100
      timeout = setTimeout(() => {
        setForceVisible(false);
      }, 200); // cerrar 0.5s después para que vea el 100%
    }

    return () => clearTimeout(timeout);
  }, [loading]);

  // Frases rotativas
  useEffect(() => {
    const interval = setInterval(() => {
      setFraseIndex((prev) => (prev + 1) % frases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  if (!loading && !forceVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 shadow-lg flex flex-col items-center gap-4 w-[90%] max-w-sm">
        <img
          src="https://i.ibb.co/8XqZgCk/2-1.png"
          alt="SCALO"
          className="w-1/2 animate-pulse"
        />
        <p className="text-xs text-gray-500 font-medium text-center">
          {frases[fraseIndex]}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-black h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-700 font-medium">
          {Math.min(progress.toFixed(0), 100)}% cargando datos iniciales...
        </p>
      </div>
    </div>
  );
}
