import React, { useState, useEffect } from "react";
import { useData } from "../components/DataContext";

const RankingClub = () => {
  const { clubData } = useData();
  const [monthlyRankings, setMonthlyRankings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [preciosPorMes, setPreciosPorMes] = useState({});
  const [preciosEditados, setPreciosEditados] = useState({});
  const [guardandoMes, setGuardandoMes] = useState(null);

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  // Traer precios por mes desde el backend
  useEffect(() => {
    const fetchPrecios = async () => {
      try {
        const res = await fetch("https://metricas-back.onrender.com/goals?closer=Club");
        const data = await res.json();
        const precios = {};
        data.forEach(item => {
          const precio = item.metricas?.Precio?.base || 0;
          if (item.monthFilter) precios[item.monthFilter] = precio;
        });
        setPreciosPorMes(precios);
      } catch (err) {
        console.error("Error al traer precios club:", err);
      }
    };
    fetchPrecios();
  }, []);

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

      acc[monthKey].entries.push({
        closer,
        cashCollected: parseFloat(curr["Cash collected"] || 0),
      });

      return acc;
    }, {});

    const rankings = Object.entries(groupedByMonth)
      .sort(([a], [b]) => new Date(b) - new Date(a))
      .map(([monthKey, { year, monthIndex, entries }]) => {
        const aggregatedEntries = entries.reduce((acc, curr) => {
          const existing = acc.find(item => item.closer === curr.closer);
          if (existing) {
            existing.cashCollected += curr.cashCollected;
            existing.offersWon += 1;
          } else {
            acc.push({
              ...curr,
              offersWon: 1
            });
          }
          return acc;
        }, []);

        const precio = preciosEditados[monthKey] ?? preciosPorMes[monthKey] ?? 0;

        const processedEntries = aggregatedEntries
          .map(item => ({
            ...item,
            facturacionPesos: item.offersWon * precio
          }))
          .sort((a, b) => b.cashCollected - a.cashCollected);

        const totalCashCollected = processedEntries.reduce((sum, item) => sum + item.cashCollected, 0);
        const totalOffersWon = processedEntries.reduce((sum, item) => sum + item.offersWon, 0);
        const totalFacturacionPesos = processedEntries.reduce((sum, item) => sum + item.facturacionPesos, 0);

        return {
          month: `${monthNames[monthIndex]} ${year}`,
          monthKey,
          ranking: processedEntries,
          totals: {
            cashCollected: totalCashCollected,
            offersWon: totalOffersWon,
            facturacionPesos: totalFacturacionPesos,
          },
        };
      });

    setMonthlyRankings(rankings);
    setIsLoading(false);
  }, [clubData, preciosPorMes, preciosEditados]);

  const handlePrecioChange = (monthKey, value) => {
    setPreciosEditados(prev => ({
      ...prev,
      [monthKey]: Number(value)
    }));
  };

  const guardarPrecio = async (monthKey) => {
    const precio = preciosEditados[monthKey];
    const payload = {
      month: monthKey,
      precio: Number(precio)
    };
  
    console.log("🟨 Enviando payload a update-precio-club:", payload);
    setGuardandoMes(monthKey);
  
    try {
      const res = await fetch("https://metricas-back.onrender.com/update-precio-club", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
  
      if (!res.ok) {
        throw new Error(`Error al guardar precio (Status ${res.status})`);
      }
  
      const data = await res.json();
      console.log("✅ Precio guardado correctamente:", data);
  
      setPreciosPorMes(prev => ({ ...prev, [monthKey]: Number(precio) }));
      setPreciosEditados(prev => {
        const nuevo = { ...prev };
        delete nuevo[monthKey];
        return nuevo;
      });
    } catch (err) {
      console.error("❌ Error en guardarPrecio:", err.message);
    }
  
    setGuardandoMes(null);
  };
  
  


  return (
    <div className="p-4 bg-gray-100 min-h-screen overflow-x-auto">
      <h1 className="p-5 text-4xl font-bold text-center text-transparent bg-gradient-to-b from-gray-900 to-gray-600 bg-clip-text">
        Ranking Club
      </h1>
      {monthlyRankings.map(({ month, monthKey, ranking, totals }) => (
        ranking.length > 0 && (
          <div key={monthKey} className="bg-white shadow-lg rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold mb-2 text-gray-700 text-center">{month}</h2>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-gray-600">💰 Precio Club:</span>
              <input
                type="number"
                value={preciosEditados[monthKey] ?? preciosPorMes[monthKey] ?? ""}
                onChange={(e) => handlePrecioChange(monthKey, e.target.value)}
                className="border px-2 py-1 rounded w-24"
              />
              <button
                onClick={() => guardarPrecio(monthKey)}
                disabled={guardandoMes === monthKey}
                className="text-sm bg-black text-white px-3 py-1 rounded hover:bg-gray-800"
              >
                {guardandoMes === monthKey ? "Guardando..." : "Guardar"}
              </button>
            </div>

            <table className="w-full table-auto text-left text-gray-700 text-sm">
              <thead>
                <tr className="bg-gray-200">
                  <th>#</th>
                  <th>Closer</th>
                  <th>Ventas</th>
                  <th>Facturación ARS</th>
                  <th>Cash Collected</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="py-1 px-2 border-b">{index + 1}</td>
                    <td className="py-1 px-2 border-b">{item.closer}</td>
                    <td className="py-1 px-2 border-b">{item.offersWon}</td>
                    <td className="py-1 px-2 border-b">
                      {new Intl.NumberFormat("es-AR", {
                        style: "currency",
                        currency: "ARS",
                      }).format(item.facturacionPesos)}
                    </td>
                    <td className="py-1 px-2 border-b">
                      {new Intl.NumberFormat("es-AR", {
                        style: "currency",
                        currency: "ARS",
                      }).format(item.cashCollected)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-300 font-bold">
                  <td>Total</td>
                  <td></td>
                  <td>{totals.offersWon}</td>
                  <td>
                    {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    }).format(totals.facturacionPesos)}
                  </td>
                  <td>
                    {new Intl.NumberFormat("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    }).format(totals.cashCollected)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      ))}
    </div>
  );
};

export default RankingClub;
