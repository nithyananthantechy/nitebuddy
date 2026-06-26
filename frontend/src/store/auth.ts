import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  userName: string | null;
  onboardingComplete: boolean;
  isAuthenticated: boolean;
  isHydrated: boolean;

  setAuth: (data: {
    accessToken: string;
    refreshToken: string;
    userId: string;
    userName: string;
    onboardingComplete: boolean;
  }) => void;
  setTokens: (access: string, refresh: string) => void;
  setOnboardingComplete: () => void;
  logout: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      userId: null,
      userName: null,
      onboardingComplete: false,
      isAuthenticated: false,
      isHydrated: false,

      setAuth: (data) =>
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          userId: data.userId,
          userName: data.userName,
          onboardingComplete: data.onboardingComplete,
          isAuthenticated: true,
        }),

      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh }),

      setOnboardingComplete: () =>
        set({ onboardingComplete: true }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          userId: null,
          userName: null,
          onboardingComplete: false,
          isAuthenticated: false,
        }),

      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: "nitebuddy-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        userId: state.userId,
        userName: state.userName,
        onboardingComplete: state.onboardingComplete,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
