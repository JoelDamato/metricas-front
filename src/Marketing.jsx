import React, { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";

export default function Marketing() {
  const [originalData, setOriginalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2024-12-31");
  const [activeButton, setActiveButton] = useState("");
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [targetValue, setTargetValue] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const API_BASE_URL = "http://localhost:3000/llamadas";

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(API_BASE_URL);
        const result = await response.json();
        setOriginalData(result);
      } catch (error) {
        console.error("Error al obtener los datos:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedMetrics.length === 0) return;

    const filtered = originalData.filter((item) => {
      const date = new Date(item.fecha_creada);
      const matchesOrigin = selectedOrigin === "all" || item.origen === selectedOrigin;
      return matchesOrigin && date >= new Date(startDate) && date <= new Date(endDate);
    });
    setFilteredData(filtered);
    updateChart(filtered);
  }, [startDate, endDate, selectedMetrics, selectedEmployees, targetValue, selectedOrigin]);

  const groupDataByDay = (data) => {
    const grouped = {};

    data.forEach((item) => {
      const dateObj = new Date(item.fecha_creada);
      const day = `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${dateObj.getFullYear()}`;

      if (!grouped[day]) grouped[day] = { day };

      selectedMetrics.forEach((metric) => {
        if (!grouped[day][metric]) grouped[day][metric] = 0;
        grouped[day][metric] += item[metric] || 0;

        if (item.closer && item.setter) {
          if (item.closer === item.setter) {
            const setterKey = `${metric}_${item.setter}`;
            if (!grouped[day][setterKey]) grouped[day][setterKey] = 0;
            grouped[day][setterKey] += item[metric] || 0;
          } else {
            const closerKey = `${metric}_${item.closer}`;
            if (!grouped[day][closerKey]) grouped[day][closerKey] = 0;
            grouped[day][closerKey] += item[metric] || 0;
          }
        } else if (item.closer) {
          const closerKey = `${metric}_${item.closer}`;
          if (!grouped[day][closerKey]) grouped[day][closerKey] = 0;
          grouped[day][closerKey] += item[metric] || 0;
        } else if (item.setter) {
          const setterKey = `${metric}_${item.setter}`;
          if (!grouped[day][setterKey]) grouped[day][setterKey] = 0;
          grouped[day][setterKey] += item[metric] || 0;
        }
      });
    });

    const sorted = Object.values(grouped).sort((a, b) => {
      const [dayA, monthA, yearA] = a.day.split("/").map(Number);
      const [dayB, monthB, yearB] = b.day.split("/").map(Number);

      return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
    });

    return sorted;
  };

  const updateChart = (data) => {
    const groupedData = groupDataByDay(data);

    const datasets = [];

    selectedMetrics.forEach((metric, metricIndex) => {
      datasets.push({
        label: metric.replace("_", " ").toUpperCase(),
        data: groupedData.map((d) => d[metric] || 0),
        borderColor: getLineColor(metricIndex),
        tension: 0.3,
        fill: false,
      });
    });

    if (selectedEmployees.length > 0) {
      selectedEmployees.forEach((employee, employeeIndex) => {
        selectedMetrics.forEach((metric, metricIndex) => {
          datasets.push({
            label: `${metric.replace("_", " ").toUpperCase()} - Empleado: ${employee}`,
            data: groupedData.map((d) => d[`${metric}_${employee}`] || 0),
            borderColor: getLineColor(metricIndex + employeeIndex + 5),
            borderDash: [10, 5],
            tension: 0.3,
            fill: false,
          });
        });
      });
    }

    if (targetValue) {
      datasets.push({
        label: "Valor Objetivo",
        data: new Array(groupedData.length).fill(parseInt(targetValue)),
        borderColor: "#EF4444",
        borderDash: [5, 5],
        fill: false,
      });
    }

    const ctx = chartRef.current.getContext("2d");
    if (chartInstance.current) chartInstance.current.destroy();

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: groupedData.map((d) => d.day),
        datasets,
      },
      options: {
        responsive: true,
        plugins: { legend: { position: "top" } },
        scales: { y: { beginAtZero: true } },
      },
    });
  };

  const employees = [...new Set([...originalData.map((d) => d.closer), ...originalData.map((d) => d.setter)])].filter(Boolean);
  const metrics = [
    "llamadas_agendadas",
    "llamadas_aplicables",
    "llamadas_efectuadas",
    "llamadas_no_efectuadas",
    "llamadas_vendidas",
    "ventaclub",
    "ventameg",
  ];

  const calculateTotals = () => {
    const totals = {};

    filteredData.forEach((item) => {
      selectedMetrics.forEach((metric) => {
        if (item.closer) {
          if (!totals[metric]) totals[metric] = 0;
          totals[metric] += item[metric] || 0;
        }
        if (item.setter) {
          if (!totals[metric]) totals[metric] = 0;
          totals[metric] += item[metric] || 0;
        }
      });
    });

    return totals;
  };

  const totals = calculateTotals();

  const uniqueOrigins = [...new Set(originalData.map((item) => item.origen || "Desconocido"))];

  return (
    <div className="flex min-h-screen bg-gray-100 text-gray-800">
      <aside className="w-1/4 p-6 bg-white shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Filtros</h2>
        <div className="mb-4">
          <label>Origen:</label>
          <select
            className="w-full p-2 border rounded-md"
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
          >
            <option value="all">Todos</option>
            {uniqueOrigins.map((origin) => (
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
        <div className="mb-4 flex gap-x-4">
          <button
            onClick={() => {
              const today = new Date();
              const lastYear = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
              setStartDate(lastYear.toISOString().split("T")[0]);
              setEndDate(today.toISOString().split("T")[0]);
              setActiveButton("last12Months");
            }}
            className={`flex-1 p-2 rounded-md ${
              activeButton === "last12Months"
                ? "bg-blue-700 text-white"
                : "bg-black text-white hover:bg-black"
            }`}
          >
            Últimos 12 meses
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
              const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
              setStartDate(firstDayOfMonth.toISOString().split("T")[0]);
              setEndDate(lastDayOfMonth.toISOString().split("T")[0]);
              setActiveButton("currentMonth");
            }}
            className={`flex-1 p-2 rounded-md ${
              activeButton === "currentMonth"
                ? "bg-blue-700 text-white"
                : "bg-black text-white hover:bg-black"
            }`}
          >
            Mes Actual
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
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={selectedMetrics.includes(metric)}
                onChange={() =>
                  setSelectedMetrics((prev) =>
                    prev.includes(metric)
                      ? prev.filter((m) => m !== metric)
                      : [...prev, metric]
                  )
                }
              />
              <div
                className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                  selectedMetrics.includes(metric) ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${
                    selectedMetrics.includes(metric) ? "translate-x-7" : "translate-x-0"
                  }`}
                ></div>
              </div>
              <span className="ml-3 text-sm">{metric.replace("_", " ")}</span>
            </label>
          </div>
        ))}

        <h3 className="font-semibold mt-4 mb-2">Empleados (Closer y Setter):</h3>
        {employees.map((employee) => (
          <div key={employee} className="flex items-center justify-between mb-2">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={selectedEmployees.includes(employee)}
                onChange={() =>
                  setSelectedEmployees((prev) =>
                    prev.includes(employee)
                      ? prev.filter((e) => e !== employee)
                      : [...prev, employee]
                  )
                }
              />
              <div
                className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                  selectedEmployees.includes(employee) ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <div
                  className={`absolute top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${
                    selectedEmployees.includes(employee)
                      ? "translate-x-7"
                      : "translate-x-0"
                  }`}
                ></div>
              </div>
              <span className="ml-3 text-sm">{employee}</span>
            </label>
          </div>
        ))}
      </aside>

      <main className="w-3/4 p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-full bg-gray-200">
            <div className="loader border-t-4 border-blue-500 w-12 h-12 rounded-full animate-spin"></div>
          </div>
        ) : selectedMetrics.length > 0 ? (
          <>
            <h1 className="text-3xl font-bold text-blue-700 text-center mb-6">Panel de Métricas</h1>
            <div className="grid grid-cols-3 gap-6 mb-6">
              {Object.entries(totals).map(([metric, value]) => (
                <MetricBox key={metric} title={metric.replace("_", " ")} value={value} />
              ))}
            </div>
            <div className="bg-white p-6 shadow rounded-md">
              <canvas ref={chartRef} />
            </div>
          </>
        ) : (
          <div className="text-center text-gray-500">Seleccione al menos una métrica para visualizar los datos.</div>
        )}
      </main>
    </div>
  );
}

const MetricBox = ({ title, value }) => (
  <div className="p-4 bg-white shadow rounded-md text-center">
    <p className="text-2xl font-bold text-blue-600">{value}</p>
    <p className="text-gray-600">{title}</p>
  </div>
);

const getLineColor = (index) => {
  const colors = ["#3B82F6", "#22C55E", "#9333EA", "#FACC15", "#EF4444"];
  return colors[index % colors.length];
};
