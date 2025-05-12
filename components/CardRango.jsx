import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useData } from "../components/DataContext";
import VentasPorFechaConAgendamiento from "../components/VentasPorFechaConAgendamiento";

export default function ResumenPorRango({ formatCurrency }) {
  const {
    metricasData: rawVentasRaw,
    metricasClienteData: rawLlamadas,
    loading: isLoading,
  } = useData();

  const rawVentas = rawVentasRaw.map(v =>
    v[1] ? { ...v[1], _id: v._id } : v
  );

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedCloser, setSelectedCloser] = useState("all");
  const [selectedOrigin, setSelectedOrigin] = useState("all");
  const [availableClosers, setAvailableClosers] = useState([]);
  const [availableOrigins, setAvailableOrigins] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [ventasFiltradas, setVentasFiltradas] = useState([]);

  useEffect(() => {
    const closers = [...new Set(rawLlamadas.map(i => i.Closer?.trim()).filter(Boolean))];
    const origins = [...new Set([
      ...rawVentas.map(i => i.Origen?.trim()),
      ...rawLlamadas.map(i => i["Ultimo origen"]?.trim())
    ].filter(Boolean))];
    setAvailableClosers(closers);
    setAvailableOrigins(origins);
  }, [rawVentas, rawLlamadas]);

  useEffect(() => {
    if (!rawVentas.length || !startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filtradas = rawVentas.filter(item => {
      const fecha = new Date(item["Fecha de agendamiento"]);
      const responsable = item.Responsable?.trim();
      const origen = item.Origen?.trim();

      return (
        !isNaN(fecha) &&
        fecha >= start &&
        fecha <= end &&
        item["Venta Club"] !== 1 &&
        (selectedCloser === "all" || responsable === selectedCloser) &&
        (selectedOrigin === "all" || origen === selectedOrigin)
      );
    });

    setVentasFiltradas(filtradas);
  }, [rawVentas, startDate, endDate, selectedCloser, selectedOrigin]);

  useEffect(() => {
    if (!rawLlamadas.length || !startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const llamadasEnRango = rawLlamadas.filter(item => {
      const fecha = new Date(item["Fecha de agendamiento"]);
      const closer = item.Closer?.trim();
      const origen = item["Ultimo origen"]?.trim();

      return (
        !isNaN(fecha) &&
        fecha >= start &&
        fecha <= end &&
        (selectedCloser === "all" || closer === selectedCloser) &&
        (selectedOrigin === "all" || origen === selectedOrigin)
      );
    });

    const llamadasAgendadas = llamadasEnRango.filter(i => i.Agendo === 1);
    const idsAgendados = new Set(llamadasAgendadas.map(i => i.id?.replace(/-/g, "")));

    const interaccionesClientes = ventasFiltradas.filter(item => {
      const idCliente = item["Nombre cliente"]?.replace(/-/g, "");
      return idsAgendados.has(idCliente);
    });

    const resumenCalculado = {
      Agenda: llamadasAgendadas.length,
      Aplica: llamadasAgendadas.filter(i => i["Aplica N"] === "1").length,
      Confirm: llamadasAgendadas.reduce(
        (acc, i) => acc + (i["Aplica N"] === "1" ? (i["Call confirm exitoso"] || 0) : 0), 0
      ),
      Llamadas: llamadasAgendadas.reduce((acc, i) => acc + (i["Llamadas efectuadas"] || 0), 0),
      Ventas: interaccionesClientes.filter(i => i["Venta Meg"] > 0).length,
      Monto: interaccionesClientes.reduce((acc, i) => acc + (parseFloat(i["Precio"]) || 0), 0),
      Cash: interaccionesClientes.reduce((acc, i) => acc + (parseFloat(i["Cash collected total"]) || 0), 0),
    };

    setResumen(resumenCalculado);
  }, [startDate, endDate, selectedCloser, selectedOrigin, rawLlamadas, ventasFiltradas]);

  return (
    <div className="w-full md:w-[32%] bg-white rounded-lg shadow-md overflow-visible min-h-[540px] pb-6">
      <h3 className="text-lg font-bold text-center py-4 bg-gradient-to-r from-[#E0C040] to-[#f7db6b] text-white">
        Resumen por Rango
      </h3>

      <div className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
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

        <select
          className="w-full border rounded p-1"
          value={selectedOrigin}
          onChange={(e) => setSelectedOrigin(e.target.value)}
        >
          <option value="all">Todos los orígenes</option>
          {availableOrigins.map((origin, idx) => (
            <option key={idx} value={origin}>{origin}</option>
          ))}
        </select>

        {resumen && (
          <div className="grid grid-cols-2 gap-3 mt-4 text-center">
            <div><p className="font-semibold">Llamadas Agendadas</p><p>{resumen.Agenda}</p></div>
            <div><p className="font-semibold">Llamadas Aplicables</p><p>{resumen.Aplica}</p></div>
            <div><p className="font-semibold">Call Confirm Exitoso</p><p>{resumen.Confirm}</p></div>
            <div><p className="font-semibold">Llamadas Efectuadas</p><p>{resumen.Llamadas}</p></div>
            <div><p className="font-semibold">Llamadas Vendidas</p><p>{resumen.Ventas}</p></div>
            <div><p className="font-semibold">Monto Total</p><p>{formatCurrency(resumen.Monto)}</p></div>
            <div><p className="font-semibold">Cash Collected</p><p>{formatCurrency(resumen.Cash)}</p></div>
            <div><p className="font-semibold">% Real Cobrado</p><p>
              {resumen.Monto > 0
                ? `${((resumen.Cash / resumen.Monto) * 100).toFixed(2)}%`
                : "0%"}
            </p></div>
          </div>
        )}

        {ventasFiltradas.length > 0 && (
          <div className="mt-6">
            <VentasPorFechaConAgendamiento
              rawVentas={ventasFiltradas}
              month={null}
              closer={selectedCloser}
              origin={selectedOrigin}
            />
          </div>
        )}
      </div>
    </div>
  );
}
