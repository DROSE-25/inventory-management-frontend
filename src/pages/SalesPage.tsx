import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select';
import { useAuthStore } from '@/store/authStore';
import { getSales, createSale } from '@/api/sales';
import { getWarehouses } from '@/api/warehouses';
import { getProducts } from '@/api/products';
import type { Sale, SaleForm } from '@/types/sale';
import type { Warehouse } from '@/types/warehouse';
import type { Product } from '@/types/product';

const today = new Date().toISOString().split('T')[0];

const emptyForm: SaleForm = {
  productId: 0, warehouseId: 0,
  quantity: 1, unitPrice: 0, saleDate: today,
};

export default function SalesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';
  const canCreate = isAdmin || user?.role === 'MANAGER' || user?.role === 'ROLE_MANAGER';

  const [sales, setSales]           = useState<Sale[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading]       = useState(true);

  const [formOpen, setFormOpen]     = useState(false);
  const [form, setForm]             = useState<SaleForm>(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setSales(await getSales());
    } catch {
      setSales([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = async () => {
    setForm(emptyForm);
    setFormError('');
    setSuccessMsg('');
    // Завантажити товари і склади паралельно
    try {
      const [prods, warehs] = await Promise.all([
        getProducts(0, 100),
        getWarehouses(),
      ]);
      setProducts(prods.content ?? prods as any);
      setWarehouses(warehs);
    } catch {
      setProducts([]);
      setWarehouses([]);
    }
    setFormOpen(true);
  };

  // При виборі товару — автоматично підставити ціну
  const handleProductChange = (productId: string) => {
    const id = Number(productId);
    const prod = products.find(p => p.id === id);
    setForm(f => ({
      ...f,
      productId: id,
      unitPrice: prod?.unitPrice ?? 0,
    }));
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
      setSuccessMsg('Продаж зареєстровано. Залишок оновлено.');
      load();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e: any) {
      const msg = e.response?.data?.message ?? '';
      if (e.response?.status === 400) {
        setFormError('Недостатньо товару на складі');
      } else {
        setFormError(msg || 'Помилка збереження');
      }
    } finally {
      setSaving(false);
    }
  };

  const totalSum = (s: Sale) =>
    (Number(s.quantity) * Number(s.unitPrice)).toFixed(2);

  return (
    <div className="space-y-4">
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

      {/* Повідомлення про успіх */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-green-800 text-sm font-medium">✅ {successMsg}</p>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left p-3 font-medium">Дата</th>
              <th className="text-left p-3 font-medium">Товар</th>
              <th className="text-left p-3 font-medium">Склад</th>
              <th className="text-right p-3 font-medium">Кількість</th>
              <th className="text-right p-3 font-medium">Ціна</th>
              <th className="text-right p-3 font-medium">Сума</th>
              <th className="text-left p-3 font-medium">Автор</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-400">Завантаження...</td></tr>
            ) : sales.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-400">Продажів не знайдено</td></tr>
            ) : sales.map((s, i) => (
              <tr key={s.id} className={`border-b hover:bg-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                <td className="p-3">{s.saleDate}</td>
                <td className="p-3 font-medium">{s.product?.name ?? '—'}</td>
                <td className="p-3 text-slate-500">{s.warehouse?.name ?? '—'}</td>
                <td className="p-3 text-right">{s.quantity}</td>
                <td className="p-3 text-right">{Number(s.unitPrice).toFixed(2)} грн</td>
                <td className="p-3 text-right font-medium">{totalSum(s)} грн</td>
                <td className="p-3 text-slate-500 text-xs">{s.createdBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Форма реєстрації продажу */}
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
                onValueChange={handleProductChange}>
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
                onValueChange={val => setForm(f => ({ ...f, warehouseId: Number(val) }))}>
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
                <Input type="number" min={1}
                  value={form.quantity}
                  onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} />
              </div>
              <div>
                <Label className="mb-1 block">Ціна за одиницю (грн)</Label>
                <Input type="number" min={0} step={0.01}
                  value={form.unitPrice}
                  onChange={e => setForm(f => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>

            <div>
              <Label className="mb-1 block">Дата продажу</Label>
              <Input type="date" value={form.saleDate}
                onChange={e => setForm(f => ({ ...f, saleDate: e.target.value }))} />
            </div>

            {/* Сума до сплати */}
            {form.quantity > 0 && form.unitPrice > 0 && (
              <div className="bg-blue-50 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  Сума: <span className="font-bold">
                    {(form.quantity * form.unitPrice).toFixed(2)} грн
                  </span>
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