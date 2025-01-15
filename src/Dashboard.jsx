import React, { useState, useEffect } from 'react';
import { Pie } from 'react-chartjs-2';

const Dashboard = () => {
  const [monthlyRankings, setMonthlyRankings] = useState([]);

  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? "https://metricas-back.onrender.com/data"
      : "http://localhost:3000/data";

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        const result = await response.json();

        if (result && result.data) {
          const data = result.data;

          // Procesar los datos por mes
          const groupedByMonth = data
            .flat() // Unir todos los subarrays en un solo array
            .filter(item => item["Fecha creada "]) // Filtrar registros con fecha
            .reduce((acc, curr) => {
              const [day, month] = curr["Fecha creada "].split("/"); // Extraer día y mes
              const monthIndex = parseInt(month, 10) - 1; // Convertir mes a índice
              if (!acc[monthIndex]) {
                acc[monthIndex] = [];
              }
              acc[monthIndex].push({
                closer: curr["Closer Actual"]?.trim() || null,
                cashCollected: parseFloat(curr["Cash Collected"] || 0),
                offersWon: parseInt(curr["Ofertas ganadas"] || 0),
                clubSales: parseInt(curr["Venta Club"] || 0),
              });
              return acc;
            }, {});

          // Ordenar y procesar cada mes
          const rankings = Object.entries(groupedByMonth).map(([monthIndex, entries]) => {
            const processedEntries = entries
              .reduce((acc, curr) => {
                // Agrupar por closer y sumar el cashCollected, ofertas ganadas y ventas club
                if (curr.closer) {
                  const existing = acc.find(item => item.closer === curr.closer);
                  if (existing) {
                    existing.cashCollected += curr.cashCollected;
                    existing.offersWon += curr.offersWon;
                    existing.clubSales += curr.clubSales;
                  } else {
                    acc.push(curr);
                  }
                }
                return acc;
              }, [])
              .sort((a, b) => b.cashCollected - a.cashCollected); // Ordenar por Cash Collected

            const totalCashCollected = processedEntries.reduce((sum, item) => sum + item.cashCollected, 0);

            return { month: monthNames[monthIndex], ranking: processedEntries, totalCashCollected };
          });

          setMonthlyRankings(rankings);
        }
      } catch (error) {
        console.error('Error al obtener los datos:', error);
      }
    };

    fetchData();
  }, [API_BASE_URL]);

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">Rankings Mensuales de Closers</h1>
      {monthlyRankings.map(({ month, ranking, totalCashCollected }) => (
        <div key={month} className="flex flex-col lg:flex-row items-center justify-center bg-white shadow-lg rounded-lg p-6 mb-8">
          <div className="flex-1 text-center lg:text-left">
            <h2 className="text-2xl font-semibold mb-4 text-gray-700">{month}</h2>
            <table className="w-full table-auto border-collapse text-left text-gray-700">
              <thead>
                <tr className="bg-gray-200">
                  <th className="py-2 px-4 border-b">Posición</th>
                  <th className="py-2 px-4 border-b">Closer</th>
                  <th className="py-2 px-4 border-b">Cash Collected</th>
                  <th className="py-2 px-4 border-b">Ofertas Ganadas</th>
                  <th className="py-2 px-4 border-b">Ventas Club</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="py-2 px-4 border-b">{index + 1}</td>
                    <td className="py-2 px-4 border-b">{item.closer}</td>
                    <td className="py-2 px-4 border-b">{item.cashCollected.toLocaleString("es-ES", { style: "currency", currency: "USD" })}</td>
                    <td className="py-2 px-4 border-b">{item.offersWon}</td>
                    <td className="py-2 px-4 border-b">{item.clubSales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="w-72 h-72 mt-6 lg:mt-0 lg:ml-8">
            <Pie
              data={{
                labels: ranking.map(item => item.closer),
                datasets: [
                  {
                    data: ranking.map(item => item.cashCollected),
                    backgroundColor: [
                      '#FF6384',
                      '#36A2EB',
                      '#FFCE56',
                      '#4BC0C0',
                      '#9966FF',
                      '#FF9F40'
                    ],
                    borderWidth: 1,
                    borderColor: '#ffffff',
                    hoverOffset: 4,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
