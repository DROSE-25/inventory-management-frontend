import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Calendar } from 'lucide-react';
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
import { getSales, createSale } from '@/api/sales';
import { getWarehouses } from '@/api/warehouses';
import { getProducts } from '@/api/products';
import type { Sale, SaleForm } from '@/types/sale';
import type { Warehouse } from '@/types/warehouse';
import type { Product } from '@/types/product';

const today = new Date().toISOString().split('T')[0];
const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const emptyForm: SaleForm = {
  productId: 0, warehouseId: 0,
  quantity: 1, unitPrice: 0, saleDate: today,
};

export default function SalesPage() {
  const { user } = useAuthStore();
  const isAdmin   = user?.role === 'ADMIN'   || user?.role === 'ROLE_ADMIN';
  const canCreate = isAdmin || user?.role === 'MANAGER' || user?.role === 'ROLE_MANAGER';

  const [sales, setSales]           = useState<Sale[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading]       = useState(true);

  // Фільтри
  const [dateFrom, setDateFrom] = useState(monthAgo);
  const [dateTo, setDateTo]     = useState(today);
  const [page, setPage]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 20;

  // Форма
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm]         = useState<SaleForm>(emptyForm);
  const [saving, setSaving]     = useState(false);
  const [formError, setFormError] = useState('');

  // Підрахунок підсумків
  const totalSum = sales.reduce((acc, s) => acc + Number(s.quantity) * Number(s.unitPrice), 0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSales(page, PAGE_SIZE, dateFrom, dateTo);
      // Якщо бекенд повертає Page<> — беремо content і totalPages
      if (Array.isArray(data)) {
        setSales(data);
        setTotalPages(1);
      } else {
        setSales((data as any).content ?? []);
        setTotalPages((data as any).totalPages ?? 1);
      }
    } catch {
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [page, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const openCreate = async () => {
    setForm(emptyForm);
    setFormError('');
    try {
      const [prods, warehs] = await Promise.all([
        getProducts(0, 200),
        getWarehouses(),
      ]);
      setProducts((prods as any).content ?? prods as any);
      setWarehouses(warehs);
    } catch {
      setProducts([]);
      setWarehouses([]);
    }
    setFormOpen(true);
  };

  const handleProductChange = (productId: string) => {
    const id = Number(productId);
    const prod = products.find(p => p.id === id);
    setForm(f => ({ ...f, productId: id, unitPrice: prod?.unitPrice ?? 0 }));
  };

  const handleSave = async () => {
    if (!form.productId || !form.warehouseId) {
      setFormError('Оберіть товар та склад');
      return;
    }
    if (form.quantity <= 0) {
      setFormError('Кількість має бути більше 0');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await createSale(form);
      setFormOpen(false);
      toast.success('Продаж зареєстровано. Залишок оновлено.');
      setPage(0);
      load();
    } catch (e: any) {
      if (e.response?.status === 400) {
        setFormError('Недостатньо товару на складі');
      } else {
        setFormError(e.response?.data?.message || 'Помилка збереження');
      }
    } finally {
      setSaving(false);
    }
  };

  const rowSum = (s: Sale) => (Number(s.quantity) * Number(s.unitPrice)).toFixed(2);

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Продажі</h1>
          <p className="text-slate-500 text-sm">Реєстрація та перегляд продажів</p>
        </div>
        {canCreate && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Зареєструвати продаж
          </Button>
        )}
      </div>

      {/* Фільтри дат */}
      <div className="flex flex-wrap gap-3 items-end p-4 bg-white border rounded-lg">
        <Calendar className="h-4 w-4 text-slate-400 self-center" />
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">Від</Label>
          <Input
            type="date" value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(0); }}
            className="w-40"
          />
        </div>
        <div>
          <Label className="text-xs text-slate-500 mb-1 block">До</Label>
          <Input
            type="date" value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(0); }}
            className="w-40"
          />
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => { setDateFrom(monthAgo); setDateTo(today); setPage(0); }}
        >
          Скинути
        </Button>
        {!loading && (
          <span className="text-sm text-slate-500 self-center ml-auto">
            {sales.length} записів · Сума: <strong>{totalSum.toFixed(2)} грн</strong>
          </span>
        )}
      </div>

      {/* Таблиця */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left p-3 font-medium">Дата</th>
              <th className="text-left p-3 font-medium">Товар</th>
              <th className="text-left p-3 font-medium">Склад</th>
              <th className="text-right p-3 font-medium">К-сть</th>
              <th className="text-right p-3 font-medium">Ціна, грн</th>
              <th className="text-right p-3 font-medium">Сума, грн</th>
              <th className="text-left p-3 font-medium">Автор</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="p-3"><Skeleton className="h-4 w-20" /></td>
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
              <tr key={s.id} className={`border-b hover:bg-slate-50 ${i % 2 !== 0 ? 'bg-slate-50/40' : ''}`}>
                <td className="p-3 text-slate-600">{s.saleDate}</td>
                <td className="p-3 font-medium">{(s as any).productName ?? s.product?.name ?? '—'}</td>
                <td className="p-3 text-slate-500">{(s as any).warehouseName ?? s.warehouse?.name ?? '—'}</td>
                <td className="p-3 text-right">{s.quantity}</td>
                <td className="p-3 text-right">{Number(s.unitPrice).toFixed(2)}</td>
                <td className="p-3 text-right font-semibold">{rowSum(s)}</td>
                <td className="p-3 text-slate-400 text-xs">{s.createdBy ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Пагінація */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            ← Попередня
          </Button>
          <span className="text-sm text-slate-500">
            Сторінка {page + 1} з {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
            Наступна →
          </Button>
        </div>
      )}

      {/* Форма */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Зареєструвати продаж</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="mb-1 block">Товар *</Label>
              <Select
                value={form.productId ? String(form.productId) : ''}
                onValueChange={handleProductChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть товар..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} ({p.sku})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1 block">Склад *</Label>
              <Select
                value={form.warehouseId ? String(form.warehouseId) : ''}
                onValueChange={val => setForm(f => ({ ...f, warehouseId: Number(val) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть склад..." />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map(w => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Кількість *</Label>
                <Input
                  type="number" min={1}
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label className="mb-1 block">Ціна (грн)</Label>
                <Input
                  type="number" min={0} step={0.01}
                  value={form.unitPrice}
                  onChange={e => setForm(f => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div>
              <Label className="mb-1 block">Дата продажу</Label>
              <Input
                type="date" value={form.saleDate}
                onChange={e => setForm(f => ({ ...f, saleDate: e.target.value }))}
              />
            </div>

            {form.quantity > 0 && form.unitPrice > 0 && (
              <div className="rounded-md bg-blue-50 px-3 py-2.5 border border-blue-100">
                <p className="text-sm text-blue-800">
                  Сума до списання:{' '}
                  <span className="font-bold">{(form.quantity * form.unitPrice).toFixed(2)} грн</span>
                </p>
              </div>
            )}

            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
              Скасувати
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Збереження...' : 'Зареєструвати'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
