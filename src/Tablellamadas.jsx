"use client";

import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function SalesMetricsTable() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(null);
  const [comparisonMonth, setComparisonMonth] = useState(null);
  const [pendingDate, setPendingDate] = useState(null);
  const [selectedCloser, setSelectedCloser] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const API_BASE_URL =
      process.env.NODE_ENV === "production"
        ? "https://metricas-back.onrender.com/notion-data"
        : "http://localhost:3000/notion-data";

    const fetchData = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        const data = await response.json();
        setOriginalData(data); // Guarda los datos originales para los filtros
        const processedData = processMonthlyData(data);
        setMonthlyData(processedData);

        // Set current month as default
        const now = new Date();
        const currentMonthData = processedData.find(
          (m) =>
            m.month === now.toLocaleString("es-ES", { month: "long" }) &&
            m.year === now.getFullYear()
        );
        setCurrentMonth(currentMonthData || processedData[0]);
        setComparisonMonth(currentMonthData || processedData[0]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (originalData.length > 0) {
      const filteredData = processMonthlyData(originalData);
      setMonthlyData(filteredData);
      const now = new Date();
      const currentMonthData = filteredData.find(
        (m) =>
          m.month === now.toLocaleString("es-ES", { month: "long" }) &&
          m.year === now.getFullYear()
      );
      setCurrentMonth(currentMonthData || filteredData[0]);
    }
  }, [selectedCloser, selectedOrigin]);

  const processMonthlyData = (data) => {
    const monthlyStats = data.reduce((acc, item) => {
      // Excluir registros con "Closer" vacío o "Sin closer"
      if (!item.Closer || item.Closer.trim() === "" ) {
        return acc;
      }

      // Aplicar filtros de "Closer" y "Origen"
      if (
        (selectedCloser && item.Closer !== selectedCloser) ||
        (selectedOrigin && item.Origen !== selectedOrigin)
      ) {
        return acc;
      }

      const date = new Date(item["Fecha creada"]);
      const month = date.toLocaleString("es-ES", { month: "long" });
      const year = date.getFullYear();
      const key = `${month}-${year}`;

      if (!acc[key]) {
        acc[key] = {
          month,
          year,
          llamadasAgendadas: 0,
          llamadasAplicables: 0,
          llamadasEfectuadas: 0,
          llamadasVendidas: 0,
        };
      }

      acc[key].llamadasAgendadas += item["Llamadas Agendadas"] || 0;
      acc[key].llamadasAplicables += item["Llamadas Aplicables"] || 0;
      acc[key].llamadasEfectuadas += item["Llamadas Efectuadas"] || 0;
      acc[key].llamadasVendidas += item["Ofertas Ganadas MEG"] || 0;


      return acc;
    }, {});

    return Object.values(monthlyStats).map((stats) => ({
      ...stats,
      month: stats.month.charAt(0).toUpperCase() + stats.month.slice(1),
      llamadasAplicablesPercent: stats.llamadasAgendadas
        ? (stats.llamadasAplicables / stats.llamadasAgendadas) * 100
        : 0,
      llamadasEfectuadasPercent: stats.llamadasAplicables
        ? (stats.llamadasEfectuadas / stats.llamadasAplicables) * 100
        : 0,
      llamadasVendidasPercent: stats.llamadasEfectuadas
        ? (stats.llamadasVendidas / stats.llamadasEfectuadas) * 100
        : 0,
    }));
  };

  const handleDateChange = (date) => {
    setPendingDate(date);
  };

  const updateComparison = () => {
    if (!pendingDate) return;

    const selectedMonthData = monthlyData.find(
      (m) =>
        m.month === pendingDate.toLocaleString("es-ES", { month: "long" }) &&
        m.year === pendingDate.getFullYear()
    );

    if (selectedMonthData) {
      setComparisonMonth(selectedMonthData);
      setPendingDate(null);
    } else {
      alert("No hay datos disponibles para el mes seleccionado.");
    }
  };

  const renderMonthColumn = (data, title) => {
    return (
      <div className="w-full md:w-1/3 p-2">
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
        </div>
        {data ? (
          <table className="w-full bg-white rounded-lg shadow text-sm">
            <tbody>
              <tr>
                <td className="p-2 border-b font-medium">Llamadas Agendadas</td>
                <td className="p-2 border-b text-center bg-cyan-100">
                  {data.llamadasAgendadas}
                </td>
              </tr>
              <tr>
                <td className="p-2 border-b font-medium">Llamadas Aplicables</td>
                <td className="p-2 border-b text-center bg-green-50">
                  {data.llamadasAplicables}
                </td>
                <td className="p-2 border-b text-center bg-green-50">
                  {data.llamadasAplicablesPercent.toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="p-2 border-b font-medium">Llamadas Efectuadas</td>
                <td className="p-2 border-b text-center bg-green-50">
                  {data.llamadasEfectuadas}
                </td>
                <td className="p-2 border-b text-center bg-green-50">
                  {data.llamadasEfectuadasPercent.toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="p-2 border-b font-medium">Llamadas Vendidas</td>
                <td className="p-2 border-b text-center bg-green-50">
                  {data.llamadasVendidas}
                </td>
                <td className="p-2 border-b text-center bg-green-50">
                  {data.llamadasVendidasPercent.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">Sin datos disponibles</p>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div className="text-center p-4">Cargando datos...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Comparación de Métricas Mensuales</h2>
      <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
      <select
  value={selectedCloser || ""}
  onChange={(e) => setSelectedCloser(e.target.value)}
  className="p-2 border rounded-md"
>
  <option value="">Todas las llamadas</option>
  {[...new Set(originalData.map((item) => item.Closer))]
    .filter((closer) => closer && closer !== "Sin closer") // Excluir "Sin closer"
    .map((closer) => (
      <option key={closer} value={closer}>
        {closer}
      </option>
    ))}
</select>


        <select
          value={selectedOrigin || ""}
          onChange={(e) => setSelectedOrigin(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="">Todos los Orígenes</option>
          {[...new Set(originalData.map((item) => item.Origen))].map((origin) => (
            <option key={origin} value={origin}>
              {origin}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap md:flex-nowrap gap-4">
        {renderMonthColumn(currentMonth, "Mes actual")}
        {renderMonthColumn(comparisonMonth, "Mes de comparación")}
      </div>
      <div className="mt-6 flex flex-col md:flex-row gap-4 items-center">
        <DatePicker
          selected={pendingDate}
          onChange={handleDateChange}
          dateFormat="MMMM yyyy"
          showMonthYearPicker
          className="p-2 border rounded-md"
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded"
          onClick={updateComparison}
        >
          Actualizar Comparación
        </button>
      </div>
    </div>
  );
}
