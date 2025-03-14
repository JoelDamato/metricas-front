"use client"

import { useEffect, useState } from "react"
import "react-datepicker/dist/react-datepicker.css"

export default function SalesMetricsTable() {
  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? "https://metricas-back.onrender.com/metricas"
      : "http://localhost:3000/metricas"

  const [monthlyData, setMonthlyData] = useState([])
  const [availableClosers, setAvailableClosers] = useState([])
  const [availableOrigins, setAvailableOrigins] = useState([])
  const [selectedCloser, setSelectedCloser] = useState("")
  const [selectedOrigin, setSelectedOrigin] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [monthlyGoals, setMonthlyGoals] = useState(() => {
    const savedGoals = localStorage.getItem("monthlyGoals")
    return savedGoals ? JSON.parse(savedGoals) : {}
  })
  const [debugInfo, setDebugInfo] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(API_BASE_URL)
        const result = await response.json()
        console.log("Datos recibidos del backend:", result)

        // 🔥 Obtener el año actual
        const currentYear = new Date().getFullYear()

        // 🔥 Filtrar solo los datos del año actual
        const filteredData = result.filter((item) => {
          const dateString = item["Fecha correspondiente"]
          const date = new Date(dateString)
          return !isNaN(date) && date.getFullYear() === currentYear
        })

        // Aplicar filtro dinámico en el frontend
        const filteredByCloserAndOrigin = filteredData.filter((item) => {
          const matchesCloser = selectedCloser ? item.Responsable === selectedCloser : true
          const matchesOrigin = selectedOrigin ? item.Origen === selectedOrigin : true
          return matchesCloser && matchesOrigin
        })

        // Agrupar datos después del filtrado
        const groupDataByMonth = (data) => {
          // Primero, encontrar todos los meses de agendamiento para cada cliente
          const clientScheduleMonths = {}
          data.forEach((item) => {
            if (item.Agenda === 1) {
              const date = new Date(item["Fecha correspondiente"])
              const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
              const clientName = item["Nombre cliente"]

              if (!clientScheduleMonths[clientName]) {
                clientScheduleMonths[clientName] = []
              }
              clientScheduleMonths[clientName].push({
                monthYear,
                date: date.getTime(),
              })
            }
          })

          // Ordenar los meses de agendamiento por fecha para cada cliente
          Object.keys(clientScheduleMonths).forEach((clientName) => {
            clientScheduleMonths[clientName].sort((a, b) => a.date - b.date)
          })

          // Initialize the accumulator object
          const acc = {}

          // Modificar la estructura inicial de acc para incluir el nuevo campo

          // Agrupar registros por cliente y período de agendamiento
          const clientRecords = {}

          // Primero, organizar todos los registros por cliente y período de agendamiento
          data.forEach((item) => {
            const clientName = item["Nombre cliente"]
            const itemDate = new Date(item["Fecha correspondiente"])
            const itemTimestamp = itemDate.getTime()

            if (clientScheduleMonths[clientName]) {
              // Encontrar el período de agendamiento correspondiente
              const scheduleInfo = clientScheduleMonths[clientName].find((schedule, index) => {
                const isLastSchedule = index === clientScheduleMonths[clientName].length - 1
                const nextSchedule = !isLastSchedule ? clientScheduleMonths[clientName][index + 1] : null

                return isLastSchedule
                  ? itemTimestamp >= schedule.date
                  : itemTimestamp >= schedule.date && itemTimestamp < nextSchedule.date
              })

              if (scheduleInfo) {
                const monthYear = scheduleInfo.monthYear

                if (!clientRecords[monthYear]) {
                  clientRecords[monthYear] = {}
                }
                if (!clientRecords[monthYear][clientName]) {
                  clientRecords[monthYear][clientName] = []
                }

                clientRecords[monthYear][clientName].push({
                  ...item,
                  timestamp: itemTimestamp,
                })
              }
            }
          })

          // Procesar los registros agrupados
          Object.entries(clientRecords).forEach(([monthYear, clients]) => {
            if (!acc[monthYear]) {
              acc[monthYear] = {
                Agenda: 0,
                "Aplica?": 0,
                "Llamadas efectuadas": 0,
                "Venta Meg": 0,
                Monto: 0,
                "Cash collected": 0,
                ventasPorMes: {},
                // Nuevo campo para rastrear los intervalos de venta
                intervalosVenta: [],
              }
            }

            Object.entries(clients).forEach(([clientName, records]) => {
              // Ordenar registros por fecha
              records.sort((a, b) => a.timestamp - b.timestamp)

              // Encontrar la primera fecha de agendamiento
              const primerAgendamiento = records.find((record) => record.Agenda === 1)

              // Encontrar la fecha de venta si existe
              const registroVenta = records.find((record) => record["Venta Meg"] > 0)

              // Si hay tanto agendamiento como venta, calcular el intervalo
              if (primerAgendamiento && registroVenta) {
                const diasIntervalo = Math.floor(
                  (new Date(registroVenta["Fecha correspondiente"]).getTime() -
                    new Date(primerAgendamiento["Fecha correspondiente"]).getTime()) /
                    (1000 * 60 * 60 * 24),
                )
                acc[monthYear].intervalosVenta.push(diasIntervalo)
              }

              // Contar Agenda
              const hasAgenda = records.some((record) => record.Agenda === 1)
              if (hasAgenda) {
                acc[monthYear].Agenda += 1
              }

              // Para "Aplica?", usar solo el registro más reciente
              const latestRecord = records[0]
              if (latestRecord["Aplica?"] === "Aplica") {
                acc[monthYear]["Aplica?"] += 1
              }

              // Procesar el resto de métricas normalmente
              records.forEach((record) => {
                acc[monthYear]["Llamadas efectuadas"] += record["Llamadas efectuadas"] || 0
                acc[monthYear]["Venta Meg"] += record["Venta Meg"] || 0

                // Registrar ventas por mes
                if (record["Venta Meg"] > 0) {
                  const ventaDate = new Date(record["Fecha correspondiente"])
                  const ventaMonthYear = `${ventaDate.getFullYear()}-${String(ventaDate.getMonth() + 1).padStart(2, "0")}`

                  if (!acc[monthYear].ventasPorMes[ventaMonthYear]) {
                    acc[monthYear].ventasPorMes[ventaMonthYear] = 0
                  }
                  acc[monthYear].ventasPorMes[ventaMonthYear] += record["Venta Meg"]
                }

                // Excluir "Venta Club": 1 en los cálculos
                if (record["Venta Club"] !== 1) {
                  acc[monthYear]["Monto"] += record["Precio"] || 0
                  acc[monthYear]["Cash collected"] += record["Cash collected total"] || 0
                }
              })
            })
          })

          // Calcular el promedio de intervalos para cada mes
          Object.keys(acc).forEach((monthYear) => {
            const intervalos = acc[monthYear].intervalosVenta
            if (intervalos.length > 0) {
              acc[monthYear].promedioIntervalo = Math.round(
                intervalos.reduce((sum, val) => sum + val, 0) / intervalos.length,
              )
            } else {
              acc[monthYear].promedioIntervalo = 0
            }
            delete acc[monthYear].intervalosVenta // Limpiamos el array temporal
          })

          return acc
        }
        setMonthlyData(Object.entries(groupDataByMonth(filteredByCloserAndOrigin)))

        // 🔥 Actualizar selectores con todos los valores disponibles
        const closersWithSales = filteredData.filter((item) => item["Venta Meg"] > 0).map((item) => item.Responsable)
        setAvailableClosers([...new Set(closersWithSales)])
        // 🔥 Obtener todos los valores únicos de "Origen", excluyendo valores vacíos
        const validOrigins = [...new Set(filteredData.map((item) => item.Origen).filter(Boolean))]

        setAvailableOrigins(validOrigins)

        // Debug info
        setDebugInfo(JSON.stringify(filteredByCloserAndOrigin[0] || {}, null, 2))
      } catch (error) {
        console.error("Error fetching data:", error)
        setDebugInfo(`Error: ${error.message}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [selectedCloser, selectedOrigin, API_BASE_URL])

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
    console.log("Valor seleccionado:", event.target.value)
    setter(event.target.value)
  }
  const handleGoalChange = (month, field, value) => {
    setMonthlyGoals((prevGoals) => ({
      ...prevGoals,
      [month]: {
        ...prevGoals[month],
        [field]: value,
      },
    }))
  }

  const saveGoal = async (month) => {
    const goalData = {
      month,
      facturacion: monthlyGoals[month]?.facturacion || 0,
      porcentaje: monthlyGoals[month]?.porcentaje || 0,
    }

    console.log("📩 Enviando al backend:", goalData)

    try {
      const response = await fetch(`https://metricas-back.onrender.com/update-goal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(goalData),
      })

      if (!response.ok) {
        throw new Error("Error al guardar los datos")
      }

      console.log("✅ Objetivo actualizado correctamente!")
    } catch (error) {
      console.error("❌ Error al actualizar objetivos:", error)
    }
  }

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetch("https://metricas-back.onrender.com/goals")
        const result = await response.json()

        // Formatear la respuesta para monthlyGoals
        const formattedGoals = result.reduce((acc, item) => {
          acc[item.month] = {
            facturacion: item.facturacion || "",
            porcentaje: item.porcentaje || "",
          }
          return acc
        }, {})

        setMonthlyGoals(formattedGoals)
      } catch (error) {
        console.error("Error al obtener objetivos:", error)
      }
    }

    fetchGoals()
  }, [])

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount)
  }

  const calculatePercentage = (value, total) => {
    if (total === 0) return "0%"
    return `${((value / total) * 100).toFixed(2)}%`
  }

  const calculateRealPercentage = (cashCollected, price) => {
    if (price === 0) return "0%"
    return `${((cashCollected / price) * 100).toFixed(2)}%`
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-6">Métricas Mensuales</h2>

      <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
        <select
          value={selectedCloser}
          onChange={handleSelectChange(setSelectedCloser)}
          className="p-2 border rounded-md"
        >
          <option value="">Todos los Closers</option>
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
          <option value="">Todos los Orígenes</option>
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
        <div className="flex flex-wrap justify-center gap-4">
          {monthlyData.map(([month, totals], index) => (
            <div key={index} className="w-full md:w-1/3 bg-white rounded-lg shadow-lg p-6">
              {/* 🏆 Título del mes con efecto degradado */}
              <h3 className="text-xl font-bold text-center mb-6 text-gray-800 border-b pb-2">
                {formatMonthYear(month)}
              </h3>

              <table className="w-full border-collapse rounded-lg overflow-hidden shadow-md">
                <tbody>
                  {/* 🟢 Filas de métricas con fondo alternado */}
                  {[
                    {
                      label: "Llamadas Agendadas",
                      value: totals.Agenda,
                      percentage: null, // Removido el porcentaje
                    },
                    {
                      label: "Llamadas Aplicables",
                      value: totals["Aplica?"],
                      percentage: calculatePercentage(totals["Aplica?"], totals.Agenda), // De agendadas
                    },
                    {
                      label: "Llamadas Efectuadas",
                      value: totals["Llamadas efectuadas"],
                      percentage: calculatePercentage(totals["Llamadas efectuadas"], totals["Aplica?"]), // De aplicables
                    },
                    {
                      label: "Llamadas Vendidas",
                      value: totals["Venta Meg"],
                      percentage: calculatePercentage(totals["Venta Meg"], totals["Llamadas efectuadas"]), // De efectuadas
                    },
                    {
                      label: "Intervalo de Ventas",
                      value: `${totals.promedioIntervalo || 0} días`,
                      percentage: null,
                    },
                  ].map(({ label, value, percentage }, i) => (
                    <tr key={i} className={`border-b ${i % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
                      <td className="py-2 px-2 text-gray-700 font-medium">{label}</td>
                      <td className="text-right py-2 px-2 font-semibold">{value}</td>
                      {percentage !== null && <td className="text-right py-2 px-2 text-gray-600">{percentage}</td>}
                    </tr>
                  ))}
                  {/* Nuevo desplegable para mostrar ventas por mes */}
                  {totals.ventasPorMes && Object.keys(totals.ventasPorMes).length > 0 && (
                    <tr className="bg-gray-50">
                      <td colSpan="3" className="py-0">
                        <details className="w-full">
                          <summary className="py-2 px-2 text-gray-700 font-medium cursor-pointer hover:bg-gray-100 flex items-center">
                            <span className="flex-1">Desglose de ventas por mes</span>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </summary>
                          <div className="pl-4 pr-2 py-2">
                            {Object.entries(totals.ventasPorMes).map(([ventaMonth, cantidad], i) => (
                              <div
                                key={i}
                                className="flex justify-between py-1 text-sm border-b border-gray-100 last:border-0"
                              >
                                <span className="text-gray-600">{formatMonthYear(ventaMonth)}</span>
                                <span className="font-medium">{cantidad}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      </td>
                    </tr>
                  )}

                  {/* Resto de las filas */}
                  {[
                    { label: "Monto Total", value: formatCurrency(totals["Monto"]), percentage: null },
                    { label: "Cash Collected", value: formatCurrency(totals["Cash collected"]), percentage: null },
                    {
                      label: "% Real",
                      value: calculateRealPercentage(totals["Cash collected"], totals["Monto"]),
                      percentage: null,
                    },
                  ].map(({ label, value, percentage }, i) => (
                    <tr key={i} className={`border-b ${i % 2 === 0 ? "bg-gray-100" : "bg-white"}`}>
                      <td className="py-2 px-2 text-gray-700 font-medium">{label}</td>
                      <td className="text-right py-2 px-2 font-semibold">{value}</td>
                      {percentage !== null && <td className="text-right py-2 px-2 text-gray-600">{percentage}</td>}
                    </tr>
                  ))}

                  {/* 🎯 Objetivos y porcentaje objetivo */}
                  {[
                    { label: "Objetivo Facturación", key: "facturacion", symbol: "$" },
                    { label: "% Objetivo", key: "porcentaje", symbol: "%" },
                  ].map(({ label, key, symbol }, i) => (
                    <tr key={i} className="border-b bg-gray-200">
                      <td className="py-3 px-4 text-gray-700 font-medium">{label}</td>
                      <td className="text-right py-3 px-4 relative">
                        <input
                          type="number"
                          value={monthlyGoals[month]?.[key] || ""}
                          onChange={(e) => handleGoalChange(month, key, e.target.value.replace(symbol, ""))}
                          className="border border-gray-400 rounded-md w-full text-right p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          {symbol}
                        </span>
                      </td>
                      <td className="text-center align-middle">
                        <button
                          onClick={() => saveGoal(month)}
                          className="bg-black text-white rounded-lg p-2 transition-all duration-300 hover:bg-gray-800 flex items-center justify-center mx-auto"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

