import { useEffect, useState } from "react";

export default function VentasPorFechaConAgendamiento({ month, closer = "all", origin = "all" }) {
  const [ventasAgrupadas, setVentasAgrupadas] = useState([]);
  const [totalVentasMes, setTotalVentasMes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = "https://metricas-back.onrender.com/metricas";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(API_URL);
        const data = await response.json();

        // Filtrar por closer y origen
        const datosFiltrados = data.filter((item) => {
          const matchesCloser = closer === "all" || item.Responsable === closer;
          const matchesOrigin = origin === "all" || item.Origen === origin;
          return matchesCloser && matchesOrigin;
        });

        // Indexar fecha de agendamiento más antigua por cliente
        const fechaAgendamientoPorCliente = {};
        datosFiltrados.forEach(item => {
          if (item.Agenda === 1) {
            const clienteId = item["Nombre cliente"];
            const fecha = new Date(item["Fecha correspondiente"]);
            if (!fechaAgendamientoPorCliente[clienteId] || fecha < fechaAgendamientoPorCliente[clienteId]) {
              fechaAgendamientoPorCliente[clienteId] = fecha;
            }
          }
        });

        // Filtrar ventas por mes de venta
        const ventasDelMes = datosFiltrados.filter(item => {
          if (item["Venta Meg"] > 0 && item["Fecha correspondiente"]) {
            const fechaVenta = new Date(item["Fecha correspondiente"]);
            const ventaMonth = `${fechaVenta.getFullYear()}-${String(fechaVenta.getMonth() + 1).padStart(2, "0")}`;
            return ventaMonth === month;
          }
          return false;
        });

        setTotalVentasMes(ventasDelMes.length);

        // Agrupar por mes de agendamiento
        const agrupadas = ventasDelMes.reduce((acc, venta) => {
          const clienteId = venta["Nombre cliente"];
          const fechaAgenda = fechaAgendamientoPorCliente[clienteId];
          const mesAgendamiento = fechaAgenda
            ? `${fechaAgenda.getFullYear()}-${String(fechaAgenda.getMonth() + 1).padStart(2, "0")}`
            : "Sin fecha de agendamiento";

          acc[mesAgendamiento] = (acc[mesAgendamiento] || 0) + 1;
          return acc;
        }, {});

        const agrupadasArray = Object.entries(agrupadas).sort(([a], [b]) => {
          if (a === "Sin fecha de agendamiento") return 1;
          if (b === "Sin fecha de agendamiento") return -1;
          return new Date(b) - new Date(a);
        });

        setVentasAgrupadas(agrupadasArray);
      } catch (error) {
        console.error("Error cargando ventas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (month) fetchData();
  }, [month, closer, origin]);

  const formatMonthYear = (monthKey) => {
    if (!monthKey || monthKey === "Sin fecha de agendamiento") return "Sin fecha de agendamiento";
    const [year, month] = monthKey.split("-");
    const meses = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    return `${meses[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="bg-gray-50 p-1 rounded-md border border-gray-200">
      <details className="group" open>
        <summary className="cursor-pointer text-[#4c4c4c] hover:underline flex justify-between items-center">
          <span className="text-md font-semibold">Ventas del mes (según agendamiento)</span>
          <span className="transition-transform group-open:rotate-90">▶</span>
        </summary>

        {isLoading ? (
          <div className="text-sm text-gray-500 px-4 py-2">Cargando datos...</div>
        ) : (
          <>
            <div className="text-sm text-gray-800 px-4 pt-2">
              Total de ventas MEG en el mes: <strong>{totalVentasMes}</strong>
            </div>
            <ul className="mt-2 pl-4 text-gray-700 text-sm list-disc">
              {ventasAgrupadas.map(([mesAgendamiento, cantidad], idx) => (
                <li key={idx}>
                  {formatMonthYear(mesAgendamiento)}: <strong>{cantidad}</strong>
                </li>
              ))}
            </ul>
          </>
        )}
      </details>
    </div>
  );
}
