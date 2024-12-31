import React, { useState, useEffect } from "react";
import { Pie, Bar } from "react-chartjs-2";
import axios from "axios";

export default function StaticMetricsChart() {
  const [isLoading, setIsLoading] = useState(true);
  const [dataByMonth, setDataByMonth] = useState({});
  const [selectedCurrentMonth, setSelectedCurrentMonth] = useState("2024-12");
  const [selectedPreviousMonth, setSelectedPreviousMonth] = useState("2024-11");

  const monthNames = {
    "2024-12": "Diciembre 2024",
    "2024-11": "Noviembre 2024",
    "2024-10": "Octubre 2024",
  };

  // Función para procesar datos del backend
  const processBackendData = (data) => {
    const groupedByMonth = {};

    data.forEach((item) => {
      const month = new Date(item["Fecha correspondiente"].start)
        .toISOString()
        .slice(0, 7);

      if (!groupedByMonth[month]) {
        groupedByMonth[month] = {
          total_nuevas_conversaciones: 0,
          respuestas_primer_contacto: 0,
          seguimiento_con_respuesta: 0,
          link_enviado: 0,
          agendamiento: 0,
          aplica: 0,
          interacciones: 0,
          llamadas_agendadas: 0,
        };
      }

      groupedByMonth[month].total_nuevas_conversaciones += 1;
      groupedByMonth[month].respuestas_primer_contacto +=
        parseInt(item["Respuestas al primer contacto"]) || 0;
      groupedByMonth[month].link_enviado += parseInt(item["Link enviado"]) || 0;
      groupedByMonth[month].agendamiento += item["Llamadas Agendadas"] || 0;
      groupedByMonth[month].aplica += (item.Aplica || "")
        .split(",")
        .filter((aplica) => aplica === "Aplica").length;
      groupedByMonth[month].interacciones += (item.Interacciones || "").split(
        ","
      ).length;
      groupedByMonth[month].llamadas_agendadas +=
        item["Llamadas Agendadas"] || 0;
    });

    return groupedByMonth;
  };

  useEffect(() => {
    const fetchData = async () => {
      const baseURL = process.env.NODE_ENV === 'production'
      ? "https://metricas-back.onrender.com"
      : "http://localhost:3000";
      try {
        const response = await axios.get(`${baseURL}/notion-data`);
        const processedData = processBackendData(response.data);
        setDataByMonth(processedData);
      } catch (error) {
        console.error("Error al obtener datos del backend:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const prepareChartData = (data) => {
    return {
      labels: [
        "Nuevas Conversaciones",
        "Respuestas a Primer Contacto",
        "Links Enviados",
        "Agendamientos",
        "Aplica",
        "Interacciones",
        "Llamadas Agendadas",
      ],
      datasets: [
        {
          data: [
            data.total_nuevas_conversaciones,
            data.respuestas_primer_contacto,
            data.link_enviado,
            data.agendamiento,
            data.aplica,
            data.interacciones,
            data.llamadas_agendadas,
          ],
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF9F40",
            "#8AC926",
          ],
        },
      ],
    };
  };

  const prepareComparisonData = (currentMonthData, previousMonthData) => {
    const labels = [
      "Nuevas Conversaciones",
      "Respuestas a Primer Contacto",
      "Links Enviados",
      "Agendamientos",
      "Aplica",
      "Interacciones",
      "Llamadas Agendadas",
    ];

    const currentValues = [
      currentMonthData.total_nuevas_conversaciones,
      currentMonthData.respuestas_primer_contacto,
      currentMonthData.link_enviado,
      currentMonthData.agendamiento,
      currentMonthData.aplica,
      currentMonthData.interacciones,
      currentMonthData.llamadas_agendadas,
    ];

    const previousValues = [
      previousMonthData.total_nuevas_conversaciones,
      previousMonthData.respuestas_primer_contacto,
      previousMonthData.link_enviado,
      previousMonthData.agendamiento,
      previousMonthData.aplica,
      previousMonthData.interacciones,
      previousMonthData.llamadas_agendadas,
    ];

    return {
      labels,
      datasets: [
        {
          label: `Mes: ${monthNames[selectedCurrentMonth]}`,
          data: currentValues,
          backgroundColor: "#36A2EB",
        },
        {
          label: `Mes: ${monthNames[selectedPreviousMonth]}`,
          data: previousValues,
          backgroundColor: "#FF6384",
        },
      ],
    };
  };

  const currentMonthChartData = dataByMonth[selectedCurrentMonth]
    ? prepareChartData(dataByMonth[selectedCurrentMonth])
    : null;

  const previousMonthChartData = dataByMonth[selectedPreviousMonth]
    ? prepareChartData(dataByMonth[selectedPreviousMonth])
    : null;

  const comparisonChartData =
    dataByMonth[selectedCurrentMonth] && dataByMonth[selectedPreviousMonth]
      ? prepareComparisonData(
          dataByMonth[selectedCurrentMonth],
          dataByMonth[selectedPreviousMonth]
        )
      : null;

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 text-gray-800">
      <main className="w-full max-w-4xl p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-full bg-gray-200">
            <div className="loader border-t-4 border-blue-500 w-12 h-12 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-4 shadow rounded-md">
                <label className="block mb-2 font-bold text-center">
                  Mes Actual
                </label>
                <select
                  className="w-full p-2 border rounded-md mb-4"
                  value={selectedCurrentMonth}
                  onChange={(e) => setSelectedCurrentMonth(e.target.value)}
                >
                  {Object.keys(dataByMonth).map((month) => (
                    <option key={month} value={month}>
                      {monthNames[month]}
                    </option>
                  ))}
                </select>
                {currentMonthChartData ? (
                  <Pie data={currentMonthChartData} />
                ) : (
                  <div className="text-center text-gray-500">
                    No hay datos para este mes.
                  </div>
                )}
              </div>
              <div className="bg-white p-4 shadow rounded-md">
                <label className="block mb-2 font-bold text-center">
                  Mes Anterior
                </label>
                <select
                  className="w-full p-2 border rounded-md mb-4"
                  value={selectedPreviousMonth}
                  onChange={(e) => setSelectedPreviousMonth(e.target.value)}
                >
                  {Object.keys(dataByMonth).map((month) => (
                    <option key={month} value={month}>
                      {monthNames[month]}
                    </option>
                  ))}
                </select>
                {previousMonthChartData ? (
                  <Pie data={previousMonthChartData} />
                ) : (
                  <div className="text-center text-gray-500">
                    No hay datos para este mes.
                  </div>
                )}
              </div>
            </div>
            <div className="bg-white p-6 shadow rounded-md">
              <h2 className="text-lg font-bold text-center mb-4">
                Comparación entre Meses
              </h2>
              {comparisonChartData ? (
                <Bar
                  data={comparisonChartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: "top",
                      },
                      title: {
                        display: true,
                        text: `Comparación entre ${monthNames[selectedCurrentMonth]} y ${monthNames[selectedPreviousMonth]}`,
                      },
                    },
                    scales: {
                      x: {
                        stacked: false,
                      },
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              ) : (
                <div className="text-center text-gray-500">
                  No hay datos para la comparación de estos meses.
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
