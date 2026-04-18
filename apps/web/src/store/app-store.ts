'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthTokens, ModelSelection, OnboardingStepId, SettingsData, User } from '@/types';
import api from '@/lib/api';

interface AppState {
  // Auth
  user: User | null;
  tokens: AuthTokens | null;
  isAuthLoading: boolean;

  // UI
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Onboarding
  onboardingComplete: boolean;
  onboardingStep: OnboardingStepId;

  // Settings (local cache)
  settings: SettingsData | null;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setAuthLoading: (loading: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setOnboardingStep: (step: OnboardingStepId) => void;
  setSettings: (settings: SettingsData | null) => void;
  updateModelSelection: (sel: ModelSelection) => void;
  signOut: () => void;
}

const defaultSettings: SettingsData = {
  displayName: null,
  bio: null,
  avatarUrl: null,
  modelSelection: { mode: 'auto', modelId: null, autoStrategy: 'balanced' },
  notificationsEnabled: true,
  compactMode: false,
  language: 'en',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dataRetentionDays: null,
  autoTitleSessions: true,
  emailDigestEnabled: false,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthLoading: true,
      sidebarOpen: true,
      sidebarCollapsed: false,
      onboardingComplete: false,
      onboardingStep: 'welcome',
      settings: null,

      setUser: (user) => {
        set({ user });
        if (user) {
          api.setToken(get().tokens?.accessToken ?? null);
        }
      },

      setTokens: (tokens) => {
        set({ tokens });
        api.setToken(tokens?.accessToken ?? null);
      },

      setAuthLoading: (isAuthLoading) => set({ isAuthLoading }),

      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

      setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),

      setOnboardingStep: (onboardingStep) => set({ onboardingStep }),

      setSettings: (settings) => set({ settings }),

      updateModelSelection: (sel) => {
        const settings = get().settings ?? defaultSettings;
        set({ settings: { ...settings, modelSelection: sel } });
      },

      signOut: () => {
        api.setToken(null);
        set({
          user: null,
          tokens: null,
          onboardingComplete: false,
          settings: null,
        });
      },
    }),
    {
      name: 'claw-app-store',
      partialize: (state) => ({
        tokens: state.tokens,
        sidebarCollapsed: state.sidebarCollapsed,
        onboardingComplete: state.onboardingComplete,
        settings: state.settings,
      }),
    }
  )
);
