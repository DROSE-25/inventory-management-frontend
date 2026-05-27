import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  Package, LayoutDashboard, ShoppingCart, Truck,
  Warehouse, BarChart3, FileText, LogOut, Users,
  ChevronRight, ChevronLeft, Menu,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Огляд',     adminOnly: false },
  { to: '/products',   icon: Package,          label: 'Товари',        adminOnly: false },
  { to: '/sales',      icon: ShoppingCart,     label: 'Продажі',       adminOnly: false },
  { to: '/suppliers',  icon: Truck,            label: 'Постачальники', adminOnly: false },
  { to: '/warehouses', icon: Warehouse,        label: 'Склади',        adminOnly: false },
  { to: '/forecasts',  icon: BarChart3,        label: 'Прогнози',      adminOnly: false },
  { to: '/reports',    icon: FileText,         label: 'Звіти',         adminOnly: false },
  { to: '/users',      icon: Users,            label: 'Користувачі',   adminOnly: true  },
];

const PAGE_LABELS: Record<string, string> = {
  '/dashboard':  'Огляд',
  '/products':   'Товари',
  '/sales':      'Продажі',
  '/suppliers':  'Постачальники',
  '/warehouses': 'Склади',
  '/forecasts':  'Прогнози',
  '/reports':    'Звіти',
  '/users':      'Користувачі',
};

const ROLE_LABEL: Record<string, string> = {
  ROLE_ADMIN: 'Адмін', ADMIN: 'Адмін',
  ROLE_MANAGER: 'Менеджер', MANAGER: 'Менеджер',
  ROLE_ANALYST: 'Аналітик', ANALYST: 'Аналітик',
};

const ROLE_GRADIENT: Record<string, string> = {
  ROLE_ADMIN: 'linear-gradient(135deg, #DC2626, #F87171)',
  ADMIN:      'linear-gradient(135deg, #DC2626, #F87171)',
  ROLE_MANAGER: 'linear-gradient(135deg, #1D4ED8, #60A5FA)',
  MANAGER:    'linear-gradient(135deg, #1D4ED8, #60A5FA)',
  ROLE_ANALYST: 'linear-gradient(135deg, #15803D, #4ADE80)',
  ANALYST:    'linear-gradient(135deg, #15803D, #4ADE80)',
};

// Accent colour per route for the active nav item
const ROUTE_ACCENT: Record<string, string> = {
  '/dashboard':  '#3B82F6',
  '/products':   '#3B82F6',
  '/sales':      '#22C55E',
  '/suppliers':  '#A78BFA',
  '/warehouses': '#38BDF8',
  '/forecasts':  '#C084FC',
  '/reports':    '#38BDF8',
  '/users':      '#F87171',
};

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin      = user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN';
  const currentLabel = PAGE_LABELS[location.pathname] ?? '';
  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);
  const roleGradient = ROLE_GRADIENT[user?.role ?? ''] ?? 'linear-gradient(135deg, #475569, #94A3B8)';
  const activeAccent = ROUTE_ACCENT[location.pathname] ?? '#3B82F6';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen flex" style={{ background: '#F1F5F9' }}>

      {/* ── SIDEBAR ── */}
      <aside
        style={{
          width: collapsed ? '72px' : '240px',
          minWidth: collapsed ? '72px' : '240px',
          background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s ease, min-width 0.25s ease',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 10,
        }}
      >
        {/* Logo */}
        <div style={{
          padding: collapsed ? '20px 0' : '20px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Package size={17} color="white" />
              </div>
              <div>
                <div style={{ color: 'white', fontWeight: '700', fontSize: '14px', lineHeight: 1 }}>
                  Склад і запаси
                </div>
                <div style={{ color: '#475569', fontSize: '11px', marginTop: '2px' }}>
                  
                </div>
              </div>
            </div>
          )}
          {collapsed && (
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Package size={17} color="white" />
            </div>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            position: 'absolute',
            top: '22px',
            right: collapsed ? '50%' : '14px',
            transform: collapsed ? 'translateX(50%)' : 'none',
            width: '22px', height: '22px',
            borderRadius: '50%',
            background: '#1E293B',
            border: '1px solid rgba(255,255,255,0.1)',
            display: collapsed ? 'none' : 'flex',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#64748B',
            transition: 'all 0.2s',
          }}
        >
          <ChevronLeft size={12} />
        </button>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {/* Expand button when collapsed */}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              style={{
                width: '100%', display: 'flex', justifyContent: 'center',
                padding: '8px 0', marginBottom: '8px',
                background: 'transparent', border: 'none',
                color: '#475569', cursor: 'pointer',
              }}
            >
              <Menu size={18} />
            </button>
          )}

          {visibleItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            const accent   = ROUTE_ACCENT[to] ?? '#3B82F6';
            return (
              <NavLink key={to} to={to} title={collapsed ? label : undefined}>
                {() => (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: collapsed ? 0 : '10px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? '10px 0' : '9px 12px',
                    borderRadius: '10px',
                    marginBottom: '2px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: isActive
                      ? `${accent}18`
                      : 'transparent',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                  }}
                  >
                    {/* Active left bar */}
                    {isActive && (
                      <div style={{
                        position: 'absolute', left: 0, top: '6px', bottom: '6px',
                        width: '3px', borderRadius: '0 3px 3px 0',
                        background: accent,
                      }} />
                    )}

                    {/* Icon */}
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      background: isActive ? `${accent}25` : 'transparent',
                      transition: 'background 0.15s',
                    }}>
                      <Icon
                        size={17}
                        color={isActive ? accent : '#64748B'}
                        style={{ transition: 'color 0.15s' }}
                      />
                    </div>

                    {/* Label */}
                    {!collapsed && (
                      <span style={{
                        fontSize: '13px',
                        fontWeight: isActive ? '600' : '400',
                        color: isActive ? 'white' : '#94A3B8',
                        whiteSpace: 'nowrap',
                        transition: 'color 0.15s',
                      }}>
                        {label}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}

        {/* User block */}
        <div style={{
          padding: collapsed ? '12px 8px' : '12px 12px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          {!collapsed ? (
            <div style={{
              padding: '10px 10px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: roleGradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: '700', color: 'white', flexShrink: 0,
                }}>
                  {user?.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'white', fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.username}
                  </div>
                  <div style={{
                    fontSize: '11px', marginTop: '2px', fontWeight: '500',
                    background: roleGradient,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
                    {ROLE_LABEL[user?.role ?? ''] ?? user?.role}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '6px', padding: '7px', borderRadius: '8px', cursor: 'pointer',
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                  color: '#F87171', fontSize: '12px', fontWeight: '500',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.15)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'; }}
              >
                <LogOut size={13} />
                Вийти
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              title="Вийти"
              style={{
                width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center',
                padding: '10px 0', borderRadius: '10px', cursor: 'pointer',
                background: 'transparent', border: 'none', color: '#475569',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#F87171'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#475569'; }}
            >
              <LogOut size={17} />
            </button>
          )}
        </div>

        </nav>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #E2E8F0',
          padding: '0 24px',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Collapse toggle in header when sidebar is open */}
            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'transparent', border: '1px solid #E2E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#94A3B8', marginRight: '4px',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F8FAFC'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <Menu size={14} />
              </button>
            )}
            {collapsed && (
              <button
                onClick={() => setCollapsed(false)}
                style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'transparent', border: '1px solid #E2E8F0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#94A3B8', marginRight: '4px',
                }}
              >
                <Menu size={14} />
              </button>
            )}

            {/* Page title */}
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: activeAccent,
              boxShadow: `0 0 6px ${activeAccent}`,
            }} />
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1E293B' }}>
              {currentLabel}
            </span>
          </div>

          {/* User chip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '4px 10px 4px 4px',
            borderRadius: '20px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
          }}>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: roleGradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: '700', color: 'white',
            }}>
              {user?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span style={{ fontSize: '12px', fontWeight: '500', color: '#475569' }}>
              {user?.username}
            </span>
          </div>
        </header>

        <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}