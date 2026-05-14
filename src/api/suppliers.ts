import { apiClient } from './client';
import type { Supplier, SupplierForm } from '@/types/supplier';

export const getSuppliers = async (): Promise<Supplier[]> => {
  const res = await apiClient.get('/suppliers');
  return Array.isArray(res.data) ? res.data : res.data.content ?? [];
};

export const createSupplier = async (data: SupplierForm): Promise<Supplier> => {
  const res = await apiClient.post('/suppliers', data);
  return res.data;
};

export const updateSupplier = async (id: number, data: SupplierForm): Promise<Supplier> => {
  const res = await apiClient.put(`/suppliers/${id}`, data);
  return res.data;
};

export const deleteSupplier = async (id: number): Promise<void> => {
  await apiClient.delete(`/suppliers/${id}`);
};