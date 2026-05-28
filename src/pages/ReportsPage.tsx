import { useState, useEffect } from 'react';
import {
  RefreshCw, FileText, Download, FileSpreadsheet, File,
  BarChart2, AlertTriangle, Package, ShoppingCart, Calendar,
  TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  downloadCsv, getAbcXyzReport, getReorderAlertsReport,
  getProductsReport, downloadAbcXyzExcel, downloadAbcXyzPdf,
} from '@/api/reports';
import { apiClient } from '@/api/client';

// ── helpers ─────────────────────────────────────────────────────────────────
function Badge({ text, color }: { text: string; color: string }) {
  const map: Record<string, { bg: string; fg: string }> = {
    green:  { bg: '#DCFCE7', fg: '#15803D' },
    yellow: { bg: '#FEF9C3', fg: '#A16207' },
    red:    { bg: '#FEE2E2', fg: '#B91C1C' },
    blue:   { bg: '#DBEAFE', fg: '#1D4ED8' },
    purple: { bg: '#EDE9FE', fg: '#6D28D9' },
    gray:   { bg: '#F1F5F9', fg: '#475569' },
  };
  const s = map[color] ?? map.gray;
  return (
    <span style={{
      background: s.bg, color: s.fg,
      fontSize: 11, fontWeight: 700,
      padding: '2px 8px', borderRadius: 20,
      display: 'inline-block',
    }}>{text}</span>
  );
}

function SectionHeader({ title, count, color, onCsv, onExcel, onPdf, icon: Icon, open, onToggle }: any) {
  return (
    <div className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
      style={{ borderBottom: open ? '1px solid #F1F5F9' : 'none' }}
      onClick={onToggle}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: color }}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-slate-800 text-sm">{title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{count} записів</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onCsv && (
          <button onClick={e => { e.stopPropagation(); onCsv(); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all"
            style={{ background: 'rgba(29,78,216,0.08)', border: '1px solid rgba(29,78,216,0.2)', color: '#1D4ED8' }}>
            <Download className="h-3 w-3" /> CSV
          </button>
        )}
        {onExcel && (
          <button onClick={e => { e.stopPropagation(); onExcel(); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all"
            style={{ background: 'rgba(21,128,61,0.08)', border: '1px solid rgba(21,128,61,0.2)', color: '#15803D' }}>
            <FileSpreadsheet className="h-3 w-3" /> Excel
          </button>
        )}
        {onPdf && (
          <button onClick={e => { e.stopPropagation(); onPdf(); }}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all"
            style={{ background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: '#DC2626' }}>
            <File className="h-3 w-3" /> PDF
          </button>
        )}
        {open ? <ChevronUp className="h-4 w-4 text-slate-400 ml-1" /> : <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />}
      </div>
    </div>
  );
}

// ── main ─────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [abcData, setAbcData]           = useState<any[]>([]);
  const [reorderData, setReorderData]   = useState<any[]>([]);
  const [productsData, setProductsData] = useState<any[]>([]);
  const [salesData, setSalesData]       = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);

  const today    = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [salesFrom, setSalesFrom] = useState(monthAgo);
  const [salesTo, setSalesTo]     = useState(today);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    abc: true, reorder: true, products: false, sales: true,
  });
  const toggle = (key: string) => setOpenSections(s => ({ ...s, [key]: !s[key] }));

  const loadAll = async () => {
    setLoading(true);
    try {
      const [abc, reorder, products, sales] = await Promise.all([
        getAbcXyzReport(), getReorderAlertsReport(), getProductsReport(),
        apiClient.get('/sales', { params: { page: 0, size: 9999, from: salesFrom, to: salesTo } })
          .then(r => Array.isArray(r.data) ? r.data : r.data.content ?? []),
      ]);
      setAbcData(abc); setReorderData(reorder); setProductsData(products); setSalesData(sales);
    } catch { toast.error('Помилка завантаження'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadAll(); }, []);

  // Handlers
  const handleAbcCsv = () => {
    downloadCsv(abcData.map(i => ({
      'Назва': i.productName, 'SKU': i.sku, 'ABC': i.abcClass, 'XYZ': i.xyzClass,
      'Клас': i.combinedClass, 'Оборот грн': Number(i.revenue).toFixed(2),
      'Частка %': ((i.revenueShare ?? 0) * 100).toFixed(2), 'CV %': Number(i.cv).toFixed(1),
    })), 'abc_xyz.csv');
    toast.success('CSV завантажено');
  };
  const handleAbcExcel = async () => {
    try { await downloadAbcXyzExcel(); toast.success('Excel завантажено'); }
    catch { toast.error('Помилка'); }
  };
  const handleAbcPdf = async () => {
    try { await downloadAbcXyzPdf(); toast.success('PDF завантажено'); }
    catch { toast.error('Помилка'); }
  };
  const handleReorderCsv = () => {
    downloadCsv(reorderData.map(i => ({
      'Товар': i.productName, 'SKU': i.sku, 'Склад': i.warehouseName ?? '—',
      'Залишок': i.currentStock, 'ROP': i.reorderPoint, 'EOQ': i.eoq,
      'Страх. запас': i.safetyStock, 'Рекомендація': i.recommendation,
    })), 'reorder_alerts.csv');
    toast.success('CSV завантажено');
  };
  const handleProductsCsv = () => {
    downloadCsv(productsData.map(i => ({
      'Назва': i.name, 'SKU': i.sku, 'Ціна грн': i.unitPrice,
      'Од. виміру': i.unitOfMeasure ?? '—', 'Категорія': i.categoryName ?? '—',
      'Постачальник': i.supplierName ?? '—', 'Статус': i.isActive ? 'Активний' : 'Неактивний',
    })), 'products.csv');
    toast.success('CSV завантажено');
  };
  const handleSalesCsv = () => {
    downloadCsv(salesData.map(s => ({
      'Дата': s.saleDate, 'Товар': s.productName, 'Склад': s.warehouseName ?? '—',
      'К-сть': s.quantity, 'Од.': s.unitOfMeasure ?? 'шт',
      'Ціна грн': s.unitPrice, 'Сума грн': (Number(s.quantity) * Number(s.unitPrice)).toFixed(2),
      'Автор': s.createdBy ?? '—',
    })), `sales_${salesFrom}_${salesTo}.csv`);
    toast.success('CSV завантажено');
  };

  // Summary stats
  const totalRevenue = salesData.reduce((s, x) => s + Number(x.quantity) * Number(x.unitPrice), 0);
  const avgCheck = salesData.length > 0 ? totalRevenue / salesData.length : 0;
  const classACount = abcData.filter(i => i.abcClass === 'A').length;
  const criticalCount = reorderData.filter((i: any) => i.currentStock <= (i.safetyStock ?? 0)).length;

  const topProducts = Object.values(
    salesData.reduce((acc: any, s: any) => {
      const k = s.productName;
      if (!acc[k]) acc[k] = { name: k, qty: 0, rev: 0 };
      acc[k].qty += Number(s.quantity);
      acc[k].rev += Number(s.quantity) * Number(s.unitPrice);
      return acc;
    }, {})
  ).sort((a: any, b: any) => b.rev - a.rev).slice(0, 5) as any[];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="rounded-xl overflow-hidden" style={{
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
              <h1 className="text-2xl font-bold text-white">Звіти</h1>
              <p className="text-sm" style={{ color: '#64748B' }}>Аналіз, експорт і перегляд даних</p>
            </div>
          </div>
          <button onClick={loadAll} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#38BDF8', cursor: 'pointer' }}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Оновити
          </button>
        </div>

        {/* Summary KPIs */}
        {!loading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[
              { label: 'Виручка за період', value: (totalRevenue / 1000).toFixed(1) + ' тис грн', color: '#4ADE80' },
              { label: 'Продажів', value: salesData.length, color: 'white' },
              { label: 'Товарів клас A', value: classACount, color: '#C084FC' },
              { label: 'Критичних залишків', value: criticalCount || reorderData.length, color: criticalCount > 0 ? '#FB923C' : '#4ADE80' },
            ].map(k => (
              <div key={k.label}>
                <div className="text-xs mb-1" style={{ color: '#475569' }}>{k.label}</div>
                <div className="text-xl font-bold" style={{ color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sales period filter */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Calendar className="h-4 w-4 text-slate-400" />
            Період для звіту продажів:
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Від</label>
            <input type="date" value={salesFrom} onChange={e => setSalesFrom(e.target.value)}
              className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">До</label>
            <input type="date" value={salesTo} onChange={e => setSalesTo(e.target.value)}
              className="border rounded px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <button onClick={loadAll}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
            style={{ background: 'rgba(3,105,161,0.1)', border: '1px solid rgba(3,105,161,0.2)', color: '#0369A1', cursor: 'pointer' }}>
            <RefreshCw className="h-3.5 w-3.5" /> Застосувати
          </button>
          {salesData.length > 0 && (
            <div className="ml-auto text-sm text-slate-500">
              <strong className="text-slate-800">{salesData.length}</strong> записів ·{' '}
              <strong className="text-blue-700">{(totalRevenue / 1000).toFixed(1)} тис грн</strong> ·{' '}
              середній чек <strong className="text-slate-700">{avgCheck.toFixed(0)} грн</strong>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-4">

          {/* ── ABC/XYZ ── */}
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <SectionHeader
              title="ABC/XYZ Аналіз" count={abcData.length}
              color="linear-gradient(135deg, #1D4ED8, #3B82F6)"
              icon={BarChart2} open={openSections.abc}
              onToggle={() => toggle('abc')}
              onCsv={handleAbcCsv} onExcel={handleAbcExcel} onPdf={handleAbcPdf}
            />
            {openSections.abc && abcData.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: '#F8FAFC' }} className="border-b">
                      {['Товар', 'SKU', 'ABC', 'XYZ', 'Клас', 'Оборот', 'Частка', 'Стабільність', 'Рекомендація'].map((h, i) => (
                        <th key={h} className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 ${i >= 5 && i <= 7 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {abcData.slice(0, 8).map((item, i) => (
                      <tr key={item.productId} className="border-b hover:bg-slate-50"
                        style={{ background: i % 2 !== 0 ? 'rgba(248,250,252,0.5)' : undefined }}>
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{item.productName}</td>
                        <td className="px-4 py-2.5"><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{item.sku}</span></td>
                        <td className="px-4 py-2.5">
                          <Badge text={item.abcClass} color={item.abcClass === 'A' ? 'green' : item.abcClass === 'B' ? 'yellow' : 'red'} />
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge text={item.xyzClass} color={item.xyzClass === 'X' ? 'blue' : item.xyzClass === 'Y' ? 'purple' : 'gray'} />
                        </td>
                        <td className="px-4 py-2.5 font-bold text-slate-700">{item.combinedClass}</td>
                        <td className="px-4 py-2.5 text-right font-medium">{(Number(item.revenue) / 1000).toFixed(1)} тис</td>
                        <td className="px-4 py-2.5 text-right text-slate-500">{((item.revenueShare ?? 0) * 100).toFixed(1)}%</td>
                        <td className="px-4 py-2.5 text-right text-slate-500">{Number(item.cv).toFixed(1)}%</td>
                        <td className="px-4 py-2.5 text-xs text-slate-500 max-w-xs">{item.recommendation?.split('.')[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {abcData.length > 8 && (
                  <div className="px-4 py-2.5 text-xs text-slate-400 text-center border-t bg-slate-50">
                    Показано 8 з {abcData.length} — завантажте CSV або Excel для повного списку
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Критичні залишки ── */}
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <SectionHeader
              title="Критичні залишки" count={reorderData.length}
              color="linear-gradient(135deg, #C2410C, #F97316)"
              icon={AlertTriangle} open={openSections.reorder}
              onToggle={() => toggle('reorder')}
              onCsv={handleReorderCsv}
            />
            {openSections.reorder && reorderData.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: '#F8FAFC' }} className="border-b">
                      {['Товар', 'SKU', 'Склад', 'Залишок', 'ROP', 'EOQ', 'Страх. запас', 'Статус'].map((h, i) => (
                        <th key={h} className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 ${i >= 3 && i <= 6 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reorderData.map((item, i) => {
                      const isCritical = item.currentStock <= (item.safetyStock ?? 0);
                      return (
                        <tr key={item.productId} className="border-b hover:bg-slate-50"
                          style={{ background: isCritical ? 'rgba(254,226,226,0.3)' : i % 2 !== 0 ? 'rgba(248,250,252,0.5)' : undefined }}>
                          <td className="px-4 py-2.5 font-semibold text-slate-800">{item.productName}</td>
                          <td className="px-4 py-2.5"><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{item.sku}</span></td>
                          <td className="px-4 py-2.5 text-slate-500 text-xs">{item.warehouseName ?? '—'}</td>
                          <td className="px-4 py-2.5 text-right font-bold" style={{ color: '#C2410C' }}>{item.currentStock}</td>
                          <td className="px-4 py-2.5 text-right text-slate-500">{item.reorderPoint}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-blue-700">{item.eoq}</td>
                          <td className="px-4 py-2.5 text-right text-slate-400">{item.safetyStock}</td>
                          <td className="px-4 py-2.5">
                            <Badge text={isCritical ? 'Критично' : 'Замовити'} color={isCritical ? 'red' : 'yellow'} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {openSections.reorder && reorderData.length === 0 && (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">✅ Всі товари в нормі</div>
            )}
          </div>

          {/* ── Продажі ── */}
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <SectionHeader
              title={`Продажі за період (${salesFrom} — ${salesTo})`}
              count={salesData.length}
              color="linear-gradient(135deg, #7C3AED, #C084FC)"
              icon={ShoppingCart} open={openSections.sales}
              onToggle={() => toggle('sales')}
              onCsv={handleSalesCsv}
            />
            {openSections.sales && salesData.length > 0 && (
              <>
                {/* Top 5 */}
                {topProducts.length > 0 && (
                  <div className="px-5 py-4 border-b bg-slate-50/50">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Топ-5 товарів за виручкою</p>
                    <div className="space-y-2">
                      {topProducts.map((p: any, i: number) => (
                        <div key={p.name} className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 w-4">{i + 1}</span>
                          <span className="text-sm font-medium text-slate-700 flex-1 truncate">{p.name}</span>
                          <div className="h-1.5 rounded bg-slate-200 w-24 overflow-hidden">
                            <div className="h-full rounded bg-purple-500"
                              style={{ width: `${(p.rev / (topProducts[0]?.rev || 1)) * 100}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-20 text-right">
                            {(p.rev / 1000).toFixed(1)} тис грн
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: '#F8FAFC' }} className="border-b">
                        {['Дата', 'Товар', 'Склад', 'К-сть', 'Ціна', 'Сума', 'Автор'].map((h, i) => (
                          <th key={h} className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 ${i >= 3 && i <= 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {salesData.slice(0, 10).map((s, i) => (
                        <tr key={s.id ?? i} className="border-b hover:bg-slate-50"
                          style={{ background: i % 2 !== 0 ? 'rgba(248,250,252,0.5)' : undefined }}>
                          <td className="px-4 py-2.5 text-xs text-slate-400">{s.saleDate}</td>
                          <td className="px-4 py-2.5 font-semibold text-slate-800">{s.productName}</td>
                          <td className="px-4 py-2.5"><span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-500">{s.warehouseName ?? '—'}</span></td>
                          <td className="px-4 py-2.5 text-right font-medium">{s.quantity} <span className="text-slate-400 text-xs">{s.unitOfMeasure ?? 'шт'}</span></td>
                          <td className="px-4 py-2.5 text-right text-slate-500">{Number(s.unitPrice).toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-800">{(Number(s.quantity) * Number(s.unitPrice)).toFixed(2)}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-400">{s.createdBy ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                    {salesData.length > 0 && (
                      <tfoot>
                        <tr style={{ background: '#F8FAFC' }} className="border-t">
                          <td colSpan={5} className="px-4 py-2.5 text-xs font-semibold text-slate-500">
                            Всього {salesData.length} записів
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-800">
                            {(totalRevenue / 1000).toFixed(1)} тис грн
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                  {salesData.length > 10 && (
                    <div className="px-4 py-2.5 text-xs text-slate-400 text-center border-t bg-slate-50">
                      Показано 10 з {salesData.length} — завантажте CSV для повного списку
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* ── Каталог товарів ── */}
          <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
            <SectionHeader
              title="Каталог товарів" count={productsData.length}
              color="linear-gradient(135deg, #15803D, #22C55E)"
              icon={Package} open={openSections.products}
              onToggle={() => toggle('products')}
              onCsv={handleProductsCsv}
            />
            {openSections.products && productsData.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: '#F8FAFC' }} className="border-b">
                      {['Назва', 'SKU', 'Ціна', 'Од.', 'Категорія', 'Постачальник', 'Статус'].map((h, i) => (
                        <th key={h} className={`px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-400 ${i === 2 ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {productsData.slice(0, 10).map((p, i) => (
                      <tr key={p.id} className="border-b hover:bg-slate-50"
                        style={{ background: i % 2 !== 0 ? 'rgba(248,250,252,0.5)' : undefined }}>
                        <td className="px-4 py-2.5 font-semibold text-slate-800">{p.name}</td>
                        <td className="px-4 py-2.5"><span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{p.sku}</span></td>
                        <td className="px-4 py-2.5 text-right font-medium">{Number(p.unitPrice).toFixed(2)} грн</td>
                        <td className="px-4 py-2.5"><span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{p.unitOfMeasure ?? 'шт'}</span></td>
                        <td className="px-4 py-2.5 text-slate-500">{p.categoryName ?? '—'}</td>
                        <td className="px-4 py-2.5 text-slate-500">{p.supplierName ?? '—'}</td>
                        <td className="px-4 py-2.5">
                          <Badge text={p.isActive ? 'Активний' : 'Неактивний'} color={p.isActive ? 'green' : 'gray'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {productsData.length > 10 && (
                  <div className="px-4 py-2.5 text-xs text-slate-400 text-center border-t bg-slate-50">
                    Показано 10 з {productsData.length} — завантажте CSV для повного списку
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
