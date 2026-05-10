import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";

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

const safeStorage: StateStorage = {
  getItem: (name: string) => {
    if (typeof window === "undefined") return null;

    const value = window.localStorage.getItem(name);
    if (!value) return null;

    try {
      const parsed = JSON.parse(value) as {
        state?: unknown;
        version?: unknown;
      };

      if (
        typeof parsed !== "object" ||
        parsed === null ||
        !("state" in parsed) ||
        !("version" in parsed)
      ) {
        window.localStorage.removeItem(name);
        return null;
      }

      return value;
    } catch {
      window.localStorage.removeItem(name);
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(name, value);
  },
  removeItem: (name: string) => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(name);
  },
};

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
      storage: createJSONStorage(() => safeStorage),
    },
  ),
);
