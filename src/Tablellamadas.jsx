"use client";

import React, { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";

export default function SalesMetricsTable() {
  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? "https://metricas-back.onrender.com/data"
      : "http://localhost:3000/data";

  const [monthlyData, setMonthlyData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [selectedCloser, setSelectedCloser] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        const result = await response.json();

        // Combina todos los lotes en un único array
        const combinedData = result.data.flat();
        console.log("Datos combinados:", combinedData);

        setOriginalData(combinedData);
        const processedData = processMonthlyData(combinedData);
        setMonthlyData(processedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL, selectedCloser, selectedOrigin]);

  const processMonthlyData = (data) => {
    const parseDate = (dateString) => {
      // Extraer día, mes y año del formato "DD/MM/YY HH:mm"
      const [datePart] = dateString.split(" "); // Separar la fecha de la hora
      const [day, month, year] = datePart.split("/").map(Number);

      // Crear un objeto Date con el formato correcto
      return new Date(2000 + year, month - 1, day); // Ajustar el año y el mes (base 0)
    };

    const monthlyStats = data.reduce((acc, item) => {
      if (
        (selectedCloser && item["Closer Actual"] !== selectedCloser) ||
        (selectedOrigin && item.Origen !== selectedOrigin)
      ) {
        return acc;
      }

      const dateString = item["Fecha creada "];
      const date = dateString ? parseDate(dateString) : null;

      if (!date) {
        console.log("Registro con fecha inválida:", item);
        return acc;
      }

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

      acc[key].llamadasAgendadas += item["Llamadas agendadas"] || 0;
      acc[key].llamadasAplicables += item["Llamadas aplicables"] || 0;
      acc[key].llamadasEfectuadas += item["Llamadas efectuadas"] || 0;
      acc[key].llamadasVendidas += item["Ofertas ganadas"] || 0;

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

  const renderMonthlyTables = () => {
    return (
      <div className="flex flex-wrap gap-4">
        {monthlyData.map((data, index) => (
          <div
            key={index}
            className="w-full md:w-1/3 bg-white rounded-lg shadow p-4 text-sm relative"
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500"></div>
              </div>
            )}
            <h3 className="text-lg font-semibold mb-2 text-center">
              {`${data.month} ${data.year}`}
            </h3>
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="p-2 border-b font-medium">Llamadas Agendadas</td>
                  <td className="p-2 border-b text-center">
                    {data.llamadasAgendadas}
                  </td>
                </tr>
                <tr>
                  <td className="p-2 border-b font-medium">Llamadas Aplicables</td>
                  <td className="p-2 border-b text-center">
                    {data.llamadasAplicables}
                  </td>
                  <td className="p-2 border-b text-center">
                    {data.llamadasAplicablesPercent.toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="p-2 border-b font-medium">Llamadas Efectuadas</td>
                  <td className="p-2 border-b text-center">
                    {data.llamadasEfectuadas}
                  </td>
                  <td className="p-2 border-b text-center">
                    {data.llamadasEfectuadasPercent.toFixed(1)}%
                  </td>
                </tr>
                <tr>
                  <td className="p-2 border-b font-medium">Llamadas Vendidas</td>
                  <td className="p-2 border-b text-center">
                    {data.llamadasVendidas}
                  </td>
                  <td className="p-2 border-b text-center">
                    {data.llamadasVendidasPercent.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  };

  const handleSelectChange = (setter) => (event) => {
    const value = event.target.value;
    setter(value);
    setIsLoading(true);
    console.log(`Cambio detectado: ${value}`);
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Métricas Mensuales</h2>
      <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
        <select
          value={selectedCloser || ""}
          onChange={handleSelectChange(setSelectedCloser)}
          className="p-2 border rounded-md"
        >
          <option value="">Todos los Closers</option>
          {[...new Set(originalData.map((item) => item["Closer Actual"]))]
            .filter((closer) => closer && closer !== "Sin closer")
            .map((closer) => (
              <option key={closer} value={closer}>
                {closer}
              </option>
            ))}
        </select>

        <select
          value={selectedOrigin || ""}
          onChange={handleSelectChange(setSelectedOrigin)}
          className="p-2 border rounded-md"
        >
          <option value="">Todos los Orígenes</option>
          {[...new Set(originalData.map((item) => item.Origen))]
            .filter(Boolean)
            .map((origin) => (
              <option key={origin} value={origin}>
                {origin}
              </option>
            ))}
        </select>
      </div>
      {renderMonthlyTables()}
    </div>
  );
}
