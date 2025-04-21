import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function ResumenPorRango({ API_URL, formatCurrency }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedCloser, setSelectedCloser] = useState("all");
  const [availableClosers, setAvailableClosers] = useState([]);
  const [resumen, setResumen] = useState(null);

  useEffect(() => {
    const fetchClosers = async () => {
      const response = await fetch(API_URL);
      const data = await response.json();
      const closers = [...new Set(data.filter(item => item["Venta Meg"] > 0).map(item => item.Responsable))];
      setAvailableClosers(closers);
    };
    fetchClosers();
  }, [API_URL]);

  useEffect(() => {
    const fetchResumen = async () => {
      if (!startDate || !endDate) return;

      const response = await fetch(API_URL);
      const data = await response.json();

      const agendamientos = data.filter(item => {
        const fecha = new Date(item["Fecha correspondiente"]);
        const matchFecha = fecha >= startDate && fecha <= endDate;
        const matchCloser = selectedCloser === "all" || item.Responsable === selectedCloser;
        return item.Agenda === 1 && matchFecha && matchCloser;
      });

      const clientesAgendados = new Set(agendamientos.map(i => i["Nombre cliente"]));

      const interaccionesClientes = data.filter(item =>
        clientesAgendados.has(item["Nombre cliente"]) &&
        (selectedCloser === "all" || item.Responsable === selectedCloser)
      );

      const resumenCalculado = interaccionesClientes.reduce(
        (acc, item) => {
          if (item.Agenda === 1) acc.Agenda++;
          if (item["Aplica?"] === "Aplica") acc.Aplica++;
          if (item["Llamadas efectuadas"]) acc.Llamadas += item["Llamadas efectuadas"];
          if (item["Venta Meg"] > 0) acc.Ventas++;
          if (item["Precio"]) acc.Monto += item["Precio"];
          if (item["Cash collected total"]) acc.Cash += item["Cash collected total"];
          if (item["Call Confirm Exitoso"]) acc.Confirm += item["Call Confirm Exitoso"];
          return acc;
        },
        { Agenda: 0, Aplica: 0, Llamadas: 0, Ventas: 0, Monto: 0, Cash: 0, Confirm: 0 }
      );

      setResumen(resumenCalculado);
    };

    fetchResumen();
  }, [startDate, endDate, selectedCloser, API_URL]);

  return (
    <div className="w-full md:w-[32%] bg-white rounded-lg shadow-md overflow-visible min-h-[540px] pb-6">
      <h3 className="text-lg font-bold text-center py-20 bg-gradient-to-r from-[#E0C040] to-[#f7db6b] text-white">
        Resumen por Rango
      </h3>

      <div className="p-4 space-y-4">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row justify-between gap-2">
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="Inicio"
            className="border rounded p-1 w-full"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            placeholderText="Fin"
            className="border rounded p-1 w-full"
          />
        </div>

        <select
          className="w-full border rounded p-1"
          value={selectedCloser}
          onChange={(e) => setSelectedCloser(e.target.value)}
        >
          <option value="all">Todos los closers</option>
          {availableClosers.map((closer, idx) => (
            <option key={idx} value={closer}>{closer}</option>
          ))}
        </select>

        {/* Datos */}
        {resumen && (
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: "Llamadas Agendadas", value: resumen.Agenda },
              { label: "Llamadas Aplicables", value: resumen.Aplica },
              { label: "Call Confirm Exitoso", value: resumen.Confirm },
              { label: "Llamadas Efectuadas", value: resumen.Llamadas },
              { label: "Llamadas Vendidas", value: resumen.Ventas },
              { label: "Monto Total", value: formatCurrency(resumen.Monto) },
              { label: "Cash Collected", value: formatCurrency(resumen.Cash) }
            ].map(({ label, value }, idx) => (
              <div key={idx} className="bg-gray-50 p-3 rounded-lg shadow text-center">
                <div className="text-sm font-semibold text-gray-600">{label}</div>
                <div className="text-lg font-bold text-gray-800">{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
