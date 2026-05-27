import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Truck, Mail, Phone, Clock } from 'lucide-react';
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
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { useAuthStore } from '@/store/authStore';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/api/suppliers';
import type { Supplier, SupplierForm } from '@/types/supplier';

const emptyForm: SupplierForm = {
  name: '', contactPerson: '', email: '', phone: '',
  leadTimeDays: 7, minOrderAmount: 0,
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
    try { setSuppliers(await getSuppliers()); }
    catch { setSuppliers([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditItem(null); setForm(emptyForm); setFormError(''); setFormOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditItem(s);
    setForm({
      name: s.name, contactPerson: s.contactPerson ?? '',
      email: s.email ?? '', phone: s.phone ?? '',
      leadTimeDays: s.leadTimeDays, minOrderAmount: s.minOrderAmount ?? 0,
    });
    setFormError(''); setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setFormError("Назва — обов'язкове поле"); return; }
    setSaving(true); setFormError('');
    try {
      editItem ? await updateSupplier(editItem.id, form) : await createSupplier(form);
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
    try { await deleteSupplier(deleteId); setDeleteId(null); toast.success('Видалено'); load(); }
    catch { setDeleteId(null); }
    finally { setDeleting(false); }
  };

  const activeCount = suppliers.filter(s => s.isActive).length;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="rounded-lg overflow-hidden" style={{
        background: 'linear-gradient(135deg, #1A0A2E 0%, #1E293B 60%, #0F1A2E 100%)',
        padding: '24px 28px',
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)' }}>
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Постачальники</h1>
              <p className="text-sm" style={{ color: '#64748B' }}>Управління постачальниками</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-all"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', color: 'white', border: 'none', cursor: 'pointer' }}
            >
              <Plus className="h-4 w-4" />
              Додати постачальника
            </button>
          )}
        </div>

        {/* Stats strip */}
        {!loading && (
          <div className="flex gap-6 mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div>
              <div className="text-xs mb-1" style={{ color: '#475569' }}>Всього постачальників</div>
              <div className="text-xl font-bold text-white">{suppliers.length}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: '#475569' }}>Активних</div>
              <div className="text-xl font-bold" style={{ color: '#A78BFA' }}>{activeCount}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: '#475569' }}>Середній термін доставки</div>
              <div className="text-xl font-bold text-white">
                {suppliers.length > 0
                  ? Math.round(suppliers.reduce((sum, s) => sum + s.leadTimeDays, 0) / suppliers.length)
                  : 0} дн.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-md border bg-white p-5 space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-36" />
            </div>
          ))}
        </div>
      ) : suppliers.length === 0 ? (
        <div className="rounded-md border bg-white">
          <EmptyState
            title="Постачальників не знайдено"
            description="Додайте першого постачальника"
            actionLabel={isAdmin ? 'Додати постачальника' : undefined}
            onAction={isAdmin ? openCreate : undefined}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map(s => (
            <div key={s.id} className="rounded-md border bg-white p-5 hover:shadow-md transition-all"
              style={{ borderLeft: `4px solid ${s.isActive ? '#7C3AED' : '#CBD5E1'}` }}>

              {/* Card header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">{s.name}</h3>
                  {s.contactPerson && (
                    <p className="text-xs text-slate-400 mt-0.5">{s.contactPerson}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                  s.isActive ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {s.isActive ? 'Активний' : 'Неактивний'}
                </span>
              </div>

              {/* Contact info */}
              <div className="space-y-1.5 mb-4">
                {s.email ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="h-3 w-3 text-slate-400" />
                    <span>{s.email}</span>
                  </div>
                ) : null}
                {s.phone ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span>{s.phone}</span>
                  </div>
                ) : null}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="h-3 w-3 text-slate-400" />
                  <span>Доставка: <strong className="text-slate-700">{s.leadTimeDays} дн.</strong></span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3"
                style={{ borderTop: '1px solid #F1F5F9' }}>
                <span className="text-xs text-slate-400">
                  Мін. замовлення: <strong className="text-slate-600">
                    {s.minOrderAmount ? s.minOrderAmount.toFixed(0) + ' грн' : '—'}
                  </strong>
                </span>
                {isAdmin && (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openEdit(s)}
                      className="w-7 h-7 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50 transition-all"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setDeleteId(s.id)}
                      className="w-7 h-7 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Редагувати постачальника' : 'Новий постачальник'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Назва *</Label>
              <Input value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="ТОВ Постачальник" />
            </div>
            <div>
              <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Контактна особа</Label>
              <Input value={form.contactPerson}
                onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))}
                placeholder="Іванов Іван" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Email</Label>
                <Input type="email" value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="info@supplier.com" />
              </div>
              <div>
                <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Телефон</Label>
                <Input value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+380..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Час доставки (днів)</Label>
                <Input type="number" min={1} value={form.leadTimeDays}
                  onChange={e => setForm(f => ({ ...f, leadTimeDays: parseInt(e.target.value) || 1 }))} />
              </div>
              <div>
                <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Мін. сума замовлення</Label>
                <Input type="number" min={0} step={0.01} value={form.minOrderAmount}
                  onChange={e => setForm(f => ({ ...f, minOrderAmount: parseFloat(e.target.value) || 0 }))} />
              </div>
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
              style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', border: 'none' }}>
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
