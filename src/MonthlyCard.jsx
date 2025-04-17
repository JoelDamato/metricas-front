import React from "react"
import { format } from "date-fns"

export default function MonthlyCard({ 
  month, 
  resumen, 
  goals = {}, 
  onGoalChange, 
  onSaveGoal, 
  calculateGoalPercentage = () => 0,
  formatCurrency = (n) => `$${n}`
}) {
  const getGoal = (metric) => goals[month]?.metrics?.find((m) => m.name === metric)?.goal || ""

  return (
    <div className="w-full bg-white rounded-lg shadow-md overflow-hidden transform transition-all duration-300 hover:shadow-lg">
      <h3 className="text-lg font-bold text-center py-2 bg-gradient-to-r from-[#E0C040] to-[#f7db6b] text-white">
        {month}
      </h3>

      <div className="p-4 space-y-3 text-sm text-gray-800">
        {/* Métricas con metas y cumplimiento */}
        {[{
          label: "Agendamientos",
          key: "Agendamientos",
          value: resumen.agendamientos
        }, {
          label: "Llamadas Aplicables",
          key: "Llamadas Aplicables",
          value: resumen.llamadasAplicables,
          divideBy: resumen.agendamientos
        }, {
          label: "Llamadas Efectuadas",
          key: "Llamadas Efectuadas",
          value: resumen.llamadasEfectuadas,
          divideBy: resumen.llamadasAplicables
        }, {
          label: "Llamadas Vendidas",
          key: "Llamadas Vendidas",
          value: resumen.ventasMeg,
          divideBy: resumen.llamadasEfectuadas
        }].map(({ label, key, value, divideBy }) => (
          <div key={key} className="bg-gray-50 p-3 rounded-md border border-gray-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-700 w-[40%]">{label}</span>
              <span className="font-bold w-[20%] text-gray-700 text-center">{value}</span>
              <span className="font-bold w-[20%] text-gray-700 text-end">
                {!isNaN(value) && !isNaN(divideBy) && divideBy > 0
                  ? `${((value * 100) / divideBy).toFixed(2)} %`
                  : "-"}
              </span>
            </div>
            <div className="mt-2 flex justify-between items-center">
              <span className="text-sm text-gray-600">Objetivo:</span>
              <input
                type="number"
                value={getGoal(label)}
                onChange={(e) => onGoalChange(month, label, e.target.value)}
                className="border border-gray-300 rounded text-sm w-16 text-right px-1 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Cumplimiento: <span className={`font-semibold ${calculateGoalPercentage(value, getGoal(label)) >= 100 ? "text-green-500" : "text-gray-600"}`}>{calculateGoalPercentage(value, getGoal(label))}%</span>
            </div>
          </div>
        ))}

        {/* Ventas por mes de agendamiento */}
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
          <details className="group">
            <summary className="cursor-pointer font-semibold text-gray-700 flex justify-between items-center">
              Ventas por mes de agendamiento
              <span className="transition-transform group-open:rotate-90">▶</span>
            </summary>
            <ul className="mt-2 pl-4 text-gray-600 text-sm list-disc">
              {resumen.ventasPorAgendamiento?.ventasPorMesAgendamiento &&
                Object.entries(resumen.ventasPorAgendamiento.ventasPorMesAgendamiento)
                  .sort(([a], [b]) => new Date(b) - new Date(a))
                  .map(([mesAgenda, cantidad], idx) => (
                    <li key={idx}>{mesAgenda}: <strong>{cantidad}</strong></li>
                  ))}
              {resumen.ventasPorAgendamiento?.ventasSinAgendamiento > 0 && (
                <li>Sin fecha de agendamiento: <strong>{resumen.ventasPorAgendamiento.ventasSinAgendamiento}</strong></li>
              )}
            </ul>
          </details>
        </div>

        {/* Intervalo promedio */}
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-md font-semibold text-gray-700">Intervalo de Ventas</span>
            <span className="text-md font-bold text-gray-700">{`${resumen.promedioDias.toFixed(0)} días`}</span>
          </div>
        </div>

        {/* Monto total */}
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-md font-semibold text-gray-700">Monto Total</span>
            <span className="text-md font-bold text-gray-700">{formatCurrency(resumen.totalPrecio)}</span>
          </div>
        </div>

        {/* Cash collected */}
        <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-md font-semibold text-gray-700">Cash Collected</span>
            <span className="text-md font-bold text-gray-700">{formatCurrency(resumen.totalCash)}</span>
          </div>
        </div>

        {/* Botón de guardar */}
        <div className="pt-2">
          <button
            onClick={() => onSaveGoal(month)}
            className="w-full bg-[#E0C040] text-white py-1 px-2 rounded text-md hover:bg-[#f7db6b] transition-all duration-300 flex items-center justify-center"
          >
            Establecer Objetivo
          </button>
        </div>
      </div>
    </div>
  )
}
