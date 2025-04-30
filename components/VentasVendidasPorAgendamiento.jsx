import { useEffect, useState } from "react";

export default function VentasPorMesDeAgendamiento({
  month,
  closer = "all",
  origin = "all",
  rawVentas = []
}) {
  const [totalVentas, setTotalVentas] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    // 🔍 Filtro por closer y origin
    const dataFiltrada = rawVentas.filter((item) => {
      const matchCloser = closer === "all" || item.Responsable === closer;
      const matchOrigin = origin === "all" || item.Origen === origin;
      return matchCloser && matchOrigin;
    });

    // 📌 Mapear agendamiento más antiguo por cliente
    const fechaAgendamientoPorCliente = {};
    dataFiltrada.forEach(item => {
      if (item.Agenda === 1 && item["Fecha correspondiente"]) {
        const clienteId = item["Nombre cliente"];
        const fechaAgenda = new Date(item["Fecha correspondiente"]);
        if (!fechaAgendamientoPorCliente[clienteId] || fechaAgenda < fechaAgendamientoPorCliente[clienteId]) {
          fechaAgendamientoPorCliente[clienteId] = fechaAgenda;
        }
      }
    });

    // ✅ Filtrar ventas MEG válidas
    const ventasMeg = dataFiltrada.filter(item =>
      item["Venta Meg"] > 0 && item["Fecha correspondiente"]
    );

    // 🧠 Agrupar por mes de agendamiento
    const ventasPorMesAgendamiento = {};
    ventasMeg.forEach(venta => {
      const clienteId = venta["Nombre cliente"];
      const fechaAgendamiento = fechaAgendamientoPorCliente[clienteId];

      if (fechaAgendamiento) {
        const mesAgendamiento = `${fechaAgendamiento.getFullYear()}-${String(fechaAgendamiento.getMonth() + 1).padStart(2, "0")}`;
        ventasPorMesAgendamiento[mesAgendamiento] = (ventasPorMesAgendamiento[mesAgendamiento] || 0) + 1;
      } else {
        ventasPorMesAgendamiento["Sin fecha de agendamiento"] = (ventasPorMesAgendamiento["Sin fecha de agendamiento"] || 0) + 1;
      }
    });

    // 🎯 Mostrar total del mes recibido
    const totalDelMes = ventasPorMesAgendamiento[month] || 0;
    setTotalVentas(totalDelMes);
    setIsLoading(false);
  }, [month, closer, origin, rawVentas]);

  return (
    <div>
      {isLoading ? (
        <span className="text-gray-500">Cargando...</span>
      ) : (
        <span className="text-black font-bold">{totalVentas}</span>
      )}
    </div>
  );
}
