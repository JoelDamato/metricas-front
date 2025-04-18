"use client"
import { ToastContainer, toast } from 'react-toastify';
import React, { useEffect, useState } from "react"
import "react-datepicker/dist/react-datepicker.css"

export default function SalesMetricsTable() {

  const API_BASE_URL = process.env.NODE_ENV === "production"
    ? "https://metricas-back.onrender.com/metricas"
    : "https://metricas-back.onrender.com/metricas"


  const [monthlyData, setMonthlyData] = useState([])
  const [availableClosers, setAvailableClosers] = useState([])
  const [availableOrigins, setAvailableOrigins] = useState([])
  const [selectedCloser, setSelectedCloser] = useState("all")
  const [selectedOrigin, setSelectedOrigin] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [monthlyGoals, setMonthlyGoals] = useState({});
  const [debugInfo, setDebugInfo] = useState("")
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [pendingMonthToSave, setPendingMonthToSave] = useState(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const response = await fetch(API_BASE_URL);
        const result = await response.json();

        const currentYear = new Date().getFullYear();

        const filteredData = result.filter((item) => {
          const dateString = item["Fecha correspondiente"];
          const date = new Date(dateString);
          return !isNaN(date) && date.getFullYear() === currentYear;
        });

        const filteredByCloserAndOrigin = filteredData.filter((item) => {
          const matchesCloser = selectedCloser === "all" || item.Responsable === selectedCloser;
          const matchesOrigin = selectedOrigin === "all" || item.Origen === selectedOrigin;
          return matchesCloser && matchesOrigin;
        });

        // ✅ Lógica nueva que asigna todas las interacciones al mes del agendamiento del cliente
        const groupDataByMonth = (data) => {
          const acc = {};
          const indexByClient = {};

          // Indexar interacciones por cliente
          data.forEach(item => {
            const clientId = item["Nombre cliente"];
            if (!indexByClient[clientId]) indexByClient[clientId] = [];
            indexByClient[clientId].push(item);
          });

          // Indexar agendamientos por cliente
          const agendamientos = data.filter(item => item.Agenda === 1);
          const fechaAgendamientoPorCliente = {};
          agendamientos.forEach(item => {
            const id = item["Nombre cliente"];
            const fecha = new Date(item["Fecha correspondiente"]);
            if (!fechaAgendamientoPorCliente[id] || fecha < fechaAgendamientoPorCliente[id]) {
              fechaAgendamientoPorCliente[id] = fecha;
            }
          });

          // Procesar ventas
          data.forEach(item => {
            if (item["Venta Meg"] > 0) {
              const clienteId = item["Nombre cliente"];
              const fechaVenta = new Date(item["Fecha correspondiente"]);
              const mesVenta = `${fechaVenta.getFullYear()}-${String(fechaVenta.getMonth() + 1).padStart(2, "0")}`;
              const fechaAgenda = fechaAgendamientoPorCliente[clienteId];
              const mesAgenda = fechaAgenda && fechaAgenda <= fechaVenta
                ? `${fechaAgenda.getFullYear()}-${String(fechaAgenda.getMonth() + 1).padStart(2, "0")}`
                : "Sin agendamiento";

              if (!acc[mesVenta]) acc[mesVenta] = crearEstructuraMes();
              acc[mesVenta]["Venta Meg"] += item["Venta Meg"] || 0;
              acc[mesVenta]["Monto"] += item["Precio"] || 0;
              acc[mesVenta]["Cash collected"] += item["Cash collected total"] || 0;

              if (!acc[mesVenta].VentasPorAgendamientoDetalle[mesAgenda]) {
                acc[mesVenta].VentasPorAgendamientoDetalle[mesAgenda] = 0;
              }
              acc[mesVenta].VentasPorAgendamientoDetalle[mesAgenda] += 1;

              if (fechaAgenda && fechaVenta > fechaAgenda) {
                const dias = Math.floor((fechaVenta - fechaAgenda) / (1000 * 60 * 60 * 24));
                acc[mesVenta].totalDiasEntreAgendaYVenta += dias;
                acc[mesVenta].cantidadVentasConIntervalo += 1;
                acc[mesVenta].intervaloPromedioDias = acc[mesVenta].totalDiasEntreAgendaYVenta / acc[mesVenta].cantidadVentasConIntervalo;
              }
            }
          });

          // Procesar agendamientos
          agendamientos.forEach(item => {
            const clienteId = item["Nombre cliente"];
            const fechaAgenda = new Date(item["Fecha correspondiente"]);
            const mesKey = `${fechaAgenda.getFullYear()}-${String(fechaAgenda.getMonth() + 1).padStart(2, "0")}`;
            if (!acc[mesKey]) acc[mesKey] = crearEstructuraMes();

            acc[mesKey].Agenda += 1;

            const interaccionesCliente = indexByClient[clienteId] || [];

            const huboVentaEnEseMes = interaccionesCliente.some(inter => {
              const fechaVenta = new Date(inter["Fecha correspondiente"]);
              return (
                inter["Venta Meg"] > 0 &&
                fechaVenta.getFullYear() === fechaAgenda.getFullYear() &&
                fechaVenta.getMonth() === fechaAgenda.getMonth()
              );
            });

            if (huboVentaEnEseMes) {
              interaccionesCliente.forEach(interaccion => {
                if (interaccion["Aplica?"] === "Aplica") acc[mesKey]["Aplica?"] += 1;
                acc[mesKey]["Llamadas efectuadas"] += interaccion["Llamadas efectuadas"] || 0;
              });
            }
          });

          return acc;
        };

        const crearEstructuraMes = () => ({
          Agenda: 0,
          "Aplica?": 0,
          "Llamadas efectuadas": 0,
          "Venta Meg": 0,
          Monto: 0,
          "Cash collected": 0,
          totalDiasEntreAgendaYVenta: 0,
          cantidadVentasConIntervalo: 0,
          intervaloPromedioDias: 0,
          VentasPorAgendamientoDetalle: {}
        });



        // Obtener datos agrupados por mes
        const groupedData = groupDataByMonth(filteredByCloserAndOrigin);

        // Esto genera el objeto ventasPorMes
        const ventasPorMes = {};
        Object.entries(groupedData).forEach(([month, data]) => {
          ventasPorMes[month] = data.ventas || 0;
        });

        setMonthlyData(Object.entries(groupedData).sort(([a], [b]) => new Date(a) - new Date(b)));


        // Convertir a array para ordenar
        const monthlyEntries = Object.entries(groupedData);

        const sortedMonthlyEntries = monthlyEntries.sort(([monthA], [monthB]) => {
          const dateA = new Date(monthA);
          const dateB = new Date(monthB);
          return dateB - dateA;
        });

        setMonthlyData(sortedMonthlyEntries);
        setIsLoading(false);

        const closersWithSales = filteredData.filter((item) => item["Venta Meg"] > 0).map((item) => item.Responsable);
        setAvailableClosers([...new Set(closersWithSales)]);

        const validOrigins = [...new Set(filteredData.map((item) => item.Origen).filter(Boolean))]
        setAvailableOrigins(validOrigins);

        setDebugInfo(JSON.stringify(filteredByCloserAndOrigin[0] || {}, null, 2));
      } catch (error) {
        console.error("Error fetching data:", error);
        setDebugInfo(`Error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedCloser, selectedOrigin, API_BASE_URL]);


  const formatMonthYear = (month) => {
    const [year, monthNumber] = month.split("-")
    const monthsInSpanish = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ]

    const monthName = monthsInSpanish[Number.parseInt(monthNumber, 10) - 1] // Convertir "02" en índice 1 (Febrero)
    return `${monthName} ${year}`
  }

  const handleSelectChange = (setter) => (event) => {
    setter(event.target.value)
  }

  const handleGoalChange = (month, metricName, value) => {
    setMonthlyGoals((prev) => {

      const updatedMonthlyGoals = { ...prev };


      if (!updatedMonthlyGoals[month]) {
        updatedMonthlyGoals[month] = {
          closer: selectedCloser,
          origin: selectedOrigin,
          metrics: []
        };
      }


      const currentMetrics = updatedMonthlyGoals[month].metrics || [];


      const metricIndex = currentMetrics.findIndex((m) => m.name === metricName);


      if (value === "") {

        return prev;
      } else if (metricIndex !== -1) {

        updatedMonthlyGoals[month].metrics = currentMetrics.map((metric, index) =>
          index === metricIndex ? { ...metric, goal: Number(value) } : metric
        );
      } else {

        updatedMonthlyGoals[month].metrics.push({
          name: metricName,
          goal: Number(value)
        });
      }

      return updatedMonthlyGoals;
    });
  };

  const calculateGoalPercentage = (actual, goal) => {
    if (!goal || goal === 0) return 0;
    const percentage = (actual / goal) * 100;
    return parseFloat(percentage.toFixed(2));
  };

  const saveGoal = async (month) => {

    const metrics = monthlyGoals[month]?.metrics || [];
    const goalData = {
      month,
      closer: selectedCloser,
      origin: selectedOrigin,
      metrics: metrics,
    };


    try {
      const response = await fetch(`https://metricas-back.onrender.com/update-goal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(goalData),
      });

      if (!response.ok) {
        throw new Error("Error al guardar los datos");
      }

      const data = await response.json();
      toast.success("Objetivo actualizado correctamente!");
    } catch (error) {
      console.error("Error al actualizar objetivos:", error);
      toast.error("Error al actualizar objetivos");
    }
  };


  useEffect(() => {
    const fetchGoals = async () => {
      try {

        const url = new URL("https://metricas-back.onrender.com/goals");
        if (selectedCloser !== "all") url.searchParams.append("selectedCloser", selectedCloser);
        if (selectedOrigin !== "all") url.searchParams.append("selectedOrigin", selectedOrigin);
        const response = await fetch(url.toString());
        const result = await response.json();



        const formattedGoals = result.reduce((acc, item) => {
          if (item?.month) {
            acc[item.month] = {
              closer: item.closer || selectedCloser || "all",
              origin: item.origin || selectedOrigin || "all",
              metrics: item.metrics || [

                { name: "Llamadas Agendadas", goal: 0 },
                { name: "Llamadas efectuadas", goal: 0 },
                { name: "Venta Meg", goal: 0 },
                { name: "Agenda", goal: 0 }
              ]
            };
          }
          return acc;
        }, {});


        setMonthlyGoals(prev => {
          const merged = {
            ...prev,
            ...formattedGoals
          };



          return merged;
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error al obtener objetivos:", error);
        setIsLoading(false);
      }
    };

    fetchGoals();
  }, [selectedCloser, selectedOrigin]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount)
  }


  const calculateRealPercentage = (cashCollected, price) => {
    if (price === 0) return "0%"
    return `${((cashCollected / price) * 100).toFixed(2)}%`
  }

  const handleSaveGoal = (month) => {
    const current = new Date();
    const currentMonth = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;

    if (month !== currentMonth) {
      setPendingMonthToSave(month);
      setShowPasswordModal(true);
    } else {
      saveGoal(month);
    }
  };

  const confirmPasswordAndSave = () => {
    if (passwordInput === "hola1234") {
      saveGoal(pendingMonthToSave);
      setShowPasswordModal(false);
      setPasswordInput("");
      setPendingMonthToSave(null);
    } else {
      toast.error("No tiene permisos para ejecutar la acción");
    }
  };



  return (
    <div className="p-4">


      <ToastContainer position="bottom-right" />
      <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
        <select
          value={selectedCloser}
          onChange={handleSelectChange(setSelectedCloser)}
          className="p-2 border rounded-md"
        >
          <option value="all">Todos los Closers</option>
          {availableClosers.map((closer) => (
            <option key={closer} value={closer}>
              {closer}
            </option>
          ))}
        </select>

        <select
          value={selectedOrigin}
          onChange={handleSelectChange(setSelectedOrigin)}
          className="p-2 border rounded-md"
        >
          <option value="all">Todos los Orígenes</option>
          {availableOrigins.map((origin) => (
            <option key={origin} value={origin}>
              {origin}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center ">
          <img
            src="https://i.ibb.co/8XqZgCk/2-1.png"
            alt="Cargando..."
            className="w-1/4 h-1/4 sm:w-1/10 transition-transform transform hover:scale-110 animate-pulse"
          />
        </div>
      ) : (


        monthlyData.length === 0 ? (
          <div className="flex justify-center items-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800">No hay datos disponibles</h2>
              <p className="text-gray-600">No hay datos para mostrar con los filtros seleccionados</p>
            </div>
          </div>
        ) :

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            {monthlyData.map(([month, totals], index) => (
              <div
                key={index}
                className="w-full bg-white rounded-lg shadow-md overflow-hidden transform transition-all duration-300 hover:shadow-lg"
              >
                {/* 🏆 Título del mes con efecto degradado */}
                <h3 className="text-lg font-bold text-center py-2 bg-gradient-to-r from-[#E0C040] to-[#f7db6b] text-white">
                  {formatMonthYear(month)}
                </h3>

                {/* 📊 Contenedor de métricas */}
                <div className="p-1 space-y-1">
                  {/* 🟢 Llamadas Agendadas */}
                  <div className="bg-gray-50 p-1 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-md font-semibold text-gray-700 w-[40%]">Llamadas Agendadas</span>
                      <span className="text-md font-bold text-gray-700">{totals.Agenda}</span>
                    </div>
                    <div className="mt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-md text-gray-600">Objetivo:</span>
                        <input
                          type="number"
                          value={
                            monthlyGoals[month]?.metrics?.find((m) => m.name === "Llamadas Agendadas")?.goal || ""
                          }
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            handleGoalChange(month, "Llamadas Agendadas", inputValue);
                          }}
                          className="border border-gray-300 rounded text-md w-16 text-right p-0.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="mt-0.5 text-md text-gray-600">
                        Cumplimiento:{" "}
                        <span
                          className={`font-semibold ${calculateGoalPercentage(
                            totals.Agenda,
                            monthlyGoals[month]?.metrics?.find((m) => m.name === "Llamadas Agendadas")?.goal
                          ) >= 100
                            ? "text-green-500"
                            : "text-gray-600"
                            }`}
                        >
                          {calculateGoalPercentage(
                            totals.Agenda,
                            monthlyGoals[month]?.metrics?.find((m) => m.name === "Llamadas Agendadas")?.goal
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 🟢 Llamadas Aplicables */}
                  <div className="bg-gray-50 p-1 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-md font-semibold text-gray-700 w-[40%]">Llamadas Aplicables</span>
                      <span className="text-md font-bold w-[20%] text-gray-700  text-center ">{totals["Aplica?"]}</span>

                      <span className="text-md font-bold w-[20%] text-gray-700 text-end">
                        {!isNaN(parseFloat(totals["Aplica?"])) &&
                          !isNaN(parseFloat(totals.Agenda)) &&
                          parseFloat(totals.Agenda) > 0
                          ? `${((parseFloat(totals["Aplica?"]) * 100) / parseFloat(totals.Agenda)).toFixed(2)} %`
                          : "-"}
                      </span>

                    </div>
                    <div className="mt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-md text-gray-600">Objetivo:</span>
                        <input
                          type="number"
                          value={
                            monthlyGoals[month]?.metrics?.find((m) => m.name === "Llamadas Aplicables")?.goal || ""
                          }

                          onChange={(e) => handleGoalChange(month, "Llamadas Aplicables", e.target.value)}
                          className="border border-gray-300 rounded text-md w-16 text-right p-0.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="mt-0.5 text-md text-gray-600">
                        Cumplimiento:{" "}
                        <span
                          className={`font-semibold ${calculateGoalPercentage(
                            totals["Aplica?"],
                            monthlyGoals[month]?.metrics?.find((m) => m.name === "Llamadas Aplicables")?.goal
                          ) >= 100
                            ? "text-green-500"
                            : "text-gray-600"
                            }`}

                        >
                          {calculateGoalPercentage(
                            totals["Aplica?"],
                            monthlyGoals[month]?.metrics?.find((m) => m.name === "Llamadas Aplicables")?.goal
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 🟢 Llamadas Efectuadas */}
                  <div className="bg-gray-50 p-1 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-md font-semibold text-gray-700 w-[40%] ">Llamadas Efectuadas</span>
                      <span className="text-md font-bold w-[20%] text-gray-700 text-center">{totals["Llamadas efectuadas"]}</span>

                      <span className="text-md font-bold w-[20%] text-gray-700 text-end">
                        {!isNaN(parseFloat(totals["Llamadas efectuadas"])) &&
                          !isNaN(parseFloat(totals["Aplica?"])) &&
                          parseFloat(totals["Aplica?"]) > 0
                          ? `${((parseFloat(totals["Llamadas efectuadas"]) * 100) / parseFloat(totals["Aplica?"])).toFixed(2)} %`
                          : "-"}
                      </span>

                    </div>
                    <div className="mt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-md text-gray-600">Objetivo:</span>
                        <input
                          type="number"
                          value={
                            monthlyGoals[month]?.metrics?.find((m) => m.name === "Llamadas Efectuadas")?.goal || ""
                          }
                          onChange={(e) => handleGoalChange(month, "Llamadas Efectuadas", e.target.value)}
                          className="border border-gray-300 rounded text-md w-16 text-right p-0.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="mt-0.5 text-md text-gray-600">
                        Cumplimiento:{" "}
                        <span
                          className={`font-semibold ${calculateGoalPercentage(
                            totals["Llamadas efectuadas"],
                            monthlyGoals[month]?.metrics?.find((m) => m.name === "Llamadas Efectuadas")?.goal
                          ) >= 100
                            ? "text-green-500"
                            : "text-gray-600"
                            }`}
                        >
                          {calculateGoalPercentage(
                            totals["Llamadas efectuadas"],
                            monthlyGoals[month]?.metrics?.find((m) => m.name === "Llamadas Efectuadas")?.goal
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 🟢 Llamadas Vendidas */}
                  <div className="bg-gray-50 p-1 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-md font-semibold text-gray-700 w-[40%]">Llamadas Vendidas</span>
                      <span className="text-md font-bold text-gray-700 w-[20%]  text-center ">{totals["Venta Meg"]}</span>
                      <span className="text-md font-bold text-gray-700 w-[20%] text-end">
                        {!isNaN(parseFloat(totals["Venta Meg"])) &&
                          !isNaN(parseFloat(totals["Llamadas efectuadas"])) &&
                          parseFloat(totals["Llamadas efectuadas"]) > 0
                          ? `${((parseFloat(totals["Venta Meg"]) * 100) / parseFloat(totals["Llamadas efectuadas"])).toFixed(2)} %`
                          : "-"}
                      </span>

                    </div>
                    <div className="mt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-md text-gray-600">Objetivo:</span>
                        <input
                          type="number"
                          value={
                            monthlyGoals[month]?.metrics?.find((m) => m.name === "Llamadas Vendidas")?.goal || ""
                          }
                          onChange={(e) => handleGoalChange(month, "Llamadas Vendidas", e.target.value)}
                          className="border border-gray-300 rounded text-md w-16 text-right p-0.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="mt-0.5 text-md text-gray-600">
                        Cumplimiento:{" "}
                        <span
                          className={`font-semibold ${calculateGoalPercentage(
                            totals["Venta Meg"],
                            monthlyGoals[month]?.metrics?.find((m) => m.name === "Llamadas Vendidas")?.goal
                          ) >= 100
                            ? "text-green-500"
                            : "text-gray-600"
                            }`}
                        >
                          {calculateGoalPercentage(
                            totals["Venta Meg"],
                            monthlyGoals[month]?.metrics?.find((m) => m.name === "Llamadas Vendidas")?.goal
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 🧾 Ventas por Submes */}
                  <div className="bg-gray-50 p-1 rounded-md border border-gray-200">
                    <details className="group">
                      <summary className="cursor-pointer text-[#4c4c4c] hover:underline flex justify-between items-center">
                        <span className="text-md font-semibold">Ventas por mes de agendamiento:</span>
                        <span className="transition-transform group-open:rotate-90">▶</span>
                      </summary>

                      <ul className="mt-2 pl-4 text-gray-700 text-sm list-disc">
                        {Object.entries(totals.VentasPorAgendamientoDetalle || {})
                          .sort(([a], [b]) => {
                            if (a === "Sin agendamiento") return 1;
                            if (b === "Sin agendamiento") return -1;
                            return new Date(b) - new Date(a); // 👈 ahora es descendente
                          })
                          .map(([mesAgenda, cantidad], idx) => (
                            <li key={idx}>
                              {mesAgenda === "Sin agendamiento"
                                ? "Sin fecha de agendamiento"
                                : formatMonthYear(mesAgenda)}: <strong>{cantidad}</strong>
                            </li>
                          ))}
                      </ul>



                    </details>
                  </div>


                  {/* 🟢 Intervalo de Ventas */}
                  <div className="bg-gray-50 p-1 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-md font-semibold text-gray-700">Intervalo de Ventas</span>
                      <span className="text-md font-bold text-gray-700">{`${totals.intervaloPromedioDias.toFixed(0) || 0} días`}</span>
                    </div>
                  </div>

                  {/* 🟢 Monto Total */}
                  <div className="bg-gray-50 p-1 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-md font-semibold text-gray-700">Monto Total</span>
                      <span className="text-md font-bold text-gray-700">{formatCurrency(totals["Monto"])}</span>
                    </div>
                    <div className="mt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-md text-gray-600">Objetivo:</span>
                        <input
                          type="number"
                          value={
                            monthlyGoals[month]?.metrics?.find((m) => m.name === "Monto Total")?.goal || ""
                          }
                          onChange={(e) => handleGoalChange(month, "Monto Total", e.target.value)}
                          className="border border-gray-300 rounded text-xs w-16 text-right p-0.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="mt-0.5 text-xs text-gray-600">
                        Cumplimiento:{" "}
                        <span
                          className={`font-semibold ${calculateGoalPercentage(
                            totals["Monto"],
                            monthlyGoals[month]?.metrics?.find((m) => m.name === "Monto Total")?.goal
                          ) >= 100
                            ? "text-green-500"
                            : "text-gray-600"
                            }`}
                        >
                          {calculateGoalPercentage(
                            totals["Monto"],
                            monthlyGoals[month]?.metrics?.find((m) => m.name === "Monto Total")?.goal
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cash Collected */}
                  <div className="bg-gray-50 p-1 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-md font-semibold text-gray-700">Cash Collected</span>
                      <span className="text-md font-bold text-gray-700">{formatCurrency(totals["Cash collected"])}</span>
                    </div>
                    <div className="mt-1">
                      <div className="flex justify-between items-center">
                        <span className="text-md text-gray-600">Objetivo (%):</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={
                            monthlyGoals[month]?.metrics?.find((m) => m.name === "Cash Collected")?.goal || ""
                          }
                          onChange={(e) => handleGoalChange(month, "Cash Collected", Math.min(100, Math.max(0, e.target.value)))}
                          className="border border-gray-300 rounded text-xs w-16 text-right p-0.5 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="mt-0.5 text-xs text-gray-600">
                        Cumplimiento:{" "}
                        <span
                          className={`font-semibold ${totals["Cash collected percentage"] >=
                            (monthlyGoals[month]?.metrics?.find((m) => m.name === "Cash Collected")?.goal || 0)
                            ? "text-green-500"
                            : "text-gray-600"
                            }`}
                        >
                          {totals["Cash collected percentage"] || 0}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/*  % Real */}
                  <div className="bg-gray-50 p-1 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-700">% Real</span>
                      <span className="text-xs font-bold text-gray-700">
                        {calculateRealPercentage(totals["Cash collected"], totals["Monto"])}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <button
                    onClick={() => handleSaveGoal(month)}
                    className="w-full bg-[#E0C040] text-white py-1 px-2 rounded text-md hover:bg-[#f7db6b] transition-all duration-300 flex items-center justify-center"
                  >
                    <span>Establecer Objetivo</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 ml-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>

            ))}
            {showPasswordModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full space-y-4">
                  <h2 className="text-lg font-bold text-gray-800 text-center">⚠️ Confirmación requerida</h2>
                  <p className="text-sm text-gray-600 text-center">
                    Estás intentando modificar un objetivo fuera del mes actual.
                  </p>
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => {
                        setShowPasswordModal(false);
                        setPasswordInput("");
                        setPendingMonthToSave(null);
                      }}
                      className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmPasswordAndSave}
                      className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Confirmar
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>)}
    </div>
  )
}

