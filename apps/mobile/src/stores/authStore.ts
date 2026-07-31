import { create, StoreApi, UseBoundStore } from 'zustand';
import apiClient from '@/services/apiClient';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  goal?: string;
  weight?: number;
  height?: number;
  activityLevel?: string;
}

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      set({ user: response.data.user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/auth/register', { name, email, password });
      set({ user: response.data.user, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore logout errors
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get('/auth/me');
      if (response.data?.user) {
        set({ user: response.data.user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
