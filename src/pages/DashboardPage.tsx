import { useEffect, useState } from 'react';
import AbcPieChart from '@/components/dashboard/AbcPieChart';
import ReorderTable from '@/components/dashboard/ReorderTable';
import { getReorderAlerts, getAbcXyz } from '@/api/dashboard';
import type { ReorderItem } from '@/types/dashboard';
import { RefreshCw, Package, AlertTriangle, TrendingUp, Banknote, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function BannerCard({ title, value, suffix, icon: Icon, color, link, tooltip, navigate }: {
  title: string; value: string | number; suffix?: string;
  icon: any; color: string; link: string; tooltip?: string;
  navigate: (path: string) => void;
}) {
  const [tip, setTip] = useState(false);
  return (
    <div
      onClick={() => navigate(link)}
      style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 8, padding: '16px 18px', cursor: 'pointer', transition: 'background 0.15s', position: 'relative' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.13)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, position: 'relative' }}>
          <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{title}</span>
          {tooltip && (
            <div onClick={e => e.stopPropagation()} onMouseEnter={() => setTip(true)} onMouseLeave={() => setTip(false)}>
              <Info style={{ width: 11, height: 11, color: 'rgba(255,255,255,0.3)', cursor: 'help' }} />
              {tip && (
                <div style={{ position: 'absolute', bottom: '100%', left: 0, marginBottom: 6, background: '#1C1F35', color: 'white', fontSize: 11, padding: '6px 10px', borderRadius: 6, width: 200, zIndex: 50, pointerEvents: 'none', lineHeight: 1.5 }}>
                  {tooltip}
                </div>
              )}
            </div>
          )}
        </div>
        <Icon style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.3)' }} strokeWidth={1.8} />
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5 }}>
        <span style={{ fontSize: 32, fontWeight: 600, color, lineHeight: 1 }}>{value}</span>
        {suffix && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>{suffix}</span>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [reorderItems, setReorderItems] = useState<ReorderItem[]>([]);
  const [abcItems, setAbcItems]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [lastUpdated, setLastUpdated]   = useState<Date | null>(null);
  const [selectedAbcClass, setSelectedAbcClass] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [reorder, abc] = await Promise.all([getReorderAlerts(), getAbcXyz()]);
      setReorderItems(reorder);
      setAbcItems(abc);
      setLastUpdated(new Date());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const totalRevenue    = abcItems.reduce((sum, i) => sum + Number(i.revenue ?? 0), 0);
  const forecastedSales = totalRevenue / 12;
  const fmt = (n: number) => n >= 1_000_000 ? (n/1_000_000).toFixed(1)+' млн' : n >= 1_000 ? (n/1_000).toFixed(1)+' тис' : n.toFixed(0);
  const timeStr = lastUpdated ? lastUpdated.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }) : null;
  const filteredReorderItems = selectedAbcClass
    ? reorderItems.filter(item => abcItems.find(a => a.productId === item.productId)?.abcClass === selectedAbcClass)
    : reorderItems;

  return (
    <div className="space-y-5">

      {/* Combined header + stats banner */}
      <div className="rounded-lg overflow-hidden" style={{ background: 'linear-gradient(135deg, #2A3050 0%, #3D4F7C 100%)', padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #4ade80' }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Система активна</span>
              {timeStr && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>· оновлено о {timeStr}</span>}
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 600, color: 'white', margin: 0 }}>Огляд системи</h1>
          </div>
          <button onClick={fetchAll} disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', color: 'white', cursor: loading ? 'not-allowed' : 'pointer' }}>
            <RefreshCw style={{ width: 12, height: 12 }} className={loading ? 'animate-spin' : ''} />
            Оновити
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 8, padding: '16px 18px', height: 80 }} />
            ))
          ) : (
            <>
              <BannerCard title="Товарів у каталозі" value={abcItems.length} suffix="позицій"
                icon={Package} color="#A5B4FC" link="/products" navigate={navigate}
                tooltip="Загальна кількість активних товарів" />
              <BannerCard title="Потребують замовлення" value={reorderItems.length}
                suffix={reorderItems.length === 1 ? 'товар' : 'товарів'}
                icon={AlertTriangle} color={reorderItems.length > 0 ? '#FCA5A5' : '#86EFAC'}
                link="/suppliers" navigate={navigate}
                tooltip="Товари нижче точки перезамовлення ROP" />
              <BannerCard title="Прогноз / місяць" value={fmt(forecastedSales)} suffix="грн"
                icon={TrendingUp} color="#67E8F9" link="/forecasts" navigate={navigate}
                tooltip="Орієнтовний обсяг продажів наступного місяця" />
              <BannerCard title="Загальний оборот" value={fmt(totalRevenue)} suffix="грн"
                icon={Banknote} color="#C4B5FD" link="/sales" navigate={navigate}
                tooltip="Сумарна виручка за весь час роботи" />
            </>
          )}
        </div>

        {/* Підказка якщо ABC не перераховано */}
        {!loading && abcItems.length === 0 && (
          <div style={{
            marginTop: 12,
            background: 'rgba(251,191,36,0.12)',
            border: '1px solid rgba(251,191,36,0.35)',
            borderRadius: 8,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <span style={{ fontSize: 16 }}>💡</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>
              Дані не відображаються? Перейдіть у{' '}
              <span
                onClick={() => navigate('/reports')}
                style={{ color: '#FCD34D', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Звіти
              </span>
              {' '}і натисніть <strong style={{ color: '#FCD34D' }}>«🔄 Перерахувати»</strong> в блоці ABC/XYZ Аналіз.
            </span>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          {loading
            ? <div className="bg-white rounded-lg animate-pulse" style={{ height: 280, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }} />
            : <AbcPieChart items={abcItems} selectedClass={selectedAbcClass} onClassSelect={setSelectedAbcClass} />
          }
        </div>
        <div className="lg:col-span-2">
          {loading
            ? <div className="bg-white rounded-lg animate-pulse" style={{ height: 280, boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }} />
            : <ReorderTable items={filteredReorderItems} />
          }
        </div>
      </div>

      {selectedAbcClass && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94A3B8' }}>
          <span>Фільтр: клас <strong style={{ color: '#475569' }}>{selectedAbcClass}</strong></span>
          <button onClick={() => setSelectedAbcClass(null)} style={{ color: '#6B7FD4', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: 12 }}>очистити</button>
        </div>
      )}
    </div>
  );
}
