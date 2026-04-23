import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  themeId: string;
  timezone: string;
  locale: string;
}

interface AuthState {
  token: string | null;
  expiresAt: string | null;
  user: User | null;
  setSession: (s: { token: string; expiresAt: string; user: User }) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      expiresAt: null,
      user: null,
      setSession: ({ token, expiresAt, user }) => set({ token, expiresAt, user }),
      clear: () => set({ token: null, expiresAt: null, user: null }),
    }),
    { name: 'kairo.auth' },
  ),
);
