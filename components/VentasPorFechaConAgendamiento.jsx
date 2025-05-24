import { useEffect, useState } from "react";

export default function VentasConAgendamientoAgrupadas({
  month,
  startDate,
  endDate,
  closer = "all",
  origin = "all",
  rawVentas = []
}) {
  const [ventasAgrupadas, setVentasAgrupadas] = useState([]);
  const [totalVentas, setTotalVentas] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    // 🔍 Filtrar por closer y origen
    const filtrados = rawVentas.filter((item) => {
      const matchCloser = closer === "all" || item.Responsable === closer;
      const matchOrigin = origin === "all" || item.Origen === origin;
      return matchCloser &&
    matchOrigin &&
    item["Venta Meg"] > 0 &&
    item["Venta Club"] === 0 && // 👈 NUEVO FILTRO
    item["Fecha correspondiente"]
    });

    // 🗓️ Filtrar por mes o rango
    let ventas = [];
    if (month) {
      ventas = filtrados.filter((item) => {
        const fecha = new Date(item["Fecha correspondiente"]);
        const ventaMonth = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
        return ventaMonth === month;
      });
    } else if (startDate && endDate) {
      ventas = filtrados.filter((item) => {
        const fecha = new Date(item["Fecha correspondiente"]);
        return fecha >= startDate && fecha <= endDate;
      });
    }

    setTotalVentas(ventas.length);

    // 🧠 Indexar fecha de agendamiento por cliente
    const fechaAgendamientoPorCliente = {};
    rawVentas.forEach(item => {
      if (item.Agenda === 1) {
        const clienteId = item["Nombre cliente"];
        const fecha = new Date(item["Fecha correspondiente"]);
        if (!fechaAgendamientoPorCliente[clienteId] || fecha < fechaAgendamientoPorCliente[clienteId]) {
          fechaAgendamientoPorCliente[clienteId] = fecha;
        }
      }
    });

    // 📊 Agrupar por mes de agendamiento
    const agrupadas = ventas.reduce((acc, venta) => {
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
    setIsLoading(false);
  }, [month, startDate, endDate, closer, origin, rawVentas]);

  const formatMonthYear = (monthKey) => {
    if (!monthKey || monthKey === "Sin fecha de agendamiento") return "Sin fecha de agendamiento";
    const [year, month] = monthKey.split("-");
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return `${meses[parseInt(month) - 1]} ${year}`;
  };

  return (
    <div className="bg-gray-50 p-1 rounded-md border border-gray-200 mt-6">
      <details className="group" open>
        <summary className="cursor-pointer text-[#4c4c4c] hover:underline flex justify-between items-center">
          <span className="text-md font-semibold">
            Ventas {month ? "del mes" : "en rango"} (según agendamiento)
          </span>
          <span className="transition-transform group-open:rotate-90">▶</span>
        </summary>

        {isLoading ? (
          <div className="text-sm text-gray-500 px-4 py-2">Cargando datos...</div>
        ) : (
          <>
            <div className="text-sm text-gray-800 px-4 pt-2">
              Total de ventas MEG: <strong>{totalVentas}</strong>
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
