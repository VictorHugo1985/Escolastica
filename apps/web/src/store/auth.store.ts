'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, setAccessToken } from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  mustChangePassword: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  setSession: (user: AuthUser, token: string) => void;
  clearMustChangePassword: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      mustChangePassword: false,

      setSession(user, token) {
        set({ user, accessToken: token });
        setAccessToken(token);
      },

      async login(email, password, rememberMe = false) {
        const { data } = await api.post('/auth/login', { email, password, rememberMe });
        set({ user: data.user, accessToken: data.accessToken, mustChangePassword: !!data.mustChangePassword });
        setAccessToken(data.accessToken);
      },

      async logout() {
        try {
          await api.post('/auth/logout');
        } catch {
          // ignore
        }
        set({ user: null, accessToken: null, mustChangePassword: false });
        setAccessToken(null);
      },

      clearMustChangePassword() {
        set({ mustChangePassword: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        mustChangePassword: state.mustChangePassword,
      }),
    },
  ),
);
