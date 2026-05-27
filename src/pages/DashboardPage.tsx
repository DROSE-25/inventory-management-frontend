import { useEffect, useState } from 'react';
import StatsCards from '@/components/dashboard/StatsCards';
import AbcPieChart from '@/components/dashboard/AbcPieChart';
import ReorderTable from '@/components/dashboard/ReorderTable';
import { getReorderAlerts, getAbcXyz } from '@/api/dashboard';
import type { ReorderItem } from '@/types/dashboard';

export default function DashboardPage() {
  const [reorderItems, setReorderItems] = useState<ReorderItem[]>([]);
  const [abcItems, setAbcItems]         = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [reorder, abc] = await Promise.all([
          getReorderAlerts(),
          getAbcXyz(),
        ]);
        setReorderItems(reorder);
        setAbcItems(abc);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const totalRevenue = abcItems.reduce((sum, i) => sum + Number(i.revenue ?? 0), 0);
  const forecastedSales = totalRevenue / 12;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-slate-500 text-sm">Огляд ключових показників системи</p>
      </div>

      <StatsCards
        totalProducts={abcItems.length}
        reorderCount={reorderItems.length}
        forecastedSales={forecastedSales}
        totalRevenue={totalRevenue}
        loading={loading}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          {!loading && <AbcPieChart items={abcItems} />}
        </div>
        <div className="lg:col-span-2">
          {!loading && <ReorderTable items={reorderItems} />}
        </div>
      </div>
    </div>
  );
}