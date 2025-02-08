import React, { useState, useEffect } from "react";

const Dashboard = () => {
  const [monthlyRankings, setMonthlyRankings] = useState([]);
  const [selectedCloser, setSelectedCloser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? "https://metricas-back.onrender.com/metricas"
      : "http://localhost:3000/metricas";

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        const result = await response.json();
        // Se asume que el endpoint devuelve un arreglo de documentos
        if (Array.isArray(result)) {
          const data = result;
          
          // Filtrar registros que tengan una fecha válida
          const filteredData = data.filter(item => {
            const dateString = item["Fecha correspondiente"];
            const date = new Date(dateString);
            return !isNaN(date) && parseInt(item["Venta Club"] || 0) !== 1;
          });

          // Agrupar los datos por mes y año basados en "Fecha correspondiente"
          const groupedByMonth = filteredData.reduce((acc, curr) => {
            const date = new Date(curr["Fecha correspondiente"]);
            const monthIndex = date.getMonth();
            const year = date.getFullYear();
            const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

            if (!acc[monthKey]) {
              acc[monthKey] = { year, monthIndex, entries: [] };
            }

            // Obtener el nombre del responsable (o asignar "Desconocido" si falta)
            const closer = curr["Responsable"]?.trim() || "Desconocido";

            // Para cada registro, extraer los valores numéricos (o 0 en caso de faltar)
            acc[monthKey].entries.push({
              closer,
              cashCollected: parseFloat(curr["Cash collected total"] || 0),
              offersWon: parseInt(curr["Venta Meg"] || 0),
              facturacion: parseFloat(curr["Precio"] || 0)
            });

            return acc;
          }, {});

        // Dentro del map que procesa cada mes
const rankings = Object.values(groupedByMonth)
.sort((a, b) => new Date(b.year, b.monthIndex, 1) - new Date(a.year, a.monthIndex, 1))
.map(({ year, monthIndex, entries }) => {
  // Agrupar los registros por responsable (closer)
  const aggregatedEntries = entries.reduce((acc, curr) => {
    const existing = acc.find(item => item.closer === curr.closer);
    if (existing) {
      existing.cashCollected += curr.cashCollected;
      existing.offersWon += curr.offersWon;
      existing.facturacion += curr.facturacion;
    } else {
      acc.push({ ...curr });
    }
    return acc;
  }, []);

  // Filtrar para incluir solo los closers donde Venta Meg (offersWon) sea mayor a 0
  const processedEntries = aggregatedEntries
    .filter(item => item.offersWon > 0)
    .sort((a, b) => b.cashCollected - a.cashCollected);

  // Calcular totales mensuales basados en los closers filtrados
  const totalCashCollected = processedEntries.reduce((sum, item) => sum + item.cashCollected, 0);
  const totalOffersWon = processedEntries.reduce((sum, item) => sum + item.offersWon, 0);
  const totalFacturacion = processedEntries.reduce((sum, item) => sum + item.facturacion, 0);

  return {
    month: `${monthNames[monthIndex]} ${year}`,
    ranking: processedEntries,
    totals: {
      cashCollected: totalCashCollected,
      offersWon: totalOffersWon,
      facturacion: totalFacturacion,
    },
  };
});



          setMonthlyRankings(rankings);
        }
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL]);

  const openModal = (closer) => {
    setSelectedCloser(closer);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCloser(null);
  };

  return (
    <div className="p-4 bg-gray-300 min-h-screen overflow-x-auto">
      {isLoading ? (
        <div className="flex justify-center items-center min-h-screen">
          <img
            src="https://i.ibb.co/8XqZgCk/2-1.png"
            alt="Cargando..."
            className="w-full sm:w-1/4 transition-transform transform hover:scale-110 animate-pulse"
          />
        </div>
      ) : (
        <>
          <h1 className="p-5 text-4xl md:mb-10 md:text-6xl font-bold text-center text-transparent bg-gradient-to-b from-gray-900 to-gray-600 bg-clip-text drop-shadow-lg tracking-wide">
            Rankings Mensuales
          </h1>
          {monthlyRankings.map(({ month, ranking, totals }) => (
            ranking.length > 0 && (
              <div key={month} className="bg-white shadow-lg rounded-lg p-4 mb-6 overflow-x-auto">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700 text-center">{month}</h2>
                <table className="w-full table-auto text-left text-gray-700 text-sm md:text-base">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className=""></th>
                      <th className="text-sm">Closer</th>
                      <th className="py-2 px-4">Cash Collected</th>
                      <th className="py-2 px-4">%</th>
                      <th className="py-2 px-4">Venta</th>
                      <th className="py-2 px-4">Facturación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((item, index) => {
                      const cashVsFacturacion =
                        item.facturacion > 0
                          ? ((item.cashCollected / item.facturacion) * 100).toFixed(2) + "%"
                          : "N/A";
                      return (
                        <tr
                          key={index}
                          className="hover:bg-gray-100 cursor-pointer"
                          onClick={() => openModal(item)}
                        >
                          <td className="py-1 px-1 border-b">{index + 1}</td>
                          <td className="py-2 px-4 border-b">{item.closer}</td>
                          <td className="py-2 px-4 border-b">${item.cashCollected.toFixed(2)}</td>
                          <td className="py-2 px-4 border-b">{cashVsFacturacion}</td>
                          <td className="py-2 px-4 border-b">{item.offersWon}</td>
                          <td className="py-2 px-4 border-b">${item.facturacion.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-300 font-bold">
                      <td className="py-2 px-4 border-t">Total</td>
                      <td className="py-2 px-4 border-t"></td>
                      <td className="py-2 px-4 border-t">${totals.cashCollected.toFixed(2)}</td>
                      <td className="py-2 px-4 border-t"></td>
                      <td className="py-2 px-4 border-t">{totals.offersWon}</td>
                      <td className="py-2 px-4 border-t">${totals.facturacion.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          ))}

          {/* Modal para ver detalles de un closer */}
          {isModalOpen && selectedCloser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-2xl relative">
                <button
                  className="absolute top-2 right-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md font-bold"
                  onClick={closeModal}
                >
                  Cerrar
                </button>
                <h2 className="text-xl font-bold mb-4 text-center">{selectedCloser.closer}</h2>
                <div className="space-y-4">
                  <div>
                    <p>
                      <strong>Cash Collected:</strong>{" "}
                      ${selectedCloser.cashCollected.toFixed(2)}
                    </p>
                    <p>
                      <strong>Ventas:</strong> {selectedCloser.offersWon}
                    </p>
                    <p>
                      <strong>Facturación:</strong>{" "}
                      ${selectedCloser.facturacion.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
