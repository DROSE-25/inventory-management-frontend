import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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

interface Category {
  id: number;
  name: string;
}

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

  const [formOpen, setFormOpen]     = useState(false);
  const [editItem, setEditItem]     = useState<Product | null>(null);
  const [form, setForm]             = useState<ProductForm>(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');

  const [deleteId, setDeleteId]     = useState<number | null>(null);
  const [deleting, setDeleting]     = useState(false);

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
    setEditItem(null);
    setForm(emptyForm);
    setFormError('');
    setFormOpen(true);
  };

const openEdit = (p: Product) => {
  setEditItem(p);
  setForm({
    name: p.name,
    sku: p.sku,
    unitPrice: p.unitPrice,
    unitOfMeasure: p.unitOfMeasure,
    orderingCost: p.orderingCost,
    supplierId: p.supplier?.id ?? 0,
    categoryId: (p as any).category?.id ?? 0,
    holdingCostRate: (p as any).holdingCostRate ?? 0.25,  // ← додати
    serviceLevel: (p as any).serviceLevel ?? 0.95,         // ← додати
  });
  setFormError('');
  setFormOpen(true);
};

  const handleSave = async () => {
    if (!form.name.trim() || !form.sku.trim()) {
      setFormError("Назва та SKU — обов'язкові поля");
      return;
    }
    if (!form.supplierId) {
      setFormError('Оберіть постачальника');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editItem) {
        await updateProduct(editItem.id, form);
      } else {
        await createProduct(form);
      }
      setFormOpen(false);
      toast.success(editItem ? 'Збережено' : 'Створено');
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteId);
      setDeleteId(null);
      toast.success('Видалено');
      load();
    } catch {
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Товари</h1>
          <p className="text-slate-500 text-sm">Управління каталогом товарів</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Додати товар
          </Button>
        )}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Пошук за назвою або SKU..."
          className="pl-9"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
        />
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left p-3 font-medium">Назва</th>
              <th className="text-left p-3 font-medium">SKU</th>
              <th className="text-right p-3 font-medium">Ціна</th>
              <th className="text-left p-3 font-medium">Категорія</th>
              <th className="text-left p-3 font-medium">Постачальник</th>
              <th className="text-center p-3 font-medium">Статус</th>
              {isAdmin && <th className="text-center p-3 font-medium">Дії</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b">
                  <td className="p-3"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-16" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-3"><Skeleton className="h-4 w-16" /></td>
                  {isAdmin && <td className="p-3"><Skeleton className="h-4 w-16" /></td>}
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 7 : 6}>
                  <EmptyState
                    title="Товарів не знайдено"
                    description="Додайте перший товар до каталогу"
                    actionLabel={isAdmin ? "Додати товар" : undefined}
                    onAction={isAdmin ? openCreate : undefined}
                  />
                </td>
              </tr>
            ) : products.map((prod, i) => (
              <tr key={prod.id} className={`border-b hover:bg-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                <td className="p-3 font-medium">{prod.name}</td>
                <td className="p-3 text-slate-500 font-mono text-xs">{prod.sku}</td>
                <td className="p-3 text-right">{prod.unitPrice?.toFixed(2)} грн</td>
                <td className="p-3 text-slate-500">{(prod as any).categoryName ?? (prod as any).category?.name ?? '—'}</td>
                <td className="p-3">{(prod as any).supplierName ?? prod.supplier?.name ?? '—'}</td>
                <td className="p-3 text-center">
                  <Badge variant={prod.isActive ? 'default' : 'secondary'}>
                    {prod.isActive ? 'Активний' : 'Неактивний'}
                  </Badge>
                </td>
                {isAdmin && (
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(prod)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline"
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                        onClick={() => setDeleteId(prod.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}>
            ← Попередня
          </Button>
          <span className="text-sm text-slate-500">
            Сторінка {page + 1} з {totalPages}
          </span>
          <Button variant="outline" size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}>
            Наступна →
          </Button>
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editItem ? 'Редагувати товар' : 'Новий товар'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Назва *</Label>
                <Input value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Назва товару" />
              </div>
              <div>
                <Label className="mb-1 block">SKU *</Label>
                <Input value={form.sku}
                  onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                  placeholder="ITEM-001" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Ціна (грн) *</Label>
                <Input type="number" min={0} step={0.01}
                  value={form.unitPrice}
                  onChange={e => setForm(f => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label className="mb-1 block">Одиниця виміру</Label>
                <Input value={form.unitOfMeasure}
                  onChange={e => setForm(f => ({ ...f, unitOfMeasure: e.target.value }))}
                  placeholder="шт, кг, л..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block">Категорія</Label>
                <Select
                  value={form.categoryId ? String(form.categoryId) : ''}
                  onValueChange={val => setForm(f => ({ ...f, categoryId: Number(val) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1 block">Постачальник *</Label>
                <Select
                  value={form.supplierId ? String(form.supplierId) : ''}
                  onValueChange={val => setForm(f => ({ ...f, supplierId: Number(val) }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Оберіть..." />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="mb-1 block">Вартість замовлення</Label>
              <Input type="number" min={0} step={0.01}
                value={form.orderingCost}
                onChange={e => setForm(f => ({ ...f, orderingCost: parseFloat(e.target.value) || 0 }))} />
            </div>

            {formError && (
              <p className="text-sm text-red-600">{formError}</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
              Скасувати
            </Button>
            <Button onClick={handleSave} disabled={saving}>
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
