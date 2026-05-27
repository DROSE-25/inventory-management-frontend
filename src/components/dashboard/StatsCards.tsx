import { Boxes, AlertOctagon, LineChart, Banknote } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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
  const stats = [
    {
      title: 'Товарів у каталозі',
      value: totalProducts,
      suffix: 'позицій',
      icon: Boxes,
      iconBg: '#2563EB',
      valueColor: '#1E40AF',
    },
    {
      title: 'Нижче точки ROP',
      value: reorderCount,
      suffix: reorderCount === 1 ? 'товар' : 'товарів',
      icon: AlertOctagon,
      iconBg: reorderCount > 0 ? '#EA580C' : '#16A34A',
      valueColor: reorderCount > 0 ? '#C2410C' : '#15803D',
    },
    {
      title: 'Прогноз / міс',
      value: formatCurrency(forecastedSales),
      suffix: 'грн',
      icon: LineChart,
      iconBg: '#16A34A',
      valueColor: '#15803D',
    },
    {
      title: 'Загальний оборот',
      value: formatCurrency(totalRevenue),
      suffix: 'грн',
      icon: Banknote,
      iconBg: '#7C3AED',
      valueColor: '#6D28D9',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.title}
          className="rounded-md p-5 bg-white transition-all hover:shadow-md"
          style={{ border: '1px solid #E2E8F0' }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-slate-500">{stat.title}</p>
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
