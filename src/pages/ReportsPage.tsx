import { useState, useEffect } from 'react';
import { RefreshCw, FileText, Download, FileSpreadsheet, File, BarChart2, AlertTriangle, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  downloadCsv, getAbcXyzReport, getReorderAlertsReport,
  getProductsReport, downloadAbcXyzExcel, downloadAbcXyzPdf,
} from '@/api/reports';

export default function ReportsPage() {
  const [abcData, setAbcData]           = useState<any[]>([]);
  const [reorderData, setReorderData]   = useState<any[]>([]);
  const [productsData, setProductsData] = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [abc, reorder, products] = await Promise.all([
        getAbcXyzReport(), getReorderAlertsReport(), getProductsReport(),
      ]);
      setAbcData(abc); setReorderData(reorder); setProductsData(products);
    } catch { toast.error('Помилка завантаження звітів'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  const handleAbcCsv = () => {
    downloadCsv(abcData.map(item => ({
      'ID товару': item.productId, 'Назва': item.productName, 'SKU': item.sku,
      'ABC клас': item.abcClass, 'XYZ клас': item.xyzClass, 'Комб. клас': item.combinedClass,
      'Оборот': item.revenue, 'Частка (%)': ((item.revenueShare ?? 0) * 100).toFixed(2),
      'CV (%)': item.cv, 'Рекомендація': item.recommendation,
    })), 'abc_xyz_analysis.csv');
    toast.success('CSV завантажено');
  };

  const handleAbcExcel = async () => {
    try { await downloadAbcXyzExcel(); toast.success('Excel завантажено'); }
    catch { toast.error('Помилка завантаження Excel'); }
  };

  const handleAbcPdf = async () => {
    try { await downloadAbcXyzPdf(); toast.success('PDF завантажено'); }
    catch { toast.error('Помилка завантаження PDF'); }
  };

  const handleReorderCsv = () => {
    downloadCsv(reorderData.map(item => ({
      'ID товару': item.productId, 'Назва': item.productName, 'SKU': item.sku,
      'Залишок': item.currentStock, 'ROP': item.reorderPoint,
      'EOQ': item.eoq, 'Страховий запас': item.safetyStock, 'Рекомендація': item.recommendation,
    })), 'reorder_alerts.csv');
    toast.success('CSV завантажено');
  };

  const handleProductsCsv = () => {
    downloadCsv(productsData.map(item => ({
      'ID': item.id, 'Назва': item.name, 'SKU': item.sku,
      'Ціна': item.unitPrice, 'Категорія': item.categoryName ?? '—',
      'Постачальник': item.supplierName ?? '—',
      'Статус': item.isActive ? 'Активний' : 'Неактивний',
    })), 'products_catalog.csv');
    toast.success('CSV завантажено');
  };

  const reports = [
    {
      title: 'ABC/XYZ Аналіз',
      description: 'Класифікація товарів за оборотом та стабільністю попиту',
      count: abcData.length,
      icon: BarChart2,
      gradient: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
      bg: 'rgba(59,130,246,0.06)',
      border: 'rgba(59,130,246,0.2)',
      iconBg: 'rgba(59,130,246,0.12)',
      iconColor: '#3B82F6',
      buttons: [
        { label: 'CSV', icon: Download, onClick: handleAbcCsv, color: '#1D4ED8', bg: 'rgba(29,78,216,0.08)', border: 'rgba(29,78,216,0.2)' },
        { label: 'Excel', icon: FileSpreadsheet, onClick: handleAbcExcel, color: '#15803D', bg: 'rgba(21,128,61,0.08)', border: 'rgba(21,128,61,0.2)' },
        { label: 'PDF', icon: File, onClick: handleAbcPdf, color: '#DC2626', bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.2)' },
      ],
    },
    {
      title: 'Критичні залишки',
      description: 'Товари нижче точки перезамовлення з рекомендаціями EOQ',
      count: reorderData.length,
      icon: AlertTriangle,
      gradient: 'linear-gradient(135deg, #C2410C, #F97316)',
      bg: 'rgba(249,115,22,0.06)',
      border: 'rgba(249,115,22,0.2)',
      iconBg: 'rgba(249,115,22,0.12)',
      iconColor: '#F97316',
      buttons: [
        { label: 'CSV', icon: Download, onClick: handleReorderCsv, color: '#C2410C', bg: 'rgba(194,65,12,0.08)', border: 'rgba(194,65,12,0.2)' },
      ],
    },
    {
      title: 'Каталог товарів',
      description: 'Всі товари з цінами, категоріями та постачальниками',
      count: productsData.length,
      icon: Package,
      gradient: 'linear-gradient(135deg, #15803D, #22C55E)',
      bg: 'rgba(34,197,94,0.06)',
      border: 'rgba(34,197,94,0.2)',
      iconBg: 'rgba(34,197,94,0.12)',
      iconColor: '#22C55E',
      buttons: [
        { label: 'CSV', icon: Download, onClick: handleProductsCsv, color: '#15803D', bg: 'rgba(21,128,61,0.08)', border: 'rgba(21,128,61,0.2)' },
      ],
    },
  ];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="rounded-lg overflow-hidden" style={{
        background: 'linear-gradient(135deg, #0C1628 0%, #1E293B 60%, #0A1220 100%)',
        padding: '24px 28px',
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0369A1, #38BDF8)' }}>
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Звіти</h1>
              <p className="text-sm" style={{ color: '#64748B' }}>Вивантаження даних у форматах CSV, Excel, PDF</p>
            </div>
          </div>
          <button
            onClick={loadAll} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all"
            style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#38BDF8', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Оновити дані
          </button>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="flex gap-6 mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div className="text-xs mb-1" style={{ color: '#475569' }}>Товарів в ABC/XYZ</div>
              <div className="text-xl font-bold text-white">{abcData.length}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: '#475569' }}>Потребують замовлення</div>
              <div className="text-xl font-bold" style={{ color: reorderData.length > 0 ? '#FB923C' : '#4ADE80' }}>
                {reorderData.length}
              </div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: '#475569' }}>Товарів у каталозі</div>
              <div className="text-xl font-bold text-white">{productsData.length}</div>
            </div>
          </div>
        )}
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reports.map(report => (
          <div key={report.title}
            className="rounded-md border p-5 hover:shadow-md transition-all"
            style={{ background: report.bg, borderColor: report.border }}>

            {/* Card header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: report.gradient }}>
                  <report.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{report.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{report.description}</p>
                </div>
              </div>
            </div>

            {/* Count */}
            {loading ? (
              <Skeleton className="h-8 w-16 mb-4" />
            ) : (
              <div className="mb-4">
                <span className="text-3xl font-bold text-slate-700">{report.count}</span>
                <span className="text-sm text-slate-400 ml-1.5">записів</span>
              </div>
            )}

            {/* Download buttons */}
            <div className="flex flex-col gap-2">
              {report.buttons.map(btn => (
                <button
                  key={btn.label}
                  onClick={btn.onClick}
                  disabled={loading || report.count === 0}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded text-sm font-medium transition-all disabled:opacity-40"
                  style={{
                    background: btn.bg,
                    border: `1px solid ${btn.border}`,
                    color: btn.color,
                    cursor: loading || report.count === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  <btn.icon className="h-3.5 w-3.5" />
                  Завантажити {btn.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ABC/XYZ preview table */}
      {!loading && abcData.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-slate-800">ABC/XYZ — попередній перегляд</h2>
            <span className="text-xs text-slate-400">Показано {Math.min(10, abcData.length)} з {abcData.length}</span>
          </div>
          <div className="rounded-md border bg-white overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ background: '#F8FAFC' }}>
                  {['Товар', 'ABC', 'XYZ', 'Оборот', 'CV %', 'Рекомендація'].map((h, i) => (
                    <th key={h} className={`px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-slate-400 ${i >= 3 && i <= 4 ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {abcData.slice(0, 10).map((item, i) => (
                  <tr key={item.productId}
                    className="border-b transition-colors hover:bg-slate-50"
                    style={{ background: i % 2 !== 0 ? 'rgba(248,250,252,0.6)' : undefined }}>
                    <td className="px-4 py-3 font-semibold text-slate-800">{item.productName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        item.abcClass === 'A' ? 'bg-green-100 text-green-700' :
                        item.abcClass === 'B' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>{item.abcClass}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        item.xyzClass === 'X' ? 'bg-blue-100 text-blue-700' :
                        item.xyzClass === 'Y' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{item.xyzClass}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {Number(item.revenue).toFixed(2)} грн
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">{Number(item.cv).toFixed(1)}%</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">{item.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {abcData.length > 10 && (
              <div className="px-4 py-3 text-center text-xs text-slate-400 border-t bg-slate-50">
                Завантажте CSV або Excel для повного списку ({abcData.length} записів)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
