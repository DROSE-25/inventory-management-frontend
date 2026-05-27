import { useEffect, useState } from 'react';
import StatsCards from '@/components/dashboard/StatsCards';
import AbcPieChart from '@/components/dashboard/AbcPieChart';
import ReorderTable from '@/components/dashboard/ReorderTable';
import { getReorderAlerts, getAbcXyz } from '@/api/dashboard';
import type { ReorderItem } from '@/types/dashboard';
import { Activity, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [reorderItems, setReorderItems] = useState<ReorderItem[]>([]);
  const [abcItems, setAbcItems]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [lastUpdated, setLastUpdated]   = useState<Date | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [reorder, abc] = await Promise.all([
        getReorderAlerts(),
        getAbcXyz(),
      ]);
      setReorderItems(reorder);
      setAbcItems(abc);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const totalRevenue    = abcItems.reduce((sum, i) => sum + Number(i.revenue ?? 0), 0);
  const forecastedSales = totalRevenue / 12;

  const timeStr = lastUpdated
    ? lastUpdated.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="rounded-lg overflow-hidden" style={{
        background: 'linear-gradient(135deg, #1E3A5F 0%, #1E293B 60%, #0F2744 100%)',
        padding: '28px 32px',
      }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #4ade80' }} />
              <span className="text-xs font-medium" style={{ color: '#94A3B8' }}>Система активна</span>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
              Огляд
            </h1>
            <p style={{ color: '#64748B', fontSize: '14px' }}>
              Огляд ключових показників системи управління запасами
            </p>
          </div>
          <div className="flex items-center gap-3">
            {timeStr && (
              <span className="text-xs" style={{ color: '#475569' }}>
                Оновлено о {timeStr}
              </span>
            )}
            <button
              onClick={fetchAll}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.3)',
                color: '#93C5FD',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Оновити
            </button>
          </div>
        </div>

        {/* Quick stats row */}
        <div className="flex gap-6 mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {[
            { label: 'Товарів у системі', value: loading ? '...' : abcItems.length },
            { label: 'Потребують замовлення', value: loading ? '...' : reorderItems.length, alert: reorderItems.length > 0 },
            { label: 'Клас A (пріоритет)', value: loading ? '...' : abcItems.filter(i => i.abcClass === 'A').length },
            { label: 'Загальний оборот', value: loading ? '...' : (totalRevenue >= 1000 ? (totalRevenue / 1000).toFixed(1) + ' тис' : totalRevenue.toFixed(0)) + ' грн' },
          ].map(({ label, value, alert }) => (
            <div key={label}>
              <div className="text-xs mb-1" style={{ color: '#475569' }}>{label}</div>
              <div className={`text-xl font-bold ${alert ? 'text-orange-400' : 'text-white'}`}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats cards */}
      <StatsCards
        totalProducts={abcItems.length}
        reorderCount={reorderItems.length}
        forecastedSales={forecastedSales}
        totalRevenue={totalRevenue}
        loading={loading}
      />

      {/* Charts */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <AbcPieChart items={abcItems} />
          </div>
          <div className="lg:col-span-2">
            <ReorderTable items={reorderItems} />
          </div>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="rounded-md border bg-white p-6 animate-pulse"
              style={{ height: '280px', gridColumn: i === 2 ? 'span 2' : undefined }}>
              <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
              <div className="h-40 bg-slate-50 rounded" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

