import { useState, useEffect } from 'react';
import { Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { getWarehouses, createWarehouse, updateWarehouse } from '@/api/warehouses';
import type { Warehouse, WarehouseForm } from '@/types/warehouse';

const emptyForm: WarehouseForm = { name: '', address: '', capacity: 0 };

export default function WarehousesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading]       = useState(true);

  const [formOpen, setFormOpen]     = useState(false);
  const [editItem, setEditItem]     = useState<Warehouse | null>(null);
  const [form, setForm]             = useState<WarehouseForm>(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [formError, setFormError]   = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setWarehouses(await getWarehouses());
    } catch {
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditItem(null);
    setForm(emptyForm);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = (w: Warehouse) => {
    setEditItem(w);
    setForm({ name: w.name, address: w.address, capacity: w.capacity });
    setFormError('');
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError("Назва — обов'язкове поле");
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editItem) {
        await updateWarehouse(editItem.id, form);
      } else {
        await createWarehouse(form);
      }
      setFormOpen(false);
      load();
    } catch (e: any) {
      setFormError(e.response?.data?.message ?? 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Склади</h1>
          <p className="text-slate-500 text-sm">Управління складами</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Додати склад
          </Button>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left p-3 font-medium">Назва</th>
              <th className="text-left p-3 font-medium">Адреса</th>
              <th className="text-right p-3 font-medium">Місткість</th>
              <th className="text-center p-3 font-medium">Статус</th>
              {isAdmin && <th className="text-center p-3 font-medium">Дії</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isAdmin ? 5 : 4} className="p-8 text-center text-slate-400">Завантаження...</td></tr>
            ) : warehouses.length === 0 ? (
              <tr><td colSpan={isAdmin ? 5 : 4} className="p-8 text-center text-slate-400">Складів не знайдено</td></tr>
            ) : warehouses.map((w, i) => (
              <tr key={w.id} className={`border-b hover:bg-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                <td className="p-3 font-medium">{w.name}</td>
                <td className="p-3 text-slate-500">{w.address || '—'}</td>
                <td className="p-3 text-right">{w.capacity?.toLocaleString()} од.</td>
                <td className="p-3 text-center">
                  <Badge variant={w.isActive ? 'default' : 'secondary'}>
                    {w.isActive ? 'Активний' : 'Неактивний'}
                  </Badge>
                </td>
                {isAdmin && (
                  <td className="p-3 text-center">
                    <Button size="sm" variant="outline" onClick={() => openEdit(w)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Редагувати склад' : 'Новий склад'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>Назва *</Label>
              <Input value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Центральний склад" />
            </div>
            <div>
              <Label>Адреса</Label>
              <Input value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="вул. Складська, 1" />
            </div>
            <div>
              <Label>Місткість (одиниць)</Label>
              <Input type="number" min={0}
                value={form.capacity}
                onChange={e => setForm(f => ({ ...f, capacity: parseInt(e.target.value) || 0 }))} />
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
              Скасувати
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Збереження...' : editItem ? 'Зберегти' : 'Створити'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}