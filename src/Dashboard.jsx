import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Chart } from "chart.js/auto";


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
      groupedByCloser[closer]["Ofertas Ganadas"] += row["Venta Meg"] ? row["Venta Meg"] : 0;
      groupedByCloser[closer]["Cash collected"] += row["Cash collected total"] || 0;
      groupedByCloser[closer]["Agendas totales"] += row["Agenda"] || 0;
      groupedByCloser[closer]["Cerradas"] += row["Venta Meg"] || 0;
      groupedByCloser[closer]["Cierre/Asistencias"] += row["Venta Meg"] && row["Llamadas efectuadas"] ? 1 : 0;
      groupedByCloser[closer]["Asistencia"] += row["Llamadas efectuadas"] || 0;
      groupedByCloser[closer]["Recuperado"] += row["Asistio?"]?.includes("Recuperado") ? 1 : 0;
      groupedByCloser[closer]["No asiste"] += (row["Agenda"] || 0) - (row["Llamadas efectuadas"] || 0);
      groupedByCloser[closer]["No aplican"] += row["Aplica?"] === "No aplica" ? 1 : 0;
      groupedByCloser[closer]["Aplican"] += row["Aplica?"]?.includes("Aplica") ? 1 : 0;
    });

    Object.keys(groupedByCloser).forEach((closer) => {
      const stats = groupedByCloser[closer];
      stats.percentages = {
        "Cash collected": ((stats["Total Sales"] > 0 ? stats["Cash collected"] / stats["Total Sales"] : 0) * 100).toFixed(2) + "%",
        "Agendas totales": ((stats["Agendas totales"] > 0 ? stats["Cerradas"] / stats["Agendas totales"] : 0) * 100).toFixed(2) + "%",
        "Cierre/Asistencias": ((stats["Asistencia"] + stats["Recuperado"] > 0 ? stats["Cierre/Asistencias"] / (stats["Asistencia"] + stats["Recuperado"]) : 0) * 100).toFixed(2) + "%",
        "Asistencia": ((stats["Agendas totales"] > 0 ? (stats["Asistencia"] + stats["Recuperado"]) / stats["Agendas totales"] : 0) * 100).toFixed(2) + "%",
        "No asiste": ((stats["Agendas totales"] > 0 ? stats["No asiste"] / stats["Agendas totales"] : 0) * 100).toFixed(2) + "%",
        "No aplican": ((stats["Agendas totales"] > 0 ? stats["No aplican"] / stats["Agendas totales"] : 0) * 100).toFixed(2) + "%",
        "Aplican": ((stats["Agendas totales"] > 0 ? stats["Aplican"] / stats["Agendas totales"] : 0) * 100).toFixed(2) + "%",
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

  //logica para calcular ventas x fecha y obtener datos para mostrar en la tabla
  useEffect(() => {
    if (data.length === 0) return;

    const formatDate = (dateString) => new Date(dateString).toISOString().split("T")[0];

    const ventasPorFecha = {};

    data.forEach((row) => {
      if (row["Venta Club"] !== 1 && formatDate(row["Fecha correspondiente"]).slice(0, 7) === monthFilter) {
        const fecha = formatDate(row["Fecha correspondiente"]);

        if (!ventasPorFecha[fecha]) ventasPorFecha[fecha] = { equipo: 0, vendedor: 0 };

        if (row["Venta Meg"] === 1) {
          ventasPorFecha[fecha].equipo++;
          if (closerFilter && row["Closer Actual"] === closerFilter) {
            ventasPorFecha[fecha].vendedor++;
          }
        }
      }
    });

    renderizarGraficoVentas(ventasPorFecha);
  }, [monthFilter, closerFilter, data]);

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
        maintainAspectRatio: false, //dejar en false para que el grafico se ajuste a todas las pantallas
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

  // Lógica para construir la tabla de resumen por Closer/Setter
  useEffect(() => {
    if (data.length === 0) return;

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    };

    const resumenPorCloser = {};
    const registrosPorCliente = {};

    //agrupa registros por cliente
    data.forEach((row) => {
      const clienteID = row["Nombre cliente"];
      if (!registrosPorCliente[clienteID]) registrosPorCliente[clienteID] = [];
      registrosPorCliente[clienteID].push(row);
    });

    //filtra "Agendamiento" == true
    const agendamientos = data.filter((row) => row["Agenda"] === 1);

    agendamientos.forEach((row) => {
      const fechaAgendamiento = formatDate(row["Fecha correspondiente"]);
      const clienteID = row["Nombre cliente"];
      const closer = row["Closer Actual"];

      if (!closer || closer === "Sin Closer") return;

      if (!resumenPorCloser[closer]) {
        resumenPorCloser[closer] = {
          agendas: 0,
          recuperados: 0,
          inasistencias: 0,
          descalificadas: 0,
          cerradas: 0,
          sinAsistencia: 0, //consultar a leo
        };
      }

      //registros posteriores al agendamiento
      const registrosPosteriores = registrosPorCliente[clienteID]?.filter(
        (r) => new Date(r["Fecha correspondiente"]) > new Date(fechaAgendamiento)
      ) || [];

      registrosPosteriores.forEach((registro) => {
        if (registro["Agenda"] === 1) resumenPorCloser[closer].agendas++;
        if (registro["Asistio?"] === "Recuperado") resumenPorCloser[closer].recuperados++;
        if (registro["Asistio?"] === "No Asistio") resumenPorCloser[closer].inasistencias++;
        if (registro["Agenda"] === 1 && registro["Aplica?"] === "No aplica") resumenPorCloser[closer].descalificadas++;
        if (registro["Venta Meg"] === 1) resumenPorCloser[closer].cerradas++;
      });
    });

    Object.keys(resumenPorCloser).forEach((closer) => {
      const stats = resumenPorCloser[closer];
      stats.percentages = {
        "Recuperado": ((stats.agendas > 0 ? stats.recuperados / stats.agendas : 0) * 100).toFixed(2) + "%",
        "Asistencia": ((stats.agendas > 0 ? (stats.recuperados + stats.inasistencias) / stats.agendas : 0) * 100).toFixed(2) + "%",
        "No Asiste": ((stats.agendas > 0 ? stats.inasistencias / stats.agendas : 0) * 100).toFixed(2) + "%",
        "No Aplican": ((stats.agendas > 0 ? stats.descalificadas / stats.agendas : 0) * 100).toFixed(2) + "%",
        "Cerradas": ((stats.agendas > 0 ? stats.cerradas / stats.agendas : 0) * 100).toFixed(2) + "%",
        "S/Asistencia": ((stats.agendas > 0 ? stats.sinAsistencia / stats.agendas : 0) * 100).toFixed(2) + "%",
      };
    });

    setResumen(resumenPorCloser);
  }, [data]);



  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Dashboard de Ventas</h2>
      <div className=" gap-4 mb-6 flex flex-col justify-center items-center md:flex-row md:items-center md:justify-between">
        <input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="p-2 border rounded-lg shadow-sm bg-white uppercase  h-16 md:h-10 " />
        <select value={closerFilter} onChange={(e) => setCloserFilter(e.target.value)} className="p-2 border rounded-lg shadow-sm bg-white w-48 h-16 md:h-10 ">
          <option value="">Seleccione un closer</option>
          {closers
            .filter((closer) => closer !== null && closer !== "")
            .map((closer) => (
              <option key={closer} value={closer}>{closer}</option>
            ))
          }
        </select>
      </div>
      { /*grafico equipo vs closer seleccionado */}
      <div className="w-full max-w-6xl mx-auto p-6 flex flex-col items-center">
        <h3 className="text-lg font-semibold text-gray-700 mt-6 text-center">Tendencia de Ventas</h3>
        <div className="relative w-full max-w-4xl h-[350px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
          <canvas ref={canvasRef} className="w-full h-full"></canvas>
        </div>
      </div>


      { /*Tabla resumen de closers */}
      <div className="w-full  py-6 max-w-7xl mx-auto ">

        <h3 className="text-lg w-full py-2 font-semibold text-gray-700 text-center">Resumen por Closer</h3>
        <div className="w-full md:max-w-6xl mx-auto overflow-x-auto">
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
                <th className="p-2 font-bold">S/Asistencia</th>
                <th className="p-2 font-bold">%</th>
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
                        <td className="p-2 text-gray-700">{datos.sinAsistencia || 0}</td>
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
        </div>

      </div>


      {closerFilter && totals[closerFilter] ? (
        <div className="w-full max-w-6xl mx-auto overflow-x-auto text-xs md:text-sm">
          <h3 className="text-lg w-full py-2 font-semibold text-gray-700 text-center">Resumen del Closer seleccionado</h3>
          <table className="w-full min-w-[700px] max-w-full bg-white  shadow-md rounded-lg">
            <tbody>
              <tr className="bg-gray-200 ">
                <td className="p-3 font-bold text-gray-700">Closer</td>
                <td className="p-3 text-gray-600 font-bold" >{closerFilter}</td>
                <td className="p-3 text-gray-600 font-bold">Actual</td>
                <td className="p-3 text-gray-600 font-bold">Objetivo</td>
                <td className="p-3 text-gray-600 font-bold">Base</td>
              </tr>
              {Object.entries(totals[closerFilter])
                .filter(([key]) => key !== "percentages")
                .map(([key, value]) => (
                  <tr key={key} className="border-b">
                    <td className="p-3 font-semibold text-gray-700">{key}</td>
                    <td className="p-3 text-gray-700">{typeof value === 'object' ? '' : value}</td>
                    <td className="p-3 text-gray-700">{totals[closerFilter].percentages[key] || "-"}</td>
                    <td className="p-3">
                      <input
                        type="text"
                        className="border p-2 w-full rounded"
                        value={inputs[closerFilter]?.[key]?.objetivo || ""}
                        onChange={(e) => handleInputChange(closerFilter, key, { ...inputs[closerFilter]?.[key], objetivo: e.target.value })}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        className="border p-2 w-full rounded"
                        value={inputs[closerFilter]?.[key]?.base || ""}
                        onChange={(e) => handleInputChange(closerFilter, key, { ...inputs[closerFilter]?.[key], base: e.target.value })}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      ) : (<p className="text-gray-500 mt-4">Seleccione un closer para ver los datos o el closer seleccionado no tiene datos.</p>)}
    </div>
  );
};

export default DashboardTable;
