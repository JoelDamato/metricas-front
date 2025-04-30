import { useContext, useEffect, useState } from "react";
import { DataContext } from "../components/DataContext";


const DashboardClub = () => {
  const [monthlyRankings, setMonthlyRankings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? "https://metricas-back.onrender.com/club"
      : "http://localhost:30003/club";

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const { metricasData } = useContext(DataContext);

  useEffect(() => {
    if (!metricasData.length) return;
  
    const currentYear = new Date().getFullYear();
  
    const filteredData = metricasData.filter(item => {
      const date = new Date(item["Fecha correspondiente"]);
      return (
        !isNaN(date) &&
        date.getFullYear() === currentYear &&
        parseInt(item["Venta Club"] || 0) === 1
      );
    });
  
    const groupedByMonth = filteredData.reduce((acc, curr) => {
      const date = new Date(curr["Fecha correspondiente"]);
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
  
      if (!acc[monthKey]) {
        acc[monthKey] = { year, monthIndex, entries: [] };
      }
  
      const closer = curr["Responsable"]?.trim() || "Desconocido";
  
      acc[monthKey].entries.push({
        closer,
        cashCollected: parseFloat(curr["Cash collected total"] || 0),
        offersWon: 1,
        facturacion: parseFloat(curr["Precio"] || 0),
      });
  
      return acc;
    }, {});
  
    const rankings = Object.values(groupedByMonth)
      .sort((a, b) => new Date(b.year, b.monthIndex, 1) - new Date(a.year, a.monthIndex, 1))
      .map(({ year, monthIndex, entries }) => {
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
  
        const processedEntries = aggregatedEntries
          .filter(item => item.offersWon > 0)
          .sort((a, b) => b.cashCollected - a.cashCollected);
  
        const totalCashCollected = processedEntries.reduce((sum, item) => sum + item.cashCollected, 0);
        const totalOffersWon = processedEntries.reduce((sum, item) => sum + item.offersWon, 0);
        const totalFacturacion = processedEntries.reduce((sum, item) => sum + item.facturacion, 0);
  
        const porcentajeRecaudado = totalFacturacion > 0
          ? ((totalCashCollected / totalFacturacion) * 100).toFixed(2)
          : "N/A";
  
        return {
          month: `${monthNames[monthIndex]} ${year}`,
          ranking: processedEntries,
          totals: {
            cashCollected: totalCashCollected,
            offersWon: totalOffersWon,
            facturacion: totalFacturacion,
            porcentajeRecaudado,
          },
        };
      });
  
    setMonthlyRankings(rankings);
    setIsLoading(false);
  }, [metricasData]);
  
  return (
    <div className="p-4 bg-gray-300 min-h-screen overflow-x-auto">
      {isLoading ? (
        <div className="flex justify-center items-center min-h-screen">
          <img
            src="https://i.ibb.co/8XqZgCk/2-1.png"
            alt="Cargando..."
            className="w-full sm:w-1/4 animate-pulse"
          />
        </div>
      ) : (
        <>
          <h1 className="p-5 text-4xl md:mb-10 md:text-6xl font-bold text-center text-transparent bg-gradient-to-b from-gray-900 to-gray-600 bg-clip-text drop-shadow-lg tracking-wide">
            Rankings Club
          </h1>
          {monthlyRankings.map(({ month, ranking, totals }) => (
            ranking.length > 0 && (
              <div key={month} className="bg-white shadow-lg rounded-lg p-4 mb-6 overflow-x-auto">
                <h2 className="text-2xl font-semibold mb-4 text-gray-700 text-center">{month}</h2>
                <table className="w-full table-auto text-left text-gray-700 text-sm md:text-base">
                  <thead>
                    <tr className="bg-gray-200">
                      <th></th>
                      <th>Closer</th>
                      <th>Cash Collected</th>
                      <th>%</th>
                      <th>Venta</th>
                      <th>Facturación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((item, index) => {
                      const cashVsFacturacion = item.facturacion > 0
                        ? ((item.cashCollected / item.facturacion) * 100).toFixed(2) + "%"
                        : "N/A";
                      return (
                        <tr key={index} className="hover:bg-gray-100 cursor-pointer">
                          <td className="py-1 px-1 border-b">{index + 1}</td>
                          <td className="py-2 px-4 border-b">{item.closer}</td>
                          <td className="py-2 px-4 border-b">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.cashCollected)}
                          </td>
                          <td className="py-2 px-4 border-b">{cashVsFacturacion}</td>
                          <td className="py-2 px-4 border-b">{item.offersWon}</td>
                          <td className="py-2 px-4 border-b">
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.facturacion)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-300 font-bold">
                      <td className="py-2 px-4 border-t">Total</td>
                      <td className="py-2 px-4 border-t"></td>
                      <td className="py-2 px-4 border-b">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totals.cashCollected)}
                      </td>
                      <td className="py-2 px-4 border-t">{totals.porcentajeRecaudado}%</td>
                      <td className="py-2 px-4 border-t">{totals.offersWon}</td>
                      <td className="py-2 px-4 border-b">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totals.facturacion)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )
          ))}
        </>
      )}
    </div>
  );
};

export default DashboardClub;
