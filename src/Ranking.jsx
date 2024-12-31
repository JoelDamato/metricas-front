import React, { useState, useEffect } from "react";
import { Pie } from "react-chartjs-2";
import "chart.js/auto";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

Chart.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const RankingPage = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [groupedData, setGroupedData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [category, setCategory] = useState("Club");
  const [selectedCloser, setSelectedCloser] = useState(null);

  useEffect(() => {
    const API_BASE_URL =
      process.env.NODE_ENV === 'production'
        ? "https://metricas-back.onrender.com/notion-data"
        : "http://localhost:3000/notion-data";

    fetch(API_BASE_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setData(data);
        } else {
          setData([data]);
        }
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  useEffect(() => {
    filterAndGroupData(selectedDate);
  }, [data]);

  const filterAndGroupData = (date) => {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const filtered = data.filter((item) => {
      const itemDate = new Date(item.Dia);
      return (
        itemDate.getMonth() + 1 === month && itemDate.getFullYear() === year
      );
    });

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
        };
      }
      acc[closer]["Venta CLUB"] += curr["Venta CLUB"] || 0;
      acc[closer]["Ofertas Ganadas MEG"] += curr["Ofertas Ganadas MEG"] || 0;
      acc[closer].Facturacion += curr.Facturacion || 0;
      acc[closer]["Cash Collected"] += curr["Cash Collected"] || 0;
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
      <label htmlFor="category" className="block text-gray-700 font-semibold mb-1">
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
      <label htmlFor="month" className="block text-gray-700 font-semibold mb-1">
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
      <h3 className="text-base md:text-lg font-semibold text-gray-700">
        Detalles de {selectedCloser.Closer}
      </h3>
      <ul className="mt-2 text-gray-600">
        {selectedCloser.Details.map((detail, index) => (
          <li key={index} className="mb-1">
            Día: {detail.Dia}, Venta CLUB: {detail["Venta CLUB"]}, Ofertas Ganadas MEG:{" "}
            {detail["Ofertas Ganadas MEG"]}, Facturación: {detail.Facturacion}, Cash Collected:{" "}
            {detail["Cash Collected"]}
          </li>
        ))}
      </ul>
    </div>
  )}
</div>

  );
};

export default RankingPage;
