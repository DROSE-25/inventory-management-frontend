import { apiClient } from './client';
import type { AppUser, UserForm } from '@/types/user';

export const getUsers = async (): Promise<AppUser[]> => {
  const res = await apiClient.get('/users');
  return Array.isArray(res.data) ? res.data : res.data.content ?? [];
};

export const createUser = async (data: UserForm): Promise<AppUser> => {
  const res = await apiClient.post('/users', data);
  return res.data;
};

export const deactivateUser = async (id: number): Promise<void> => {
  await apiClient.patch(`/users/${id}/deactivate`);
};

export const activateUser = async (id: number): Promise<void> => {
  await apiClient.patch(`/users/${id}/activate`);
};