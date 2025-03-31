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
    const [commissionRates, setCommissionRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch de datos al montar el componente
    useEffect(() => {
        const fetchComisionesData = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:3000/comisiones-meg');
                console.log("Resumen backend:", response.data.resumen);
                const transformedTransactions = response.data.transacciones.map(trans => ({
                    id: trans.cliente,
                    date: new Date(trans.fecha).toLocaleDateString(),
                    month: new Date(trans.fecha).toISOString().slice(0, 7),
                    clientName: trans.cliente,
                    responsible: trans.responsable,
                    cashCollected: trans.cash,
                    product: trans.producto
                }));

                const transformedEarnings = response.data.resumen.map(earn => ({
                    

                    responsible: earn.responsable,
                    month: earn.mes,
                    salesCount: earn.totalVentas,
                    cashCollected: earn.totalCashCollected,
                    currentEarnings: earn.ganancia,
                    commissionToSubtract: 0,
                    commissionToAdd: 0,
                    products: earn.productos
                }));


                const transformedRates = response.data.ajustes.map(ajuste => ({
                    type: ajuste.ajuste,
                    sales: ajuste.number,
                    rate: ajuste.porcentaje
                }));

                setTransactions(transformedTransactions);
                setEarnings(transformedEarnings);
                setCommissionRates(transformedRates);
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
        return [...new Set(earnings.map(e => e.month))]
            .sort()
            .reverse();
    }, [earnings]);

    // Filtrar ganancias
    const filteredEarnings = useMemo(() => {
        return earnings.filter(earn =>
            (monthFilter === '' || earn.month === monthFilter) &&
            (responsibleFilter === '' || earn.responsible.toLowerCase().includes(responsibleFilter.toLowerCase()))
        );
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

    const indexOfLastItem = currentPageCloser * itemsPerPageCloser;
    const indexOfFirstItem = indexOfLastItem - itemsPerPageCloser;
    const currentItems = filteredEarnings.slice(indexOfFirstItem, indexOfLastItem);
    const totalPagesCloser = Math.ceil(filteredEarnings.length / itemsPerPageCloser);

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
                            const [year, monthNumber] = month.split('-');
                            const date = new Date(year, parseInt(monthNumber) - 1);
                            const label = date.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase();
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cant Ventas</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cash collected</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ganancia</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Productos</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentItems.map((earn, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(`${earn.month}-01`).toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{earn.responsible}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{earn.salesCount}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${earn.cashCollected.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${earn.currentEarnings.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {earn.products && earn.products.map(p =>
                                            `${p.producto} (${p.cantidad})`
                                        ).join(', ')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Controles de paginación */}
                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <span className="text-sm text-gray-700">
                            Mostrando {filteredEarnings.length > 0 ? indexOfFirstItem + 1 : 0} a {Math.min(indexOfLastItem, filteredEarnings.length)} de {filteredEarnings.length} registros
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

                        {/* Botones para páginas específicas */}
                        <div className="hidden md:flex space-x-1">
                            {Array.from({ length: Math.min(5, totalPagesCloser) }, (_, i) => {
                                // Lógica para mostrar 5 páginas centradas en la página actual
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ajustes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Porcentaje asociado</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {commissionRates.map((rate, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {rate.type ? rate.type : `Cantidad de ventas`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {rate.sales || 'SIN OPCION'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {rate.rate}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>


        </div>
    )
}