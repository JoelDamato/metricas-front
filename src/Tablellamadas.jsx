"use client";

import React, { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function SalesMetricsTable() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(null);
  const [comparisonMonth, setComparisonMonth] = useState(null); // Tabla adicional para comparación
  const [pendingDate, setPendingDate] = useState(null); // Fecha seleccionada para modificar la tabla de comparación
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
        setComparisonMonth(currentMonthData || processedData[0]); // Inicializa la comparación con el mes actual
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const processMonthlyData = (data) => {
    const monthlyStats = data.reduce((acc, item) => {
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
      acc[key].llamadasVendidas += item["% Vendidas"] || 0;

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
      setComparisonMonth(selectedMonthData); // Actualiza la tabla de comparación con el nuevo mes
      setPendingDate(null); // Limpia la fecha seleccionada
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
