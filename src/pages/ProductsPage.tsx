import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search, Package, Tag } from 'lucide-react';
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
import type { Product, ProductForm } from '@/types/product';
import type { Supplier } from '@/types/supplier';

interface Category { id: number; name: string; }

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

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getProducts(page, 20, search);
      setProducts(data.content);
      setTotalPages(data.totalPages);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getAllSuppliers().then(setSuppliers).catch(() => {});
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditItem(null); setForm(emptyForm); setFormError(''); setFormOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditItem(p);
    setForm({
      name: p.name, sku: p.sku, unitPrice: p.unitPrice,
      unitOfMeasure: p.unitOfMeasure, orderingCost: p.orderingCost,
      supplierId: p.supplier?.id ?? 0,
      categoryId: (p as any).category?.id ?? 0,
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

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="rounded-lg overflow-hidden" style={{
        background: 'linear-gradient(135deg, #0F2744 0%, #1E293B 60%, #0A1628 100%)',
        padding: '24px 28px',
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)' }}>
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Товари</h1>
              <p className="text-sm" style={{ color: '#64748B' }}>Управління каталогом товарів</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-all"
              style={{
                background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
                color: 'white', border: 'none', cursor: 'pointer',
              }}
            >
              <Plus className="h-4 w-4" />
              Додати товар
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Пошук за назвою або SKU..."
          className="pl-9"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
        />
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ background: '#F8FAFC' }}>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-400">Назва</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-400">SKU</th>
              <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-400">Ціна</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-400">Категорія</th>
              <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-400">Постачальник</th>
              <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-400">Статус</th>
              {isAdmin && <th className="text-center px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-400">Дії</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: isAdmin ? 7 : 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  ))}
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6}>
                  <EmptyState
                    title="Товарів не знайдено"
                    description="Додайте перший товар до каталогу"
                    actionLabel={isAdmin ? 'Додати товар' : undefined}
                    onAction={isAdmin ? openCreate : undefined}
                  />
                </td>
              </tr>
            ) : products.map((prod, i) => (
              <tr key={prod.id}
                className="border-b transition-colors hover:bg-blue-50/30"
                style={{ background: i % 2 !== 0 ? 'rgba(248,250,252,0.6)' : undefined }}>
                <td className="px-4 py-3">
                  <span className="font-semibold text-slate-800">{prod.name}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">
                    {prod.sku}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-semibold text-slate-700">{prod.unitPrice?.toFixed(2)}</span>
                  <span className="text-slate-400 text-xs ml-1">грн</span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-slate-500 text-xs">
                    <Tag className="h-3 w-3" />
                    {(prod as any).categoryName ?? (prod as any).category?.name ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {(prod as any).supplierName ?? prod.supplier?.name ?? '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    prod.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {prod.isActive ? 'Активний' : 'Неактивний'}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1.5">
                      <button
                        onClick={() => openEdit(prod)}
                        className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(prod.id)}
                        className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-all"
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

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
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
                <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Категорія</Label>
                <Select value={form.categoryId ? String(form.categoryId) : ''}
                  onValueChange={val => setForm(f => ({ ...f, categoryId: Number(val) }))}>
                  <SelectTrigger><SelectValue placeholder="Оберіть..." /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
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
              <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Вартість замовлення (грн)</Label>
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
              style={{ background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', border: 'none' }}>
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
    </div>
  );
}
