import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import {
  Package, LayoutDashboard, ShoppingCart, Truck,
  Warehouse, BarChart3, FileText, LogOut, User, Users // Додано Users
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  // Зміна 2: Перевірка ролі адміна та формування списку меню
  const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN';

  const navItems = [
    { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/products',   icon: Package,          label: 'Товари' },
    { to: '/sales',      icon: ShoppingCart,     label: 'Продажі' },
    { to: '/suppliers',  icon: Truck,            label: 'Постачальники' },
    { to: '/warehouses', icon: Warehouse,        label: 'Склади' },
    { to: '/forecasts',  icon: BarChart3,        label: 'Прогнози' },
    { to: '/reports',    icon: FileText,         label: 'Звіти' },
    ...(isAdmin ? [{ to: '/users', icon: Users, label: 'Користувачі' }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Зміна 3: Бічне меню (змінено bg-rose-600 на bg-slate-900) */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6" />
            <span className="font-bold text-lg">Inventory</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm">{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Основна частина */}
      <div className="flex-1 flex flex-col">
        {/* Шапка */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div></div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-slate-500" />
              <span className="font-medium">{user?.username}</span>
              <span className="text-slate-500">({user?.role})</span>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Вийти
            </Button>
          </div>
        </header>

        {/* Контент сторінок */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}