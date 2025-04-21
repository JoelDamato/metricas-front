import { useState, useEffect, useMemo } from "react"
import axios from "axios"


export default function Comisiones() {

    const [responsibleFilter, setResponsibleFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [productFilter, setProductFilter] = useState('');
    const [currentPageCloser, setCurrentPageCloser] = useState(1);
    const [itemsPerPageCloser, setItemsPerPageCloser] = useState(10);
    const [transactions, setTransactions] = useState([]);
    const [earnings, setEarnings] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API_BASE_URL = process.env.NODE_ENV === "production"
        ? "https://metricas-back.onrender.com/"
        : "http://localhost:30003/"

        useEffect(() => {
            const fetchComisionesData = async () => {
                try {
                    setLoading(true);
                    const response = await axios.get(`${API_BASE_URL}comisiones-meg`);
                    
                    console.log('Respuesta API:', response.data); // 👈 Debug útil
                    
                    const agrupado = response?.data?.agrupado || {};
        
                    // Transformar estructura agrupada a earnings por responsable y mes
                    const transformedEarnings = Object.entries(agrupado).map(([key, earn]) => {
                        const mes = earn.mes?.length === 7 ? earn.mes : key.split("-").slice(-2).join("-");
                        return {
                            responsable: earn.responsable || 'Sin asignar',
                            mes,
                            totalVentas: earn.totalVentas || 0,
                            totalVentasMEG: earn.totalVentasMEG || 0,
                            totalVentasClub: earn.totalVentasClub || 0,
                            totalCashCollectedMEG: earn.totalCashCollectedMEG || 0,
                            totalCashCollectedClub: earn.totalCashCollectedClub || 0,
                            totalCashCollected: earn.totalCashCollected || 0,
                            comisionTotal: earn.comisionTotal || 0,
                            comisionMEG: earn.comisionMEG || 0,
                            comisionClub: earn.comisionClub || 0,
                            detalleComisiones: earn.detalleComisiones || {},
                            productos: earn.productos || [],
                            commissionToSubtract: 0,
                            commissionToAdd: 0,
                        };
                    });
        
                    // No hay transacciones individuales en la respuesta, así que dejamos vacío o adaptás después
                    setTransactions([]);
                    setEarnings(transformedEarnings);
                    setLoading(false);
                } catch (err) {
                    console.error('Error al obtener datos de comisiones:', err);
                    setError('No se pudieron cargar los datos');
                    setLoading(false);
                }
            };
        
            fetchComisionesData();
        }, []);
        

    // Obtener meses únicos para el filtro
    const uniqueMonths = useMemo(() => {
        const mesesRaw = earnings.map(e => e.mes);
        const mesesClean = mesesRaw.map(m => m.trim());
        const mesesSet = [...new Set(mesesClean)];
        return mesesSet.sort().reverse();
    }, [earnings]);


    // Filtrar ganancias
    const filteredEarnings = useMemo(() => {
        return earnings.filter(earn => {
            return (monthFilter === '' || earn.mes === monthFilter) &&
                (responsibleFilter === '' || earn.responsable.toLowerCase().includes(responsibleFilter.toLowerCase()));
        });
    }, [earnings, monthFilter, responsibleFilter]);


    // Filtrar transacciones
    const filteredTransactions = useMemo(() => {
        return transactions.filter(transaction =>
            (monthFilter === '' || transaction.month === monthFilter) &&
            (responsibleFilter === '' || transaction.responsible.toLowerCase().includes(responsibleFilter.toLowerCase())) &&
            (dateFilter === '' || transaction.date.includes(dateFilter)) &&
            (productFilter === '' || transaction.product.toLowerCase().includes(productFilter.toLowerCase()))
        );
    }, [transactions, monthFilter, responsibleFilter, dateFilter, productFilter]);

    const ITEMS_PER_PAGE = 8;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
    const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));




    const nextPage = () => {
        if (currentPageCloser < totalPagesCloser) {
            setCurrentPageCloser(currentPageCloser + 1);
        }
    };

    const prevPage = () => {
        if (currentPageCloser > 1) {
            setCurrentPageCloser(currentPageCloser - 1);
        }
    };


    const goToPage = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPagesCloser) {
            setCurrentPageCloser(pageNumber);
        }
    };


    const handleItemsPerPageChange = (e) => {
        setItemsPerPageCloser(Number(e.target.value));
        setCurrentPageCloser(1); // Resetear a la primera página
    };



    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 text-center text-xl p-4">
                {error}
            </div>
        );
    }


    const indexOfLastEarning = currentPageCloser * itemsPerPageCloser;
    const indexOfFirstEarning = indexOfLastEarning - itemsPerPageCloser;
    const currentItems = filteredEarnings.slice(indexOfFirstEarning, indexOfLastEarning);
    const totalPagesCloser = Math.ceil(filteredEarnings.length / itemsPerPageCloser);
    const formatUSD = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(value);
    };


    return (

        <div className="p-4 bg-white rounded-lg shadow">
            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                    <select
                        className="w-full p-2 border border-gray-300 rounded"
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                    >
                        <option value="">Todos los meses</option>
                        {uniqueMonths.map(month => {
                            const [year, monthNum] = month.split("-");
                            const monthDate = new Date(Number(year), Number(monthNum) - 1);
                            const label = monthDate.toLocaleDateString('es-AR', {
                                month: 'long',
                                year: 'numeric'
                            }).toUpperCase();

                            return (
                                <option key={month} value={month}>
                                    {label}
                                </option>
                            );
                        })}




                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                    <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded"
                        value={responsibleFilter}
                        onChange={(e) => setResponsibleFilter(e.target.value)}
                        placeholder="Filtrar por responsable"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                    <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded"
                        value={productFilter}
                        onChange={(e) => setProductFilter(e.target.value)}
                        placeholder="Filtrar por producto"
                    />
                </div>
            </div>
            {/* Tabla de Ganancias por Closer */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Ganancias por closer</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Ventas</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash MEG</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash CLUB</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comisión</th>

                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentItems.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {(() => {
                                            const [year, month] = item.mes.split("-");
                                            const date = new Date(Number(year), Number(month) - 1);
                                            return date.toLocaleDateString('es-AR', {
                                                month: 'long',
                                                year: 'numeric'
                                            }).toUpperCase();
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.responsable}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.totalVentas}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatUSD(item.totalCashCollectedMEG)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatUSD(item.totalCashCollectedClub)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatUSD(item.totalCashCollected)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatUSD(item.comisionTotal)}</td>

                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Controles de paginación */}
                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="text-sm text-gray-700">
                            Mostrando {filteredEarnings.length > 0 ? indexOfFirstEarning + 1 : 0} a {Math.min(indexOfLastEarning, filteredEarnings.length)} de {filteredEarnings.length} registros
                        </span>
                        <div className="ml-4">
                            <select
                                className="border rounded px-2 py-1 text-sm"
                                value={itemsPerPageCloser}
                                onChange={handleItemsPerPageChange}
                            >
                                <option value={5}>5 por página</option>
                                <option value={10}>10 por página</option>
                                <option value={25}>25 por página</option>
                                <option value={50}>50 por página</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={prevPage}
                            disabled={currentPageCloser === 1}
                            className={`px-3 py-1 rounded ${currentPageCloser === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                            Anterior
                        </button>
                        <div className="hidden md:flex space-x-1">
                            {Array.from({ length: Math.min(5, totalPagesCloser) }, (_, i) => {
                                let pageNum;
                                if (totalPagesCloser <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPageCloser <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPageCloser >= totalPagesCloser - 2) {
                                    pageNum = totalPagesCloser - 4 + i;
                                } else {
                                    pageNum = currentPageCloser - 2 + i;
                                }
                                return (
                                    <button
                                        key={i}
                                        onClick={() => goToPage(pageNum)}
                                        className={`w-8 h-8 rounded-full ${currentPageCloser === pageNum ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={nextPage}
                            disabled={currentPageCloser === totalPagesCloser || totalPagesCloser === 0}
                            className={`px-3 py-1 rounded ${currentPageCloser === totalPagesCloser || totalPagesCloser === 0 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabla de Transacciones */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Consulta de transacciones</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Filtros */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Responsable</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded"
                            value={responsibleFilter}
                            onChange={(e) => {
                                setCurrentPage(1);
                                setResponsibleFilter(e.target.value);
                            }}
                            placeholder="Filtrar por responsable"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded"
                            value={dateFilter}
                            onChange={(e) => {
                                setCurrentPage(1);
                                setDateFilter(e.target.value);
                            }}
                            placeholder="Filtrar por fecha"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded"
                            value={productFilter}
                            onChange={(e) => {
                                setCurrentPage(1);
                                setProductFilter(e.target.value);
                            }}
                            placeholder="Filtrar por producto"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre del cliente</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsable</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash collected</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto Adquirido</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedTransactions.map((transaction, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.date}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.clientName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.responsible}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${transaction.cashCollected}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.product}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Controles de paginación */}
                <div className="flex justify-between items-center mt-4">
                    <button
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-600">
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
                    >
                        Siguiente
                    </button>
                </div>
            </div>

            {/* Tabla de Ajustes de Porcentaje */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Ajuste de porcentaje de ganancia</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ajustes
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Number
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Porcentaje asociado
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Cantidad de ventas</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1-4</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">8%</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Cantidad de ventas</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5-14</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">9%</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Cantidad de ventas</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">+15</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10%</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">CLUB</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">SIN OPCION</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">60%</td>
                            </tr>
                            <tr>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Autogenda</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">SIN OPCION</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10%</td>
                            </tr>
                        </tbody>
                    </table>

                </div>
            </div>


        </div>
    )
}