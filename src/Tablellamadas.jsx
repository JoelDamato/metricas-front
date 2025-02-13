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
  const [debugInfo, setDebugInfo] = useState("")
  const [monthlyGoals, setMonthlyGoals] = useState(() => {
    const savedGoals = localStorage.getItem("monthlyGoals");
    return savedGoals ? JSON.parse(savedGoals) : {};
  });
  
  
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(API_BASE_URL);
        const result = await response.json();
        console.log("Datos recibidos del backend:", result);
  
        // 🔥 Aplicamos el filtro dinámico en el frontend
        const filteredData = result.filter((item) => {
          const matchesCloser = selectedCloser ? item.Responsable === selectedCloser : true;
          const matchesOrigin = selectedOrigin ? item.Origen === selectedOrigin : true;
          return matchesCloser && matchesOrigin;
        });
  
        // Agrupar después de filtrar
        const groupedData = groupDataByMonth(filteredData);
        setMonthlyData(Object.entries(groupedData));
  
        // 🔥 Actualizar selectores con todos los valores disponibles
        const closersWithSales = result
          .filter((item) => item["Venta Meg"] > 0)
          .map((item) => item.Responsable);
        setAvailableClosers([...new Set(closersWithSales)]);
        setAvailableOrigins([...new Set(result.map((item) => item.Origen))]);
  
        // Debug info
        setDebugInfo(JSON.stringify(filteredData[0] || {}, null, 2));
      } catch (error) {
        console.error("Error fetching data:", error);
        setDebugInfo(`Error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchData();
  }, [selectedCloser, selectedOrigin]); // 🔥 Ahora se actualiza correctamente cuando cambias el Closer u Origen
  

  const groupDataByMonth = (data) => {
    const acc = data.reduce((acc, item) => { // <-- Asignamos reduce() a una variable "acc"
      const date = new Date(item["Fecha correspondiente"]);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  
      if (!acc[monthYear]) {
        acc[monthYear] = {
          Agenda: 0,
          "Aplica?": 0,
          "Llamadas efectuadas": 0,
          "Venta Meg": 0,
          Monto: 0,
          "Cash collected": 0,
          uniqueAplicaClients: new Set(), // 🔥 Para almacenar clientes únicos con "Aplica"
        };
      }
  
      acc[monthYear].Agenda += item.Agenda || 0;
      acc[monthYear]["Llamadas efectuadas"] += item["Llamadas efectuadas"] || 0;
      acc[monthYear]["Venta Meg"] += item["Venta Meg"] || 0;
  
      // 🔥 Solo contar "Aplica?" una vez por cliente
      if (item["Aplica?"] === "Aplica") {
        acc[monthYear].uniqueAplicaClients.add(item["Nombre cliente"]);
      }
  
      // 🔥 Excluir "Venta Club": 1 en los cálculos
      if (item["Venta Club"] !== 1) {
        acc[monthYear]["Monto"] += item["Precio"] || 0;
        acc[monthYear]["Cash collected"] += item["Cash collected total"] || 0;
      }
  
      return acc;
    }, {}); // <-- Aquí se guarda el objeto final en acc
  
    // 🔥 Convertimos el Set de clientes únicos a su conteo real antes de retornar los datos
    Object.keys(acc).forEach((monthYear) => {
      acc[monthYear]["Aplica?"] = acc[monthYear].uniqueAplicaClients.size;
      delete acc[monthYear].uniqueAplicaClients; // Eliminamos el Set ya que no es necesario en la respuesta final
    });
  
    return acc; // ✅ Retornamos los datos corregidos
  };
  
  const formatMonthYear = (month) => {
    const [year, monthNumber] = month.split("-");
    const monthsInSpanish = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    
    const monthName = monthsInSpanish[parseInt(monthNumber, 10) - 1]; // Convertir "02" en índice 1 (Febrero)
    return `${monthName} ${year}`;
  };
  
  
  

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
    }));
  };

  const saveGoal = async (month) => {
    const goalData = {
      month,
      facturacion: monthlyGoals[month]?.facturacion || 0,
      porcentaje: monthlyGoals[month]?.porcentaje || 0,
    };
  
    console.log("📩 Enviando al backend:", goalData);
  
    try {
      const response = await fetch(`http://localhost:3000/update-goal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(goalData),
      });
  
      if (!response.ok) {
        throw new Error("Error al guardar los datos");
      }
  
      console.log("✅ Objetivo actualizado correctamente!");
    } catch (error) {
      console.error("❌ Error al actualizar objetivos:", error);
    }
  };
  
  
  
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetch("http://localhost:3000/goals");
        const result = await response.json();
  
        // Formatear la respuesta para monthlyGoals
        const formattedGoals = result.reduce((acc, item) => {
          acc[item.month] = {
            facturacion: item.facturacion || "",
            porcentaje: item.porcentaje || "",
          };
          return acc;
        }, {});
  
        setMonthlyGoals(formattedGoals);
      } catch (error) {
        console.error("Error al obtener objetivos:", error);
      }
    };
  
    fetchGoals();
  }, []);
  



  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(amount)
  }

  const calculatePercentage = (value, total) => {
    if (total === 0) return "0%"
    return `${((value / total) * 100).toFixed(2)}%`
  }

  const calculateRealPercentage = (cashCollected, price) => {
    if (price === 0) return "0%";
    return `${((cashCollected / price) * 100).toFixed(2)}%`;
  };

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
  <div key={index} className="w-full md:w-1/4 bg-white rounded-lg shadow p-4">
<h3 className="text-lg font-semibold text-center mb-4">
  {formatMonthYear(month)}
</h3>

    <table className="w-full">
      <tbody>
        <tr className="border-b">
          <td className="">Llamadas agendadas</td>
          <td className=" text-right">{totals.Agenda}</td>
          <td className=" text-right">100%</td>
        </tr>
        <tr className="border-b">
          <td className="">Llamadas aplicables</td>
          <td className=" text-right">{totals["Aplica?"]}</td>
          <td className=" text-right">
            {calculatePercentage(totals["Aplica?"], totals.Agenda)}
          </td>
        </tr>
        <tr className="border-b">
          <td className="">Llamadas efectuadas</td>
          <td className="text-right">{totals["Llamadas efectuadas"]}</td>
          <td className="border-l py-1  text-right">
            {calculatePercentage(totals["Llamadas efectuadas"], totals.Agenda)}
          </td>
        </tr>
        <tr className="border-b">
          <td className="">Llamadas vendidas</td>
          <td className=" text-right">{totals["Venta Meg"]}</td>
          <td className=" text-right">{calculatePercentage(totals["Venta Meg"], totals.Agenda)}</td>
        </tr>
        <tr className="border-b">
          <td className="">Monto</td>
          <td className=" text-right" colSpan="2">
            {formatCurrency(totals["Monto"])}
          </td>
        </tr>
        <tr className="border-b">
          <td className="">Cash Collected</td>
          <td className=" text-right" colSpan="2">
            {formatCurrency(totals["Cash collected"])}
          </td>
        </tr>

        {/* 🔥 Inputs para Objetivo y % Objetivo */}
        <tr className="border-b">
  <td className="py-2 text-gray-700 font-medium">Objetivo Facturación</td>
  <td className="text-right relative">
    <input
      type="number"
      value={monthlyGoals[month]?.facturacion || ""}
      onChange={(e) => handleGoalChange(month, "facturacion", e.target.value.replace("$", ""))}
      className="border p-2 border-gray-400 rounded-lg w-full text-right pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
  </td>
  <td className="pl-3">
    <button 
      onClick={() => saveGoal(month)} 
      className="bg-black text-white rounded-lg p-2 transition-all duration-300 hover:bg-gray-800 flex items-center justify-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    </button>
  </td>
</tr>


<tr className="border-b">
  <td className="py-2 text-gray-700 font-medium"> % Objetivo </td>
  <td className="text-right relative">
    <input
      type="number"
      value={monthlyGoals[month]?.porcentaje || ""}
      onChange={(e) => handleGoalChange(month, "porcentaje", e.target.value.replace("%", ""))}
      className="border p-2 border-gray-400 rounded-lg w-full text-right pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
  </td>
  <td className="pl-3">
    <button 
      onClick={() => saveGoal(month)} 
      className="bg-black text-white rounded-lg p-2 transition-all duration-300 hover:bg-gray-800 flex items-center justify-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    </button>
  </td>
</tr>


        <tr className="border-b">
          <td className="">% Real</td>
          <td className=" text-right" colSpan="2">
            {calculateRealPercentage(totals["Cash collected"], totals["Monto"])}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
))}

        </div>
      )}

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
        <pre className="whitespace-pre-wrap">{debugInfo}</pre>
      </div>
    </div>
  )
}

