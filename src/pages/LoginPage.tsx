import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Package2, BarChart3, ShieldCheck, Boxes } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await authApi.login({ username, password });
      login(response.accessToken, response.username, response.role);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message
        || (err.response?.status === 401
          ? 'Неправильний логін або пароль'
          : 'Помилка з\'єднання з сервером');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      background: '#0F172A',
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: '-80px', left: '-80px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-100px', right: '-60px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '6px',
            background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Package2 size={22} color="white" />
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: '700', fontSize: '16px', lineHeight: 1 }}>Склад і запаси</div>
            <div style={{ color: '#64748B', fontSize: '12px', marginTop: '2px' }}></div>
          </div>
        </div>

        {/* Center text */}
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '6px',
            padding: '6px 14px',
            fontSize: '12px',
            color: '#93C5FD',
            marginBottom: '24px',
            fontWeight: '500',
          }}>
            Система управління запасами
          </div>
          <h1 style={{
            color: 'white',
            fontSize: '42px',
            fontWeight: '800',
            lineHeight: '1.15',
            marginBottom: '20px',
            letterSpacing: '-0.5px',
          }}>
            Контроль запасів<br />
            <span style={{
              background: 'linear-gradient(90deg, #3B82F6, #818CF8)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              на одному екрані
            </span>
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '15px', lineHeight: '1.6', maxWidth: '380px' }}>
            Прогнозування попиту, ABC/XYZ-аналіз, автоматичні рекомендації щодо замовлень та детальна звітність.
          </p>

          {/* Features */}
          <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: BarChart3, label: 'Прогнозування попиту', desc: '6 методів прогнозування з автовибором' },
              { icon: ShieldCheck, label: 'Рольовий доступ', desc: 'Адмін, Менеджер, Аналітик' },
              { icon: Boxes, label: 'ABC/XYZ аналіз', desc: 'Класифікація товарів за оборотом' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '4px',
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon size={16} color="#60A5FA" />
                </div>
                <div>
                  <div style={{ color: '#E2E8F0', fontSize: '13px', fontWeight: '600' }}>{label}</div>
                  <div style={{ color: '#64748B', fontSize: '12px' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ color: '#334155', fontSize: '12px', position: 'relative' }}>
          © 2026 Inventory Management System
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={{
        width: '460px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1E293B',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
        padding: '48px 40px',
      }}>
        <div style={{ width: '100%', maxWidth: '360px' }}>
          <h2 style={{
            color: 'white', fontSize: '26px', fontWeight: '700',
            marginBottom: '8px', letterSpacing: '-0.3px',
          }}>
            Вхід до системи
          </h2>
          <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '36px' }}>
            Введіть свої облікові дані
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block', color: '#94A3B8', fontSize: '13px',
                fontWeight: '500', marginBottom: '8px',
              }}>
                Логін
              </label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                disabled={loading}
                autoComplete="username"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: '4px',
                  background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontSize: '14px', outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#3B82F6'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'block', color: '#94A3B8', fontSize: '13px',
                fontWeight: '500', marginBottom: '8px',
              }}>
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: '4px',
                  background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontSize: '14px', outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#3B82F6'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '4px', padding: '10px 14px',
                color: '#FCA5A5', fontSize: '13px', marginBottom: '20px',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px',
                background: loading ? '#1E40AF' : 'linear-gradient(135deg, #3B82F6, #6366F1)',
                border: 'none', borderRadius: '4px',
                color: 'white', fontSize: '14px', fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => { if (!loading) (e.target as HTMLElement).style.opacity = '0.9'; }}
              onMouseLeave={e => { (e.target as HTMLElement).style.opacity = '1'; }}
            >
              {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
              {loading ? 'Вхід...' : 'Увійти'}
            </button>
          </form>

          <div style={{
            marginTop: '32px', padding: '16px',
            background: 'rgba(59,130,246,0.05)',
            border: '1px solid rgba(59,130,246,0.1)',
            borderRadius: '4px',
          }}>
            <p style={{ color: '#475569', fontSize: '12px', marginBottom: '6px', fontWeight: '600' }}>
              Тестові дані:
            </p>
            <p style={{ color: '#64748B', fontSize: '12px' }}>
              Логін: <span style={{ color: '#93C5FD' }}>admin</span> &nbsp;·&nbsp;
              Пароль: <span style={{ color: '#93C5FD' }}>admin123</span>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
