import { useEffect, useState, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useData } from "../components/DataContext";

export default function ResumenPorRango({ formatCurrency }) {
  const {
    metricasData: rawVentasRaw,
    metricasClienteData: rawLlamadas,
    loading: isLoading,
  } = useData();

  // Usar useMemo para evitar recrear el array en cada render
  const rawVentas = useMemo(() => 
    rawVentasRaw.map(v => v[1] ? { ...v[1], _id: v._id } : v), 
    [rawVentasRaw]
  );

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedCloser, setSelectedCloser] = useState("all");
  const [selectedOrigin, setSelectedOrigin] = useState("all");

  // Usar useMemo para calcular los valores disponibles
  const availableClosers = useMemo(() => {
    return [...new Set(rawLlamadas.map(i => i.Closer?.trim()).filter(Boolean))];
  }, [rawLlamadas]);

  const availableOrigins = useMemo(() => {
    return [...new Set([
      ...rawVentas.map(i => i.Origen?.trim()),
      ...rawLlamadas.map(i => i["Ultimo origen"]?.trim())
    ].filter(Boolean))];
  }, [rawVentas, rawLlamadas]);

  // Utilidad para comparar solo fechas (sin horas) - CORREGIDA
  function isDateInRange(dateString, start, end) {
    if (!dateString || !start || !end) return false;
    
    // Parsear la fecha del string - manteniendo consistencia con zona horaria
    const date = new Date(dateString);
    if (isNaN(date)) return false;
    
    // Convertir todo a strings de fecha en formato YYYY-MM-DD para comparación exacta
    const dateStr = date.toISOString().split('T')[0];
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    
    return dateStr >= startStr && dateStr <= endStr;
  }

  // Utilidad para obtener el primer y último día del mes - MEJORADA
  function getMonthRange(date) {
    if (!date) return [null, null];
    
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Primer día del mes a las 00:00:00
    const first = new Date(year, month, 1);
    // Último día del mes a las 23:59:59
    const last = new Date(year, month + 1, 0);
    
    return [first, last];
  }

  // Calcular el resumen usando useMemo
  const resumen = useMemo(() => {
    if (!startDate || !endDate || !rawVentas.length || !rawLlamadas.length) {
      return null;
    }

    console.log('Rango de fechas:', { 
      startDate: startDate.toISOString().split('T')[0], 
      endDate: endDate.toISOString().split('T')[0] 
    }); // Debug

    // Filtrar llamadas agendadas por fecha de agendamiento
    const llamadasAgendadas = rawLlamadas.filter(item => {
      const fechaStr = item["Fecha de agendamiento"];
      if (!fechaStr) return false;
      if (item.Agendo !== 1) return false;
      
      const inRange = isDateInRange(fechaStr, startDate, endDate);
      
      // Debug: log algunas fechas para verificar
      if (Math.random() < 0.01) { // Solo 1% de las veces para no saturar
        console.log('Fecha agendamiento:', fechaStr, 'En rango:', inRange);
      }
      
      if (!inRange) return false;
      if (selectedCloser !== "all" && item.Closer?.trim() !== selectedCloser) return false;
      if (selectedOrigin !== "all" && item["Ultimo origen"]?.trim() !== selectedOrigin) return false;
      return true;
    });

    console.log('Llamadas agendadas filtradas:', llamadasAgendadas.length); // Debug

    const idsAgendados = new Set(llamadasAgendadas.map(i => i.id?.replace(/-/g, "")));

    // Filtrar ventas por fecha de agendamiento
    const ventasFiltradas = rawVentas.filter(item => {
      const fechaStr = item["Fecha de agendamiento"];
      const responsable = item.Responsable?.trim();
      const origen = item.Origen?.trim();
      const idCliente = item["Nombre cliente"]?.replace(/-/g, "");

      return (
        isDateInRange(fechaStr, startDate, endDate) &&
        item["Venta Club"] !== 1 &&
        (selectedCloser === "all" || responsable === selectedCloser) &&
        (selectedOrigin === "all" || origen === selectedOrigin) &&
        idsAgendados.has(idCliente)
      );
    });

    return {
      Agenda: llamadasAgendadas.length,
      Aplica: llamadasAgendadas.filter(i => i["Aplica N"] === "1").length,
      Confirm: llamadasAgendadas.reduce(
        (acc, i) => acc + (i["Aplica N"] === "1" ? (i["Call confirm exitoso"] || 0) : 0), 0
      ),
      // Solo sumar llamadas efectuadas si Aplica N === "1"
      Llamadas: llamadasAgendadas.reduce(
        (acc, i) => acc + (i["Aplica N"] === "1" ? (i["Llamadas efectuadas"] || 0) : 0), 0
      ),
      Ventas: ventasFiltradas.filter(i => i["Venta Meg"] > 0).length,
      Monto: ventasFiltradas.reduce((acc, i) => acc + (parseFloat(i["Precio"]) || 0), 0),
      Cash: ventasFiltradas.reduce((acc, i) => acc + (parseFloat(i["Cash collected total"]) || 0), 0),
    };
  }, [startDate, endDate, selectedCloser, selectedOrigin, rawVentas, rawLlamadas]);

  // CORREGIDO: Solo autocompletar si no hay endDate, sin modificar startDate
  useEffect(() => {
    if (startDate && !endDate) {
      const [, last] = getMonthRange(startDate);
      setEndDate(last);
    }
  }, [startDate, endDate]); // Agregué endDate como dependencia

  // Función helper para seleccionar mes completo
  const selectFullMonth = (date) => {
    const [first, last] = getMonthRange(date);
    setStartDate(first);
    setEndDate(last);
  };

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
            dateFormat="dd/MM/yyyy"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            placeholderText="Fin"
            className="border rounded p-1 w-full"
            dateFormat="dd/MM/yyyy"
          />
        </div>

        {/* Botón para seleccionar mes completo */}
        {startDate && (
          <button
            onClick={() => selectFullMonth(startDate)}
            className="w-full bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
          >
            Seleccionar mes completo ({startDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })})
          </button>
        )}

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

        {/* Información de debug */}
        {startDate && endDate && (
          <div className="text-xs text-gray-500 mt-2">
            Rango: {startDate.toLocaleDateString('es-ES')} - {endDate.toLocaleDateString('es-ES')}
          </div>
        )}
      </div>
    </div>
  );
}