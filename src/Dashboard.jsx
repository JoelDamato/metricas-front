import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Chart } from "chart.js/auto";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";

const DashboardTable = () => {
  const API_URL = "https://metricas-back.onrender.com/dashboard";

  const [data, setData] = useState([]);
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [closers, setClosers] = useState([]);
  const [closerFilter, setCloserFilter] = useState("");
  const [totals, setTotals] = useState({});
  const [inputs, setInputs] = useState({});
  const chartInstance = useRef(null);
  const canvasRef = useRef(null);
  const [resumen, setResumen] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;



  const handleDateChange = (update) => {
    setDateRange(update);
    if (update.length === 2) {
      setMonthFilter("");
    }
  };

  //fetch data para traer la informacion de la api
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(API_URL);
        setData(response.data);
        const uniqueClosers = [...new Set(response.data.map(item => item["Closer Actual"]))];
        setClosers(uniqueClosers);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  //useEffect para calcular los totales de ventas por closer
  useEffect(() => {
    const filtered = data.filter((row) =>
      row["Venta Club"] !== 1 &&
      new Date(row["Fecha correspondiente"]).toISOString().slice(0, 7) === monthFilter &&
      (closerFilter ? row["Closer Actual"] === closerFilter : true)
    );
  
    const groupedByCloser = {};
  
    filtered.forEach((row) => {
      const closer = row["Closer Actual"];
      if (!groupedByCloser[closer]) {
        groupedByCloser[closer] = {
          "Total Sales": 0,
          "Ofertas Ganadas": 0,
          "Cash collected": 0,
          "Agendas totales": 0,
          "Cerradas": 0,
          "Cierre/Asistencias": 0,
          "Asistencia": 0,
          "Recuperado": 0,
          "No asiste": 0,
          "No aplican": 0,
          "Aplican": 0,
          percentages: {},
        };
      }
  
  
      groupedByCloser[closer]["Total Sales"] += row["Precio"] || 0;
      groupedByCloser[closer]["Ofertas Ganadas"] += row["Venta Meg"] || 0;
      groupedByCloser[closer]["Cash collected"] += row["Cash collected total"] || 0;
      groupedByCloser[closer]["Agendas totales"] += row["Agenda"] || 0;
      groupedByCloser[closer]["Cerradas"] += row["Venta Meg"] || 0;
  

      if (row["Asistio?"] === "Asistió") {
        groupedByCloser[closer]["Asistencia"] += 1;
      } else if (row["Asistio?"] === "Recuperado") {
        groupedByCloser[closer]["Recuperado"] += 1;
      }

      if (row["Agenda"] === 1 && row["Asistio?"] !== "Asistió" && row["Asistio?"] !== "Recuperado") {
        groupedByCloser[closer]["No asiste"] += 1;
      }
  

      if (row["Aplica?"] === "Aplica") {
        groupedByCloser[closer]["Aplican"] += 1;
      } else if (row["Aplica?"] === "No aplica") {
        groupedByCloser[closer]["No aplican"] += 1;
      }
  

      if (row["Venta Meg"] > 0 && (row["Asistio?"] === "Asistió" || row["Asistio?"] === "Recuperado")) {
        groupedByCloser[closer]["Cierre/Asistencias"] += 1;
      }
    });
  

    Object.keys(groupedByCloser).forEach((closer) => {
      const stats = groupedByCloser[closer];
  
      stats.percentages = {
        "Cash collected": ((stats["Total Sales"] > 0 ? stats["Cash collected"] / stats["Total Sales"] : 0) * 100).toFixed(2) + "%",
        "Cerradas": ((stats["Agendas totales"] > 0 ? stats["Cerradas"] / stats["Agendas totales"] : 0) * 100).toFixed(2) + "%",
        "Cierre/Asistencias": ((stats["Asistencia"] + stats["Recuperado"] > 0 ? stats["Cierre/Asistencias"] / (stats["Asistencia"] + stats["Recuperado"]) : 0) * 100).toFixed(2) + "%",
        "Asistencia": ((stats["Agendas totales"] > 0 ? (stats["Asistencia"] + stats["Recuperado"]) / stats["Agendas totales"] : 0) * 100).toFixed(2) + "%",
        "No asiste": ((stats["Agendas totales"] > 0 ? stats["No asiste"] / stats["Agendas totales"] : 0) * 100).toFixed(2) + "%",
        "No aplican": ((stats["Aplican"] + stats["No aplican"] > 0 ? stats["No aplican"] / (stats["Aplican"] + stats["No aplican"]) : 0) * 100).toFixed(2) + "%",
        "Aplican": ((stats["Aplican"] + stats["No aplican"] > 0 ? stats["Aplican"] / (stats["Aplican"] + stats["No aplican"]) : 0) * 100).toFixed(2) + "%",
      };
    });
  

    setTotals(groupedByCloser);
  }, [monthFilter, closerFilter, data]);


  //manejo de inputs
  const handleInputChange = (closer, field, value) => {
    setInputs((prev) => ({
      ...prev,
      [closer]: { ...prev[closer], [field]: value },
    }));
  };

  useEffect(() => {
    if (data.length === 0) return;
    setIsLoading(true);

    const formatDateDisplay = (dateString) => {
      return new Date(dateString).toLocaleDateString("es-ES", { timeZone: "UTC" });
    };

    const formatDateFilter = (dateString) => {
      return new Date(dateString).toISOString().split("T")[0];
    };


    const normalizarFecha = (fecha) => {
      const fechaUTC = new Date(fecha);
      fechaUTC.setUTCHours(0, 0, 0, 0);
      return fechaUTC;
    };

    let ventasPorFecha = {};

    if (startDate && endDate) {
      const startUTC = normalizarFecha(startDate);
      const endUTC = normalizarFecha(endDate);



      for (let d = new Date(startUTC); d <= endUTC; d.setUTCDate(d.getUTCDate() + 1)) {
        const fechaStr = formatDateDisplay(d);
        ventasPorFecha[fechaStr] = { equipo: 0, vendedor: 0 };
      }


      data.forEach((row) => {
        const fechaCorrespondiente = normalizarFecha(row["Fecha correspondiente"]);
        const fechaStr = formatDateDisplay(row["Fecha correspondiente"]);

        if (fechaCorrespondiente >= startUTC && fechaCorrespondiente <= endUTC && row["Venta Club"] !== 1) {
          if (!ventasPorFecha[fechaStr]) ventasPorFecha[fechaStr] = { equipo: 0, vendedor: 0 };

          if (row["Venta Meg"] === 1) {
            ventasPorFecha[fechaStr].equipo++;
            if (closerFilter && row["Closer Actual"] === closerFilter) {
              ventasPorFecha[fechaStr].vendedor++;
            }
          }
        }
      });
    }

    else if (monthFilter) {


      const year = parseInt(monthFilter.split("-")[0], 10);
      const month = parseInt(monthFilter.split("-")[1], 10) - 1;


      const startMonth = new Date(Date.UTC(year, month, 1));
      const endMonth = new Date(Date.UTC(year, month + 1, 0));




      for (let d = new Date(startMonth); d <= endMonth; d.setUTCDate(d.getUTCDate() + 1)) {
        const fechaStr = formatDateDisplay(d);
        ventasPorFecha[fechaStr] = { equipo: 0, vendedor: 0 };
      }


      data.forEach((row) => {
        const fechaCorrespondiente = normalizarFecha(row["Fecha correspondiente"]);
        const fechaStr = formatDateDisplay(row["Fecha correspondiente"]);

        if (fechaCorrespondiente >= startMonth && fechaCorrespondiente <= endMonth && row["Venta Club"] !== 1) {
          if (!ventasPorFecha[fechaStr]) ventasPorFecha[fechaStr] = { equipo: 0, vendedor: 0 };

          if (row["Venta Meg"] === 1) {
            ventasPorFecha[fechaStr].equipo++;
            if (closerFilter && row["Closer Actual"] === closerFilter) {
              ventasPorFecha[fechaStr].vendedor++;
            }
          }
        }
      });
    }

    // sort para ordenar las fechas en el grafico
    const sortedVentasPorFecha = Object.keys(ventasPorFecha)
      .sort((a, b) => {
        const [dayA, monthA, yearA] = a.split("-").map(Number);
        const [dayB, monthB, yearB] = b.split("-").map(Number);
        return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
      })
      .reduce((obj, key) => {
        obj[key] = ventasPorFecha[key];
        return obj;
      }, {});

    renderizarGraficoVentas(sortedVentasPorFecha);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  }, [startDate, endDate, monthFilter, closerFilter, data]);



  const calcularTendencia = (ventas, tipo) => {
    const valores = Object.values(ventas).map((v) => v[tipo]);
    if (valores.length === 0) return [];

    const tendencia = [];
    let suma = 0;

    for (let i = 0; i < valores.length; i++) {
      suma += valores[i];
      tendencia.push(suma / (i + 1));
    }

    return tendencia;
  };

  // configuracion de chart js
  const renderizarGraficoVentas = (ventas) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const tendenciaEquipo = calcularTendencia(ventas, "equipo");
    const tendenciaVendedor = calcularTendencia(ventas, "vendedor");

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(ventas),
        datasets: [
          {
            label: "Equipo",
            data: Object.values(ventas).map((v) => v.equipo),
            backgroundColor: "#606060",
          },
          {
            label: "Closer Seleccionado",
            data: Object.values(ventas).map((v) => v.vendedor),
            backgroundColor: "#E0C040",
          },
          {
            label: "Tendencia Equipo",
            data: tendenciaEquipo,
            type: "line",
            borderColor: "#909090",
            borderWidth: 2,
            fill: false,
            tension: 0.3,
          },
          {
            label: "Tendencia Closer",
            data: tendenciaVendedor,
            type: "line",
            borderColor: "#FFD700",
            borderWidth: 2,
            fill: false,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // Ajuste para pantallas responsivas
        scales: {
          x: {
            stacked: false,
            categoryPercentage: 0.8,
            barPercentage: 0.6,
          },
          y: {
            stacked: false,
            beginAtZero: true,
          },
        },
      },
    });

  };

  useEffect(() => {
    if (data.length === 0) return;

    const resumenPorCloser = {};
    const registrosPorCliente = {};

    // Organizar registros por cliente
    data.forEach((row) => {
      const clienteID = row["Nombre cliente"];
      if (!registrosPorCliente[clienteID]) registrosPorCliente[clienteID] = [];
      registrosPorCliente[clienteID].push(row);
    });

    // Ordenar registros por fecha
    Object.keys(registrosPorCliente).forEach((clienteID) => {
      registrosPorCliente[clienteID].sort((a, b) => new Date(a["Fecha correspondiente"]) - new Date(b["Fecha correspondiente"]));
    });

    // Filtrar solo los agendamientos
    const agendamientos = data.filter((row) => row["Agenda"] === 1);

    // Procesar cada agendamiento
    agendamientos.forEach((row) => {
      const fechaAgendamiento = new Date(row["Fecha correspondiente"]);
      const clienteID = row["Nombre cliente"];
      const closer = row["Closer Actual"] || row["Responsable"]; // Usar "Responsable" si "Closer Actual" es null

      if (!closer || closer === "Sin Closer") return;

      // Inicializar el resumen para el closer si no existe
      if (!resumenPorCloser[closer]) {
        resumenPorCloser[closer] = {
          agendas: 0,
          asistencias: 0,
          inasistencias: 0,
          recuperados: 0,
          descalificadas: 0,
          cerradas: 0,
          sinAsistencia: 0,
          asistenciasConVenta: 0,
        };
      }

      // Contar el agendamiento
      resumenPorCloser[closer].agendas++;

      // Verificar si el registro actual cumple con las condiciones de descalificación
      if (row["Agenda"] == 1 && row["Aplica?"] == "No aplica") {
        resumenPorCloser[closer].descalificadas++;
      }

      // Obtener registros posteriores al agendamiento
      const registrosPosteriores = registrosPorCliente[clienteID]?.filter(
        (r) => new Date(r["Fecha correspondiente"]) > fechaAgendamiento
      ) || [];

      // Verificar si hay algún registro posterior que cumpla con las condiciones de descalificación
      const descalificadaPosterior = registrosPosteriores.some(
        (r) => r["Agenda"] == 1 && r["Aplica?"] == "No aplica"
      );

      // Si se encuentra una descalificación posterior, incrementar el contador
      if (descalificadaPosterior) {
        resumenPorCloser[closer].descalificadas++;
      }

      // Obtener el último registro posterior
      const ultimoRegistro = registrosPosteriores.length > 0
        ? registrosPosteriores[registrosPosteriores.length - 1]
        : null;

      // Procesar el último registro posterior
      if (ultimoRegistro) {
        // Contar asistencias
        if (ultimoRegistro["Asistio?"] === "Asistió") {
          resumenPorCloser[closer].asistencias++;
          if (ultimoRegistro["Venta Meg"] === 1) {
            resumenPorCloser[closer].asistenciasConVenta++;
          }
        }

        // Contar recuperados
        if (ultimoRegistro["Asistio?"] === "Recuperado") {
          resumenPorCloser[closer].recuperados++;
        }

        // Contar inasistencias
        if (ultimoRegistro["Asistio?"] !== "Asistió" && ultimoRegistro["Asistio?"] !== "Recuperado") {
          resumenPorCloser[closer].inasistencias++;
        }

        // Contar ventas cerradas
        if (ultimoRegistro["Venta Meg"] === 1) {
          resumenPorCloser[closer].cerradas++;
        }
      }
    });

    // Calcular porcentajes
    Object.keys(resumenPorCloser).forEach((closer) => {
      const stats = resumenPorCloser[closer];
      stats.percentages = {
        "Asistencia": ((stats.agendas > 0 ? stats.asistencias / stats.agendas : 0) * 100).toFixed(2) + "%",
        "No Asiste": ((stats.agendas > 0 ? stats.inasistencias / stats.agendas : 0) * 100).toFixed(2) + "%",
        "Recuperado": ((stats.agendas > 0 ? stats.recuperados / stats.agendas : 0) * 100).toFixed(2) + "%",
        "No Aplican": ((stats.agendas > 0 ? stats.descalificadas / stats.agendas : 0) * 100).toFixed(2) + "%",
        "Cerradas": ((stats.agendas > 0 ? stats.cerradas / stats.agendas : 0) * 100).toFixed(2) + "%",
        "S/Asistencia": ((stats.asistencias > 0 ? stats.asistenciasConVenta / stats.asistencias : 0) * 100).toFixed(2) + "%",
      };
    });


    setResumen(resumenPorCloser);

  }, [data]);



  //chequear los porcentajes de aplica y no aplica
  //agendas totales no lleva porcentaje
  //cerradas tiene que tomar cuando % de las agendas totales se cerraron
  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Dashboard de Ventas</h2>
      <div className=" gap-4 mb-6 flex flex-col justify-center items-center md:flex-row md:items-center md:justify-between">
        <DatePicker
          selected={startDate}
          onChange={handleDateChange}
          startDate={startDate}
          endDate={endDate}
          locale={es}
          selectsRange
          className="p-2 border rounded-lg shadow-sm bg-white w-[16vw] "
          placeholderText="Seleccionar rango de fechas"
        />

        <input
          type="month"
          value={monthFilter}
          onChange={(e) => {
            setMonthFilter(e.target.value);
            setDateRange([null, null]);
          }}
          className="p-2 border rounded-lg shadow-sm bg-white uppercase h-16 md:h-10"
        />
        <select value={closerFilter} onChange={(e) => setCloserFilter(e.target.value)} className="p-2 border rounded-lg shadow-sm bg-white w-48 h-16 md:h-10 ">
          <option value="">Seleccione un closer</option>
          {closers
            .filter((closer) => closer !== null && closer !== "" && closer !== "Nadia")
            .map((closer) => (
              <option key={closer} value={closer}>{closer}</option>
            ))
          }
        </select>
      </div>
      { /*grafico equipo vs closer seleccionado */}
      <div className="w-full max-w-6xl mx-auto p-6 flex flex-col items-center">
        <h3 className="text-lg font-semibold text-gray-700 mt-6 text-center">Tendencia de Ventas</h3>

        <div className="relative w-full max-w-4xl h-[350px] sm:h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center bg-white rounded-lg shadow-md">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg shadow-md">
              <div className="w-10 h-10 border-4 border-[#E0C040] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <canvas ref={canvasRef} className="w-full h-full"></canvas>
        </div>
      </div>


      { /*Tabla resumen de closers */}
      <div className="w-full  py-6 max-w-7xl mx-auto ">

        <h3 className="text-lg w-full py-2 font-semibold text-gray-700 text-center">Resumen por Closer</h3>
        <div className="w-full md:max-w-6xl mx-auto overflow-x-auto">
          {isLoading ? (
            // 🔹 Skeleton Loader mientras los datos están cargando
            <table className="w-full bg-white shadow-md rounded-lg text-xs md:text-sm table-auto">
              <thead>
                <tr className="bg-gray-200 text-gray-700 text-center">
                  {Array.from({ length: 14 }).map((_, index) => (
                    <th key={index} className="p-2 font-bold">
                      <div className="w-16 h-4 bg-gray-300 rounded animate-pulse mx-auto"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b text-center animate-pulse">
                    {Array.from({ length: 14 }).map((_, idx) => (
                      <td key={idx} className="p-2">
                        <div className="w-14 h-4 bg-gray-200 rounded mx-auto"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            // 🔹 Tabla de datos cuando la carga ha terminado
            <table className="w-full bg-white shadow-md rounded-lg text-xs md:text-sm table-auto">
              <thead>
                <tr className="bg-gray-200 text-gray-700 text-center">
                  <th className="p-2 font-bold text-left">Closer</th>
                  <th className="p-2 font-bold">Agendas</th>
                  <th className="p-2 font-bold">Recuperados</th>
                  <th className="p-2 font-bold">%</th>
                  <th className="p-2 font-bold">Asistencias</th>
                  <th className="p-2 font-bold">%</th>
                  <th className="p-2 font-bold">Inasistencias</th>
                  <th className="p-2 font-bold">%</th>
                  <th className="p-2 font-bold">Descalificadas</th>
                  <th className="p-2 font-bold">%</th>
                  <th className="p-2 font-bold">Cerradas</th>
                  <th className="p-2 font-bold">%</th>
                  <th className="p-2 font-bold w-40">S/Asistencia %</th>

                </tr>
              </thead>
              <tbody>
                {Object.entries(resumen).length > 0 ? (
                  Object.entries(resumen)
                    .filter(([closer]) => closer !== "Sin Closer") // 🔹 Ocultar "Sin Closer"
                    .map(([closer, datos]) => {
                      const percentages = datos.percentages || {};

                      return (
                        <tr key={closer} className="border-b hover:bg-gray-100 transition text-center">
                          <td className="p-2 text-gray-800 text-left font-semibold">{closer}</td>
                          <td className="p-2 text-gray-700">{datos.agendas || 0}</td>
                          <td className="p-2 text-gray-700">{datos.recuperados || 0}</td>
                          <td className="p-2 text-green-600 font-semibold">
                            {percentages["Recuperado"] || "0%"}
                          </td>
                          <td className="p-2 text-gray-700">{datos.asistencias || 0}</td>
                          <td className="p-2 text-blue-600 font-semibold">
                            {percentages["Asistencia"] || "0%"}
                          </td>
                          <td className="p-2 text-gray-700">{datos.inasistencias || 0}</td>
                          <td className="p-2 text-red-600 font-semibold">
                            {percentages["No Asiste"] || "0%"}
                          </td>
                          <td className="p-2 text-gray-700">{datos.descalificadas || 0}</td>
                          <td className="p-2 text-gray-500 font-semibold">
                            {percentages["No Aplican"] || "0%"}
                          </td>
                          <td className="p-2 text-gray-700">{datos.cerradas || 0}</td>
                          <td className="p-2 text-purple-600 font-semibold">
                            {percentages["Cerradas"] || "0%"}
                          </td>

                          <td className="p-2 text-orange-600 font-semibold">
                            {percentages["S/Asistencia"] || "0%"}
                          </td>
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td colSpan="14" className="p-3 text-gray-600 text-center">
                      No hay datos disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

        </div>

      </div>


      {closerFilter && totals[closerFilter] ? (
        <div className="w-full max-w-6xl mx-auto overflow-x-auto text-xs md:text-sm">
          <h3 className="text-lg w-full py-2 font-semibold text-gray-700 text-center">
            Resumen del Closer seleccionado
          </h3>
          <table className="w-full min-w-[700px] max-w-full bg-white shadow-md rounded-lg">
            <tbody>
        
              <tr className="bg-gray-200">
                <td className="p-3 font-bold text-gray-700">Métrica</td>
                <td className="p-3 text-gray-600 font-bold">Valor</td>
                <td className="p-3 text-gray-600 font-bold">Porcentaje</td>
                <td className="p-3 text-gray-600 font-bold">Objetivo</td>
                <td className="p-3 text-gray-600 font-bold">Base</td>
              </tr>

              {Object.entries(totals[closerFilter])
                .filter(([key]) => key !== "percentages")
                .map(([key, value]) => {
                  const isIntegerValue = [
                    "Agendas totales",
                    "Ofertas Ganadas",
                    "Cerradas",
                    "Asistencia",
                    "Recuperado",
                    "No asiste",
                    "No aplican",
                    "Aplican",
                    "Cierre/Asistencias"
                  ].includes(key);

                  const formattedValue =
                    typeof value === "object"
                      ? "" 
                      : isIntegerValue
                        ? Number(value).toLocaleString("es-AR", { maximumFractionDigits: 0 }) // Entero
                        : Number(value).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); // Decimal

                  return (
                    <tr key={key} className="border-b">                  
                      <td className="p-3 font-semibold text-gray-700">{key}</td>
                      <td className="p-3 text-gray-700">{formattedValue}</td>
                      <td className="p-3 text-gray-700">
                        {totals[closerFilter].percentages[key] || "-"}
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          className="border p-2 w-28 rounded"
                          value={inputs[closerFilter]?.[key]?.objetivo || ""}
                          onChange={(e) =>
                            handleInputChange(closerFilter, key, {
                              ...inputs[closerFilter]?.[key],
                              objetivo: e.target.value,
                            })
                          }
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          className="border p-2 w-28 rounded"
                          value={inputs[closerFilter]?.[key]?.base || ""}
                          onChange={(e) =>
                            handleInputChange(closerFilter, key, {
                              ...inputs[closerFilter]?.[key],
                              base: e.target.value,
                            })
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500 mt-4">
          {closerFilter
            ? "El closer seleccionado no tiene datos."
            : "Seleccione un closer para ver los datos."}
        </p>
      )}
    </div>
  );
};

export default DashboardTable;
