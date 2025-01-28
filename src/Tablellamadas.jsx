"use client";

import React, { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";

export default function SalesMetricsTable() {
  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? "https://metricas-back.onrender.com/data-mes"
      : "http://localhost:3000/data-mes";

  const [monthlyData, setMonthlyData] = useState([]); // Datos agrupados por mes
  const [availableClosers, setAvailableClosers] = useState([]); // Lista dinámica de Closers
  const [availableOrigins, setAvailableOrigins] = useState([]); // Lista dinámica de Orígenes
  const [selectedCloser, setSelectedCloser] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true); // Mostrar loading antes de realizar la solicitud
        const url = new URL(API_BASE_URL);
        if (selectedCloser) url.searchParams.append("closer", selectedCloser);
        if (selectedOrigin) url.searchParams.append("origin", selectedOrigin);
        console.log("URL generada:", url.toString()); // Verifica la URL
        const response = await fetch(url);
        const result = await response.json();
        console.log("Datos recibidos del backend:", result);
        setMonthlyData(Object.entries(result.data || {})); // Datos agrupados por mes
        setAvailableClosers(result.closers || []); // Valores únicos de Closers
        setAvailableOrigins(result.origins || []); // Valores únicos de Orígenes
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false); // Ocultar loading después de la carga
      }
    };

    fetchData();
  }, [API_BASE_URL, selectedCloser, selectedOrigin]);

  const handleSelectChange = (setter) => (event) => {
    console.log("Valor seleccionado:", event.target.value); // Verifica el valor seleccionado
    setter(event.target.value);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Métricas Mensuales</h2>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
        <select
          value={selectedCloser}
          onChange={handleSelectChange(setSelectedCloser)}
          className="p-2 border rounded-md"
        >
          <option value="">Todos los Closers</option>
          {availableClosers.map((closer) => (
            <option key={closer} value={closer}>
              {closer}
            </option>
          ))}
        </select>

        <select
          value={selectedOrigin}
          onChange={handleSelectChange(setSelectedOrigin)}
          className="p-2 border rounded-md"
        >
          <option value="">Todos los Orígenes</option>
          {availableOrigins.map((origin) => (
            <option key={origin} value={origin}>
              {origin}
            </option>
          ))}
        </select>
      </div>

      {/* Loading spinner */}
      {isLoading ? (
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 border-opacity-75"></div>
        </div>
      ) : (
        // Renderiza las tablas si no está cargando
        <div className="flex flex-wrap gap-4">
          {monthlyData.map(([month, totals], index) => (
            <div
              key={index}
              className="w-full md:w-1/3 bg-white rounded-lg shadow p-4"
            >
              <h3 className="text-lg font-semibold text-center">{month}</h3>
              <table className="w-full">
                <tbody>
                  <tr>
                    <td>Llamadas Agendadas</td>
                    <td>{totals.llamadasAgendadas}</td>
                  </tr>
                  <tr>
                    <td>Llamadas Aplicables</td>
                    <td>{totals.llamadasAplicables}</td>
                  </tr>
                  <tr>
                    <td>Llamadas Efectuadas</td>
                    <td>{totals.llamadasEfectuadas}</td>
                  </tr>
                  <tr>
                    <td>Llamadas Vendidas</td>
                    <td>{totals.llamadasVendidas}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
