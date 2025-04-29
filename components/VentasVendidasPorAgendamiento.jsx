import { useEffect, useState } from "react";

export default function VentasPorMesDeAgendamiento({ month, closer = "all", origin = "all" }) {
  const [totalVentas, setTotalVentas] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const API_URL = "https://metricas-back.onrender.com/metricas";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(API_URL);
        const data = await response.json();

        // Filtrar por closer y origin
        const dataFiltrada = data.filter((item) => {
          const matchCloser = closer === "all" || item.Responsable === closer;
          const matchOrigin = origin === "all" || item.Origen === origin;
          return matchCloser && matchOrigin;
        });

        // 1. Mapear fecha de agendamiento más antigua por cliente
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

        // 2. Filtrar ventas Meg
        const ventasMeg = dataFiltrada.filter(item => item["Venta Meg"] > 0 && item["Fecha correspondiente"]);

        // 3. Atribuir cada venta al mes de agendamiento
        const ventasPorMesAgendamiento = {};

        ventasMeg.forEach(venta => {
          const clienteId = venta["Nombre cliente"];
          const fechaAgendamiento = fechaAgendamientoPorCliente[clienteId];

          if (fechaAgendamiento) {
            const mesAgendamiento = `${fechaAgendamiento.getFullYear()}-${String(fechaAgendamiento.getMonth() + 1).padStart(2, "0")}`;
            ventasPorMesAgendamiento[mesAgendamiento] = (ventasPorMesAgendamiento[mesAgendamiento] || 0) + 1;
          } else {
            // Opcional: podrías manejar ventas sin agendamiento registrado
            ventasPorMesAgendamiento["Sin fecha de agendamiento"] = (ventasPorMesAgendamiento["Sin fecha de agendamiento"] || 0) + 1;
          }
        });

        // 4. Mostrar sólo el total del mes recibido
        const totalDelMes = ventasPorMesAgendamiento[month] || 0;
        setTotalVentas(totalDelMes);
      } catch (error) {
        console.error("Error cargando ventas:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [month, closer, origin]);

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
