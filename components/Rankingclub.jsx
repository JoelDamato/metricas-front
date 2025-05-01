import { useContext, useEffect, useState } from "react";
import { DataContext } from "../components/DataContext";

const DashboardClub = () => {
  const [monthlyRankings, setMonthlyRankings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { clubData } = useContext(DataContext);

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  useEffect(() => {
    if (!clubData.length) return;
    const currentYear = new Date().getFullYear();

    const filteredData = clubData.filter(item => {
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
      const precioUsd = parseFloat(curr["Precio"] || 0);
      const tc = parseFloat(curr["Tc"] || 0);
      const facturacionPesos = !isNaN(precioUsd) && !isNaN(tc) ? precioUsd * tc : 0;

      acc[monthKey].entries.push({
        closer,
        cashCollected: parseFloat(curr["Cash collected"] || 0),
        offersWon: 1,
        facturacion: precioUsd,
        facturacionPesos,
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
            existing.facturacionPesos += curr.facturacionPesos;
          } else {
            acc.push({
              ...curr,
              facturacionPesos: curr.facturacionPesos || 0,
            });
          }
          return acc;
        }, []);

        const processedEntries = aggregatedEntries
          .filter(item => item.offersWon > 0)
          .map(item => ({
            ...item,
            precioPromedio: item.offersWon > 0 ? item.facturacionPesos / item.offersWon : 0,
          }))
          .sort((a, b) => b.cashCollected - a.cashCollected);

        const totalCashCollected = processedEntries.reduce((sum, item) => sum + item.cashCollected, 0);
        const totalOffersWon = processedEntries.reduce((sum, item) => sum + item.offersWon, 0);
        const totalFacturacion = processedEntries.reduce((sum, item) => sum + item.facturacion, 0);
        const totalFacturacionPesos = processedEntries.reduce((sum, item) => sum + item.facturacionPesos, 0);
        const precioPromedioTotal = totalOffersWon > 0 ? totalFacturacionPesos / totalOffersWon : 0;

        return {
          month: `${monthNames[monthIndex]} ${year}`,
          ranking: processedEntries,
          totals: {
            cashCollected: totalCashCollected,
            offersWon: totalOffersWon,
            facturacion: totalFacturacion,
            facturacionPesos: totalFacturacionPesos,
            precioPromedio: precioPromedioTotal
          },
        };
      });

    setMonthlyRankings(rankings);
    setIsLoading(false);
  }, [clubData]);

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
                      <th>#</th>
                      <th>Closer</th>
                      <th>Ventas</th>
                      <th>Facturación USD</th>
                      <th>Facturación ARS</th>
                      <th>Cash Collected</th>
                      <th>Precio Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-100 cursor-pointer">
                        <td className="py-1 px-2 border-b">{index + 1}</td>
                        <td className="py-2 px-4 border-b">{item.closer}</td>
                        <td className="py-2 px-4 border-b">{item.offersWon}</td>
                        <td className="py-2 px-4 border-b">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.facturacion)}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.facturacionPesos)}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.cashCollected)}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.precioPromedio)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-300 font-bold">
                      <td className="py-2 px-4 border-t">Total</td>
                      <td className="py-2 px-4 border-t"></td>
                      <td className="py-2 px-4 border-t">{totals.offersWon}</td>
                      <td className="py-2 px-4 border-t">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totals.facturacion)}
                      </td>
                      <td className="py-2 px-4 border-t">
                        {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(totals.facturacionPesos)}
                      </td>
                      <td className="py-2 px-4 border-t">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totals.cashCollected)}
                      </td>
                      <td className="py-2 px-4 border-t">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totals.precioPromedio)}
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
