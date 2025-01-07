import React, { useState, useEffect } from "react";
import { Pie, Bar, Radar } from "react-chartjs-2";
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function MetricsComparison() {
  const [isLoading, setIsLoading] = useState(true);
  const [dataByMonth, setDataByMonth] = useState({});
  const [dataByMonthAndOrigin, setDataByMonthAndOrigin] = useState({});
  const [selectedDate1, setSelectedDate1] = useState(new Date());
  const [selectedDate2, setSelectedDate2] = useState(new Date());

  const formatMonth = (date) => date.toISOString().slice(0, 7);

  // Procesar datos del backend para métricas generales por mes
  const processBackendData = (data) => {
    const groupedByMonth = {};

    data.forEach((item) => {
      const month = new Date(item["Fecha correspondiente"]).toISOString().slice(0, 7);

      if (!groupedByMonth[month]) {
        groupedByMonth[month] = {
          nuevasConversaciones: 0,
          respuestasPrimerContacto: 0,
          linksEnviados: 0,
          llamadasAgendadas: 0,
          interacciones: 0,
        };
      }

      groupedByMonth[month].nuevasConversaciones += 1;
      groupedByMonth[month].respuestasPrimerContacto += parseInt(item["Respuestas al primer contacto"]) || 0;
      groupedByMonth[month].linksEnviados += parseInt(item["Link enviado"]) || 0;
      groupedByMonth[month].llamadasAgendadas += parseInt(item["Llamadas Agendadas"]) || 0;
      groupedByMonth[month].interacciones += parseInt(item["Interacciones"].match(/\d+/)?.[0]) || 0;
    });

    return groupedByMonth;
  };

  // Procesar datos del backend para métricas por origen y mes
  const processDataByOrigin = (data) => {
    const groupedByMonthAndOrigin = {};

    data.forEach((item) => {
      const month = new Date(item["Fecha correspondiente"]).toISOString().slice(0, 7);
      const origin = item["Origen"] || "Sin Origen";

      if (!groupedByMonthAndOrigin[month]) {
        groupedByMonthAndOrigin[month] = {};
      }

      if (!groupedByMonthAndOrigin[month][origin]) {
        groupedByMonthAndOrigin[month][origin] = 0;
      }

      groupedByMonthAndOrigin[month][origin] += 1;
    });

    return groupedByMonthAndOrigin;
  };

  useEffect(() => {
    const fetchData = async () => {
      const baseURL =
        process.env.NODE_ENV === "production"
          ? "https://metricas-back.onrender.com"
          : "http://localhost:3000";

      try {
        const response = await axios.get(`${baseURL}/notion-data`);
        const processedData = processBackendData(response.data);
        const processedOriginData = processDataByOrigin(response.data);

        setDataByMonth(processedData);
        setDataByMonthAndOrigin(processedOriginData);
      } catch (error) {
        console.error("Error al obtener datos del backend:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const removeZeros = (data) => {
    const labels = [];
    const values = [];

    data.labels.forEach((label, index) => {
      if (data.datasets[0].data[index] !== 0) {
        labels.push(label);
        values.push(data.datasets[0].data[index]);
      }
    });

    return {
      labels,
      datasets: [
        {
          ...data.datasets[0],
          data: values,
        },
      ],
    };
  };

  // Preparar datos para gráficos de torta
  const preparePieData = (month) => {
    const data = dataByMonth[month] || {};

    const rawData = {
      labels: [
        "Nuevas Conversaciones",
        "Respuestas a Primer Contacto",
        "Links Enviados",
        "Llamadas Agendadas",
        "Interacciones",
      ],
      datasets: [
        {
          data: [
            data.nuevasConversaciones || 0,
            data.respuestasPrimerContacto || 0,
            data.linksEnviados || 0,
            data.llamadasAgendadas || 0,
            data.interacciones || 0,
          ],
          backgroundColor: [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
          ],
        },
      ],
    };

    return removeZeros(rawData);
  };

  // Preparar datos para gráfico de barras comparativo
  const prepareBarComparisonData = (month1, month2) => {
    const dataMonth1 = dataByMonth[month1] || {};
    const dataMonth2 = dataByMonth[month2] || {};

    const labels = [
      "Nuevas Conversaciones",
      "Respuestas a Primer Contacto",
      "Links Enviados",
      "Llamadas Agendadas",
      "Interacciones",
    ];

    const data1 = [
      dataMonth1.nuevasConversaciones || 0,
      dataMonth1.respuestasPrimerContacto || 0,
      dataMonth1.linksEnviados || 0,
      dataMonth1.llamadasAgendadas || 0,
      dataMonth1.interacciones || 0,
    ];

    const data2 = [
      dataMonth2.nuevasConversaciones || 0,
      dataMonth2.respuestasPrimerContacto || 0,
      dataMonth2.linksEnviados || 0,
      dataMonth2.llamadasAgendadas || 0,
      dataMonth2.interacciones || 0,
    ];

    // Remove zeros from both datasets
    const filteredLabels = [];
    const filteredData1 = [];
    const filteredData2 = [];

    labels.forEach((label, index) => {
      if (data1[index] !== 0 || data2[index] !== 0) {
        filteredLabels.push(label);
        filteredData1.push(data1[index]);
        filteredData2.push(data2[index]);
      }
    });

    return {
      labels: filteredLabels,
      datasets: [
        {
          label: `Mes: ${month1}`,
          data: filteredData1,
          backgroundColor: "#36A2EB",
        },
        {
          label: `Mes: ${month2}`,
          data: filteredData2,
          backgroundColor: "#FF6384",
        },
      ],
    };
  };

  // Preparar datos para gráfico de radar comparativo por origen
  const prepareRadarData = (month1, month2) => {
    const dataMonth1 = dataByMonthAndOrigin[month1] || {};
    const dataMonth2 = dataByMonthAndOrigin[month2] || {};

    const allOrigins = Array.from(
      new Set([...Object.keys(dataMonth1), ...Object.keys(dataMonth2)])
    );

    const dataset1 = allOrigins.map((origin) => dataMonth1[origin] || 0);
    const dataset2 = allOrigins.map((origin) => dataMonth2[origin] || 0);

    return {
      labels: allOrigins,
      datasets: [
        {
          label: `Mes: ${month1}`,
          data: dataset1,
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
        {
          label: `Mes: ${month2}`,
          data: dataset2,
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 text-gray-800">
      <main className="w-full max-w-6xl p-4 md:p-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-full bg-gray-200">
            <div className="loader border-t-4 border-blue-500 w-12 h-12 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-4 shadow rounded-md">

                <div className="flex justify-center mb-4">
                  <DatePicker
                    selected={selectedDate1}
                    onChange={(date) => setSelectedDate1(date)}
                    dateFormat="MMMM yyyy"
                    showMonthYearPicker
                    className="w-full max-w-xs p-2 border rounded-md text-center"
                  />
                </div>
                <Pie data={preparePieData(formatMonth(selectedDate1))} />
              </div>

              <div className="bg-white p-4 shadow rounded-md">

                <div className="flex justify-center mb-4">
                  <DatePicker
                    selected={selectedDate2}
                    onChange={(date) => setSelectedDate2(date)}
                    dateFormat="MMMM yyyy"
                    showMonthYearPicker
                    className="w-full max-w-xs p-2 border rounded-md text-center"
                  />
                </div>
                <Pie data={preparePieData(formatMonth(selectedDate2))} />
              </div>
            </div>

            <div className="bg-white p-4 shadow rounded-md mb-6">
              <h3 className="text-center font-bold mb-4">Comparación de Barras</h3>
              <Bar
                data={prepareBarComparisonData(
                  formatMonth(selectedDate1),
                  formatMonth(selectedDate2)
                )}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: "top" },
                    title: {
                      display: true,
                      text: `Comparación entre ${formatMonth(selectedDate1)} y ${formatMonth(
                        selectedDate2
                      )}`,
                    },
                  },
                  scales: {
                    x: { stacked: false },
                    y: { beginAtZero: true },
                  },
                }}
              />
            </div>

            <div className="bg-white p-4 shadow rounded-md">
              <h3 className="text-center font-bold mb-4">Radar: Comparación por Origen</h3>
              <Radar
                data={prepareRadarData(
                  formatMonth(selectedDate1),
                  formatMonth(selectedDate2)
                )}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: "top" },
                    title: {
                      display: true,
                      text: `Comparación por Origen entre ${formatMonth(selectedDate1)} y ${formatMonth(
                        selectedDate2
                      )}`,
                    },
                  },
                }}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
