import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  themeId: string;
  timezone: string;
}

interface Session {
  token: string;
  expiresAt: string;
  user: AuthUser;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  setSession: (s: Session) => Promise<void>;
  clear: () => Promise<void>;
  hydrate: () => Promise<void>;
}

const STORAGE_KEY = 'kairo_session_v1';

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  user: null,
  hydrated: false,

  setSession: async (s) => {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(s));
    set({ token: s.token, user: s.user });
  },

  clear: async () => {
    await SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => {});
    set({ token: null, user: null });
  },

  hydrate: async () => {
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as Session;
        if (new Date(s.expiresAt) > new Date()) {
          set({ token: s.token, user: s.user });
        } else {
          await SecureStore.deleteItemAsync(STORAGE_KEY).catch(() => {});
        }
      }
    } catch {
      // ignore parse / storage errors
    }
    set({ hydrated: true });
  },
}));
