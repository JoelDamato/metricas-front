import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

Chart.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [groupedData, setGroupedData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [category, setCategory] = useState("Club");
  const [selectedCloser, setSelectedCloser] = useState(null);

  useEffect(() => {
    const API_BASE_URL =
      process.env.NODE_ENV === "production"
        ? "https://metricas-back.onrender.com/notion-data"
        : "http://localhost:3000/notion-data";

    fetch(API_BASE_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((jsonData) => {
        if (Array.isArray(jsonData)) {
          setData(jsonData);
        } else {
          setData([jsonData]);
        }
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  useEffect(() => {
    filterAndGroupData(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const filterAndGroupData = (date) => {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    // Filtrar registros del mes/año seleccionado
    const filtered = data.filter((item) => {
      const itemDate = new Date(item["Fecha creada"]);
      return (
        itemDate.getMonth() + 1 === month && itemDate.getFullYear() === year
      );
    });

    // Agrupar y acumular
    const grouped = filtered.reduce((acc, curr) => {
      const closer = curr.Closer;
      if (!acc[closer]) {
        acc[closer] = {
          Closer: closer,
          "Venta CLUB": 0,
          "Ofertas Ganadas MEG": 0,
          Facturacion: 0,
          "Cash Collected": 0,
          Details: [],
          // NUEVOS CAMPOS
          llamadasAgendadas: 0,
          llamadasEfectuadas: 0,
          aplicaCount: 0,
          noAplicaCount: 0,
        };
      }

      acc[closer]["Venta CLUB"] += curr["Venta CLUB"] || 0;
      acc[closer]["Ofertas Ganadas MEG"] += curr["Ofertas Ganadas MEG"] || 0;
      acc[closer].Facturacion += curr.Facturacion || 0;
      acc[closer]["Cash Collected"] += curr["Cash Collected"] || 0;

      // Llamadas Agendadas
      acc[closer].llamadasAgendadas += curr["Llamadas Agendadas"] || 0;

      // Llamadas Efectuadas
      acc[closer].llamadasEfectuadas += curr["Llamadas Efectuadas"] || 0;

      // Aplica / No aplica
      // Ajusta estos checks según los valores que devuelva tu API
      const aplicaValue = (curr.Aplica || "").trim().toLowerCase();

      if (aplicaValue === "aplica") {
        acc[closer].aplicaCount += 1;
      } else if (aplicaValue === "no aplica") {
        acc[closer].noAplicaCount += 1;
      }
      

      acc[closer].Details.push(curr);
      return acc;
    }, {});

    setFilteredData(filtered);
    setGroupedData(Object.values(grouped));
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    filterAndGroupData(date);
  };

  const handleCloserClick = (closer) => {
    const closerData = groupedData.find((item) => item.Closer === closer);
    setSelectedCloser(closerData);
  };

  const getRanking = (key1, key2) => {
    return [...groupedData]
      .sort((a, b) => b[key1] - a[key1])
      .map((item, index) => (
        <tr
          key={item.Closer}
          className="border-b cursor-pointer hover:bg-gray-100"
          onClick={() => handleCloserClick(item.Closer)}
        >
          <td className="py-2 px-4 text-center">{index + 1}</td>
          <td className="py-2 px-4">{item.Closer}</td>
          <td className="py-2 px-4 text-center">{item[key1]}</td>
          <td className="py-2 px-4 text-center">{item[key2]}</td>
        </tr>
      ));
  };

  const generatePieChartData = (key) => {
    return {
      labels: groupedData.map((item) => item.Closer),
      datasets: [
        {
          data: groupedData.map((item) => item[key]),
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
          ],
        },
      ],
    };
  };

  const pieChartOptions = {
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: {
            size: 14,
          },
        },
      },
      datalabels: {
        color: "#fff",
        font: {
          size: 16,
          weight: "bold",
        },
        formatter: (value) => value,
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="bg-gray-100 min-h-screen p-4 md:p-6">
      {/* Filtros */}
      <div className="flex flex-col md:flex-row justify-center items-center bg-white rounded-lg shadow-lg p-5 mb-5 gap-2">
        {/* Categoría */}
        <div className="w-full md:w-auto">
          <label
            htmlFor="category"
            className="block text-gray-700 font-semibold mb-1"
          >
            Categoría
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full md:w-48 bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 shadow"
          >
            <option value="Club">Club</option>
            <option value="MEG">MEG</option>
          </select>
        </div>

        {/* Seleccionar Mes */}
        <div className="w-full md:w-auto">
          <label
            htmlFor="month"
            className="block text-gray-700 font-semibold mb-1"
          >
            Seleccionar Mes
          </label>
          <DatePicker
            selected={selectedDate}
            onChange={handleDateChange}
            dateFormat="MM/yyyy"
            showMonthYearPicker
            className="w-full md:w-48 bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 shadow"
          />
        </div>
      </div>

      {/* Contenido */}
      {groupedData.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Gráfico de Ventas */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-700 text-center mb-4">
              Cantidad de Ventas
            </h3>
            <div className="relative h-56 md:h-64">
              <Pie
                data={generatePieChartData(
                  category === "Club" ? "Venta CLUB" : "Ofertas Ganadas MEG"
                )}
                options={pieChartOptions}
              />
            </div>
          </div>

          {/* Tabla de Ranking */}
          <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
            <h3 className="text-base md:text-lg font-semibold text-gray-700 text-center mb-4">
              Ranking
            </h3>
            <table className="w-full table-auto border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="py-2 px-4 text-center">#</th>
                  <th className="py-2 px-4 text-left">Closer</th>
                  <th className="py-2 px-4 text-center">
                    {category === "Club" ? "Ventas Club" : "Ofertas Ganadas MEG"}
                  </th>
                  <th className="py-2 px-4 text-center">
                    {category === "Club" ? "Facturación" : "Cash Collected"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {getRanking(
                  category === "Club" ? "Venta CLUB" : "Ofertas Ganadas MEG",
                  category === "Club" ? "Facturacion" : "Cash Collected"
                )}
              </tbody>
            </table>
          </div>

          {/* Gráfico de Facturación */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-700 text-center mb-4">
              Facturación
            </h3>
            <div className="relative h-56 md:h-64">
              <Pie
                data={generatePieChartData(
                  category === "Club" ? "Facturacion" : "Cash Collected"
                )}
                options={pieChartOptions}
              />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-600 text-center mt-12">
          No se encontraron datos para el mes y categoría seleccionados.
        </p>
      )}

      {/* Ficha de Closer */}
   
{selectedCloser && (
  <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
    {/* Título centrado */}
    <h3 className="text-center text-lg md:text-xl font-semibold text-gray-700 mb-4">
      Detalles de {selectedCloser.Closer}
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Ventas Club  */}
      <div className="bg-green-100 rounded p-4 shadow flex flex-col items-center justify-center text-center">
        {/* SVG (reemplaza el contenido según necesites) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-green-600 mb-1"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          {/* Path de ejemplo. Reemplázalo con el que necesites */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 
            4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 
            12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879
            -1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33
            M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        {/* Título de la tarjeta */}
        <h4 className="font-bold text-2xl text-gray-800 mb-1">
          Ventas Club 
        </h4>
        {/* Información destacada */}
        <p className="text-2xl font-bold text-gray-700">
          {selectedCloser["Venta CLUB"]}
        </p>
      </div>

      {/* Ofertas Ganadas MEG  */}
      <div className="bg-green-100 rounded p-4 shadow flex flex-col items-center justify-center text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-green-600 mb-1"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          {/* Reemplaza con el SVG que necesites */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 
            4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 
            12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879
            -1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33
            M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        <h4 className="font-bold text-2xl text-gray-800 mb-1">
          Ofertas Ganadas MEG 
        </h4>
        <p className="text-2xl font-bold text-gray-700">
          {selectedCloser["Ofertas Ganadas MEG"]}
        </p>
      </div>

      {/* Facturación  */}
      <div className="bg-green-100 rounded p-4 shadow flex flex-col items-center justify-center text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-green-600 mb-1"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          {/* Reemplaza con el SVG que necesites */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 
            4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 
            12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879
            -1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33
            M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
        <h4 className="font-bold text-2xl text-gray-800 mb-1">
          Facturación 
        </h4>
        <p className="text-2xl font-bold text-gray-700">
          {selectedCloser.Facturacion}
        </p>
      </div>

      {/* Cash Collected  */}
      <div className="bg-green-100 rounded p-4 shadow flex flex-col items-center justify-center text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-green-600 mb-1"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          {/* Reemplaza con el SVG que necesites */}
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 
            4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 
            12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879
            -1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33
            M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
          />
        </svg>
         <h4 className="font-bold text-2xl text-gray-800 mb-1">
          Cash Collected 
        </h4>
        <p className="text-2xl font-bold text-gray-700">
          {selectedCloser["Cash Collected"]}
        </p>
        <p className="text-sm text-gray-700 mt-2">
          <strong>Facturación / Cash Collected:</strong>{" "}
          {selectedCloser["Facturacion"] > 0
            ? (
                (selectedCloser["Cash Collected"] /
                  selectedCloser["Facturacion"]) *
                100
              ).toFixed(0) + "%"
            : "0%"}
        </p>
      </div>

      {/* Llamadas Agendadas  */}
      <div className="bg-gray-200 rounded p-4 shadow flex flex-col items-center justify-center text-center">
      <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-black mb-1"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
</svg>

<h4 className="font-bold text-2xl text-gray-800 mb-1">
          Llamadas Agendadas 
        </h4>
        <p className="text-2xl font-bold text-gray-700">
          {selectedCloser.llamadasAgendadas}
        </p>
      </div>

      {/* Llamadas Efectuadas  */}
      <div className="bg-gray-200 rounded p-4 shadow flex flex-col items-center justify-center text-center">
      <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-black mb-1"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
</svg>

<h4 className="font-bold text-2xl text-gray-800 mb-1">
          Llamadas Efectuadas 
        </h4>
        <p className="text-2xl font-bold text-gray-700">
          {selectedCloser.llamadasEfectuadas}
        </p>
        {/* Ratio Efectuadas / Agendadas */}
        <p className="text-sm text-gray-700 mt-2">
          <strong>Efectuadas / Agendadas:</strong>{" "}
          {selectedCloser.llamadasAgendadas > 0
            ? (
                (selectedCloser.llamadasEfectuadas /
                  selectedCloser.llamadasAgendadas) *
                100
              ).toFixed(0) + "%"
            : "0%"}
        </p>
      </div>

      {/* Aplica  */}
      <div className="bg-blue-200 rounded p-4 shadow flex flex-col items-center justify-center text-center">
      <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-green-600 mb-1"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
</svg>

<h4 className="font-bold text-2xl text-gray-800 mb-1">
          Aplica 
        </h4>
        <p className="text-2xl font-bold text-gray-700">
          {selectedCloser.aplicaCount}
        </p>
      </div>

      {/* No Aplica (Mes) */}
      <div className="bg-red-200 rounded p-4 shadow flex flex-col items-center justify-center text-center">
      <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-8 h-8 text-red-600 mb-1"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
  <path stroke-linecap="round" stroke-linejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
</svg>

<h4 className="font-bold text-2xl text-gray-800 mb-1">
          No Aplica 
        </h4>
        <p className="text-2xl font-bold text-gray-700">
          {selectedCloser.noAplicaCount}
        </p>
      </div>
    </div>
  </div>
)}


    </div>
  );
};

export default Dashboard;
