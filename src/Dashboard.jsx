import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";

const Dashboard = () => {
  const [monthlyRankings, setMonthlyRankings] = useState([]);
  const [selectedCloser, setSelectedCloser] = useState(null);

  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? "https://metricas-back.onrender.com/data"
      : "http://localhost:3000/data";

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        const result = await response.json();

        if (result && result.data) {
          const data = result.data;
          
          const groupedByMonth = data
            .flat()
            .filter(item => {
              const dateString = item["Fecha correspondiente"];
              const date = new Date(dateString);
              return !isNaN(date) && parseInt(item["Venta Meg"] || 0) !== 0;
            })
            .reduce((acc, curr) => {
              const date = new Date(curr["Fecha correspondiente"]);
              const monthIndex = date.getMonth();
              const year = date.getFullYear();
              const monthKey = `${year}-${monthIndex}`;

              if (!acc[monthKey]) {
                acc[monthKey] = { year, monthIndex, entries: [] };
              }

              acc[monthKey].entries.push({
                closer: curr["Responsable"]?.trim() || "Desconocido",
                cashCollected: parseFloat(curr["Cash collected total"] || 0),
                offersWon: parseInt(curr["Venta Meg"] || 0),
                facturacion: parseFloat(curr["Precio"] || 0),
              });

              return acc;
            }, {});

          const rankings = Object.values(groupedByMonth)
            .sort((a, b) => new Date(b.year, b.monthIndex) - new Date(a.year, a.monthIndex))
            .map(({ year, monthIndex, entries }) => {
              const processedEntries = entries
                .reduce((acc, curr) => {
                  const existing = acc.find(item => item.closer === curr.closer);
                  if (existing) {
                    existing.cashCollected += curr.cashCollected;
                    existing.offersWon += curr.offersWon;
                    existing.facturacion += curr.facturacion;
                  } else {
                    acc.push(curr);
                  }
                  return acc;
                }, [])
                .sort((a, b) => b.cashCollected - a.cashCollected);

              return {
                month: `${monthNames[monthIndex]} ${year}`,
                ranking: processedEntries,
                facturacion: processedEntries.reduce((sum, item) => sum + item.facturacion, 0),
              };
            });

          setMonthlyRankings(rankings);
        }
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      }
    };

    fetchData();
  }, [API_BASE_URL]);

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">Rankings Mensuales de Closers</h1>
      {monthlyRankings.map(({ month, ranking, facturacion }) => (
        ranking.length > 0 && (
          <div key={month} className="bg-white shadow-lg rounded-lg p-4 mb-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700 text-center">{month}</h2>
            <p className="text-lg text-gray-700 font-semibold text-center">Facturación Total: {facturacion.toLocaleString("es-ES", { style: "currency", currency: "USD" })}</p>
            <table className="w-full table-auto text-left text-gray-700">
              <thead>
                <tr className="bg-gray-200">
                  <th className="py-2 px-4">Posición</th>
                  <th className="py-2 px-4">Closer</th>
                  <th className="py-2 px-4">Cash Collected</th>
                  <th className="py-2 px-4">Vendidos</th>
                  <th className="py-2 px-4">Facturación</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-100 cursor-pointer" onClick={() => setSelectedCloser(item)}>
                    <td className="py-2 px-4 border-b">{index + 1}</td>
                    <td className="py-2 px-4 border-b">{item.closer}</td>
                    <td className="py-2 px-4 border-b">{item.cashCollected.toLocaleString("es-ES", { style: "currency", currency: "USD" })}</td>
                    <td className="py-2 px-4 border-b">{item.offersWon}</td>
                    <td className="py-2 px-4 border-b">{item.facturacion.toLocaleString("es-ES", { style: "currency", currency: "USD" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ))}
      {selectedCloser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h2 className="text-2xl font-bold mb-4 text-center">{selectedCloser.closer}</h2>
            <p className="text-lg text-gray-700">Venta Meg: <span className="font-semibold">{selectedCloser.offersWon}</span></p>
            <button
              onClick={() => setSelectedCloser(null)}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md w-full hover:bg-red-600">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
