import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Warehouse, MapPin, PackageSearch, PackagePlus } from 'lucide-react';
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
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select';
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

interface ProductOption {
  id: number;
  name: string;
  sku: string;
}

export default function WarehousesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';

  const [warehouses, setWarehouses]   = useState<WarehouseType[]>([]);
  const [loading, setLoading]         = useState(true);
  const [formOpen, setFormOpen]       = useState(false);
  const [editItem, setEditItem]       = useState<WarehouseType | null>(null);
  const [form, setForm]               = useState<WarehouseForm>(emptyForm);
  const [saving, setSaving]           = useState(false);
  const [formError, setFormError]     = useState('');
  const [stockTotals, setStockTotals] = useState<Record<number, number>>({});

  // Stock modal
  const [stockOpen, setStockOpen]           = useState(false);
  const [stockWarehouse, setStockWarehouse] = useState<WarehouseType | null>(null);
  const [stockItems, setStockItems]         = useState<StockItem[]>([]);
  const [stockLoading, setStockLoading]     = useState(false);

  // Receive form (всередині stock modal)
  const [receiveOpen, setReceiveOpen]       = useState(false);
  const [products, setProducts]             = useState<ProductOption[]>([]);
  const [receiveProductId, setReceiveProductId] = useState('');
  const [receiveQty, setReceiveQty]         = useState('');
  const [receiving, setReceiving]           = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getWarehouses();
      setWarehouses(data);
      const totals: Record<number, number> = {};
      await Promise.all(
        data.map(async (w) => {
          try {
            const res = await apiClient.get(`/stock/warehouse/${w.id}`);
            const items: StockItem[] = Array.isArray(res.data) ? res.data : res.data.content ?? [];
            totals[w.id] = items.reduce((sum, s) => sum + Number(s.quantity ?? 0), 0);
          } catch {
            totals[w.id] = 0;
          }
        })
      );
      setStockTotals(totals);
    } catch {
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Завантаження залишків для конкретного складу
  const loadStockItems = async (warehouseId: number) => {
    setStockLoading(true);
    try {
      const res = await apiClient.get(`/stock/warehouse/${warehouseId}`);
      const data: StockItem[] = (Array.isArray(res.data) ? res.data : res.data.content ?? [])
        .map((s: any) => ({
          productId: s.productId,
          productName: s.productName,
          productSku: s.productSku,
          quantity: Number(s.quantity),
          reorderPoint: Number(s.reorderPoint ?? 0),
          belowReorderPoint: s.belowReorderPoint ?? false,
        }));
      setStockItems(data);
    } catch {
      setStockItems([]);
    } finally {
      setStockLoading(false);
    }
  };

  const openStockModal = async (w: WarehouseType) => {
    setStockWarehouse(w);
    setStockItems([]);
    setStockOpen(true);
    setReceiveOpen(false);
    setReceiveProductId('');
    setReceiveQty('');
    await loadStockItems(w.id);
    // Завантажуємо список товарів для форми прийому
    try {
      const res = await apiClient.get('/products', { params: { size: 200 } });
      const raw = Array.isArray(res.data) ? res.data : res.data.content ?? [];
      setProducts(raw.map((p: any) => ({ id: p.id, name: p.name, sku: p.sku })));
    } catch {
      setProducts([]);
    }
  };

  const handleReceive = async () => {
    if (!receiveProductId || !receiveQty || Number(receiveQty) <= 0) {
      toast.error('Оберіть товар і вкажіть кількість більше 0');
      return;
    }
    if (!stockWarehouse) return;
    setReceiving(true);
    try {
      await apiClient.post(
        `/stock/product/${receiveProductId}/warehouse/${stockWarehouse.id}/receive`,
        null,
        { params: { quantity: receiveQty } }
      );
      toast.success('Товар успішно оприбутковано');
      setReceiveOpen(false);
      setReceiveProductId('');
      setReceiveQty('');
      await loadStockItems(stockWarehouse.id);
      // Оновлюємо лічильник на картці
      const res = await apiClient.get(`/stock/warehouse/${stockWarehouse.id}`);
      const items: StockItem[] = Array.isArray(res.data) ? res.data : res.data.content ?? [];
      setStockTotals(prev => ({
        ...prev,
        [stockWarehouse.id]: items.reduce((sum, s) => sum + Number(s.quantity ?? 0), 0),
      }));
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Помилка оприбуткування');
    } finally {
      setReceiving(false);
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
        background: 'linear-gradient(135deg, #2A3050 0%, #3D4F7C 100%)',
        padding: '24px 28px',
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.25)' }}>
              <Warehouse className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Склади</h1>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>Управління складами</p>
            </div>
          </div>
          {isAdmin && (
            <button onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold"
              style={{ background: 'white', color: '#5B6CF0', border: 'none', cursor: 'pointer', fontWeight: '700' }}>
              <Plus className="h-4 w-4" />
              Додати склад
            </button>
          )}
        </div>
        {!loading && (
          <div className="flex gap-6 mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.25)' }}>
            <div>
              <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>Всього складів</div>
              <div className="text-xl font-bold text-white">{warehouses.length}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>Активних</div>
              <div className="text-xl font-bold text-white">{activeCount}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>Загальна місткість</div>
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
            const usedQty = stockTotals[w.id] ?? 0;
            const capacity = w.capacity ?? 0;
            const fillPct = capacity > 0 ? Math.min(100, Math.round((usedQty / capacity) * 100)) : 0;
            const barColor = fillPct > 80
              ? 'linear-gradient(90deg, #DC2626, #EF4444)'
              : fillPct > 50
              ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
              : 'linear-gradient(90deg, #6B7FD4, #8E9EF7)';
            return (
              <div key={w.id}
                className="rounded-lg bg-white hover:shadow-lg transition-all"
                style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
              >
                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div style={{ width: 44, height: 44, borderRadius: 6, background: w.isActive ? 'linear-gradient(135deg, #6B7FD4, #8E9EF7)' : 'linear-gradient(135deg, #94A3B8, #CBD5E1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Warehouse className="h-5 w-5 text-white" />
                    </div>
                    <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, fontWeight: 600, background: w.isActive ? '#DCFCE7' : '#F1F5F9', color: w.isActive ? '#16A34A' : '#94A3B8' }}>
                      {w.isActive ? 'Активний' : 'Неактивний'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base mb-1">{w.name}</h3>
                  {w.address && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-400">{w.address}</span>
                    </div>
                  )}
                </div>

                <div className="px-5 pb-4">
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-xs text-slate-400 font-medium">Місткість</span>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">{usedQty.toLocaleString()} / </span>
                      <span className="text-2xl font-semibold" style={{ color: '#6B7FD4', lineHeight: 1 }}>{capacity.toLocaleString()}</span>
                      <span className="text-xs text-slate-400 ml-1">од.</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${fillPct}%`, background: barColor }} />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-slate-400">Завантаженість</span>
                    <span className="text-xs font-bold" style={{ color: fillPct > 80 ? '#DC2626' : fillPct > 50 ? '#F59E0B' : '#6B7FD4' }}>
                      {fillPct}%
                    </span>
                  </div>
                </div>

                <div className="px-5 pb-4 flex gap-2" style={{ borderTop: '1px solid #F2F4F8', paddingTop: 12 }}>
                  <button
                    onClick={() => openStockModal(w)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all text-white"
                    style={{ background: '#3D4A6B', border: 'none', cursor: 'pointer' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.9'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
                  >
                    <PackageSearch className="h-3.5 w-3.5" />
                    Товари на складі
                  </button>
                  {isAdmin && (
                    <>
                      <button onClick={() => openEdit(w)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
                        style={{ background: '#F8FAFC', border: '1px solid #E8E9EC' }}>
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button onClick={() => handleDelete(w.id)}
                        className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-all">
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

      {/* ── Stock Modal ── */}
      <Dialog open={stockOpen} onOpenChange={(open) => { setStockOpen(open); if (!open) setReceiveOpen(false); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <PackageSearch className="h-5 w-5 text-sky-600" />
                Товари — {stockWarehouse?.name}
              </span>
              {isAdmin && (
                <button
                  onClick={() => setReceiveOpen(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all mr-6"
                  style={{
                    background: receiveOpen ? '#F1F5F9' : 'linear-gradient(135deg, #3D4A6B, #5B6CF0)',
                    color: receiveOpen ? '#64748B' : 'white',
                    border: 'none', cursor: 'pointer',
                  }}
                >
                  <PackagePlus className="h-3.5 w-3.5" />
                  {receiveOpen ? 'Скасувати' : 'Прийняти товар'}
                </button>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Форма прийому товару */}
          {receiveOpen && (
            <div className="rounded-lg p-4 mb-2" style={{ background: '#F8FAFF', border: '1px solid #E0E7FF' }}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Оприбуткування товару на склад «{stockWarehouse?.name}»
              </p>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label className="mb-1 block text-xs text-slate-500">Товар</Label>
                  <Select value={receiveProductId} onValueChange={setReceiveProductId}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Оберіть товар..." />
                    </SelectTrigger>
                    <SelectContent>
                      {products.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-400">Товарів не знайдено</div>
                      ) : products.map(p => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          <span className="font-medium">{p.name}</span>
                          <span className="text-slate-400 ml-2 text-xs font-mono">{p.sku}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div style={{ width: 120 }}>
                  <Label className="mb-1 block text-xs text-slate-500">Кількість</Label>
                  <Input
                    type="number" min={1} step={1}
                    placeholder="0"
                    value={receiveQty}
                    onChange={e => setReceiveQty(e.target.value)}
                    className="h-9"
                    onKeyDown={e => { if (e.key === 'Enter') handleReceive(); }}
                  />
                </div>
                <Button
                  onClick={handleReceive}
                  disabled={receiving || !receiveProductId || !receiveQty}
                  className="h-9"
                  style={{ background: '#3D4A6B', border: 'none', color: 'white', whiteSpace: 'nowrap' }}
                >
                  {receiving ? '...' : 'Оприбуткувати'}
                </Button>
              </div>
            </div>
          )}

          {/* Таблиця залишків */}
          <div className="max-h-[50vh] overflow-y-auto">
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
                <p className="text-slate-400 text-xs mt-1">
                  {isAdmin ? 'Натисніть «Прийняти товар» щоб оприбуткувати першу партію' : 'Залишки ще не внесені'}
                </p>
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
                        <span className={`font-bold ${s.belowReorderPoint ? 'text-amber-500' : 'text-slate-800'}`}>
                          {s.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400 text-xs">{s.reorderPoint || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        {s.belowReorderPoint ? (
                          <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded font-medium">Мало</span>
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

      {/* ── Form Dialog ── */}
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
              style={{ background: '#3D4A6B', border: 'none', color: 'white', fontWeight: '600' }}>
              {saving ? 'Збереження...' : editItem ? 'Зберегти' : 'Створити'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
