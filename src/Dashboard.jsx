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
            .flat()
            .filter(item => {
              const dateString = item["Fecha correspondiente"];
              const date = new Date(dateString);
            
              // Asegúrate de que la fecha sea válida
              if (isNaN(date)) {
                console.warn(`Fecha inválida encontrada: ${dateString}`);
                return false;
              }
            
              return true;
            })
            
            .reduce((acc, curr) => {
              const date = new Date(curr["Fecha correspondiente"]);
const monthIndex = date.getMonth(); // Usa getMonth para la zona local si la base de datos usa horarios locales
const year = date.getFullYear(); // Asegúrate de obtener correctamente el año

              const monthKey = `${monthIndex}-${year}`; // Clave única para mes y año
  
              if (curr["Producto Adq"] !== "Club" && parseInt(curr["Venta Meg"] || 0) > 0) {
                if (!acc[monthKey]) {
                  acc[monthKey] = { year, monthIndex, entries: [] };
                }
                acc[monthKey].entries.push({
                  closer: curr["Closer Actual"]?.trim() || null,
                  cashCollected: parseFloat(curr["Cash Collected"] || 0),
                  offersWon: parseInt(curr["Venta Meg"] || 0),
                  facturacion: parseFloat(curr["Precio"] || 0),
                });
              }
              return acc;
            }, {});
  
          // Ordenar y procesar por fecha descendente
          const rankings = Object.values(groupedByMonth)
            .sort((a, b) => new Date(b.year, b.monthIndex) - new Date(a.year, a.monthIndex))
            .map(({ year, monthIndex, entries }) => {
              const processedEntries = entries
                .reduce((acc, curr) => {
                  if (curr.closer) {
                    const existing = acc.find(item => item.closer === curr.closer);
                    if (existing) {
                      existing.cashCollected += curr.cashCollected;
                      existing.offersWon += curr.offersWon;
                      existing.facturacion += curr.facturacion;
                    } else {
                      acc.push(curr);
                    }
                  }
                  return acc;
                }, [])
                .sort((a, b) => b.cashCollected - a.cashCollected);
  
              const totalCashCollected = processedEntries.reduce((sum, item) => sum + item.cashCollected, 0);
  
              const processedWithPercentage = processedEntries.map(item => ({
                ...item,
                percentage: ((item.cashCollected / totalCashCollected) * 100).toFixed(2),
              }));
  
              return {
                month: `${monthNames[monthIndex]} ${year}`, // Mes con año
                ranking: processedWithPercentage,
                facturacion: totalCashCollected,
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
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center">Rankings Mensuales de Closers</h1>
      {monthlyRankings.map(({ month, ranking, facturacion }) => {
  const totalOffersWon = ranking.reduce((sum, item) => sum + item.offersWon, 0);

  return (
    <div
      key={month}
      className="flex flex-col lg:flex-row items-center justify-center bg-white shadow-lg rounded-lg p-6 mb-8"
    >
      <div className="flex-1 text-center lg:text-left">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">{month}</h2>
        <table className="w-full table-auto border-collapse text-left text-gray-700">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-2 px-4 border-b">Posición</th>
              <th className="py-2 px-4 border-b">Closer</th>
              <th className="py-2 px-4 border-b">Cash Collected</th>
              <th className="py-2 px-4 border-b">Porcentaje</th>
              <th className="py-2 px-4 border-b">Vendidos</th>
              <th className="py-2 px-4 border-b">Facturación</th>
            </tr>
          </thead>
          <tbody>
  {ranking.map((item, index) => (
    <tr key={index} className="hover:bg-gray-100">
      <td className="py-2 px-4 border-b">{index + 1}</td>
      <td className="py-2 px-4 border-b">{item.closer}</td>
      <td className="py-2 px-4 border-b">
        {item.cashCollected.toLocaleString("es-ES", {
          style: "currency",
          currency: "USD",
        })}
      </td>
      <td className="py-2 px-4 border-b">{item.percentage}%</td>
      <td className="py-2 px-4 border-b">{item.offersWon}</td>
      <td className="py-2 px-4 border-b">
        {item.facturacion.toLocaleString("es-ES", {
          style: "currency",
          currency: "USD",
        })}
      </td>
    </tr>
  ))}
  {/* Fila de totales */}
  <tr className="font-bold bg-gray-100">
    <td className="py-2 px-4 border-b" colSpan="2">
      Totales
    </td>
    <td className="py-2 px-4 border-b">
      {facturacion.toLocaleString("es-ES", {
        style: "currency",
        currency: "USD",
      })}
    </td>
    <td className="py-2 px-4 border-b"></td>
    <td className="py-2 px-4 border-b">{ranking.reduce((sum, item) => sum + item.offersWon, 0)}</td>
    <td className="py-2 px-4 border-b">
      {ranking.reduce((sum, item) => sum + item.facturacion, 0).toLocaleString("es-ES", {
        style: "currency",
        currency: "USD",
      })}
    </td>
  </tr>
</tbody>

        </table>
      </div>
      <div className="w-72 h-72 mt-6 lg:mt-0 lg:ml-8">
        <Pie
          data={{
            labels: ranking.map((item) => item.closer),
            datasets: [
              {
                data: ranking.map((item) => item.cashCollected),
                backgroundColor: [
                  "#FF6384",
                  "#36A2EB",
                  "#FFCE56",
                  "#4BC0C0",
                  "#9966FF",
                  "#FF9F40",
                ],
                borderWidth: 1,
                borderColor: "#ffffff",
                hoverOffset: 4,
              },
            ],
          }}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: "bottom",
              },
            },
          }}
        />
      </div>
    </div>
  );
})}


    </div>
  );
};

export default Dashboard;
