import React, { useState, useMemo } from 'react';
import {
  UBER_ORDERS,
  calculateSummary,
  formatDuration,
  OrderItem,
  DaySummary,
} from './data/ordersData';
import {
  Calendar,
  Clock,
  Compass,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  TrendingUp,
  ExternalLink,
  Store,
  Layers,
  FileText,
  Eye,
  Info,
} from 'lucide-react';

export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof OrderItem>('id');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    'table' | 'days' | 'restaurants' | 'report' | 'gallery'
  >('table');
  const [copiedToast, setCopiedToast] = useState<string | null>(null);
  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);

  const summary = useMemo(() => calculateSummary(UBER_ORDERS), []);

  const filteredOrders = useMemo(() => {
    return UBER_ORDERS.filter((order) => {
      const matchesSearch =
        order.restaurant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.time.includes(searchTerm) ||
        order.dayName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDay = selectedDay === 'all' || order.date === selectedDay;
      const matchesStatus =
        selectedStatus === 'all' || order.status === selectedStatus;

      return matchesSearch && matchesDay && matchesStatus;
    }).sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'durationMinutes') {
        valA = a.durationMinutes * 60 + a.durationSeconds;
        valB = b.durationMinutes * 60 + b.durationSeconds;
      }

      if (typeof valA === 'string') {
        return sortAsc
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [searchTerm, selectedDay, selectedStatus, sortField, sortAsc]);

  const handleSort = (field: keyof OrderItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToast(label);
    setTimeout(() => setCopiedToast(null), 3000);
  };

  const exportCSV = () => {
    const headers = [
      '#',
      'Fecha',
      'Día',
      'Hora',
      'Restaurante / Origen',
      'Dirección de Entrega',
      'Kilometraje (km)',
      'Tiempo (minutos)',
      'Tiempo (texto)',
      'Estado',
    ];
    const rows = filteredOrders.map((o) => [
      o.id,
      o.date,
      `"${o.dayName}"`,
      o.time,
      `"${o.restaurant.replace(/"/g, '""')}"`,
      `"${o.address.replace(/"/g, '""')}"`,
      o.distanceKm,
      o.status === 'completed'
        ? (o.durationMinutes + o.durationSeconds / 60).toFixed(2)
        : 0,
      `"${formatDuration(o.durationMinutes, o.durationSeconds)}"`,
      o.status === 'completed' ? 'Completado' : 'Cancelado por usuario',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `uber_driver_pedidos_${selectedDay}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getExecutiveReportText = () => {
    let report = `RESUMEN DE PEDIDOS UBER DRIVER\n`;
    report += `Período analizado: 28/10/2026 - 08/11/2026\n`;
    report += `====================================================\n\n`;
    report += `METRICAS GLOBALES:\n`;
    report += `• Cantidad total de pedidos: ${summary.totalOrders} (${summary.completedCount} completados, ${summary.cancelledCount} cancelados)\n`;
    report += `• Distancia total recorrida: ${summary.totalDistanceKm.toFixed(2)} km\n`;
    report += `• Tiempo promedio de entrega por pedido: ${summary.avgDurationMinutes} min ${summary.avgDurationSeconds} seg (${summary.avgDurationDecimal} min)\n`;
    report += `• Tiempo total activo en entregas: ${summary.totalHours}h ${summary.totalMinutesRem}m ${summary.totalSecondsRem}s\n\n`;
    report += `DESGLOSE POR DÍA:\n`;
    summary.days.forEach((d) => {
      report += `• ${d.dayName}: ${d.totalOrders} pedidos (${d.completedOrders} completados) | ${d.totalDistanceKm} km | Promedio: ${d.avgDurationMinutes}m ${d.avgDurationSeconds}s\n`;
    });
    report += `\nTABLA DETALLADA DE PEDIDOS:\n`;
    report += `Fecha | Hora | Restaurante / Origen | Dirección de Entrega | Km | Tiempo\n`;
    report += `------------------------------------------------------------------------\n`;
    UBER_ORDERS.forEach((o) => {
      report += `${o.dayName.split(',')[1]?.trim() || o.date} | ${o.time} | ${o.restaurant} | ${o.address} | ${o.distanceKm} km | ${formatDuration(o.durationMinutes, o.durationSeconds)}\n`;
    });
    return report;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {copiedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2 border border-emerald-400/40 animate-bounce">
          <Check className="w-5 h-5" />
          <span className="font-medium text-sm">{copiedToast}</span>
        </div>
      )}

      {/* Screenshot Viewer Modal */}
      {activeScreenshot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-sm text-slate-200">
                  Captura de Pantalla Original
                </h3>
              </div>
              <button
                onClick={() => setActiveScreenshot(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto flex justify-center bg-slate-950/70">
              <img
                src={activeScreenshot}
                alt="Captura Uber Driver"
                className="rounded-lg max-h-[75vh] object-contain shadow-lg border border-slate-800"
              />
            </div>
            <div className="p-3 border-t border-slate-800 bg-slate-900 text-xs text-slate-400 text-center flex justify-between items-center px-4">
              <span>Evidencia extraída de la app Uber Driver</span>
              <a
                href={activeScreenshot}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1"
              >
                Abrir imagen <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main App Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-xl border border-emerald-500/30 flex items-center justify-center">
                <FileSpreadsheet className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                  Registro de Actividad Uber Driver
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Análisis completo y cuadro resumen de los 84 pedidos
                  extraídos de las capturas de pantalla (28 oct - 8 nov)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() =>
                copyToClipboard(
                  getExecutiveReportText(),
                  '¡Informe copiado al portapapeles!'
                )
              }
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-semibold flex items-center gap-2 transition shadow-sm"
              title="Copiar texto resumen formateado"
            >
              <Copy className="w-4 h-4 text-emerald-400" />
              <span>Copiar Informe</span>
            </button>
            <button
              onClick={exportCSV}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md shadow-emerald-950"
              title="Descargar datos en formato CSV"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </header>

        {/* Global Summary Cards (Highlights requested by the user) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Pedidos */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Cantidad de Pedidos
              </span>
              <span className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <Layers className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tracking-tight">
                {summary.totalOrders}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                pedidos totales
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {summary.completedCount} completados
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-amber-400">
                <XCircle className="w-3.5 h-3.5" />
                {summary.cancelledCount} cancelados
              </span>
            </div>
          </div>

          {/* Card 2: Distancia Total Recorrida */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-sky-500/40 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Distancia Total Recorrida
              </span>
              <span className="p-2 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
                <Compass className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black text-sky-400 tracking-tight">
                {summary.totalDistanceKm.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-semibold">km</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
              <span>Promedio por pedido:</span>
              <span className="text-sky-300 font-medium">
                {(summary.totalDistanceKm / summary.completedCount).toFixed(
                  2
                )}{' '}
                km / pedido
              </span>
            </div>
          </div>

          {/* Card 3: Tiempo Promedio por Pedido */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tiempo Promedio / Pedido
              </span>
              <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                <Clock className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-amber-300 tracking-tight">
                {summary.avgDurationMinutes}m {summary.avgDurationSeconds}s
              </span>
              <span className="text-xs text-slate-400 font-normal">
                ({summary.avgDurationDecimal} min)
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
              <span>Rango entregas:</span>
              <span className="text-amber-200/90 font-medium">
                13 min ~ 1h 21 min
              </span>
            </div>
          </div>

          {/* Card 4: Tiempo Total en Entregas */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tiempo Total de Entrega
              </span>
              <span className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                <TrendingUp className="w-5 h-5" />
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-purple-300 tracking-tight">
                {summary.totalHours}h {summary.totalMinutesRem}m
              </span>
              <span className="text-xs text-slate-400 font-normal">
                ({summary.totalHours * 60 + summary.totalMinutesRem} min)
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2.5">
              <span>Días trabajados:</span>
              <span className="text-purple-200 font-medium">
                {summary.days.length} jornadas activas
              </span>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('table')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'table'
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Cuadro Resumen de Pedidos ({filteredOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('days')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'days'
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Resumen por Día ({summary.days.length} días)</span>
          </button>

          <button
            onClick={() => setActiveTab('restaurants')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'restaurants'
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Comercios / Restaurantes ({summary.brands.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'report'
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Informe Ejecutivo para Copiar</span>
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'gallery'
                ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-500'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Capturas de Respaldo</span>
          </button>
        </div>

        {/* TAB 1: MAIN TABLE */}
        {activeTab === 'table' && (
          <div className="flex flex-col gap-4">
            {/* Filter and Search Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Buscar restaurante, calle, ciudad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
                  <Filter className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Día:</span>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900">
                      Todos los días ({UBER_ORDERS.length})
                    </option>
                    {summary.days.map((d) => (
                      <option
                        key={d.date}
                        value={d.date}
                        className="bg-slate-900"
                      >
                        {d.dayName} ({d.totalOrders})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
                  <span>Estado:</span>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="all" className="bg-slate-900">
                      Todos ({UBER_ORDERS.length})
                    </option>
                    <option value="completed" className="bg-slate-900">
                      Completados ({summary.completedCount})
                    </option>
                    <option value="cancelled" className="bg-slate-900">
                      Cancelados ({summary.cancelledCount})
                    </option>
                  </select>
                </div>

                {(searchTerm ||
                  selectedDay !== 'all' ||
                  selectedStatus !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedDay('all');
                      setSelectedStatus('all');
                    }}
                    className="text-xs text-slate-400 hover:text-emerald-400 underline px-2 py-1"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Table Container */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                    <tr>
                      <th
                        onClick={() => handleSort('id')}
                        className="p-3.5 pl-4 cursor-pointer hover:text-white transition w-12"
                      >
                        <div className="flex items-center gap-1">
                          #
                          {sortField === 'id' &&
                            (sortAsc ? (
                              <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('date')}
                        className="p-3.5 cursor-pointer hover:text-white transition"
                      >
                        <div className="flex items-center gap-1">
                          Fecha
                          {sortField === 'date' &&
                            (sortAsc ? (
                              <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('time')}
                        className="p-3.5 cursor-pointer hover:text-white transition"
                      >
                        <div className="flex items-center gap-1">
                          Hora
                          {sortField === 'time' &&
                            (sortAsc ? (
                              <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('restaurant')}
                        className="p-3.5 cursor-pointer hover:text-white transition"
                      >
                        <div className="flex items-center gap-1">
                          Restaurante / Origen
                          {sortField === 'restaurant' &&
                            (sortAsc ? (
                              <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('address')}
                        className="p-3.5 cursor-pointer hover:text-white transition min-w-[200px]"
                      >
                        <div className="flex items-center gap-1">
                          Dirección de Entrega
                          {sortField === 'address' &&
                            (sortAsc ? (
                              <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('distanceKm')}
                        className="p-3.5 cursor-pointer hover:text-white transition text-right"
                      >
                        <div className="flex items-center justify-end gap-1">
                          Kilometraje
                          {sortField === 'distanceKm' &&
                            (sortAsc ? (
                              <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                            ))}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('durationMinutes')}
                        className="p-3.5 cursor-pointer hover:text-white transition text-right"
                      >
                        <div className="flex items-center justify-end gap-1">
                          Tiempo
                          {sortField === 'durationMinutes' &&
                            (sortAsc ? (
                              <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
                            ))}
                        </div>
                      </th>
                      <th className="p-3.5 text-center">Estado</th>
                      <th className="p-3.5 pr-4 text-center">Captura</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 font-normal">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="text-center py-12 text-slate-500"
                        >
                          No se encontraron pedidos con los filtros
                          seleccionados.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const isCancelled = order.status === 'cancelled';
                        return (
                          <tr
                            key={order.id}
                            className={`hover:bg-slate-800/40 transition ${
                              isCancelled
                                ? 'bg-amber-950/15 text-slate-400'
                                : 'text-slate-200'
                            }`}
                          >
                            <td className="p-3.5 pl-4 text-xs font-mono text-slate-500">
                              #{order.id}
                            </td>
                            <td className="p-3.5 whitespace-nowrap">
                              <span className="font-medium text-slate-300">
                                {order.dayName.split(',')[1]?.trim() ||
                                  order.date}
                              </span>
                            </td>
                            <td className="p-3.5 whitespace-nowrap font-mono font-semibold text-emerald-400">
                              {order.time}
                            </td>
                            <td className="p-3.5">
                              <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                                <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{order.restaurant}</span>
                              </div>
                            </td>
                            <td className="p-3.5 text-slate-300">
                              <span className="line-clamp-2" title={order.address}>
                                {order.address}
                              </span>
                            </td>
                            <td className="p-3.5 text-right whitespace-nowrap font-mono font-medium">
                              {isCancelled ? (
                                <span className="text-slate-500">—</span>
                              ) : (
                                <span className="text-sky-300">
                                  {order.distanceKm.toFixed(2)} km
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-right whitespace-nowrap font-mono">
                              {isCancelled ? (
                                <span className="text-amber-400/80 text-xs">
                                  Cancelado
                                </span>
                              ) : (
                                <span className="text-amber-300 font-medium">
                                  {formatDuration(
                                    order.durationMinutes,
                                    order.durationSeconds
                                  )}
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-center whitespace-nowrap">
                              {isCancelled ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                  Cancelado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  Completado
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 pr-4 text-center whitespace-nowrap">
                              {order.screenshot ? (
                                <button
                                  onClick={() =>
                                    setActiveScreenshot(order.screenshot!)
                                  }
                                  className="text-slate-400 hover:text-emerald-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                                  title="Ver captura original de este pedido"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              ) : (
                                <span className="text-slate-600">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {filteredOrders.length > 0 && (
                    <tfoot className="bg-slate-950 font-bold border-t-2 border-slate-700 text-slate-200">
                      <tr>
                        <td colSpan={5} className="p-4 pl-4 text-xs uppercase tracking-wider">
                          Subtotal Filtrado ({filteredOrders.length} pedidos)
                        </td>
                        <td className="p-4 text-right font-mono text-sky-400">
                          {filteredOrders
                            .filter((o) => o.status === 'completed')
                            .reduce((s, o) => s + o.distanceKm, 0)
                            .toFixed(2)}{' '}
                          km
                        </td>
                        <td className="p-4 text-right font-mono text-amber-300">
                          {(() => {
                            const comp = filteredOrders.filter(
                              (o) => o.status === 'completed'
                            );
                            if (comp.length === 0) return '0 min';
                            const sec = comp.reduce(
                              (s, o) =>
                                s + o.durationMinutes * 60 + o.durationSeconds,
                              0
                            );
                            const avgSec = sec / comp.length;
                            return `Prom: ${Math.floor(
                              avgSec / 60
                            )}m ${Math.round(avgSec % 60)}s`;
                          })()}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DAY BY DAY BREAKDOWN */}
        {activeTab === 'days' && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Resumen Diario de Actividad y Rendimiento
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mb-6">
                Comparativa de pedidos entregados, kilometraje recorrido y tiempo promedio diario invertido por entrega.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase font-semibold text-xs tracking-wider">
                    <tr>
                      <th className="p-3.5 pl-4">Día / Fecha</th>
                      <th className="p-3.5 text-center">Total Pedidos</th>
                      <th className="p-3.5 text-center">Completados</th>
                      <th className="p-3.5 text-center">Cancelados</th>
                      <th className="p-3.5 text-right">Km Totales</th>
                      <th className="p-3.5 text-right">Km Promedio / Pedido</th>
                      <th className="p-3.5 text-right">Tiempo Total</th>
                      <th className="p-3.5 text-right pr-4">Tiempo Promedio / Pedido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {summary.days.map((day) => {
                      const avgKmPerOrder =
                        day.completedOrders > 0
                          ? day.totalDistanceKm / day.completedOrders
                          : 0;
                      const dayHours = Math.floor(day.totalSeconds / 3600);
                      const dayMin = Math.floor((day.totalSeconds % 3600) / 60);

                      return (
                        <tr
                          key={day.date}
                          className="hover:bg-slate-800/40 transition"
                        >
                          <td className="p-3.5 pl-4 font-semibold text-slate-100 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                            {day.dayName}
                          </td>
                          <td className="p-3.5 text-center font-bold text-white">
                            {day.totalOrders}
                          </td>
                          <td className="p-3.5 text-center text-emerald-400 font-medium">
                            {day.completedOrders}
                          </td>
                          <td className="p-3.5 text-center">
                            {day.cancelledOrders > 0 ? (
                              <span className="text-amber-400 font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                                {day.cancelledOrders}
                              </span>
                            ) : (
                              <span className="text-slate-600">0</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right font-mono font-semibold text-sky-400">
                            {day.totalDistanceKm.toFixed(2)} km
                          </td>
                          <td className="p-3.5 text-right font-mono text-slate-300">
                            {avgKmPerOrder.toFixed(2)} km
                          </td>
                          <td className="p-3.5 text-right font-mono text-purple-300">
                            {dayHours > 0 ? `${dayHours}h ` : ''}
                            {dayMin}m
                          </td>
                          <td className="p-3.5 pr-4 text-right font-mono font-bold text-amber-300">
                            {day.avgDurationMinutes}m {day.avgDurationSeconds}s
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-950 font-bold border-t-2 border-slate-700 text-white">
                    <tr>
                      <td className="p-4 pl-4 uppercase tracking-wider text-xs">
                        TOTAL GENERAL ({summary.days.length} días)
                      </td>
                      <td className="p-4 text-center text-emerald-400 text-base">
                        {summary.totalOrders}
                      </td>
                      <td className="p-4 text-center text-emerald-400">
                        {summary.completedCount}
                      </td>
                      <td className="p-4 text-center text-amber-400">
                        {summary.cancelledCount}
                      </td>
                      <td className="p-4 text-right font-mono text-sky-400 text-base">
                        {summary.totalDistanceKm.toFixed(2)} km
                      </td>
                      <td className="p-4 text-right font-mono text-slate-300">
                        {(
                          summary.totalDistanceKm / summary.completedCount
                        ).toFixed(2)}{' '}
                        km
                      </td>
                      <td className="p-4 text-right font-mono text-purple-300 text-base">
                        {summary.totalHours}h {summary.totalMinutesRem}m
                      </td>
                      <td className="p-4 pr-4 text-right font-mono text-amber-300 text-base">
                        {summary.avgDurationMinutes}m {summary.avgDurationSeconds}s
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RESTAURANTS / COMMERCE BREAKDOWN */}
        {activeTab === 'restaurants' && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-400" />
                Comercios y Cadenas de Restaurantes con más Pedidos
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mb-6">
                Concentración de pedidos y kilómetros generados por cada comercio o franquicia.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.brands.map((b, idx) => (
                  <div
                    key={b.name}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs text-slate-500 font-mono">
                          #{idx + 1}
                        </span>
                        <h4 className="font-bold text-white text-base mt-0.5">
                          {b.name}
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/20">
                        {b.count} pedidos
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
                      <span>Distancia acumulada:</span>
                      <span className="font-mono text-sky-400 font-semibold">
                        {b.totalKm.toFixed(2)} km
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EXECUTIVE REPORT COPYABLE TEXT */}
        {activeTab === 'report' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  Informe Ejecutivo Formateado
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                  Texto listo para copiar y pegar en WhatsApp, email, informe contable o Excel.
                </p>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(
                    getExecutiveReportText(),
                    '¡Informe copiado al portapapeles!'
                  )
                }
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md transition self-start sm:self-center"
              >
                <Copy className="w-4 h-4" />
                <span>Copiar Todo el Informe</span>
              </button>
            </div>

            {/* Quick Answer Summary Box */}
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-5 text-emerald-100 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wider">
                <Info className="w-4 h-4" />
                Respuesta a las tres preguntas solicitadas:
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="bg-slate-950/60 p-3.5 rounded-lg border border-emerald-500/20">
                  <span className="text-xs text-slate-400 block font-medium">
                    1. Cantidad de pedidos:
                  </span>
                  <span className="text-2xl font-black text-white mt-1 block">
                    {summary.totalOrders} pedidos
                  </span>
                  <span className="text-xs text-emerald-400">
                    ({summary.completedCount} entregados, {summary.cancelledCount}{' '}
                    cancelados)
                  </span>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-lg border border-emerald-500/20">
                  <span className="text-xs text-slate-400 block font-medium">
                    2. Tiempo promedio por pedido:
                  </span>
                  <span className="text-2xl font-black text-amber-300 mt-1 block">
                    {summary.avgDurationMinutes} min {summary.avgDurationSeconds} seg
                  </span>
                  <span className="text-xs text-slate-400">
                    ({summary.avgDurationDecimal} minutos promedio)
                  </span>
                </div>

                <div className="bg-slate-950/60 p-3.5 rounded-lg border border-emerald-500/20">
                  <span className="text-xs text-slate-400 block font-medium">
                    3. Distancia total recorrida:
                  </span>
                  <span className="text-2xl font-black text-sky-400 mt-1 block">
                    {summary.totalDistanceKm.toFixed(2)} km
                  </span>
                  <span className="text-xs text-slate-400">
                    (Promedio: {(summary.totalDistanceKm / summary.completedCount).toFixed(2)} km / pedido)
                  </span>
                </div>
              </div>
            </div>

            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre leading-relaxed select-all">
              {getExecutiveReportText()}
            </pre>
          </div>
        )}

        {/* TAB 5: SCREENSHOT GALLERY */}
        {activeTab === 'gallery' && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-400" />
                Galería de Capturas de Pantalla Originales (42 Capturas)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mb-6">
                Todas las capturas proporcionadas para validar cualquier pedido o detalle de la ruta.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Array.from(
                  new Set(UBER_ORDERS.map((o) => o.screenshot).filter(Boolean))
                ).map((shotPath, index) => (
                  <div
                    key={shotPath}
                    onClick={() => setActiveScreenshot(shotPath!)}
                    className="group bg-slate-950 border border-slate-800 rounded-xl overflow-hidden hover:border-emerald-500/50 cursor-pointer transition shadow hover:shadow-emerald-950/50 flex flex-col"
                  >
                    <div className="aspect-[9/16] bg-slate-900 overflow-hidden relative">
                      <img
                        src={shotPath!}
                        alt={`Captura ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <Eye className="w-6 h-6 text-white drop-shadow" />
                      </div>
                    </div>
                    <div className="p-2 text-center text-xs font-mono text-slate-400 bg-slate-950 truncate">
                      Captura #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>
          Uber Driver Activity Analytics • Total de 84 registros analizados con
          precisión kilométrica y temporal
        </p>
      </footer>
    </div>
  );
}
