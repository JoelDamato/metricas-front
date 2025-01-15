import React, { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import Table from "./Tablellamadas.jsx";

export default function SalesMetricsChart() {
  const [originalData, setOriginalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-12-31");
  const [activeButton, setActiveButton] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedOrigin, setSelectedOrigin] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const metrics = [
    "Llamadas aplicables",
    "Llamadas agendadas",
    "Llamadas efectuadas",
    "Ofertas ganadas",
  ];

  useEffect(() => {
    const API_BASE_URL =
      process.env.NODE_ENV === "production"
        ? "https://metricas-back.onrender.com/data"
        : "http://localhost:3000/data";

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(API_BASE_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log("Response Status:", response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error en la respuesta:", errorData);
          throw new Error(`Error ${response.status}: ${errorData.msg || response.statusText}`);
        }

        const result = await response.json();
        console.log("Datos recibidos del endpoint:", result);

        // Aplanar los datos si vienen en fragmentos
        const flatData = Array.isArray(result) ? result.flat() : result.data || [];
        console.log("Datos aplanados:", flatData);

        const validData = flatData.map((item) => {
          const dateString = item["Fecha creada "];
          const parseDate = (dateString) => {
            if (!dateString) return null;
            const [datePart] = dateString.split(" ");
            const [day, month, year] = datePart.split("/").map(Number);
            return new Date(2000 + year, month - 1, day);
          };

          return {
            ...item,
            "Fecha creada": parseDate(dateString),
          };
        });

        console.log("Datos procesados:", validData);
        setOriginalData(validData.filter((item) => item["Fecha creada"]));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const origins = [...new Set(originalData.map((d) => d.Origen))].filter(Boolean);
  console.log("Orígenes disponibles:", origins);

  const employees = [...new Set(originalData.map((d) => d["Closer Actual"]).filter(Boolean))];

  console.log("Closers disponibles:", employees);

  useEffect(() => {
    if (selectedMetrics.length === 0) return;

    console.log("Original Data antes de filtrar:", originalData);

    const filtered = originalData.filter((item) => {
      const date = item["Fecha creada"];
      const matchesDate = date >= new Date(startDate) && date <= new Date(endDate);
      const matchesOrigin = selectedOrigin ? item.Origen === selectedOrigin : true;
      const matchesEmployee = selectedEmployees.length
        ? selectedEmployees.includes(item["Closer Actual"])
        : true;

      return matchesDate && matchesOrigin && matchesEmployee;
    });

    console.log("Datos filtrados:", filtered);
    setFilteredData(filtered);
    updateChart(filtered);
  }, [startDate, endDate, selectedMetrics, selectedEmployees, selectedOrigin, targetValue, originalData]);

  const processDailyData = (data) => {
    return data.reduce((acc, item) => {
      const date = item["Fecha creada"];
      if (!date) return acc;
  
      const day = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${date.getFullYear()}`;
  
      if (!acc[day]) {
        acc[day] = {};
  
        selectedMetrics.forEach((metric) => {
          acc[day][metric] = 0;
          if (selectedEmployees.length) {
            selectedEmployees.forEach((employee) => {
              acc[day][`metric_${employee}`] = 0;
            });
          }
        });
      }
  
      selectedMetrics.forEach((metric) => {
        acc[day][metric] += item[metric] || 0;
        if (selectedEmployees.length) {
          selectedEmployees.forEach((employee) => {
            if (item["Closer Actual"] === employee) {
              acc[day][`metric_${employee}`] += item[metric] || 0;
            }
          });
        }
      });
  
      return acc;
    }, {});
  };
  
  const updateChart = (data) => {
    const groupedData = processDailyData(data);
    console.log("Datos agrupados por día:", groupedData);
  
    const labels = Object.keys(groupedData).sort((a, b) => {
      const [dayA, monthA, yearA] = a.split("/").map(Number);
      const [dayB, monthB, yearB] = b.split("/").map(Number);
      return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
    });
  
    console.log("Etiquetas del gráfico (días):", labels);
  
    const datasets = selectedMetrics.map((metric, index) => ({
      label: metric,
      data: labels.map((key) => groupedData[key][metric] || 0),
      borderColor: getLineColor(index),
      tension: 0.3,
      borderDash: [5, 5], // Línea entrecortada para métricas
      fill: false,
    }));
  
    if (selectedEmployees.length > 0) {
      selectedEmployees.forEach((employee, index) => {
        datasets.push({
          label: `Métrica para ${employee}`,
          data: labels.map((key) => groupedData[key][`metric_${employee}`] || 0),
          borderColor: getLineColor(index + selectedMetrics.length),
          tension: 0.3,
          borderDash: [], // Línea sólida para closers
          fill: false,
        });
      });
    }
  
    if (targetValue) {
      datasets.push({
        label: "Valor Objetivo",
        data: labels.map(() => Number(targetValue)),
        borderColor: "#FF0000",
        borderDash: [15, 5], // Línea entrecortada larga para el valor objetivo
        tension: 0.3,
        fill: false,
      });
    }
  
    console.log("Datasets para el gráfico:", datasets);
  
    const ctx = chartRef.current.getContext("2d");
    if (chartInstance.current) chartInstance.current.destroy();
  
    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: { legend: { position: "top" } },
        scales: { 
          y: { beginAtZero: true },
          x: { title: { display: true, text: "Días" } },
        },
      },
    });
  };
  

  const setCurrentMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
    setActiveButton("currentMonth");
  };

  const setLast12Months = () => {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    setStartDate(twelveMonthsAgo.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
    setActiveButton("last12Months");
  };

  return (
    <>
  
 <Table/>

    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 text-gray-800">
      <aside className="md:w-1/4 w-full p-6 bg-white shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Filtros</h2>
        <div className="mb-4">
          <label>Origen:</label>
          <select
            className="w-full p-2 border rounded-md"
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
          >
            <option value="">Todos</option>
            {origins.map((origin) => (
              <option key={origin} value={origin}>
                {origin}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label>Desde:</label>
          <input
            type="date"
            className="w-full p-2 border rounded-md"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <label>Hasta:</label>
          <input
            type="date"
            className="w-full p-2 border rounded-md"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="mb-4 flex space-x-2">
          <button
            onClick={setCurrentMonth}
            className={`px-4 py-2 rounded-md ${
              activeButton === "currentMonth"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Mes Actual
          </button>
          <button
            onClick={setLast12Months}
            className={`px-4 py-2 rounded-md ${
              activeButton === "last12Months"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Últimos 12 Meses
          </button>
        </div>
        <div className="mb-4">
          <label>Valor Objetivo:</label>
          <input
            type="number"
            className="w-full p-2 border rounded-md"
            placeholder="Ingrese valor"
            value={targetValue}
            onChange={(e) => setTargetValue(e.target.value)}
          />
        </div>
        <h3 className="font-semibold mb-2">Métricas:</h3>
        {metrics.map((metric) => (
          <div key={metric} className="flex items-center justify-between mb-2">
            <span>{metric.replace("_", " ")}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={selectedMetrics.includes(metric)}
                onChange={(e) =>
                  setSelectedMetrics((prev) =>
                    e.target.checked
                      ? [...prev, metric]
                      : prev.filter((m) => m !== metric)
                  )
                }
              />
              <div className="w-11 h-6 bg-gray-200 peer-checked:bg-blue-600 rounded-full"></div>
            </label>
          </div>
        ))}
<div className="mb-4">
  <h3 className="font-semibold mb-2">Seleccionar Closers:</h3>
  {employees.map((employee) => (
    <div key={employee} className="flex items-center justify-between mb-2">
      <span>{employee}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={selectedEmployees.includes(employee)}
          onChange={(e) =>
            setSelectedEmployees((prev) =>
              e.target.checked
                ? [...prev, employee]
                : prev.filter((emp) => emp !== employee)
            )
          }
        />
        <div className="w-11 h-6 bg-gray-200 peer-checked:bg-blue-600 rounded-full"></div>
      </label>
    </div>
  ))}
</div>



      </aside>

      <main className="md:w-3/4 w-full p-8">

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {selectedMetrics.map((metric) => {
      const totalByOrigin = filteredData.reduce((acc, item) => {
        const origin = item.Origen || "Sin Origen";
        acc[origin] = (acc[origin] || 0) + (item[metric] || 0);
        return acc;
      }, {});
  
      const totalByCloser = selectedEmployees.length
        ? selectedEmployees.reduce((acc, closer) => {
            acc[closer] = filteredData
              .filter((item) => item["Closer Actual"] === closer)
              .reduce((sum, item) => sum + (item[metric] || 0), 0);
            return acc;
          }, {})
        : {};
  
      const totalGeneral = Object.values(totalByOrigin).reduce((a, b) => a + b, 0);
  
      return (
        <div
          key={metric}
          className="bg-white p-6 rounded-md shadow-md flex flex-col items-center"
        >
          <h4 className="font-bold text-lg mb-4 text-center">{metric}</h4>
          <div className="text-6xl font-bold text-blue-600 mb-4">
            {totalGeneral}
          </div>
          <div className="w-full">
            <h5 className="font-semibold mb-2">Por Origen:</h5>
            {Object.entries(totalByOrigin).map(([origin, total]) => (
              <p key={origin} className="text-sm">
                {origin}: <span className="font-bold">{total}</span>
              </p>
            ))}
            {Object.keys(totalByCloser).length > 0 && (
              <div className="mt-4">
                <h5 className="font-semibold mb-2">Por Closer:</h5>
                {Object.entries(totalByCloser).map(([closer, total]) => (
                  <p key={closer} className="text-sm">
                    {closer}: <span className="font-bold">{total}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    })}
  </div>

        {isLoading ? (
          <div className="text-center">Cargando datos...</div>
        ) : selectedMetrics.length > 0 ? (
          <div>

            <div className="bg-white p-6 shadow rounded-md">
              <canvas ref={chartRef} />
            </div>
          </div>
        ) : (
          <div className="text-center">Seleccione al menos una métrica.</div>
        )}
      </main>
    </div>
    </>
  );
}

const getLineColor = (index) => {
  const colors = ["#3B82F6", "#22C55E", "#9333EA", "#FACC15", "#EF4444"];
  return colors[index % colors.length];
};
