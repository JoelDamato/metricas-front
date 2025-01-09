import React, { useState, useEffect, useRef } from "react"
import Chart from "chart.js/auto"
import Table from "./Tablellamadas.jsx"

export default function SalesMetricsChart() {
  const [originalData, setOriginalData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [startDate, setStartDate] = useState("2024-01-01")
  const [endDate, setEndDate] = useState("2024-12-31")
  const [activeButton, setActiveButton] = useState("")
  const [selectedMetrics, setSelectedMetrics] = useState([])
  const [selectedEmployees, setSelectedEmployees] = useState([])
  const [selectedOrigin, setSelectedOrigin] = useState("")
  const [targetValue, setTargetValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  const metrics = [
    "Llamadas Aplicables",
    "Llamadas Agendadas",
    "Llamadas Efectuadas",
    "Venta en llamada",

  ]

  useEffect(() => {
    const API_BASE_URL =
      process.env.NODE_ENV === "production"
        ? "https://metricas-back.onrender.com/notion-data"
        : "http://localhost:3000/notion-data"

    const fetchData = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(API_BASE_URL)
        const result = await response.json()
        const validData = result.filter((item) => item.Closer !== "Sin closer")
        setOriginalData(validData)
      } catch (error) {
        console.error("Error al obtener los datos:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const origins = [...new Set(originalData.map((d) => d.Origen))].filter(Boolean)
  const employees = [...new Set([...originalData.map((d) => d.Closer), ...originalData.map((d) => d.Setter)])].filter(Boolean)

  useEffect(() => {
    if (selectedMetrics.length === 0) return

    const filtered = originalData.filter((item) => {
      const date = new Date(item["Fecha creada"])
      const matchesDate =
        date >= new Date(startDate) && date <= new Date(endDate)
      const matchesOrigin = selectedOrigin
        ? item.Origen === selectedOrigin
        : true
      return matchesDate && matchesOrigin
    })

    setFilteredData(filtered)
    updateChart(filtered)
  }, [startDate, endDate, selectedMetrics, selectedEmployees, selectedOrigin, targetValue, originalData])

  const groupDataByDay = (data) => {
    const grouped = {}

    data.forEach((item) => {
      const dateObj = new Date(item["Fecha creada"])
      const day = `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${dateObj.getFullYear()}`

      if (!grouped[day]) grouped[day] = { day }

      selectedMetrics.forEach((metric) => {
        if (!grouped[day][metric]) grouped[day][metric] = 0
        grouped[day][metric] += item[metric] || 0

        if (item.Closer && item.Setter) {
          if (item.Closer === item.Setter) {
            const setterKey = `${metric}_${item.Setter}`
            if (!grouped[day][setterKey]) grouped[day][setterKey] = 0
            grouped[day][setterKey] += item[metric] || 0
          } else {
            const closerKey = `${metric}_${item.Closer}`
            if (!grouped[day][closerKey]) grouped[day][closerKey] = 0
            grouped[day][closerKey] += item[metric] || 0
          }
        } else if (item.Closer) {
          const closerKey = `${metric}_${item.Closer}`
          if (!grouped[day][closerKey]) grouped[day][closerKey] = 0
          grouped[day][closerKey] += item[metric] || 0
        } else if (item.Setter) {
          const setterKey = `${metric}_${item.Setter}`
          if (!grouped[day][setterKey]) grouped[day][setterKey] = 0
          grouped[day][setterKey] += item[metric] || 0
        }
      })
    })

    const sorted = Object.values(grouped).sort((a, b) => {
      const [dayA, monthA, yearA] = a.day.split("/").map(Number)
      const [dayB, monthB, yearB] = b.day.split("/").map(Number)

      return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB)
    })

    return sorted
  }

  const updateChart = (data) => {
    const groupedData = groupDataByDay(data)

    const datasets = []

    selectedMetrics.forEach((metric, metricIndex) => {
      datasets.push({
        label: metric.replace("_", " ").toUpperCase(),
        data: groupedData.map((d) => d[metric] || 0),
        borderColor: getLineColor(metricIndex),
        tension: 0.3,
        fill: false,
      })
    })

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
          })
        })
      })
    }

    if (targetValue) {
      datasets.push({
        label: "Valor Objetivo",
        data: new Array(groupedData.length).fill(parseInt(targetValue)),
        borderColor: "#EF4444",
        borderDash: [5, 5],
        fill: false,
      })
    }

    const ctx = chartRef.current.getContext("2d")
    if (chartInstance.current) chartInstance.current.destroy()

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
    })
  }

  const setCurrentMonth = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setStartDate(firstDay.toISOString().split('T')[0])
    setEndDate(lastDay.toISOString().split('T')[0])
    setActiveButton("currentMonth")
  }

  const setLast12Months = () => {
    const now = new Date()
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
    setStartDate(twelveMonthsAgo.toISOString().split('T')[0])
    setEndDate(now.toISOString().split('T')[0])
    setActiveButton("last12Months")
  }

  const calculateTotals = () => {
    const totals = { total: {}, employees: {} }

    filteredData.forEach((item) => {
      selectedMetrics.forEach((metric) => {
        if (!totals.total[metric]) totals.total[metric] = 0
        totals.total[metric] += item[metric] || 0

        selectedEmployees.forEach((employee) => {
          if (!totals.employees[employee]) totals.employees[employee] = {}
          if (!totals.employees[employee][metric]) totals.employees[employee][metric] = 0
          if (item.Closer === employee || item.Setter === employee) {
            totals.employees[employee][metric] += item[metric] || 0
          }
        })
      })
    })

    return totals
  }

  const totals = calculateTotals()

  return (
    <>
    <Table/>
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100 text-gray-800">
      {/* ASIDE / FILTROS */}
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
        <h3 className="font-semibold mt-4 mb-2">Empleados:</h3>
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
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        ))}
      </aside>

      {/* MAIN */}
      <main className="md:w-3/4 w-full p-8">
        
        {isLoading ? (
          <div className="text-center">Cargando datos...</div>
        ) : selectedMetrics.length > 0 ? (
          <>
            <h1 className="text-3xl font-bold mb-4">Panel de Métricas</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {Object.entries(totals.total).map(([metric, totalValue]) => (
                <div key={metric} className="bg-white rounded-lg shadow-md p-4">
                  <h3 className="text-lg font-semibold mb-2">{metric.replace("_", " ")}</h3>
                  <p className="text-3xl font-bold">{Math.round(totalValue)}</p>
                  {selectedEmployees.map((employee) => (
                    totals.employees[employee] && totals.employees[employee][metric] ? (
                      <p key={employee} className="text-sm mt-2">
                        {employee}: {Math.round(totals.employees[employee][metric])}
                      </p>
                    ) : null
                  ))}
                </div>
              ))}
            </div>
            <div className="bg-white p-6 shadow rounded-md">
              <canvas ref={chartRef} />
            </div>
          </>
        ) : (
          <div className="text-center">Seleccione al menos una métrica.</div>
        )}
      </main>
    </div></>
  )
}

const getLineColor = (index) => {
  const colors = ["#3B82F6", "#22C55E", "#9333EA", "#FACC15", "#EF4444"]
  return colors[index % colors.length]
}

