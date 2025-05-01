import React, { useState } from "react";

export default function ImportarButton() {
  const [estado, setEstado] = useState("idle"); // idle | cargando | ok | error
  const [mensaje, setMensaje] = useState("");

  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? "https://metricas-back.onrender.com"
      : "http://localhost:30003";

  const importar = async () => {
    setEstado("cargando");
    setMensaje("Importando datos...");

    try {
      const res1 = await fetch(`${API_BASE_URL}/importar-metricascliente`);
      const data1 = await res1.json();

      const res2 = await fetch(`${API_BASE_URL}/importar-metricasdata`);
      const data2 = await res2.json();

      const total = (data1.total || 0) + (data2.total || 0);
      setEstado("ok");
      setMensaje(`✅ Importación completada. Total registros: ${total}`);
    } catch (err) {
      setEstado("error");
      setMensaje("❌ Error al importar datos");
    }

    setTimeout(() => {
      setEstado("idle");
      setMensaje("");
    }, 4000); // reinicia el estado luego de 4 segundos
  };

  return (
    <div className="flex flex-col items-center justify-center py-6">
      {estado === "idle" && (
        <button
          onClick={importar}
        className="flex items-center gap-2 px-6 py-2 rounded-full bg-black text-black border border-black shadow-md hover:bg-black hover:text-white transition-all duration-300"
          >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.014 4.356v4.99"
            />
          </svg>
          <span className="font-medium text-base">Actualizar</span>
        </button>
      )}

      {estado === "cargando" && (
<p   className="flex items-center gap-2 px-6 py-2 rounded-full bg-black text-black border border-black shadow-md hover:bg-black hover:text-white transition-all duration-300"
>
          Importando datos...
        </p>
      )}

      {estado === "ok" && (
        <p   className="flex items-center gap-2 px-6 py-2 rounded-full bg-black text-black border border-black shadow-md hover:bg-black hover:text-white transition-all duration-300"
        >{mensaje}</p>
      )}

      {estado === "error" && (
        <p   className="flex items-center gap-2 px-6 py-2 rounded-full bg-black text-black border border-black shadow-md hover:bg-black hover:text-white transition-all duration-300"
        >{mensaje}</p>
      )}
    </div>
  );
}
