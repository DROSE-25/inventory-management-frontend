import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, TrendingUp, Coins } from 'lucide-react';
 
const stats = [
  { title: 'Товарів у каталозі', value: '—', icon: Package,        color: 'text-blue-600' },
  { title: 'Нижче ROP',          value: '—', icon: AlertTriangle,  color: 'text-orange-600' },
  { title: 'Прогноз на місяць',  value: '—', icon: TrendingUp,     color: 'text-green-600' },
  { title: 'Вартість запасів',   value: '—', icon: Coins,          color: 'text-purple-600' },
];
 
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-slate-500">Огляд ключових показників системи</p>
      </div>
 
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
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-slate-500 mt-1">
                Дані з\'являться після наповнення системи
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
 
      <Card>
        <CardHeader>
          <CardTitle>У розробці</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">
            Графіки продажів, топ товарів та критичні залишки будуть додані
            у Day 20 (тиждень 3 — UI з даними).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
