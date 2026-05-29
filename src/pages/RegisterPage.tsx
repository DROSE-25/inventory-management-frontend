import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/api/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Package2, Building2, User, Mail, Lock, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface RegisterForm {
  companyName: string;
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [form, setForm] = useState<RegisterForm>({
    companyName: '',
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Partial<RegisterForm>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<1 | 2>(1); // Step 1: company, Step 2: user

  const update = (field: keyof RegisterForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setServerError(null);
  };

  const validateStep1 = () => {
    const errs: Partial<RegisterForm> = {};
    if (!form.companyName.trim()) errs.companyName = "Назва компанії обов'язкова";
    else if (form.companyName.length < 2) errs.companyName = 'Мінімум 2 символи';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Partial<RegisterForm> = {};
    if (!form.fullName.trim()) errs.fullName = "Ім'я обов'язкове";
    if (!form.username.trim()) errs.username = 'Логін обов\'язковий';
    else if (form.username.length < 3) errs.username = 'Мінімум 3 символи';
    else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) errs.username = 'Лише латиниця, цифри та _';
    if (!form.email.trim()) errs.email = 'Email обов\'язковий';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Невірний формат email';
    if (!form.password) errs.password = 'Пароль обов\'язковий';
    else if (form.password.length < 6) errs.password = 'Мінімум 6 символів';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Паролі не співпадають';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = (e: FormEvent) => {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    setServerError(null);
    try {
      const response = await apiClient.post('/auth/register', {
        companyName: form.companyName,
        fullName: form.fullName,
        username: form.username,
        email: form.email,
        password: form.password,
      });
      const data = response.data;
      login(data.accessToken, data.username, data.role);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message
        || err.response?.data
        || 'Помилка реєстрації. Спробуйте ще раз.';
      setServerError(typeof msg === 'string' ? msg : 'Помилка реєстрації');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (field: keyof RegisterForm) => ({
    background: '#1C1F35',
    border: `1px solid ${errors[field] ? '#EF4444' : 'rgba(255,255,255,0.1)'}`,
    color: 'white',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s',
  } as React.CSSProperties);

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '6px',
    display: 'block',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      background: '#1A1A2E',
    }}>
      {/* Left panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px',
        background: 'linear-gradient(135deg, #1A1A2E 0%, #2D3561 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: 420 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #6B7FD4, #8E9EF7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package2 size={22} color="white" />
            </div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>Склад і запаси</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Система управління</div>
            </div>
          </div>

          <h1 style={{ fontSize: 32, fontWeight: 700, color: 'white', marginBottom: 12 }}>
            Почніть роботу<br />безкоштовно
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15, lineHeight: 1.6, marginBottom: 40 }}>
            Зареєструйте свою компанію та отримайте повний доступ до системи управління складом.
          </p>

          {[
            'Прогнозування попиту (6 методів)',
            'ABC/XYZ аналіз асортименту',
            'Автоматичний розрахунок EOQ/ROP',
            'Excel звіти одним кліком',
          ].map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <CheckCircle2 size={16} color="#6B7FD4" />
              <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        width: 480,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
            {[1, 2].map((s) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: step >= s ? 'linear-gradient(135deg, #6B7FD4, #8E9EF7)' : 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: step >= s ? 'white' : 'rgba(255,255,255,0.3)',
                  transition: 'all 0.3s',
                }}>
                  {s}
                </div>
                <span style={{ fontSize: 12, color: step >= s ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)' }}>
                  {s === 1 ? 'Компанія' : 'Акаунт'}
                </span>
                {s < 2 && <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.1)', marginLeft: 4 }} />}
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'white', marginBottom: 6 }}>
            {step === 1 ? 'Про вашу компанію' : 'Дані для входу'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 28 }}>
            {step === 1
              ? 'Вкажіть назву вашого підприємства або організації'
              : 'Створіть обліковий запис адміністратора'}
          </p>

          {serverError && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 20,
              color: '#FCA5A5', fontSize: 13,
            }}>
              {serverError}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <form onSubmit={handleNext}>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>
                  <Building2 size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  Назва компанії
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={update('companyName')}
                  placeholder="ТОВ «Моя компанія»"
                  style={inputStyle('companyName')}
                  autoFocus
                />
                {errors.companyName && (
                  <div style={{ color: '#FCA5A5', fontSize: 12, marginTop: 4 }}>{errors.companyName}</div>
                )}
              </div>

              <button type="submit" style={{
                width: '100%', padding: '12px', borderRadius: 8,
                background: 'linear-gradient(135deg, #6B7FD4, #8E9EF7)',
                color: 'white', fontWeight: 700, fontSize: 15,
                border: 'none', cursor: 'pointer', marginBottom: 20,
              }}>
                Далі →
              </button>
            </form>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>
                  <User size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  Повне ім'я
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={update('fullName')}
                  placeholder="Іваненко Іван Іванович"
                  style={inputStyle('fullName')}
                  autoFocus
                />
                {errors.fullName && <div style={{ color: '#FCA5A5', fontSize: 12, marginTop: 4 }}>{errors.fullName}</div>}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>
                  <User size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  Логін
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={update('username')}
                  placeholder="admin"
                  style={inputStyle('username')}
                />
                {errors.username && <div style={{ color: '#FCA5A5', fontSize: 12, marginTop: 4 }}>{errors.username}</div>}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>
                  <Mail size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="admin@company.com"
                  style={inputStyle('email')}
                />
                {errors.email && <div style={{ color: '#FCA5A5', fontSize: 12, marginTop: 4 }}>{errors.email}</div>}
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>
                  <Lock size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  Пароль
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={update('password')}
                    placeholder="Мінімум 6 символів"
                    style={{ ...inputStyle('password'), paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
                  }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <div style={{ color: '#FCA5A5', fontSize: 12, marginTop: 4 }}>{errors.password}</div>}
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>
                  <Lock size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                  Підтвердження паролю
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  placeholder="Повторіть пароль"
                  style={inputStyle('confirmPassword')}
                />
                {errors.confirmPassword && <div style={{ color: '#FCA5A5', fontSize: 12, marginTop: 4 }}>{errors.confirmPassword}</div>}
              </div>

              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <button type="button" onClick={() => setStep(1)} style={{
                  flex: 1, padding: '12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                }}>
                  ← Назад
                </button>
                <button type="submit" disabled={loading} style={{
                  flex: 2, padding: '12px', borderRadius: 8,
                  background: loading ? 'rgba(107,127,212,0.5)' : 'linear-gradient(135deg, #6B7FD4, #8E9EF7)',
                  color: 'white', fontWeight: 700, fontSize: 15,
                  border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? 'Реєстрація...' : 'Зареєструватись'}
                </button>
              </div>
            </form>
          )}

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
            Вже є акаунт?{' '}
            <Link to="/login" style={{ color: '#8E9EF7', textDecoration: 'none', fontWeight: 600 }}>
              Увійти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
