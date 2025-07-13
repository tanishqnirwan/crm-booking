import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: string;
  phone?: string;
  is_verified?: boolean;
  created_at?: string;
}

interface AuthState {
  user: AuthUser | null;
  access_token: string | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
  setUser: (user: AuthUser | null) => void;
  updateUser: (user: AuthUser) => void;
  setAccessToken: (token: string) => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      access_token: null,
      login: (user, token) => {
        // Also save to localStorage for API access
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', token);
        }
        set({ user, access_token: token });
        // Force a re-render by triggering a state update
        setTimeout(() => {
          set({ user, access_token: token });
        }, 0);
      },
      logout: () => {
        // Also remove from localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
        }
        set({ user: null, access_token: null });
      },
      setUser: (user) => set({ user }),
      updateUser: (user) => set({ user }),
      setAccessToken: (token) => {
        // Also save to localStorage for API access
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', token);
        }
        set({ access_token: token });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, access_token: state.access_token }),
    }
  )
); 