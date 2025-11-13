/**
 * Sistema de cores do CPOPM Hub
 * Baseado em Radix UI Colors para consistência e acessibilidade
 */

export const colors = {
  // Primary - Verde Esmeralda (principal cor da marca)
  primary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22',
  },

  // Secondary - Azul Slate (cor neutra principal)
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Accent - Azul Indigo (para destaques e CTAs secundários)
  accent: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
    950: '#1e1b4b',
  },

  // Semantic colors
  success: {
    light: '#4ade80',
    DEFAULT: '#22c55e',
    dark: '#16a34a',
  },

  warning: {
    light: '#fbbf24',
    DEFAULT: '#f59e0b',
    dark: '#d97706',
  },

  error: {
    light: '#f87171',
    DEFAULT: '#ef4444',
    dark: '#dc2626',
  },

  info: {
    light: '#60a5fa',
    DEFAULT: '#3b82f6',
    dark: '#2563eb',
  },

  // Background colors
  background: {
    DEFAULT: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    inverse: '#0f172a',
  },

  // Border colors
  border: {
    DEFAULT: '#e2e8f0',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
  },

  // Text colors
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    tertiary: '#64748b',
    muted: '#94a3b8',
    inverse: '#f8fafc',
  },

  // Special colors for states
  hover: {
    primary: 'rgba(16, 185, 129, 0.1)',
    secondary: 'rgba(71, 85, 105, 0.05)',
    accent: 'rgba(99, 102, 241, 0.1)',
  },

  focus: {
    ring: '#6366f1',
    border: '#4f46e5',
  },

  // Chart colors
  chart: {
    1: '#10b981',
    2: '#6366f1',
    3: '#f59e0b',
    4: '#ec4899',
    5: '#8b5cf6',
    6: '#14b8a6',
    7: '#f97316',
    8: '#84cc16',
  },
} as const

export type Colors = typeof colors
