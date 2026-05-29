import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  Package, LayoutDashboard, ShoppingCart, Truck,
  Warehouse, BarChart3, FileText, LogOut, Users,
  Menu, HelpCircle,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Головна',        adminOnly: false },
  { to: '/products',   icon: Package,          label: 'Товари',         adminOnly: false },
  { to: '/sales',      icon: ShoppingCart,     label: 'Продажі',        adminOnly: false },
  { to: '/suppliers',  icon: Truck,            label: 'Постачальники',  adminOnly: false },
  { to: '/warehouses', icon: Warehouse,        label: 'Склади',         adminOnly: false },
  { to: '/forecasts',  icon: BarChart3,        label: 'Прогнози',       adminOnly: false },
  { to: '/reports',    icon: FileText,         label: 'Звіти',          adminOnly: false },
  { to: '/help',       icon: HelpCircle,       label: 'Інструкція',     adminOnly: false },
  { to: '/users',      icon: Users,            label: 'Користувачі',    adminOnly: true  },
];

const PAGE_LABELS: Record<string, string> = {
  '/dashboard':  'Головна',
  '/products':   'Товари',
  '/sales':      'Продажі',
  '/suppliers':  'Постачальники',
  '/warehouses': 'Склади',
  '/forecasts':  'Прогнози',
  '/reports':    'Звіти',
  '/help':       'Інструкція',
  '/users':      'Користувачі',
};

const ROLE_LABEL: Record<string, string> = {
  ROLE_ADMIN: 'Адмін', ADMIN: 'Адмін',
  ROLE_MANAGER: 'Менеджер', MANAGER: 'Менеджер',
  ROLE_ANALYST: 'Аналітик', ANALYST: 'Аналітик',
};

const ROLE_GRADIENT: Record<string, string> = {
  ROLE_ADMIN:   'linear-gradient(135deg, #6B7FD4, #5A68C0)',
  ADMIN:        'linear-gradient(135deg, #6B7FD4, #5A68C0)',
  ROLE_MANAGER: 'linear-gradient(135deg, #6B7FD4, #5A68C0)',
  MANAGER:      'linear-gradient(135deg, #6B7FD4, #5A68C0)',
  ROLE_ANALYST: 'linear-gradient(135deg, #8B5CF6, #38BDF8)',
  ANALYST:      'linear-gradient(135deg, #8B5CF6, #38BDF8)',
};

const ROUTE_ACCENT: Record<string, string> = {
  '/dashboard':  '#6B7FD4',
  '/products':   '#6B7FD4',
  '/sales':      '#6B7FD4',
  '/suppliers':  '#6B7FD4',
  '/warehouses': '#6B7FD4',
  '/forecasts':  '#6B7FD4',
  '/reports':    '#6B7FD4',
  '/help':       '#6B7FD4',
  '/users':      '#6B7FD4',
};

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [reorderCount, setReorderCount] = useState(0);

  const isAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ADMIN';

  useEffect(() => {
    apiClient.get('/optimization/reorder-alerts')
      .then(r => {
        const arr = Array.isArray(r.data) ? r.data : r.data.content ?? [];
        setReorderCount(arr.length);
      }).catch(() => {});
    const interval = setInterval(() => {
      apiClient.get('/optimization/reorder-alerts')
        .then(r => {
          const arr = Array.isArray(r.data) ? r.data : r.data.content ?? [];
          setReorderCount(arr.length);
        }).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentLabel = PAGE_LABELS[location.pathname] ?? '';
  const visibleItems = NAV_ITEMS.filter(item => !item.adminOnly || isAdmin);
  const roleGradient = ROLE_GRADIENT[user?.role ?? ''] ?? '#FF0000';
  const activeAccent = ROUTE_ACCENT[location.pathname] ?? '#6B7FD4';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="min-h-screen flex" style={{ background: '#F2F4F8' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: collapsed ? '68px' : '220px',
        minWidth: collapsed ? '68px' : '220px',
        background: '#1C1F35',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease, min-width 0.25s ease',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'visible',
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{
          padding: '18px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '6px',
            background: 'linear-gradient(135deg, #6B7FD4, #5A68C0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Package size={16} color="white" />
          </div>
          {!collapsed && (
            <span style={{ color: 'white', fontWeight: '600', fontSize: '14px', whiteSpace: 'nowrap' }}>
              Склад і запаси
            </span>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
          {visibleItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;
            const accent   = ROUTE_ACCENT[to] ?? '#6B7FD4';
            return (
              <NavLink key={to} to={to} title={collapsed ? label : undefined}>
                {() => (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: collapsed ? 0 : '10px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      padding: collapsed ? '11px 0' : '9px 10px',
                      borderRadius: '6px',
                      marginBottom: '2px',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      background: isActive ? `${accent}22` : 'transparent',
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    {isActive && (
                      <div style={{
                        position: 'absolute', left: 0, top: '6px', bottom: '6px',
                        width: '3px', borderRadius: '0 3px 3px 0',
                        background: accent,
                      }} />
                    )}
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      background: isActive ? `${accent}28` : 'transparent',
                      position: 'relative',
                    }}>
                      <Icon size={17} color={isActive ? accent : '#5A6070'} />
                      {to === '/dashboard' && reorderCount > 0 && (
                        <div style={{
                          position: 'absolute', top: 0, right: 0,
                          width: '16px', height: '16px', borderRadius: '50%',
                          background: '#6B7FD4', color: 'white',
                          fontSize: '9px', fontWeight: '600',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1.5px solid #151521', lineHeight: 1,
                        }}>
                          {reorderCount > 9 ? '9+' : reorderCount}
                        </div>
                      )}
                    </div>
                    {!collapsed && (
                      <span style={{
                        fontSize: '13px',
                        fontWeight: isActive ? '600' : '400',
                        color: isActive ? 'white' : '#5A6070',
                        whiteSpace: 'nowrap',
                      }}>
                        {label}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User block */}
        <div style={{
          padding: collapsed ? '12px 8px' : '12px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {!collapsed ? (
            <div style={{
              padding: '10px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: roleGradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: '600', color: 'white', flexShrink: 0,
                }}>
                  {user?.username?.[0]?.toUpperCase() ?? '?'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'white', fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.username}
                  </div>
                  <div style={{
                    fontSize: '11px', marginTop: '2px', fontWeight: '500',
                    color: 'rgba(255,255,255,0.7)',
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
                  background: 'rgba(91,108,240,0.08)', border: '1px solid rgba(91,108,240,0.18)',
                  color: '#9AABF7', fontSize: '12px', fontWeight: '500', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(91,108,240,0.16)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(91,108,240,0.08)'; }}
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
                padding: '10px 0', borderRadius: '6px', cursor: 'pointer',
                background: 'transparent', border: 'none', color: '#5A6070', transition: 'color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#9AABF7'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#5A6070'; }}
            >
              <LogOut size={17} />
            </button>
          )}
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #E8E9EC',
          padding: '0 24px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setCollapsed(c => !c)}
              style={{
                width: '32px', height: '32px', borderRadius: '8px',
                background: 'transparent', border: '1px solid #E8E9EC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#9CA3AF',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F5F6F8'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <Menu size={15} />
            </button>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: activeAccent,
              boxShadow: `0 0 8px ${activeAccent}80`,
            }} />
            <span style={{ fontSize: '15px', fontWeight: '600', color: '#1C1F35' }}>
              {currentLabel}
            </span>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '5px 12px 5px 5px',
            borderRadius: '24px',
            background: '#F5F6F8',
            border: '1px solid #E8E9EC',
          }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: roleGradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '12px', fontWeight: '600', color: 'white',
            }}>
              {user?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>
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
