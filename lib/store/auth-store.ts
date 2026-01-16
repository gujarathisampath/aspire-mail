import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface User {
  email: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user) => {
        set({ user, isAuthenticated: true });
      },
      clearAuth: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "aspire-mail-session",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
