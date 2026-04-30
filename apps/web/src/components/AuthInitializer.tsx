'use client';

import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { setAccessToken } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function AuthInitializer() {
  const { user, setSession, logout } = useAuthStore();

  useEffect(() => {
    const stored = useAuthStore.getState();
    if (!stored.user) return;

    // Token lost after page refresh — restore via cookie
    if (!stored.accessToken) {
      axios
        .post(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
        .then(({ data }) => {
          setSession(stored.user!, data.accessToken);
        })
        .catch(() => {
          logout();
        });
    } else {
      setAccessToken(stored.accessToken);
    }
  }, []);

  return null;
}
