import { apiClient } from './client';
import type { ReorderItem, SalePoint } from '@/types/dashboard';

export const getReorderAlerts = async (): Promise<ReorderItem[]> => {
  const res = await apiClient.get('/optimization/reorder-alerts');
  return (res.data as any[]).map(item => ({
    ...item,
    warehouseName: item.warehouseName ?? item.warehouse_name ?? item.warehouseId ?? '—',
  }));
};

export const getAbcXyz = async (): Promise<any[]> => {
  const res = await apiClient.get('/analysis/abc-xyz');
  return res.data.map((i: any) => ({
    ...i,
    revenue: Number(i.revenue ?? 0),
    abcClass: i.abcClass ?? i.abc_class ?? i.abcclass ?? '',
  }));
};

export const getSalesChart = async (): Promise<SalePoint[]> => {
  const to = new Date().toISOString().split('T')[0];
  const from = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const res = await apiClient.get('/sales/aggregate', {
    params: { from, to, granularity: 'day' },
  });
  const raw: Array<{ periodStart: string; totalQuantity: number }> = res.data;
  return raw.map(r => ({ date: r.periodStart, quantity: Number(r.totalQuantity) }));
};