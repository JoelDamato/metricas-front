import React, { useState, useEffect } from "react";
import axios from "axios";

const DashboardTable = () => {
  const API_URL =
    process.env.NODE_ENV === "production"
      ? "https://metricas-back.onrender.com/dashboard"
      : "http://localhost:3000/dashboard";

  const [data, setData] = useState([]);
  const [monthFilter, setMonthFilter] = useState(new Date().toISOString().slice(0, 7));
  const [closers, setClosers] = useState([]);
  const [closerFilter, setCloserFilter] = useState("");
  const [totals, setTotals] = useState({});

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
      new Date(row["Fecha correspondiente"]).toISOString().slice(0, 7) === monthFilter &&
      (closerFilter ? row["Closer Actual"] === closerFilter : true)
    );

    const groupedByCloser = {};
    
    filtered.forEach((row) => {
      const closer = row["Closer Actual"];
      if (!groupedByCloser[closer]) {
        groupedByCloser[closer] = {
          "Total Sales": 0,
          "Ofertas ganadas": 0,
          "Cash collected": 0,
          "Agendas totales": 0,
          "Cerradas": 0,
          "Cierre/Asistencias": 0,
          "Asistencia": 0,
          "Recuperado": 0,
          "No asiste": 0,
          "No aplican": 0,
          "Aplican": 0
        };
      }
      groupedByCloser[closer]["Total Sales"] += row["Precio"] || 0;
      groupedByCloser[closer]["Ofertas ganadas"] += row["Venta MEG"] ? row["Venta MEG"] : 0;
      groupedByCloser[closer]["Cash collected"] += row["Cash collected total"] || 0;
      groupedByCloser[closer]["Agendas totales"] += row["Agenda"] || 0;
      groupedByCloser[closer]["Cerradas"] += row["Venta MEG"] || 0;
      groupedByCloser[closer]["Cierre/Asistencias"] += row["Venta MEG"] && row["Llamadas efectuadas"] ? 1 : 0;
      groupedByCloser[closer]["Asistencia"] += row["Llamadas efectuadas"] || 0;
      groupedByCloser[closer]["Recuperado"] += row["Asistio?"]?.includes("Recuperado") ? 1 : 0;
      groupedByCloser[closer]["No asiste"] += (row["Agenda"] || 0) - (row["Llamadas efectuadas"] || 0);
      groupedByCloser[closer]["No aplican"] += row["Aplica?"] === "No aplica" ? 1 : 0;
      groupedByCloser[closer]["Aplican"] += row["Aplica?"]?.includes("Aplica") ? 1 : 0;
    });

    setTotals(groupedByCloser);
  }, [monthFilter, closerFilter, data]);

  return (
    <div className="flex flex-col items-center p-6 bg-gray-100 min-h-screen">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Dashboard de Ventas</h2>
      <div className="flex gap-4 mb-6">
        <input
          type="month"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          className="p-2 border rounded-lg shadow-sm bg-white"
        />
        <select
          value={closerFilter}
          onChange={(e) => setCloserFilter(e.target.value)}
          className="p-2 border rounded-lg shadow-sm bg-white"
        >
          <option value="">Seleccione un closer</option>
          {closers.map((closer) => (
            <option key={closer} value={closer}>{closer}</option>
          ))}
        </select>
      </div>
      {closerFilter && totals[closerFilter] ? (
        <table className="w-3/4 bg-white shadow-md rounded-lg overflow-hidden">
          <tbody>
            <tr className="bg-gray-200">
              <td className="p-3 font-bold text-gray-700">Closer</td>
              <td className="p-3 text-gray-600">{closerFilter}</td>
            </tr>
            {Object.entries(totals[closerFilter]).map(([key, value]) => (
              <tr key={key} className="border-b">
                <td className="p-3 font-bold text-gray-700">{key}</td>
                <td className="p-3 text-gray-600">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500 mt-4">Seleccione un closer para ver los datos.</p>
      )}
    </div>
  );
};

export default DashboardTable;
