import { useState, useEffect } from 'react';
import { Plus, UserX, UserCheck, Users, Shield, ShieldCheck, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/empty-state';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select';
import { getUsers, createUser, deactivateUser, activateUser } from '@/api/users';
import type { AppUser, UserForm } from '@/types/user';

const emptyForm: UserForm = { username: '', email: '', password: '', role: 'MANAGER' };

const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  ADMIN:    { label: 'Адмін',    color: '#DC2626', bg: 'rgba(220,38,38,0.1)',   icon: Shield },
  MANAGER:  { label: 'Менеджер', color: '#5A68C0', bg: 'rgba(74,90,212,0.1)',   icon: ShieldCheck },
  ANALYST:  { label: 'Аналітик', color: '#059669', bg: 'rgba(21,128,61,0.1)',   icon: Eye },
};

function getRoleConfig(role: string) {
  for (const key of Object.keys(ROLE_CONFIG)) {
    if (role.includes(key)) return ROLE_CONFIG[key];
  }
  return { label: role, color: '#64748B', bg: 'rgba(100,116,139,0.1)', icon: Shield };
}

function getAvatar(username: string) {
  return username?.[0]?.toUpperCase() ?? '?';
}

export default function UsersPage() {
  const [users, setUsers]         = useState<AppUser[]>([]);
  const [loading, setLoading]     = useState(true);
  const [formOpen, setFormOpen]   = useState(false);
  const [form, setForm]           = useState<UserForm>(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setLoading(true);
    try { setUsers(await getUsers()); }
    catch { setUsers([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.username.trim() || !form.password.trim()) {
      setFormError("Логін та пароль — обов'язкові поля"); return;
    }
    setSaving(true); setFormError('');
    try {
      await createUser(form);
      setFormOpen(false);
      toast.success('Користувача створено');
      load();
    } catch (e: any) {
      setFormError(e.response?.data?.message ?? 'Помилка створення');
    } finally { setSaving(false); }
  };

  const handleToggle = async (u: AppUser) => {
    try {
      u.isActive ? await deactivateUser(u.id) : await activateUser(u.id);
      toast.success(u.isActive ? 'Деактивовано' : 'Активовано');
      load();
    } catch { toast.error('Помилка'); }
  };

  const activeCount  = users.filter(u => u.isActive).length;
  const adminCount   = users.filter(u => u.role?.includes('ADMIN')).length;
  const managerCount = users.filter(u => u.role?.includes('MANAGER')).length;

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
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">Управління обліковими записами</p>
            </div>
          </div>
          <button
            onClick={() => { setForm(emptyForm); setFormError(''); setFormOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold"
            style={{ background: 'white', color: '#5B6CF0', border: 'none', cursor: 'pointer', fontWeight: '700' }}
          >
            <Plus className="h-4 w-4" />
            Новий користувач
          </button>
        </div>

        {!loading && (
          <div className="flex gap-6 mt-5 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.25)' }}>
            <div>
              <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>Всього</div>
              <div className="text-xl font-bold text-white">{users.length}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>Активних</div>
              <div className="text-xl font-bold" style={{ color: '#F87171' }}>{activeCount}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>Адміністраторів</div>
              <div className="text-xl font-bold text-white">{adminCount}</div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.75)' }}>Менеджерів</div>
              <div className="text-xl font-bold text-white">{managerCount}</div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border bg-white overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ background: '#F5F6F8' }}>
              {['Користувач', 'Email', 'Роль', 'Статус', 'Дата створення', 'Дії'].map((h, i) => (
                <th key={h} className={`px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-400 ${i === 5 ? 'text-center' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    title="Користувачів не знайдено"
                    description="Створіть першого користувача"
                    actionLabel="Новий користувач"
                    onAction={() => { setForm(emptyForm); setFormError(''); setFormOpen(true); }}
                  />
                </td>
              </tr>
            ) : users.map((u, i) => {
              const roleConf = getRoleConfig(u.role);
              const RoleIcon = roleConf.icon;
              return (
                <tr key={u.id}
                  className="border-b transition-colors hover:bg-red-50/10"
                  style={{ background: i % 2 !== 0 ? 'rgba(248,250,252,0.6)' : undefined }}>

                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: u.isActive ? 'linear-gradient(135deg, #DC2626, #F87171)' : '#DDE0E5' }}>
                        {getAvatar(u.username)}
                      </div>
                      <span className="font-semibold text-slate-800">{u.username}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-slate-500 text-sm">{u.email || '—'}</td>

                  {/* Role */}
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: roleConf.bg, color: roleConf.color }}>
                      <RoleIcon className="h-3 w-3" />
                      {roleConf.label}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      u.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {u.isActive ? 'Активний' : 'Неактивний'}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('uk-UA') : '—'}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-center">
                    {u.role?.includes('ADMIN') ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium"
                        style={{ background: 'rgba(100,116,139,0.06)', border: '1px solid rgba(100,116,139,0.15)', color: '#94A3B8' }}>
                        <Shield className="h-3 w-3" />
                        Захищений
                      </span>
                    ) : (
                      <button
                        onClick={() => handleToggle(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border text-xs font-medium transition-all"
                        style={{
                          background: u.isActive ? 'rgba(220,38,38,0.06)' : 'rgba(21,128,61,0.06)',
                          border: u.isActive ? '1px solid rgba(220,38,38,0.2)' : '1px solid rgba(21,128,61,0.2)',
                          color: u.isActive ? '#DC2626' : '#059669',
                          cursor: 'pointer',
                        }}
                      >
                        {u.isActive
                          ? <><UserX className="h-3 w-3" />Деактивувати</>
                          : <><UserCheck className="h-3 w-3" />Активувати</>
                        }
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Form */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Новий користувач</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Логін *</Label>
              <Input value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="username" />
            </div>
            <div>
              <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Email</Label>
              <Input type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com" />
            </div>
            <div>
              <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Пароль *</Label>
              <Input type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="мінімум 6 символів" />
            </div>
            <div>
              <Label className="mb-1 block text-xs text-slate-500 uppercase tracking-wide">Роль</Label>
              <Select value={form.role} onValueChange={val => setForm(f => ({ ...f, role: val }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Адмін</SelectItem>
                  <SelectItem value="MANAGER">Менеджер</SelectItem>
                  <SelectItem value="ANALYST">Аналітик</SelectItem>
                </SelectContent>
              </Select>
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
              style={{ background: 'linear-gradient(135deg, #5B6CF0, #8E9EF7)', border: 'none' }}>
              {saving ? 'Створення...' : 'Створити'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
