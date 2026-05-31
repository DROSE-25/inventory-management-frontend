import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Package, Tag, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/empty-state';
import toast from 'react-hot-toast';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { useAuthStore } from '@/store/authStore';
import {
  getProducts, createProduct, updateProduct,
  deleteProduct, getAllSuppliers, getCategories
} from '@/api/products';
import { apiClient } from '@/api/client';
import type { Product, ProductForm } from '@/types/product';
import type { Supplier } from '@/types/supplier';

interface Category { id: number; name: string; }
interface Warehouse { id: number; name: string; }
interface ProductStock { warehouseName: string; quantity: number; }

const emptyForm: ProductForm = {
  name: '', sku: '', unitPrice: 0,
  unitOfMeasure: 'шт', orderingCost: 0,
  supplierId: 0, categoryId: 0,
  holdingCostRate: 0.25,
  serviceLevel: 0.95,
};

export default function ProductsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';

  const [products, setProducts]     = useState<Product[]>([]);
  const [suppliers, setSuppliers]   = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [page, setPage]             = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [formOpen, setFormOpen]   = useState(false);
  const [editItem, setEditItem]   = useState<Product | null>(null);
  const [form, setForm]           = useState<ProductForm>(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteId, setDeleteId]             = useState<number | null>(null);
  const [deleting, setDeleting]             = useState(false);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState('');

  const [warehouses, setWarehouses]   = useState<Warehouse[]>([]);
  // productId -> список складів з кількістю
  const [productStocks, setProductStocks] = useState<Record<number, ProductStock[]>>({});

  // ── Керування категоріями ──────────────────────────────────
  const [catOpen, setCatOpen]         = useState(false);
  const [newCatName, setNewCatName]   = useState('');
  const [catSaving, setCatSaving]     = useState(false);
  const [deleteCatId, setDeleteCatId] = useState<number | null>(null);
  const [deletingCat, setDeletingCat] = useState(false);

  const loadCategories = () =>
    getCategories().then(setCategories).catch(() => {});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProducts(page, 20, search);
      setProducts(data.content);
      setTotalPages(data.totalPages);
      // Завантажуємо склади для кожного товару
      const stocks: Record<number, ProductStock[]> = {};
      await Promise.all(
        data.content.map(async (prod) => {
          try {
            const res = await apiClient.get(`/stock/product/${prod.id}`);
            const items = Array.isArray(res.data) ? res.data : res.data.content ?? [];
            stocks[prod.id] = items.map((s: any) => ({
              warehouseName: s.warehouseName,
              quantity: Number(s.quantity),
            }));
          } catch {
            stocks[prod.id] = [];
          }
        })
      );
      setProductStocks(stocks);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getAllSuppliers().then(setSuppliers).catch(() => {});
    loadCategories();
    // Завантажуємо склади для фільтру
    apiClient.get('/warehouses').then(res => {
      const data = Array.isArray(res.data) ? res.data : res.data.content ?? [];
      setWarehouses(data.map((w: any) => ({ id: w.id, name: w.name })));
    }).catch(() => {});
  }, []);

  const filteredProducts = products.filter(prod => {
    const catName = (prod as any).categoryName ?? (prod as any).category?.name ?? '';
    const supName = (prod as any).supplierName ?? (prod as any).supplier?.name ?? '';
    if (filterCategory && catName !== filterCategory) return false;
    if (filterSupplier && supName !== filterSupplier) return false;
    if (filterWarehouse) {
      const stocks = productStocks[prod.id] ?? [];
      if (!stocks.some(s => s.warehouseName === filterWarehouse && s.quantity > 0)) return false;
    }
    return true;
  });

  const openCreate = () => {
    setEditItem(null); setForm(emptyForm); setFormError(''); setFormOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditItem(p);
    setForm({
      name: p.name, sku: p.sku, unitPrice: p.unitPrice,
      unitOfMeasure: p.unitOfMeasure, orderingCost: p.orderingCost,
      supplierId: p.supplier?.id ?? 0,
      categoryId: (p as any).categoryId ?? (p as any).category?.id ?? 0,
      holdingCostRate: (p as any).holdingCostRate ?? 0.25,
      serviceLevel: (p as any).serviceLevel ?? 0.95,
    });
    setFormError(''); setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim()) { setFormError("Назва та SKU — обов'язкові поля"); return; }
    if (!form.supplierId) { setFormError('Оберіть постачальника'); return; }
    setSaving(true); setFormError('');
    try {
      editItem ? await updateProduct(editItem.id, form) : await createProduct(form);
      setFormOpen(false);
      toast.success(editItem ? 'Збережено' : 'Створено');
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Помилка збереження');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteId);
      setDeleteId(null); toast.success('Видалено'); load();
    } catch { setDeleteId(null); } finally { setDeleting(false); }
  };

  // ── Дії з категоріями ──────────────────────────────────────
  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setCatSaving(true);
    try {
      await apiClient.post('/categories', { name: newCatName.trim() });
      setNewCatName('');
      await loadCategories();
      toast.success('Категорію створено');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Помилка створення категорії');
    } finally { setCatSaving(false); }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCatId) return;
    setDeletingCat(true);
    try {
      await apiClient.delete(`/categories/${deleteCatId}`);
      setDeleteCatId(null);
      await loadCategories();
      toast.success('Категорію видалено');
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Неможливо видалити — можливо, категорія використовується');
    } finally { setDeletingCat(false); }
  };

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
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">Управління каталогом товарів</p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCatOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-all"
                style={{
                  background: 'rgba(255,255,255,0.15)', color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer',
                }}
              >
                <Settings2 className="h-4 w-4" />
                Категорії
              </button>
              <button
                onClick={openCreate}
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-all"
                style={{
                  background: 'white', color: '#5B6CF0', border: 'none', cursor: 'pointer', fontWeight: '700',
                }}
              >
                <Plus className="h-4 w-4" />
                Додати товар
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Пошук за назвою або SKU..."
            className="pl-9 w-64"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <Select value={filterCategory || "__all__"} onValueChange={v => setFilterCategory(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Всі категорії" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Всі категорії</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSupplier || "__all__"} onValueChange={v => setFilterSupplier(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Всі постачальники" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Всі постачальники</SelectItem>
            {suppliers.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterWarehouse || "__all__"} onValueChange={v => setFilterWarehouse(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Всі склади" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Всі склади</SelectItem>
            {warehouses.map(w => <SelectItem key={w.id} value={w.name}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterCategory || filterSupplier || filterWarehouse) && (
          <button
            onClick={() => { setFilterCategory(''); setFilterSupplier(''); setFilterWarehouse(''); }}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Скинути фільтри ✕
          </button>
        )}
      </div>

      {/* Counter */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-slate-500">
          Показано <span className="font-semibold text-slate-800">{filteredProducts.length}</span>
          {(filterCategory || filterSupplier || search || filterWarehouse) && (
            <span className="text-slate-400"> з {products.length}</span>
          )} товарів
        </p>
        {(filterCategory || filterSupplier || search || filterWarehouse) && (
          <p className="text-xs text-slate-400">
            {filterCategory && <span className="mr-2">📂 {filterCategory}</span>}
            {filterSupplier && <span className="mr-2">🏭 {filterSupplier}</span>}
            {filterWarehouse && <span className="mr-2">🏠 {filterWarehouse}</span>}
            {search && <span>🔍 "{search}"</span>}
          </p>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg bg-white overflow-hidden" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: '#3D4A6B' }}>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/80">Назва</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/80">SKU</th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/80">Ціна</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/80">Од.</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/80">Категорія</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/80">Постачальник</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/80">Склади</th>
              <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/80">Статус</th>
              {isAdmin && <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide text-white/80">Дії</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100">
                  {Array.from({ length: isAdmin ? 9 : 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                  ))}
                </tr>
              ))
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 9 : 8}>
                  <EmptyState
                    title="Товарів не знайдено"
                    description="Додайте перший товар до каталогу"
                    actionLabel={isAdmin ? 'Додати товар' : undefined}
                    onAction={isAdmin ? openCreate : undefined}
                  />
                </td>
              </tr>
            ) : filteredProducts.map((prod, i) => (
              <tr key={prod.id}
                className="border-b border-slate-100 transition-colors"
                style={{ background: i % 2 !== 0 ? '#FAFAFA' : 'white' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(91,108,240,0.04)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 !== 0 ? '#FAFAFA' : 'white'; }}
              >
                <td className="px-4 py-3.5">
                  <span className="font-semibold text-slate-800">{prod.name}</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-mono text-xs px-2 py-1 rounded-md font-medium" style={{ background: 'rgba(91,108,240,0.08)', color: '#6B7FD4' }}>
                    {prod.sku}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="font-bold text-slate-800">{prod.unitPrice?.toFixed(2)}</span>
                  <span className="text-slate-400 text-xs ml-1">грн</span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-block text-xs px-2 py-0.5 rounded-md font-semibold" style={{ background: '#F1F5F9', color: '#64748B' }}>
                    {prod.unitOfMeasure || 'шт'}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1 text-slate-500 text-xs">
                    <Tag className="h-3 w-3 text-slate-300" />
                    {(prod as any).categoryName ?? (prod as any).category?.name ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-slate-600 text-sm">
                  {(prod as any).supplierName ?? prod.supplier?.name ?? '—'}
                </td>
                <td className="px-4 py-3.5">
                  {(productStocks[prod.id] ?? []).length === 0 ? (
                    <span className="text-xs text-slate-300">—</span>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {(productStocks[prod.id] ?? []).map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-xs">
                          <span className="text-slate-500">{s.warehouseName}:</span>
                          <span className="font-semibold text-slate-700">{s.quantity}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', padding: '3px 10px',
                    borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: prod.isActive ? '#DCFCE7' : '#F1F5F9',
                    color: prod.isActive ? '#16A34A' : '#94A3B8',
                  }}>
                    {prod.isActive ? 'Активний' : 'Неактивний'}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3.5">
                    <div className="flex justify-center gap-1.5">
                      <button
                        onClick={() => openEdit(prod)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                        style={{ background: 'rgba(91,108,240,0.08)', color: '#6B7FD4', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(91,108,240,0.18)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(91,108,240,0.08)'; }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(prod.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                        style={{ background: 'rgba(220,38,38,0.06)', color: '#DC2626', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.15)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.06)'; }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            ← Попередня
          </Button>
          <span className="text-sm text-slate-500 px-2">
            {page + 1} / {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
            Наступна →
          </Button>
        </div>
      )}

      {/* ── Модальне вікно: Керування категоріями ── */}
      <Dialog open={catOpen} onOpenChange={(open) => { setCatOpen(open); if (!open) loadCategories(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-slate-500" />
              Категорії товарів
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Форма створення */}
            <div>
              <Label className="mb-1.5 block text-xs text-slate-500 uppercase tracking-wide">
                Нова категорія
              </Label>
              <div className="flex gap-2">
                <Input
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Наприклад: Молочна продукція"
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateCategory(); }}
                />
                <Button
                  onClick={handleCreateCategory}
                  disabled={catSaving || !newCatName.trim()}
                  style={{ background: '#3D4A6B', border: 'none', whiteSpace: 'nowrap' }}
                >
                  {catSaving ? '...' : <><Plus className="h-4 w-4 mr-1" />Додати</>}
                </Button>
              </div>
            </div>

            {/* Список існуючих */}
            <div>
              <Label className="mb-1.5 block text-xs text-slate-500 uppercase tracking-wide">
                Існуючі категорії ({categories.length})
              </Label>
              <div className="rounded-lg border border-slate-200 overflow-hidden max-h-64 overflow-y-auto">
                {categories.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-slate-400">
                    Категорій ще немає. Створіть першу вище.
                  </div>
                ) : (
                  categories.map((c, i) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between px-3 py-2.5 text-sm"
                      style={{ background: i % 2 !== 0 ? '#FAFAFA' : 'white', borderBottom: '1px solid #F1F5F9' }}
                    >
                      <span className="flex items-center gap-2 text-slate-700">
                        <Tag className="h-3.5 w-3.5 text-slate-300" />
                        {c.name}
                      </span>
                      <button
                        onClick={() => setDeleteCatId(c.id)}
                        className="w-7 h-7 rounded flex items-center justify-center transition-all"
                        style={{ background: 'rgba(220,38,38,0.06)', color: '#DC2626', border: 'none', cursor: 'pointer' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.15)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.06)'; }}
                        title="Видалити категорію"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCatOpen(false)}>Закрити</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Форма товару ── */}
      <Dialog open={formOpen} onOpenChange={(open) => { if (!catOpen) setFormOpen(open); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Редагувати товар' : 'Новий товар'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Назва *</Label>
                <Input value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Назва товару" />
              </div>
              <div>
                <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">SKU *</Label>
                <Input value={form.sku}
                  onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                  placeholder="ITEM-001" className="font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Ціна (грн) *</Label>
                <Input type="number" min={0} step={0.01} value={form.unitPrice}
                  onChange={e => setForm(f => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Одиниця виміру</Label>
                <Input value={form.unitOfMeasure}
                  onChange={e => setForm(f => ({ ...f, unitOfMeasure: e.target.value }))}
                  placeholder="шт, кг, л..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">
                  Категорія
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setCatOpen(true)}
                      className="ml-2 text-blue-400 hover:text-blue-600 normal-case font-normal tracking-normal"
                      style={{ fontSize: '10px' }}
                    >
                      + керувати
                    </button>
                  )}
                </Label>
                <Select value={form.categoryId ? String(form.categoryId) : ''}
                  onValueChange={val => setForm(f => ({ ...f, categoryId: Number(val) }))}>
                  <SelectTrigger><SelectValue placeholder="Оберіть..." /></SelectTrigger>
                  <SelectContent>
                    {categories.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-400">
                        Немає категорій. Спочатку створіть їх.
                      </div>
                    ) : (
                      categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Постачальник *</Label>
                <Select value={form.supplierId ? String(form.supplierId) : ''}
                  onValueChange={val => setForm(f => ({ ...f, supplierId: Number(val) }))}>
                  <SelectTrigger><SelectValue placeholder="Оберіть..." /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">
                Вартість замовлення (грн)
                <span className="ml-1 text-slate-300 normal-case font-normal tracking-normal" style={{ fontSize: '10px' }}>
                  — скільки коштує оформити одне замовлення постачальнику
                </span>
              </Label>
              <Input type="number" min={0} step={0.01} value={form.orderingCost}
                onChange={e => setForm(f => ({ ...f, orderingCost: parseFloat(e.target.value) || 0 }))} />
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
              style={{ background: '#3D4A6B', border: 'none' }}>
              {saving ? 'Збереження...' : editItem ? 'Зберегти зміни' : 'Створити'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteId !== null}
        title="Видалити товар?"
        description="Цю дію не можна скасувати. Товар буде видалено з системи."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />

      <ConfirmDialog
        open={deleteCatId !== null}
        title="Видалити категорію?"
        description="Якщо категорія використовується товарами — видалення буде заблоковано."
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeleteCatId(null)}
        loading={deletingCat}
      />
    </div>
  );
}
