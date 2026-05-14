import { apiClient } from './client';
import type { Sale, SaleForm } from '@/types/sale';

export const getSales = async (page = 0, size = 20): Promise<Sale[]> => {
  const res = await apiClient.get('/sales', { params: { page, size } });
  return Array.isArray(res.data) ? res.data : res.data.content ?? [];
};

export const createSale = async (data: SaleForm): Promise<Sale> => {
  const res = await apiClient.post('/sales', data);
  return res.data;
};