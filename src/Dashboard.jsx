import React, { useState, useEffect } from "react";
import axios from "axios";

const DashboardTable = () => {
  const API_URL = "https://metricas-back.onrender.com/dashboard";

  const [data, setData] = useState([]);
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [closers, setClosers] = useState([]);
  const [closerFilter, setCloserFilter] = useState("");
  const [totals, setTotals] = useState({});
  const [inputs, setInputs] = useState({});

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

  const handleInputChange = (closer, field, value) => {
    setInputs((prev) => ({
      ...prev,
      [closer]: { ...prev[closer], [field]: value },
    }));
  };

  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Dashboard de Ventas</h2>
      <div className="flex gap-4 mb-6">
        <input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="p-2 border rounded-lg shadow-sm bg-white" />
        <select value={closerFilter} onChange={(e) => setCloserFilter(e.target.value)} className="p-2 border rounded-lg shadow-sm bg-white w-48">
          <option value="">Seleccione un closer</option>
          {closers.map((closer) => (<option key={closer} value={closer}>{closer}</option>))}
        </select>
      </div>
      {closerFilter && totals[closerFilter] ? (
        <div className="w-full max-w-6xl mx-auto overflow-x-auto">
          <table className="w-full bg-white shadow-md rounded-lg overflow-x-auto">
            <tbody>
              <tr className="bg-gray-200">
                <td className="p-3 font-bold text-gray-700 w-1/4">Closer</td>
                <td className="p-3 text-gray-600 w-1/6">Actual</td>
                <td className="p-3 text-gray-600 w-1/6">Objetivo</td>
                <td className="p-3 text-gray-600 w-1/6">Base</td>
              </tr>
              {Object.entries(totals[closerFilter])
                .filter(([key]) => key !== "percentages")
                .map(([key, value]) => (
                  <tr key={key} className="border-b">
                    <td className="p-3 font-bold text-gray-700">{key}</td>
                    <td className="p-3 text-gray-600">{typeof value === 'object' ? '' : value}</td>
                    <td className="p-3 w-1/6">
                      <input
                        type="text"
                        className="border p-2 w-full min-w-[100px] max-w-[150px] rounded"
                        value={inputs[closerFilter]?.[key]?.objetivo || ""}
                        onChange={(e) => handleInputChange(closerFilter, key, { ...inputs[closerFilter]?.[key], objetivo: e.target.value })}
                      />
                    </td>
                    <td className="p-3 w-1/6">
                      <input
                        type="text"
                        className="border p-2 w-full min-w-[100px] max-w-[150px] rounded"
                        value={inputs[closerFilter]?.[key]?.base || ""}
                        onChange={(e) => handleInputChange(closerFilter, key, { ...inputs[closerFilter]?.[key], base: e.target.value })}
                      />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

      ) : (<p className="text-gray-500 mt-4">Seleccione un closer para ver los datos.</p>)}
    </div>
  );
};

export default DashboardTable;
