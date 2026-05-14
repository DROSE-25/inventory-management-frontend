import { useState, useEffect } from 'react';
import { Plus, UserX, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import toast from 'react-hot-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/empty-state';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select';
import { getUsers, createUser, deactivateUser, activateUser } from '@/api/users';
import type { AppUser, UserForm } from '@/types/user';

const emptyForm: UserForm = {
  username: '', email: '', password: '', role: 'MANAGER',
};

const roleBadgeColor = (role: string) => {
  if (role.includes('ADMIN'))   return 'bg-red-100 text-red-700';
  if (role.includes('MANAGER')) return 'bg-blue-100 text-blue-700';
  return 'bg-green-100 text-green-700';
};

const roleLabel = (role: string) => {
  if (role.includes('ADMIN'))   return 'Адмін';
  if (role.includes('MANAGER')) return 'Менеджер';
  if (role.includes('ANALYST')) return 'Аналітик';
  return role;
};

export default function UsersPage() {
  const [users, setUsers]         = useState<AppUser[]>([]);
  const [loading, setLoading]     = useState(true);

  const [formOpen, setFormOpen]   = useState(false);
  const [form, setForm]           = useState<UserForm>(emptyForm);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setUsers(await getUsers());
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.username.trim() || !form.password.trim()) {
      setFormError("Логін та пароль — обов'язкові поля");
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await createUser(form);
      setFormOpen(false);
      toast.success('Користувача створено');
      load();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e: any) {
      setFormError(e.response?.data?.message ?? 'Помилка створення');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (u: AppUser) => {
    try {
      if (u.isActive) {
        await deactivateUser(u.id);
      } else {
        await activateUser(u.id);
      }
      load();
    } catch {
      // ігноруємо
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Користувачі</h1>
          <p className="text-slate-500 text-sm">Управління обліковими записами</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setFormError(''); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Новий користувач
        </Button>
      </div>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-green-800 text-sm font-medium">✅ {successMsg}</p>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50">
              <th className="text-left p-3 font-medium">Логін</th>
              <th className="text-left p-3 font-medium">Email</th>
              <th className="text-center p-3 font-medium">Роль</th>
              <th className="text-center p-3 font-medium">Статус</th>
              <th className="text-left p-3 font-medium">Дата створення</th>
              <th className="text-center p-3 font-medium">Дії</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
  Array.from({ length: 5 }).map((_, i) => (
    <tr key={i} className="border-b">
      <td className="p-3"><Skeleton className="h-4 w-24" /></td>
      <td className="p-3"><Skeleton className="h-4 w-32" /></td>
      <td className="p-3"><Skeleton className="h-4 w-16" /></td>
      <td className="p-3"><Skeleton className="h-4 w-16" /></td>
      <td className="p-3"><Skeleton className="h-4 w-20" /></td>
      <td className="p-3"><Skeleton className="h-4 w-24" /></td>
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
) : users.map((u, i) => (
  <tr key={u.id} className={`border-b hover:bg-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
    <td className="p-3 font-medium">{u.username}</td>
    <td className="p-3 text-slate-500">{u.email || '—'}</td>
    <td className="p-3 text-center">
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleBadgeColor(u.role)}`}>
        {roleLabel(u.role)}
      </span>
    </td>
    <td className="p-3 text-center">
      <Badge variant={u.isActive ? 'default' : 'secondary'}>
        {u.isActive ? 'Активний' : 'Неактивний'}
      </Badge>
    </td>
    <td className="p-3 text-slate-500 text-xs">
      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('uk-UA') : '—'}
    </td>
    <td className="p-3 text-center">
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleToggle(u)}
        className={u.isActive
          ? 'text-red-600 hover:text-red-700 hover:border-red-300'
          : 'text-green-600 hover:text-green-700 hover:border-green-300'}
      >
        {u.isActive
          ? <><UserX className="h-3 w-3 mr-1" />Деактивувати</>
          : <><UserCheck className="h-3 w-3 mr-1" />Активувати</>
        }
      </Button>
    </td>
  </tr>
))}
        </tbody>
      </table>
    </div>

      {/* Форма створення */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Новий користувач</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="mb-1 block">Логін *</Label>
              <Input value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="username" />
            </div>
            <div>
              <Label className="mb-1 block">Email</Label>
              <Input type="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com" />
            </div>
            <div>
              <Label className="mb-1 block">Пароль *</Label>
              <Input type="password" value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="мінімум 6 символів" />
            </div>
            <div>
              <Label className="mb-1 block">Роль</Label>
              <Select
                value={form.role}
                onValueChange={val => setForm(f => ({ ...f, role: val }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Адмін</SelectItem>
                  <SelectItem value="MANAGER">Менеджер</SelectItem>
                  <SelectItem value="ANALYST">Аналітик</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formError && <p className="text-sm text-red-600">{formError}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
              Скасувати
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Створення...' : 'Створити'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}