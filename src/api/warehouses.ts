import { apiClient } from './client';
import type { Warehouse, WarehouseForm } from '@/types/warehouse';

export const getWarehouses = async (): Promise<Warehouse[]> => {
  const res = await apiClient.get('/warehouses');
  return Array.isArray(res.data) ? res.data : res.data.content ?? [];
};

export const createWarehouse = async (data: WarehouseForm): Promise<Warehouse> => {
  const res = await apiClient.post('/warehouses', data);
  return res.data;
};

export const updateWarehouse = async (id: number, data: WarehouseForm): Promise<Warehouse> => {
  const res = await apiClient.put(`/warehouses/${id}`, data);
  return res.data;
};