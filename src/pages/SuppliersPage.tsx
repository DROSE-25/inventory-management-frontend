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
    try { const data = await getSuppliers(); setSuppliers(data.filter((s: any) => s.isActive !== false)); }
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
        background: 'linear-gradient(135deg, #2A3050 0%, #3D4F7C 100%)',
        padding: '24px 28px',
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.25)' }}>
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">Управління постачальниками</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-all"
              style={{ background: 'white', color: '#5B6CF0', border: 'none', cursor: 'pointer', fontWeight: '700' }}
            >
              <Plus className="h-4 w-4" />
              Додати постачальника
            </button>
          )}
        </div>

        {/* Stats strip */}
        {!loading && (
          <div className="flex gap-6 mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.25)' }}>
            <div>
              <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>Всього постачальників</div>
              <div className="text-xl font-bold text-white">{suppliers.length}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>Активних</div>
              <div className="text-xl font-bold" style={{ color: 'white' }}>{activeCount}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>Середній термін доставки</div>
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
            <div key={i} className="rounded-lg bg-white p-5 space-y-3" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
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
            <div key={s.id} className="rounded-lg bg-white transition-all"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div style={{ width: 44, height: 44, borderRadius: 6, flexShrink: 0, background: s.isActive ? 'linear-gradient(135deg, #6B7FD4, #8E9EF7)' : 'linear-gradient(135deg, #94A3B8, #CBD5E1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Truck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm leading-tight">{s.name}</h3>
                      {s.contactPerson && <p className="text-xs text-slate-400 mt-0.5">{s.contactPerson}</p>}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, fontWeight: 600, whiteSpace: 'nowrap', background: s.isActive ? '#DCFCE7' : '#F1F5F9', color: s.isActive ? '#16A34A' : '#94A3B8' }}>
                    {s.isActive ? 'Активний' : 'Неактивний'}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4 p-3 rounded-lg" style={{ background: '#F8F9FA' }}>
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">Доставка</div>
                    <div className="text-lg font-semibold" style={{ color: '#6B7FD4' }}>{s.leadTimeDays} <span className="text-xs font-normal text-slate-400">дн.</span></div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">Мін. замовлення</div>
                    <div className="text-sm font-bold text-slate-700">{s.minOrderAmount ? s.minOrderAmount.toLocaleString() + ' грн' : '—'}</div>
                  </div>
                </div>

                {/* Contacts */}
                <div className="space-y-1.5 mb-4">
                  {s.email && <a href={`mailto:${s.email}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-indigo-500 transition-colors"><Mail className="h-3 w-3 text-slate-300 shrink-0" />{s.email}</a>}
                  {s.phone && <a href={`tel:${s.phone}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-indigo-500 transition-colors"><Phone className="h-3 w-3 text-slate-300 shrink-0" />{s.phone}</a>}
                </div>

                {/* Actions */}
                {isAdmin && (
                  <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid #F2F4F8' }}>
                    <button onClick={() => openEdit(s)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(91,108,240,0.08)', color: '#6B7FD4', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(91,108,240,0.15)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(91,108,240,0.08)'; }}
                    ><Pencil className="h-3 w-3" /> Редагувати</button>
                    <button onClick={() => setDeleteId(s.id)}
                      className="w-8 flex items-center justify-center rounded-lg"
                      style={{ background: 'rgba(220,38,38,0.06)', color: '#DC2626', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.12)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,38,38,0.06)'; }}
                    ><Trash2 className="h-3.5 w-3.5" /></button>
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
              style={{ background: 'linear-gradient(135deg, #6B7FD4, #5A68C0)', border: 'none', color: 'white' }}>
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
