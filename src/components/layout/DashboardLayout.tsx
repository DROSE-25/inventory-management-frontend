import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import {
  Package, LayoutDashboard, ShoppingCart, Truck,
  Warehouse, BarChart3, FileText, LogOut, Users,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',       adminOnly: false },
  { to: '/products',   icon: Package,          label: 'Товари',          adminOnly: false },
  { to: '/sales',      icon: ShoppingCart,     label: 'Продажі',         adminOnly: false },
  { to: '/suppliers',  icon: Truck,            label: 'Постачальники',   adminOnly: false },
  { to: '/warehouses', icon: Warehouse,        label: 'Склади',          adminOnly: false },
  { to: '/forecasts',  icon: BarChart3,        label: 'Прогнози',        adminOnly: false },
  { to: '/reports',    icon: FileText,         label: 'Звіти',           adminOnly: false },
  { to: '/users',      icon: Users,            label: 'Користувачі',     adminOnly: true  },
];

const PAGE_LABELS: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/products':   'Товари',
  '/sales':      'Продажі',
  '/suppliers':  'Постачальники',
  '/warehouses': 'Склади',
  '/forecasts':  'Прогнози',
  '/reports':    'Звіти',
  '/users':      'Користувачі',
};

const ROLE_LABEL: Record<string, string> = {
  ROLE_ADMIN:    'Адмін',
  ADMIN:         'Адмін',
  ROLE_MANAGER:  'Менеджер',
  MANAGER:       'Менеджер',
  ROLE_ANALYST:  'Аналітик',
  ANALYST:       'Аналітик',
};

const ROLE_COLOR: Record<string, string> = {
  ROLE_ADMIN:    'bg-red-500/20 text-red-200',
  ADMIN:         'bg-red-500/20 text-red-200',
  ROLE_MANAGER:  'bg-blue-500/20 text-blue-200',
  MANAGER:       'bg-blue-500/20 text-blue-200',
  ROLE_ANALYST:  'bg-green-500/20 text-green-200',
  ANALYST:       'bg-green-500/20 text-green-200',
};

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN';
  const currentLabel = PAGE_LABELS[location.pathname] ?? '';

  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-900 text-white flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600 rounded-md">
              <Package className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-none">Inventory</p>
              <p className="text-slate-400 text-xs mt-0.5">Management</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User block */}
        <div className="px-4 py-4 border-t border-slate-700/60">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold uppercase">
              {user?.username?.[0] ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.username}</p>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${ROLE_COLOR[user?.role ?? ''] ?? 'bg-slate-700 text-slate-300'}`}>
                {ROLE_LABEL[user?.role ?? ''] ?? user?.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-slate-100 text-sm w-full px-2 py-1.5 rounded hover:bg-slate-800 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Вийти
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center gap-2 text-sm text-slate-500">
          <span>Inventory</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-medium text-slate-800">{currentLabel}</span>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
