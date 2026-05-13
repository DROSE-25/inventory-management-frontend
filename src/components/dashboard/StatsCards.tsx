import { Package, AlertTriangle, TrendingUp, Coins } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  totalProducts: number;
  reorderCount: number;
  forecastedSales: number;
  loading: boolean;
}

export default function StatsCards({
  totalProducts, reorderCount, forecastedSales, loading
}: Props) {
  const stats = [
    { title: 'Товарів у каталозі', value: totalProducts,
      icon: Package, color: 'text-blue-600' },
    { title: 'Нижче ROP',  value: reorderCount,
      icon: AlertTriangle, color: 'text-orange-600' },
    { title: 'Прогноз продажів (міс.)', value: forecastedSales.toFixed(0),
      icon: TrendingUp, color: 'text-green-600' },
    { title: 'Товарів під замовлення', value: reorderCount,
      icon: Coins, color: 'text-purple-600' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-5 w-5 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {loading ? '...' : stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

