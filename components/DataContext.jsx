import { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";

export const DataContext = createContext();

const API_BASE = import.meta.env.PROD
  ? "https://metricas-back.onrender.com"
  : "http://localhost:30003";

export const DataProvider = ({ children }) => {
  const [dashboardData, setDashboardData] = useState([]);
  const [metricasData, setMetricasData] = useState([]);
  const [llamadasData, setLlamadasData] = useState([]);
  const [clubData, setClubData] = useState([]); // ✅ nuevo
  const [metricasClienteData, setMetricasClienteData] = useState([]); // ✅ nuevo
  const [loading, setLoading] = useState(false);

  const fetchAllData = async () => {
    console.log("📡 Ejecutando fetchAllData: cargando datos desde el backend...");
    try {
      setLoading(true);
      const [dash, metricas, llamadas, club, metricasCliente] = await Promise.all([
        axios.get(`${API_BASE}/dashboard`),
        axios.get(`${API_BASE}/metricas`),
        axios.get(`${API_BASE}/llamadas`),
        axios.get(`${API_BASE}/club`),
        axios.get(`${API_BASE}/metricascliente`)
      ]);

      setDashboardData(dash.data);
      setMetricasData(metricas.data);
      setLlamadasData(llamadas.data);
      setClubData(club.data);
      setMetricasClienteData(metricasCliente.data);
      console.log("✅ Datos cargados con éxito");
    } catch (error) {
      console.error("❌ Error al cargar los datos iniciales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <DataContext.Provider
      value={{
        dashboardData,
        metricasData,
        llamadasData,
        clubData,
        metricasClienteData,
        setDataDashboard: setDashboardData,
        setDataMetricas: setMetricasData,
        setDataLlamadas: setLlamadasData,
        loading,
        setLoading
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
