import { Boxes, AlertOctagon, LineChart, Banknote, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  totalProducts: number;
  reorderCount: number;
  forecastedSales: number;
  totalRevenue: number;
  loading: boolean;
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' млн';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + ' тис';
  return n.toFixed(0);
}

export default function StatsCards({
  totalProducts, reorderCount, forecastedSales, totalRevenue, loading,
}: Props) {
  const navigate = useNavigate();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const stats = [
    {
      title: 'Товарів у каталозі',
      tooltip: 'Загальна кількість активних товарів у системі',
      value: totalProducts,
      suffix: 'позицій',
      icon: Boxes,
      iconBg: '#2563EB',
      valueColor: '#1E40AF',
      link: '/products',
    },
    {
      title: 'Нижче точки ROP',
      tooltip: 'Товари, залишок яких опустився нижче точки перезамовлення. Потребують термінового поповнення',
      value: reorderCount,
      suffix: reorderCount === 1 ? 'товар' : 'товарів',
      icon: AlertOctagon,
      iconBg: reorderCount > 0 ? '#EA580C' : '#16A34A',
      valueColor: reorderCount > 0 ? '#C2410C' : '#15803D',
      link: '/suppliers',
    },
    {
      title: 'Прогноз / міс',
      tooltip: 'Прогнозований обсяг продажів на наступний місяць на основі історичних даних',
      value: formatCurrency(forecastedSales),
      suffix: 'грн',
      icon: LineChart,
      iconBg: '#16A34A',
      valueColor: '#15803D',
      link: '/forecasts',
    },
    {
      title: 'Загальний оборот',
      tooltip: 'Сумарна вартість усіх продажів за весь період роботи системи',
      value: formatCurrency(totalRevenue),
      suffix: 'грн',
      icon: Banknote,
      iconBg: '#7C3AED',
      valueColor: '#6D28D9',
      link: '/sales',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.title}
          onClick={() => navigate(stat.link)}
          className="rounded-md p-5 bg-white transition-all hover:shadow-md"
          style={{ border: '1px solid #E2E8F0', position: 'relative', cursor: 'pointer' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium text-slate-500">{stat.title}</p>
              <div
                style={{ position: 'relative', display: 'inline-flex' }}
                onClick={e => e.stopPropagation()}
                onMouseEnter={() => setActiveTooltip(stat.title)}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                <Info className="h-3.5 w-3.5 text-slate-300 cursor-help hover:text-slate-400 transition-colors" />
                {activeTooltip === stat.title && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    marginBottom: 6,
                    background: '#1E293B',
                    color: 'white',
                    fontSize: 12,
                    lineHeight: 1.5,
                    padding: '8px 12px',
                    borderRadius: 8,
                    width: 220,
                    zIndex: 50,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    pointerEvents: 'none',
                  }}>
                    {stat.tooltip}
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0, height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderTop: '5px solid #1E293B',
                    }} />
                  </div>
                )}
              </div>
            </div>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: stat.iconBg }}
            >
              <stat.icon className="h-[18px] w-[18px] text-white" strokeWidth={1.8} />
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-9 w-28" />
          ) : (
            <div className="flex items-end gap-1.5">
              <span className="text-3xl font-bold tracking-tight" style={{ color: stat.valueColor }}>
                {stat.value}
              </span>
              <span className="text-sm text-slate-400 mb-0.5">{stat.suffix}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
