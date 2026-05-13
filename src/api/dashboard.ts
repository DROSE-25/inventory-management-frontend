import { apiClient } from './client';
import type { ReorderItem, AbcItem } from '@/types/dashboard';

// Товари що потребують перезамовлення
export const getReorderAlerts = async (): Promise<ReorderItem[]> => {
  const res = await apiClient.get('/optimization/reorder-alerts');
  return res.data;
};

// ABC-XYZ аналіз для кругової діаграми
export const getAbcXyz = async (): Promise<AbcItem[]> => {
  const res = await apiClient.get('/analysis/abc-xyz');
  return res.data;
};
