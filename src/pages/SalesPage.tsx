import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Calendar, ShoppingCart, ArrowLeft, ArrowRight, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/empty-state';
import toast from 'react-hot-toast';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';

import { useAuthStore } from '@/store/authStore';
import SvgChart from '@/components/dashboard/SvgChart';
import { getSales, createSale } from '@/api/sales';
import { getWarehouses } from '@/api/warehouses';
import { getProducts } from '@/api/products';
import type { Sale, SaleForm } from '@/types/sale';
import type { Warehouse } from '@/types/warehouse';
import type { Product } from '@/types/product';

const today    = new Date().toISOString().split('T')[0];
const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const emptyForm: SaleForm = {
  productId: 0, warehouseId: 0,
  quantity: 1, unitPrice: 0, saleDate: today,
};

const WAREHOUSE_COLORS = ['#3B82F6', '#22C55E', '#F97316', '#A855F7', '#EF4444'];
const CHART_MODES = [
  { key: 'revenue', label: 'Виручка, грн' },
  { key: 'quantity', label: 'Кількість, шт' },
];

export default function SalesPage() {
  const { user } = useAuthStore();
  const isAdmin   = user?.role === 'ADMIN'   || user?.role === 'ROLE_ADMIN';
  const canCreate = isAdmin || user?.role === 'MANAGER' || user?.role === 'ROLE_MANAGER';

  const [sales, setSales]           = useState<Sale[]>([]);
  const [allSales, setAllSales]     = useState<Sale[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading]       = useState(true);
  const [chartLoading, setChartLoading] = useState(false);

  const [dateFrom, setDateFrom] = useState(monthAgo);
  const [dateTo, setDateTo]     = useState(today);
  const [page, setPage]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 20;

  const [chartMode, setChartMode] = useState<'revenue' | 'quantity'>('revenue');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  const [formOpen, setFormOpen]   = useState(false);
  const [form, setForm]           = useState<SaleForm>(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');
  const [stockInfo, setStockInfo] = useState<{qty: number; warehouse: string} | null>(null);
  const [stockLoading, setStockLoading] = useState(false);

  const totalSum = sales.reduce((acc, s) => acc + Number(s.quantity) * Number(s.unitPrice), 0);

  // Load paginated table data
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSales(page, PAGE_SIZE, dateFrom, dateTo);
      if (Array.isArray(data)) {
        setSales(data); setTotalPages(1);
      } else {
        setSales((data as any).content ?? []);
        setTotalPages((data as any).totalPages ?? 1);
      }
    } catch { setSales([]); }
    finally { setLoading(false); }
  }, [page, dateFrom, dateTo]);

  // Load ALL sales for chart (no pagination)
  const loadChart = useCallback(async () => {
    setChartLoading(true);
    try {
      const raw = await getSales(0, 9999, dateFrom, dateTo);
      let arr: Sale[] = [];
      if (Array.isArray(raw)) {
        arr = raw;
      } else if ((raw as any)?.content) {
        arr = (raw as any).content;
      } else {
        arr = [];
      }
      console.log('[Chart] loaded sales:', arr.length, arr[0]);
      setAllSales(arr);
      const wh = await getWarehouses();
      setWarehouses(wh);
    } catch (e) {
      console.error('[Chart] error:', e);
      setAllSales([]);
    }
    finally { setChartLoading(false); }
  }, [dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadChart(); }, [loadChart]);

  // Build chart data grouped by date and warehouse
  const chartData = useMemo(() => {
    if (!allSales.length) return [];

    // Group by date
    const byDate: Record<string, Record<string, number>> = {};

    allSales.forEach(s => {
      const date = s.saleDate?.toString().slice(0, 10) ?? '';
      const wName = (s as any).warehouseName ?? s.warehouse?.name ?? 'Невідомо';
      const rev = Number(s.quantity) * Number(s.unitPrice);
      const qty = Number(s.quantity);

      if (!byDate[date]) byDate[date] = {};
      const key = chartMode === 'revenue' ? `${wName}_rev` : `${wName}_qty`;
      byDate[date][key] = (byDate[date][key] ?? 0) + (chartMode === 'revenue' ? rev : qty);
    });

    const result = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date: date.slice(5), // MM-DD
        ...vals,
      }));
    console.log('[chartData] result length:', result.length, 'warehouseNames will be:', Array.from(new Set(allSales.map((s:any) => s.warehouseName))));
    return result;
  }, [allSales, chartMode]);

  // Get unique warehouse names from allSales
  const warehouseNames = useMemo(() => {
    const names = new Set<string>();
    allSales.forEach(s => {
      const n = (s as any).warehouseName ?? s.warehouse?.name;
      if (n) names.add(n);
    });
    return Array.from(names);
  }, [allSales]);

  const openCreate = async () => {
    setForm(emptyForm); setFormError('');
    try {
      const [prods, warehs] = await Promise.all([getProducts(0, 200), getWarehouses()]);
      setProducts((prods as any).content ?? prods as any);
      setWarehouses(warehs);
    } catch { setProducts([]); setWarehouses([]); }
    setFormOpen(true);
  };

  const handleProductChange = async (productId: string) => {
    const id = Number(productId);
    const prod = products.find(p => p.id === id);
    setForm(f => ({ ...f, productId: id, unitPrice: prod?.unitPrice ?? 0, warehouseId: 0 }));
    setStockInfo(null);
  };

  const handleWarehouseChange = async (warehouseId: string) => {
    const wid = Number(warehouseId);
    setForm(f => ({ ...f, warehouseId: wid }));
    if (!form.productId || !wid) return;
    setStockLoading(true);
    try {
      const { apiClient } = await import('@/api/client');
      const res = await apiClient.get(`/stock/product/${form.productId}/warehouse/${wid}`);
      const qty = Number(res.data?.quantity ?? 0);
      const wh  = warehouses.find(w => w.id === wid)?.name ?? '';
      setStockInfo({ qty, warehouse: wh });
    } catch {
      setStockInfo(null);
    } finally {
      setStockLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.productId || !form.warehouseId) { setFormError('Оберіть товар та склад'); return; }
    if (form.quantity <= 0) { setFormError('Кількість має бути більше 0'); return; }
    setSaving(true); setFormError('');
    try {
      await createSale(form);
      setFormOpen(false);
      toast.success('Продаж зареєстровано. Залишок оновлено.');
      setPage(0); load(); loadChart();
    } catch (e: any) {
      setFormError(e.response?.status === 400 ? 'Недостатньо товару на складі' : e.response?.data?.message || 'Помилка збереження');
    } finally { setSaving(false); }
  };

  const rowSum = (s: Sale) => (Number(s.quantity) * Number(s.unitPrice)).toFixed(2);

  const formatYAxis = (v: number) =>
    chartMode === 'revenue'
      ? v >= 1000 ? (v / 1000).toFixed(0) + 'к' : String(v)
      : String(v);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="rounded-lg overflow-hidden" style={{
        background: 'linear-gradient(135deg, #0A1628 0%, #1E293B 60%, #0F1F35 100%)',
        padding: '24px 28px',
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #15803D, #22C55E)' }}>
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Продажі</h1>
              <p className="text-sm" style={{ color: '#64748B' }}>Реєстрація та перегляд продажів</p>
            </div>
          </div>
          {canCreate && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-all"
              style={{
                background: 'linear-gradient(135deg, #15803D, #22C55E)',
                color: 'white', border: 'none', cursor: 'pointer',
              }}
            >
              <Plus className="h-4 w-4" />
              Зареєструвати продаж
            </button>
          )}
        </div>

        {!loading && sales.length > 0 && (
          <div className="flex gap-6 mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div className="text-xs mb-1" style={{ color: '#475569' }}>Записів за період</div>
              <div className="text-xl font-bold text-white">{allSales.length || sales.length}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: '#475569' }}>Загальна сума</div>
              <div className="text-xl font-bold" style={{ color: '#4ADE80' }}>
                {totalSum >= 1000 ? (totalSum / 1000).toFixed(1) + ' тис' : totalSum.toFixed(0)} грн
              </div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: '#475569' }}>Середній чек</div>
              <div className="text-xl font-bold text-white">
                {sales.length > 0 ? (totalSum / sales.length).toFixed(0) : 0} грн
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end p-4 bg-white border rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mr-1">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Період:</span>
        </div>
        <div>
          <Label className="text-xs text-slate-400 mb-1 block uppercase tracking-wide">Від</Label>
          <Input type="date" value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(0); }}
            className="w-40" />
        </div>
        <div>
          <Label className="text-xs text-slate-400 mb-1 block uppercase tracking-wide">До</Label>
          <Input type="date" value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(0); }}
            className="w-40" />
        </div>
        <Button variant="outline" size="sm"
          onClick={() => { setDateFrom(monthAgo); setDateTo(today); setPage(0); }}>
          Скинути
        </Button>
      </div>

      {/* Charts */}
      <div className="bg-white border rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-slate-400" />
            <span className="font-semibold text-slate-700 text-sm">Динаміка продажів по складах</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Chart mode toggle */}
            <div className="flex rounded-lg border overflow-hidden text-xs">
              {CHART_MODES.map(m => (
                <button key={m.key}
                  onClick={() => setChartMode(m.key as any)}
                  className="px-3 py-1.5 transition-colors"
                  style={{
                    background: chartMode === m.key ? '#1E293B' : 'white',
                    color: chartMode === m.key ? 'white' : '#64748B',
                  }}>
                  {m.label}
                </button>
              ))}
            </div>
            {/* Chart type toggle */}
            <div className="flex rounded-lg border overflow-hidden text-xs">
              {(['line', 'bar'] as const).map(t => (
                <button key={t}
                  onClick={() => setChartType(t)}
                  className="px-3 py-1.5 transition-colors"
                  style={{
                    background: chartType === t ? '#1E293B' : 'white',
                    color: chartType === t ? 'white' : '#64748B',
                  }}>
                  {t === 'line' ? 'Лінія' : 'Стовпці'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {chartLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
            Немає даних для відображення
          </div>
        ) : (
          <SvgChart
            data={chartData}
            warehouseNames={warehouseNames}
            chartMode={chartMode}
            chartType={chartType}
            colors={WAREHOUSE_COLORS}
          />
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ background: '#F8FAFC' }}>
              {['Дата', 'Товар', 'Склад', 'К-сть', 'Ціна, грн', 'Сума, грн', 'Автор'].map((h, i) => (
                <th key={h} className={`px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-400 ${i >= 3 && i <= 5 ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  ))}
                </tr>
              ))
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState
                    title="Продажів не знайдено"
                    description={canCreate ? 'Зареєструйте перший продаж' : 'Немає даних за вказаний період'}
                    actionLabel={canCreate ? 'Зареєструвати продаж' : undefined}
                    onAction={canCreate ? openCreate : undefined}
                  />
                </td>
              </tr>
            ) : sales.map((s, i) => (
              <tr key={s.id}
                className="border-b transition-colors hover:bg-green-50/20"
                style={{ background: i % 2 !== 0 ? 'rgba(248,250,252,0.6)' : undefined }}>
                <td className="px-4 py-3">
                  <span className="text-slate-500 text-xs font-medium">{s.saleDate}</span>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-800">
                  {(s as any).productName ?? s.product?.name ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span className="text-slate-500 text-xs bg-slate-100 px-2 py-0.5 rounded">
                    {(s as any).warehouseName ?? s.warehouse?.name ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-medium text-slate-700">
                  {s.quantity}
                  <span className="text-slate-400 text-xs ml-1">
                    {(s as any).unitOfMeasure ?? s.product?.unitOfMeasure ?? 'шт'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-slate-500">{Number(s.unitPrice).toFixed(2)}</td>
                <td className="px-4 py-3 text-right">
                  <span className="font-bold text-slate-800">{rowSum(s)}</span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{s.createdBy ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all disabled:opacity-40"
            style={{ cursor: page === 0 ? 'not-allowed' : 'pointer' }}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Попередня
          </button>
          <span className="text-sm text-slate-500 px-2">{page + 1} / {totalPages}</span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all disabled:opacity-40"
            style={{ cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
          >
            Наступна <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Зареєструвати продаж</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Товар *</Label>
              <Select value={form.productId ? String(form.productId) : ''} onValueChange={handleProductChange}>
                <SelectTrigger><SelectValue placeholder="Оберіть товар..." /></SelectTrigger>
                <SelectContent>
                  {products.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name} ({p.sku})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Склад *</Label>
              <Select value={form.warehouseId ? String(form.warehouseId) : ''}
                onValueChange={handleWarehouseChange}>
                <SelectTrigger><SelectValue placeholder="Оберіть склад..." /></SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                {/* Stock info */}
              {stockLoading && (
                <p className="text-xs text-slate-400 mb-2">Завантажую залишок...</p>
              )}
              {stockInfo && !stockLoading && (
                <div className="mb-3 px-3 py-2 rounded-lg flex items-center justify-between"
                  style={{
                    background: stockInfo.qty <= 0 ? 'rgba(220,38,38,0.08)' : stockInfo.qty < 10 ? 'rgba(234,88,12,0.08)' : 'rgba(22,163,74,0.08)',
                    border: `1px solid ${stockInfo.qty <= 0 ? 'rgba(220,38,38,0.2)' : stockInfo.qty < 10 ? 'rgba(234,88,12,0.2)' : 'rgba(22,163,74,0.2)'}`,
                  }}>
                  <span className="text-xs text-slate-600">
                    Залишок на складі:
                  </span>
                  <span className="text-sm font-bold"
                    style={{ color: stockInfo.qty <= 0 ? '#B91C1C' : stockInfo.qty < 10 ? '#C2410C' : '#15803D' }}>
                    {stockInfo.qty <= 0 ? '⛔ Немає на складі' : stockInfo.qty < 10 ? `⚠️ ${stockInfo.qty} шт (мало)` : `✓ ${stockInfo.qty} шт`}
                  </span>
                </div>
              )}
              <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Кількість *</Label>
                <Input type="number" min={1} value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} />
              </div>
              <div>
                <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Ціна (грн)</Label>
                <Input type="number" min={0} step={0.01} value={form.unitPrice}
                  onChange={e => setForm(f => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div>
              <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Дата продажу</Label>
              <Input type="date" value={form.saleDate}
                onChange={e => setForm(f => ({ ...f, saleDate: e.target.value }))} />
            </div>
            {form.quantity > 0 && form.unitPrice > 0 && (
              <div className="rounded bg-green-50 border border-green-200 px-3 py-2.5">
                <p className="text-sm text-green-800">
                  Сума до списання: <span className="font-bold">{(form.quantity * form.unitPrice).toFixed(2)} грн</span>
                </p>
              </div>
            )}
            {formError && (
              <div className="rounded bg-red-50 border border-red-200 px-3 py-2">
                <p className="text-sm text-red-600">{formError}</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Скасувати</Button>
            <Button onClick={handleSave} disabled={saving}
              style={{ background: 'linear-gradient(135deg, #15803D, #22C55E)', border: 'none' }}>
              {saving ? 'Збереження...' : 'Зареєструвати'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
