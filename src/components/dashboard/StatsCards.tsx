import { Package, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      icon: Package,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      valueColor: 'text-blue-700',
    },
    {
      title: 'Нижче точки ROP',
      value: reorderCount,
      suffix: reorderCount === 1 ? 'товар' : 'товарів',
      icon: AlertTriangle,
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      valueColor: reorderCount > 0 ? 'text-orange-600' : 'text-green-600',
    },
    {
      title: 'Прогноз продажів / міс',
      value: formatCurrency(forecastedSales),
      suffix: 'грн',
      icon: TrendingUp,
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      valueColor: 'text-green-700',
    },
    {
      title: 'Загальний оборот',
      value: formatCurrency(totalRevenue),
      suffix: 'грн',
      icon: DollarSign,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      valueColor: 'text-purple-700',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              {stat.title}
            </CardTitle>
            <div className={`p-2 rounded-lg ${stat.iconBg}`}>
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div>
                <span className={`text-3xl font-bold ${stat.valueColor}`}>
                  {stat.value}
                </span>
                <span className="text-sm text-slate-400 ml-1">{stat.suffix}</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
