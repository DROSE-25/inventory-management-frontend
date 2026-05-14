import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { useAuthStore } from '@/store/authStore';
import {
  getSuppliers, createSupplier,
  updateSupplier, deleteSupplier
} from '@/api/suppliers';
import type { Supplier, SupplierForm } from '@/types/supplier';

const emptyForm: SupplierForm = {
  name: '', contactEmail: '', contactPhone: '',
  leadTimeDays: 7, orderingCost: 0,
};

export default function SuppliersPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'ROLE_ADMIN';

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading]     = useState(true);

  const [formOpen, setFormOpen]   = useState(false);
  const [editItem, setEditItem]   = useState<Supplier | null>(null);
  const [form, setForm]           = useState<SupplierForm>(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteId, setDeleteId]   = useState<number | null>(null);
  const [deleting, setDeleting]   = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      setSuppliers(await getSuppliers());
    } catch {
      setSuppliers([]);
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

  const openEdit = (s: Supplier) => {
    setEditItem(s);
    setForm({
      name: s.name,
      contactEmail: s.contactEmail,
      contactPhone: s.contactPhone,
      leadTimeDays: s.leadTimeDays,
      orderingCost: s.orderingCost,
    });
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
        await updateSupplier(editItem.id, form);
      } else {
        await createSupplier(form);
      }
      setFormOpen(false);
      load();
    } catch (e: any) {
      setFormError(e.response?.data?.message ?? 'Помилка збереження');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteSupplier(deleteId);
      setDeleteId(null);
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
          <h1 className="text-2xl font-bold tracking-tight">Постачальники</h1>
          <p className="text-slate-500 text-sm">Управління постачальниками</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Додати постачальника
          </Button>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left p-3 font-medium">Назва</th>
              <th className="text-left p-3 font-medium">Email</th>
              <th className="text-left p-3 font-medium">Телефон</th>
              <th className="text-right p-3 font-medium">Час доставки</th>
              <th className="text-right p-3 font-medium">Вартість замовлення</th>
              <th className="text-center p-3 font-medium">Статус</th>
              {isAdmin && <th className="text-center p-3 font-medium">Дії</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isAdmin ? 7 : 6} className="p-8 text-center text-slate-400">Завантаження...</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan={isAdmin ? 7 : 6} className="p-8 text-center text-slate-400">Постачальників не знайдено</td></tr>
            ) : suppliers.map((s, i) => (
              <tr key={s.id} className={`border-b hover:bg-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                <td className="p-3 font-medium">{s.name}</td>
                <td className="p-3 text-slate-500">{s.contactEmail || '—'}</td>
                <td className="p-3 text-slate-500">{s.contactPhone || '—'}</td>
                <td className="p-3 text-right">{s.leadTimeDays} дн.</td>
                <td className="p-3 text-right">{s.orderingCost?.toFixed(2)} грн</td>
                <td className="p-3 text-center">
                  <Badge variant={s.isActive ? 'default' : 'secondary'}>
                    {s.isActive ? 'Активний' : 'Неактивний'}
                  </Badge>
                </td>
                {isAdmin && (
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline"
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                        onClick={() => setDeleteId(s.id)}>
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

      {/* Форма */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editItem ? 'Редагувати постачальника' : 'Новий постачальник'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label>Назва *</Label>
              <Input value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="ТОВ Постачальник" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.contactEmail}
                  onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                  placeholder="info@supplier.com" />
              </div>
              <div>
                <Label>Телефон</Label>
                <Input value={form.contactPhone}
                  onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
                  placeholder="+380..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Час доставки (днів)</Label>
                <Input type="number" min={1}
                  value={form.leadTimeDays}
                  onChange={e => setForm(f => ({ ...f, leadTimeDays: parseInt(e.target.value) || 1 }))} />
              </div>
              <div>
                <Label>Вартість замовлення</Label>
                <Input type="number" min={0} step={0.01}
                  value={form.orderingCost}
                  onChange={e => setForm(f => ({ ...f, orderingCost: parseFloat(e.target.value) || 0 }))} />
              </div>
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

      <ConfirmDialog
        open={deleteId !== null}
        title="Видалити постачальника?"
        description="Цю дію не можна скасувати."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}