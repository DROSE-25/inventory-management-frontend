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
      iconBg: 'linear-gradient(135deg, #6B7FD4, #8E9EF7)',
      valueColor: '#6B7FD4',
      link: '/products',
    },
    {
      title: 'Нижче точки ROP',
      tooltip: 'Товари, залишок яких опустився нижче точки перезамовлення',
      value: reorderCount,
      suffix: reorderCount === 1 ? 'товар' : 'товарів',
      icon: AlertOctagon,
      iconBg: reorderCount > 0
        ? 'linear-gradient(135deg, #8E9EF7, #FBBF24)'
        : 'linear-gradient(135deg, #10B981, #34D399)',
      valueColor: reorderCount > 0 ? '#8E9EF7' : '#10B981',
      link: '/suppliers',
    },
    {
      title: 'Прогноз / міс',
      tooltip: 'Прогнозований обсяг продажів на наступний місяць',
      value: formatCurrency(forecastedSales),
      suffix: 'грн',
      icon: LineChart,
      iconBg: 'linear-gradient(135deg, #10B981, #38BDF8)',
      valueColor: '#10B981',
      link: '/forecasts',
    },
    {
      title: 'Загальний оборот',
      tooltip: 'Сумарна вартість усіх продажів за весь період',
      value: formatCurrency(totalRevenue),
      suffix: 'грн',
      icon: Banknote,
      iconBg: 'linear-gradient(135deg, #8B5CF6, #6B7FD4)',
      valueColor: '#8B5CF6',
      link: '/sales',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.title}
          onClick={() => navigate(stat.link)}
          style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            border: 'none',
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            cursor: 'pointer',
            transition: 'box-shadow 0.2s, transform 0.2s',
            position: 'relative',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
            (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)';
            (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <p style={{ fontSize: '13px', fontWeight: '500', color: '#8896A5', margin: 0 }}>{stat.title}</p>
              <div
                style={{ position: 'relative', display: 'inline-flex' }}
                onClick={e => e.stopPropagation()}
                onMouseEnter={() => setActiveTooltip(stat.title)}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                <Info style={{ width: '14px', height: '14px', color: '#C5CDD5', cursor: 'help' }} />
                {activeTooltip === stat.title && (
                  <div style={{
                    position: 'absolute', bottom: '100%', left: '50%',
                    transform: 'translateX(-50%)', marginBottom: 6,
                    background: '#1A1A2E', color: 'white', fontSize: 12,
                    lineHeight: 1.5, padding: '8px 12px', borderRadius: 6,
                    width: 220, zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    pointerEvents: 'none',
                  }}>
                    {stat.tooltip}
                    <div style={{
                      position: 'absolute', top: '100%', left: '50%',
                      transform: 'translateX(-50%)', width: 0, height: 0,
                      borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                      borderTop: '5px solid #1A1A2E',
                    }} />
                  </div>
                )}
              </div>
            </div>
            <div style={{
              width: '40px', height: '40px', borderRadius: '6px',
              background: stat.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <stat.icon style={{ width: '20px', height: '20px', color: 'white' }} strokeWidth={1.8} />
            </div>
          </div>
          {loading ? (
            <Skeleton style={{ height: '36px', width: '112px', borderRadius: '8px' }} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
              <span style={{ fontSize: '32px', fontWeight: '600', lineHeight: 1, color: stat.valueColor }}>
                {stat.value}
              </span>
              <span style={{ fontSize: '13px', color: '#8896A5', marginBottom: '3px' }}>{stat.suffix}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
