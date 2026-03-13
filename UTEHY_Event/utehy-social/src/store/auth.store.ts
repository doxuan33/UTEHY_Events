import { create } from 'zustand';

export type UserRole = 'STUDENT' | 'PAGE_ADMIN' | 'SYSTEM_ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  student_id?: string;
  avatar_url?: string;
  training_points?: number;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAuth: (token: string, refreshToken: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (userData: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  user: null,

  setAuth: (token, refreshToken, user) =>
    set({ token, refreshToken, user }),

  logout: () =>
    set({ token: null, refreshToken: null, user: null }),

  updateUser: (userData) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null,
    })),
}));