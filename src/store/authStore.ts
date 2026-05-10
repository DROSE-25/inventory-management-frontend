import { create } from 'zustand';
import type { User, Role } from '@/types/auth';
 
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, username: string, role: Role) => void;
  logout: () => void;
}
 
// Ініціалізація з localStorage (для збереження сесії)
const getInitialState = () => {
  const token = localStorage.getItem('accessToken');
  const userJson = localStorage.getItem('user');
  if (token && userJson) {
    try {
      return { token, user: JSON.parse(userJson) as User };
    } catch {
      return { token: null, user: null };
    }
  }
  return { token: null, user: null };
};
 
const initial = getInitialState();
 
export const useAuthStore = create<AuthState>((set) => ({
  user: initial.user,
  token: initial.token,
  isAuthenticated: !!initial.token,
 
  login: (token, username, role) => {
    const user: User = { username, role };
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
 
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  },
}));
