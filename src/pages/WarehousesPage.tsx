import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Warehouse, MapPin, Box, PackageSearch, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/empty-state';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '@/api/warehouses';
import { apiClient } from '@/api/client';
import type { Warehouse as WarehouseType, WarehouseForm } from '@/types/warehouse';

const emptyForm: WarehouseForm = { name: '', address: '', capacity: 0 };

interface StockItem {
  productId: number;
  productName: string;
  productSku: string;
  quantity: number;
  reorderPoint: number;
  belowReorderPoint: boolean;
}

export default function WarehousesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';

  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [loading, setLoading]       = useState(true);
  const [formOpen, setFormOpen]     = useState(false);
  const [editItem, setEditItem]     = useState<WarehouseType | null>(null);
  const [form, setForm]             = useState<WarehouseForm>(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');

  // Stock modal
  const [stockOpen, setStockOpen]       = useState(false);
  const [stockWarehouse, setStockWarehouse] = useState<WarehouseType | null>(null);
  const [stockItems, setStockItems]     = useState<StockItem[]>([]);
  const [stockLoading, setStockLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setWarehouses(await getWarehouses()); }
    catch { setWarehouses([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openStockModal = async (w: WarehouseType) => {
    setStockWarehouse(w);
    setStockItems([]);
    setStockOpen(true);
    setStockLoading(true);
    try {
      // Get all stock levels and filter by warehouse
      const res = await apiClient.get('/stock/below-reorder-point');
      const belowRop: StockItem[] = (Array.isArray(res.data) ? res.data : res.data.content ?? [])
        .filter((s: any) => s.warehouseId === w.id)
        .map((s: any) => ({
          productId: s.productId,
          productName: s.productName,
          productSku: s.productSku,
          quantity: Number(s.quantity),
          reorderPoint: Number(s.reorderPoint),
          belowReorderPoint: true,
        }));

      // Also get all products to fetch their stock on this warehouse
      const productsRes = await apiClient.get('/products', { params: { page: 0, size: 200 } });
      const allProducts = productsRes.data.content ?? productsRes.data ?? [];

      // Fetch stock for each product on this warehouse
      const stockPromises = allProducts.map(async (p: any) => {
        try {
          const r = await apiClient.get(`/stock/product/${p.id}/warehouse/${w.id}`);
          return {
            productId: p.id,
            productName: p.name,
            productSku: p.sku,
            quantity: Number(r.data?.quantity ?? 0),
            reorderPoint: Number(r.data?.reorderPoint ?? 0),
            belowReorderPoint: r.data?.belowReorderPoint ?? false,
          };
        } catch { return null; }
      });

      const results = (await Promise.all(stockPromises))
        .filter((s): s is StockItem => s !== null && s.quantity > 0);

      setStockItems(results.sort((a, b) => b.quantity - a.quantity));
    } catch {
      setStockItems([]);
    } finally {
      setStockLoading(false);
    }
  };

  const openCreate = () => {
    setEditItem(null); setForm(emptyForm); setFormError(''); setFormOpen(true);
  };

  const openEdit = (w: WarehouseType) => {
    setEditItem(w);
    setForm({ name: w.name, address: w.address, capacity: w.capacity });
    setFormError(''); setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError("Назва — обов'язкове поле"); return; }
    setSaving(true); setFormError('');
    try {
      editItem ? await updateWarehouse(editItem.id, form) : await createWarehouse(form);
      setFormOpen(false);
      toast.success(editItem ? 'Склад оновлено' : 'Склад створено');
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Помилка збереження');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Видалити склад?')) return;
    try { await deleteWarehouse(id); toast.success('Склад видалено'); load(); }
    catch (e: any) { toast.error(e.response?.data?.message ?? 'Помилка видалення'); }
  };

  const totalCapacity = warehouses.reduce((sum, w) => sum + (w.capacity ?? 0), 0);
  const activeCount   = warehouses.filter(w => w.isActive).length;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="rounded-lg overflow-hidden" style={{
        background: 'linear-gradient(135deg, #0C1F3A 0%, #1E293B 60%, #0A1628 100%)',
        padding: '24px 28px',
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0369A1, #38BDF8)' }}>
              <Warehouse className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Склади</h1>
              <p className="text-sm" style={{ color: '#64748B' }}>Управління складами</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold"
              style={{ background: 'linear-gradient(135deg, #0369A1, #38BDF8)', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              <Plus className="h-4 w-4" />
              Додати склад
            </button>
          )}
        </div>

        {!loading && (
          <div className="flex gap-6 mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div className="text-xs mb-1" style={{ color: '#475569' }}>Всього складів</div>
              <div className="text-xl font-bold text-white">{warehouses.length}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: '#475569' }}>Активних</div>
              <div className="text-xl font-bold" style={{ color: '#38BDF8' }}>{activeCount}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: '#475569' }}>Загальна місткість</div>
              <div className="text-xl font-bold text-white">{totalCapacity.toLocaleString()} од.</div>
            </div>
          </div>
        )}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-md border bg-white p-5 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      ) : warehouses.length === 0 ? (
        <div className="rounded-md border bg-white">
          <EmptyState
            title="Складів не знайдено"
            description="Додайте перший склад"
            actionLabel={isAdmin ? 'Додати склад' : undefined}
            onAction={isAdmin ? openCreate : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map(w => {
            const fillPct = totalCapacity > 0 ? Math.round((w.capacity / totalCapacity) * 100) : 0;
            return (
              <div key={w.id}
                className="rounded-md border bg-white p-5 hover:shadow-md transition-all"
                style={{ borderLeft: `4px solid ${w.isActive ? '#0369A1' : '#CBD5E1'}` }}>

                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                      style={{ background: w.isActive ? 'rgba(3,105,161,0.1)' : 'rgba(203,213,225,0.3)' }}>
                      <Warehouse className={`h-4 w-4 ${w.isActive ? 'text-sky-600' : 'text-slate-400'}`} />
                    </div>
                    <h3 className="font-bold text-slate-800">{w.name}</h3>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    w.isActive ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {w.isActive ? 'Активний' : 'Неактивний'}
                  </span>
                </div>

                {w.address && (
                  <div className="flex items-start gap-2 mb-4">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-slate-500">{w.address}</span>
                  </div>
                )}

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Box className="h-3 w-3 text-slate-400" />
                      <span className="text-xs text-slate-500">Місткість</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">
                      {w.capacity?.toLocaleString()} од.
                    </span>
                  </div>
                  <div className="h-1.5 rounded bg-slate-100 overflow-hidden">
                    <div className="h-full rounded transition-all"
                      style={{ width: `${fillPct}%`, background: 'linear-gradient(90deg, #0369A1, #38BDF8)' }} />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{fillPct}% від загальної місткості</div>
                </div>

                {/* Actions */}
                <div className="flex gap-1.5 pt-3" style={{ borderTop: '1px solid #F1F5F9' }}>
                  <button
                    onClick={() => openStockModal(w)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded border text-xs font-medium transition-all"
                    style={{ borderColor: '#E2E8F0', color: '#0369A1', background: 'rgba(3,105,161,0.04)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(3,105,161,0.1)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(3,105,161,0.04)'; }}
                  >
                    <PackageSearch className="h-3 w-3" />
                    Товари на складі
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => openEdit(w)}
                        className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:text-sky-600 hover:border-sky-300 hover:bg-sky-50 transition-all"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stock Modal */}
      <Dialog open={stockOpen} onOpenChange={setStockOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageSearch className="h-5 w-5 text-sky-600" />
              Товари — {stockWarehouse?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto">
            {stockLoading ? (
              <div className="space-y-2 py-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : stockItems.length === 0 ? (
              <div className="text-center py-10">
                <PackageSearch className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Товарів на складі не знайдено</p>
                <p className="text-slate-400 text-xs mt-1">Можливо залишки ще не внесені</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Товар</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">SKU</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Залишок</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">ROP</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {stockItems.map((s, i) => (
                    <tr key={s.productId}
                      className="border-b hover:bg-slate-50 transition-colors"
                      style={{ background: i % 2 !== 0 ? 'rgba(248,250,252,0.5)' : undefined }}>
                      <td className="px-4 py-3 font-medium text-slate-800">{s.productName}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{s.productSku}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-bold ${s.belowReorderPoint ? 'text-orange-500' : 'text-slate-800'}`}>
                          {s.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 text-xs">{s.reorderPoint}</td>
                      <td className="px-4 py-3 text-center">
                        {s.belowReorderPoint ? (
                          <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded font-medium">Мало</span>
                        ) : (
                          <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded font-medium">Норма</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-slate-50">
                    <td colSpan={2} className="px-4 py-2.5 text-xs font-semibold text-slate-500">
                      Всього позицій: {stockItems.length}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs font-semibold text-slate-700">
                      {stockItems.reduce((s, i) => s + i.quantity, 0)} од.
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStockOpen(false)}>Закрити</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Редагувати склад' : 'Новий склад'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Назва *</Label>
              <Input value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Центральний склад" />
            </div>
            <div>
              <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Адреса</Label>
              <Input value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="вул. Складська, 1" />
            </div>
            <div>
              <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Місткість (одиниць)</Label>
              <Input type="number" min={0} value={form.capacity}
                onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 0 }))} />
            </div>
            {formError && (
              <div className="rounded bg-red-50 border border-red-200 px-3 py-2">
                <p className="text-sm text-red-600">{formError}</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>Скасувати</Button>
            <Button onClick={handleSave} disabled={saving}
              style={{ background: 'linear-gradient(135deg, #0369A1, #38BDF8)', border: 'none' }}>
              {saving ? 'Збереження...' : editItem ? 'Зберегти' : 'Створити'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
