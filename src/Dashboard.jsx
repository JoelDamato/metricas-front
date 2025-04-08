import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Chart } from "chart.js/auto";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import es from "date-fns/locale/es";

import { ToastContainer, toast } from 'react-toastify';


const DashboardTable = () => {
  const API_URL = process.env.NODE_ENV === "production"
    ? "https://metricas-back.onrender.com/"
    : "https://metricas-back.onrender.com/"




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
  const [updatingMetric, setUpdatingMetric] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [objetivosCloser, setObjetivosCloser] = useState(null);



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
        const response = await axios.get(`${API_URL}dashboard`);
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



  const handleInputChange = (closer, metrica, value) => {

    setInputs((prev) => ({
      ...prev,
      [closer]: {
        ...prev[closer],
        [metrica]: {
          ...prev[closer]?.[metrica],
          ...value,
        },
      },
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

    // Filtrar los datos por el mes seleccionado
    const filteredData = data.filter((row) => {
      const fecha = new Date(row["Fecha correspondiente"]);
      const monthYear = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      return monthYear === monthFilter;
    });

    const resumenPorCloser = {};

    // Primera pasada: procesar todas las filas para contabilizar métricas por closer
    filteredData.forEach((row) => {
      // Usar "Closer Actual" si está disponible, de lo contrario usar "Responsable"
      const closer = row["Closer Actual"] || row["Responsable"];

      // Ignorar registros sin closer o con "Sin Closer"
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

      // Contar agendas
      if (row["Agenda"] === 1) {
        resumenPorCloser[closer].agendas++;
      }

      // Contar descalificadas
      if (row["Agenda"] === 1 && row["Aplica?"] === "No aplica") {
        resumenPorCloser[closer].descalificadas++;
      }

      // Contar asistencias y recuperados solo si hubo llamada efectuada
      if (row["Llamadas efectuadas"] === 1) {
        if (row["Asistio?"] === "Asistió") {
          resumenPorCloser[closer].asistencias++;
          if (row["Venta Meg"] === 1) {
            resumenPorCloser[closer].asistenciasConVenta++;
          }
        } else if (row["Asistio?"] === "Recuperado") {
          resumenPorCloser[closer].recuperados++;
        }
      }

      // Calcular inasistencias después de contar todo lo demás
      for (const closer in resumenPorCloser) {
        const resumen = resumenPorCloser[closer];
        resumen.inasistencias =
          resumen.agendas -
          resumen.descalificadas -
          resumen.asistencias -
          resumen.recuperados;

        if (resumen.inasistencias < 0) resumen.inasistencias = 0;
      }
 
      // Contar ventas cerradas
      if (row["Venta Meg"] === 1) {
        resumenPorCloser[closer].cerradas++;
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
       "S/Asistencia": ((stats.asistencias > 0 ? stats.asistenciasConVenta / stats.asistencias : 0) * 100).toFixed(2) + "%"
      };
    });

    setResumen(resumenPorCloser);
  }, [data, monthFilter]);



  useEffect(() => {
    if (closerFilter && monthFilter) {
      fetchObjetivosCloser(closerFilter, monthFilter).then((data) => {
        if (data && Object.keys(data.metricas).length > 0) {
          const metricas = data.metricas;


          setObjetivosCloser({ metricas });

          setInputs((prevInputs) => ({
            ...prevInputs,
            [closerFilter]: Object.keys(metricas).reduce((acc, metrica) => {
              acc[metrica] = {
                objetivo: metricas[metrica]?.objetivo ?? "",
                base: metricas[metrica]?.base ?? "",
              };
              return acc;
            }, {}),
          }));
        } else {
          setObjetivosCloser({ metricas: {} });

          setInputs((prev) => ({
            ...prev,
            [closerFilter]: {},
          }));
        }
      });
    } else {
      setObjetivosCloser({ metricas: {} });

      setInputs((prev) => ({
        ...prev,
        [closerFilter]: {},
      }));
    }
  }, [closerFilter, monthFilter]);



  const fetchObjetivosCloser = async (closer, monthFilter) => {

    try {
      const response = await axios.get(`${API_URL}objetivos-closer`, {
        params: { closer, monthFilter },
      });

      return response.data;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  };


  const handleUpdate = async (closer, metrica) => {
    try {
      setUpdatingMetric(metrica);

      const objetivo = inputs[closer]?.[metrica]?.objetivo;
      const base = inputs[closer]?.[metrica]?.base;


      const data = {
        closer,
        monthFilter,
        metricas: {
          [metrica]: {
            objetivo,
            base,
          },
        },
      };

      await axios.post(`${API_URL}update-objetivo-closer`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      toast.success("¡Objetivo actualizado con éxito!");

      const updatedData = await fetchObjetivosCloser(closer, monthFilter);

      if (updatedData && updatedData.length > 0) {
        const nuevasMetricas = updatedData[0]?.metricas || {};

        setObjetivosCloser({ metricas: nuevasMetricas });
        setInputs((prevInputs) => ({
          ...prevInputs,
          [closer]: Object.keys(nuevasMetricas).reduce((acc, key) => {
            acc[key] = {
              objetivo: nuevasMetricas[key]?.objetivo ?? "",
              base: nuevasMetricas[key]?.base ?? "",
            };
            return acc;
          }, {}),
        }));
      }
    } catch (error) {
      console.error("Error en actualización:", error);
      toast.error(error.response?.data?.message || "Error al actualizar el objetivo");
    } finally {
      setUpdatingMetric(null);
    }
  };




  //chequear los porcentajes de aplica y no aplica
  //agendas totales no lleva porcentaje
  //cerradas tiene que tomar cuando % de las agendas totales se cerraron
  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
      <ToastContainer position="bottom-right" />
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

        <h3 className="text-lg w-full py-2 font-semibold text-gray-700 text-start">Resumen por Closer</h3>
        {monthFilter && <h2 className="text-lg w-full py-2 font-semibold text-gray-700 text-start" >Mes correspondiente: {monthFilter} </h2>}
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
                  <th className="p-2 font-bold w-40">Cierre S/Asistencia %</th>

                </tr>
              </thead>
              <tbody>
                {Object.entries(resumen).length > 0 ? (
                  <>
                    {Object.entries(resumen)
                      .filter(([closer]) => closer !== "Sin Closer")
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
                      })}

                    {/* Fila de totales */}
                    {(() => {
                      // Calcular totales
                      const totales = Object.entries(resumen)
                        .filter(([closer]) => closer !== "Sin Closer")
                        .reduce((acc, [_, datos]) => {
                          acc.agendas += (datos.agendas || 0);
                          acc.recuperados += (datos.recuperados || 0);
                          acc.asistencias += (datos.asistencias || 0);
                          acc.inasistencias += (datos.inasistencias || 0);
                          acc.descalificadas += (datos.descalificadas || 0);
                          acc.cerradas += (datos.cerradas || 0);
                          return acc;
                        }, {
                          agendas: 0,
                          recuperados: 0,
                          asistencias: 0,
                          inasistencias: 0,
                          descalificadas: 0,
                          cerradas: 0
                        });

                      // Calcular porcentajes
                      const totalPercentages = {
                        "Recuperado": totales.agendas ? `${((totales.recuperados / totales.agendas) * 100).toFixed(1)}%` : "0%",
                        "Asistencia": totales.agendas ? `${((totales.asistencias / totales.agendas) * 100).toFixed(1)}%` : "0%",
                        "No Asiste": totales.agendas ? `${((totales.inasistencias / totales.agendas) * 100).toFixed(1)}%` : "0%",
                        "No Aplican": totales.agendas ? `${((totales.descalificadas / totales.agendas) * 100).toFixed(1)}%` : "0%",
                        "Cerradas": totales.agendas ? `${((totales.cerradas / totales.agendas) * 100).toFixed(1)}%` : "0%",
                        "S/Asistencia": totales.asistencias ? `${((totales.cerradas / totales.asistencias) * 100).toFixed(1)}%` : "0%"
                      };

                      return (
                        <tr className="bg-gray-200 font-bold text-center border-t-2 border-gray-400">
                          <td className="p-2 text-gray-800 text-left">TOTAL</td>
                          <td className="p-2 text-gray-700">{totales.agendas}</td>
                          <td className="p-2 text-gray-700">{totales.recuperados}</td>
                          <td className="p-2 text-green-600">{totalPercentages["Recuperado"]}</td>
                          <td className="p-2 text-gray-700">{totales.asistencias}</td>
                          <td className="p-2 text-blue-600">{totalPercentages["Asistencia"]}</td>
                          <td className="p-2 text-gray-700">{totales.inasistencias}</td>
                          <td className="p-2 text-red-600">{totalPercentages["No Asiste"]}</td>
                          <td className="p-2 text-gray-700">{totales.descalificadas}</td>
                          <td className="p-2 text-gray-500">{totalPercentages["No Aplican"]}</td>
                          <td className="p-2 text-gray-700">{totales.cerradas}</td>
                          <td className="p-2 text-purple-600">{totalPercentages["Cerradas"]}</td>
                          <td className="p-2 text-orange-600">{totalPercentages["S/Asistencia"]}</td>
                        </tr>
                      );
                    })()}
                  </>
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
                <td className="p-3 text-gray-600 font-bold">Acciones</td>
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
                    "Cierre/Asistencias",

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

                        <div className="relative flex items-center">
                          <span className="absolute left-2 text-gray-500 text-sm">%</span>
                          <input
                            type="text"
                            className="border p-2 w-28 rounded text-right pl-6"
                            value={
                              inputs?.[closerFilter]?.[key]?.objetivo !== undefined
                                ? inputs[closerFilter][key].objetivo
                                : objetivosCloser.metricas?.[key]?.objetivo !== undefined
                                  ? objetivosCloser.metricas[key].objetivo
                                  : ""
                            }
                            onChange={(e) =>
                              handleInputChange(closerFilter, key, {
                                objetivo: e.target.value,
                              })
                            }
                          />
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="relative flex items-center">
                          <span className="absolute left-2 text-gray-500 text-sm">%</span>
                          <input
                            type="text"
                            className="border p-2 w-28 rounded text-right pl-6"
                            value={
                              inputs?.[closerFilter]?.[key]?.base !== undefined
                                ? inputs[closerFilter][key].base
                                : objetivosCloser.metricas?.[key]?.base !== undefined
                                  ? objetivosCloser.metricas[key].base
                                  : ""
                            }
                            onChange={(e) =>
                              handleInputChange(closerFilter, key, {
                                base: e.target.value,
                              })
                            }
                          />
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="w-40  flex justify-start ">
                          <button
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center justify-center"
                            onClick={() => handleUpdate(closerFilter, key)}
                            disabled={updatingMetric === key}
                          >
                            {updatingMetric === key ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Actualizando...
                              </>
                            ) : (
                              "Actualizar"
                            )}
                          </button>
                        </div>

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
