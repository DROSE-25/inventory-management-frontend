import { apiClient } from './client';
import type { Sale, SaleForm } from '@/types/sale';

export const getSales = async (
  page = 0, 
  size = 20,
  from?: string, 
  to?: string
): Promise<Sale[]> => {
  const res = await apiClient.get('/sales', { 
    params: { page, size, from, to } 
  });
  return Array.isArray(res.data) ? res.data : res.data.content ?? [];
};

export const createSale = async (data: SaleForm): Promise<Sale> => {
  const res = await apiClient.post('/sales', data);
  return res.data;
};
export const deleteSale = async (id: number): Promise<void> => {
  await apiClient.delete(`/sales/${id}`);
};
