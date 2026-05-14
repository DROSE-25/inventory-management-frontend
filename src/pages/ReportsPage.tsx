import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReportCard from '@/components/reports/ReportCard';
import {
  downloadCsv,
  getAbcXyzReport,
  getReorderAlertsReport,
  getProductsReport,
} from '@/api/reports';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [abcData, setAbcData]           = useState<any[]>([]);
  const [reorderData, setReorderData]   = useState<any[]>([]);
  const [productsData, setProductsData] = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [abc, reorder, products] = await Promise.all([
        getAbcXyzReport(),
        getReorderAlertsReport(),
        getProductsReport(),
      ]);
      setAbcData(abc);
      setReorderData(reorder);
      setProductsData(products);
    } catch {
      toast.error('Помилка завантаження звітів');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleAbcCsv = () => {
    const rows = abcData.map(item => ({
      'ID товару':    item.productId,
      'Назва':        item.productName,
      'SKU':          item.sku,
      'ABC клас':     item.abcClass,
      'XYZ клас':     item.xyzClass,
      'Комб. клас':   item.combinedClass,
      'Оборот':       item.revenue,
      'Частка (%)':   ((item.revenueShare ?? 0) * 100).toFixed(2),
      'CV (%)':       item.cv,
      'Рекомендація': item.recommendation,
    }));
    downloadCsv(rows, 'abc_xyz_analysis.csv');
    toast.success('CSV завантажено');
  };

  const handleReorderCsv = () => {
    const rows = reorderData.map(item => ({
      'ID товару':    item.productId,
      'Назва':        item.productName,
      'SKU':          item.sku,
      'Залишок':      item.currentStock,
      'ROP':          item.reorderPoint,
      'EOQ':          item.eoq,
      'Safety Stock': item.safetyStock,
      'Рекомендація': item.recommendation,
    }));
    downloadCsv(rows, 'reorder_alerts.csv');
    toast.success('CSV завантажено');
  };

  const handleProductsCsv = () => {
    const rows = productsData.map(item => ({
      'ID':           item.id,
      'Назва':        item.name,
      'SKU':          item.sku,
      'Ціна':         item.unitPrice,
      'Категорія':    item.categoryName ?? '—',
      'Постачальник': item.supplierName ?? '—',
      'Статус':       item.isActive ? 'Активний' : 'Неактивний',
    }));
    downloadCsv(rows, 'products_catalog.csv');
    toast.success('CSV завантажено');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Звіти</h1>
          <p className="text-slate-500 text-sm">
            Вивантаження даних у форматі CSV
          </p>
        </div>
        <Button variant="outline" onClick={loadAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Оновити дані
        </Button>
      </div>

      {/* Статистика */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{abcData.length}</p>
            <p className="text-xs text-slate-500">товарів в ABC/XYZ</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{reorderData.length}</p>
            <p className="text-xs text-slate-500">потребують замовлення</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{productsData.length}</p>
            <p className="text-xs text-slate-500">товарів у каталозі</p>
          </div>
        </div>
      )}

      {/* Картки звітів */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReportCard
          title="ABC/XYZ Аналіз"
          description="Класифікація товарів за оборотом та стабільністю попиту"
          rowCount={loading ? undefined : abcData.length}
          onDownloadCsv={handleAbcCsv}
          loading={loading}
        />
        <ReportCard
          title="Критичні залишки"
          description="Товари нижче точки перезамовлення з рекомендаціями EOQ"
          rowCount={loading ? undefined : reorderData.length}
          onDownloadCsv={handleReorderCsv}
          loading={loading}
        />
        <ReportCard
          title="Каталог товарів"
          description="Всі товари з цінами, категоріями та постачальниками"
          rowCount={loading ? undefined : productsData.length}
          onDownloadCsv={handleProductsCsv}
          loading={loading}
        />
      </div>

      {/* ABC/XYZ таблиця */}
      {!loading && abcData.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">ABC/XYZ — попередній перегляд</h2>
          <div className="border rounded-lg overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3 font-medium">Товар</th>
                  <th className="text-center p-3 font-medium">ABC</th>
                  <th className="text-center p-3 font-medium">XYZ</th>
                  <th className="text-right p-3 font-medium">Оборот</th>
                  <th className="text-right p-3 font-medium">CV %</th>
                  <th className="text-left p-3 font-medium">Рекомендація</th>
                </tr>
              </thead>
              <tbody>
                {abcData.slice(0, 10).map((item, i) => (
                  <tr key={item.productId} className={`border-b hover:bg-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                    <td className="p-3 font-medium">{item.productName}</td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                        item.abcClass === 'A' ? 'bg-green-100 text-green-700' :
                        item.abcClass === 'B' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>{item.abcClass}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                        item.xyzClass === 'X' ? 'bg-blue-100 text-blue-700' :
                        item.xyzClass === 'Y' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>{item.xyzClass}</span>
                    </td>
                    <td className="p-3 text-right">{Number(item.revenue).toFixed(2)} грн</td>
                    <td className="p-3 text-right">{Number(item.cv).toFixed(1)}%</td>
                    <td className="p-3 text-xs text-slate-600 max-w-xs truncate">{item.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {abcData.length > 10 && (
              <div className="p-3 text-center text-sm text-slate-400 border-t">
                Показано 10 з {abcData.length} — завантажте CSV для повного списку
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
