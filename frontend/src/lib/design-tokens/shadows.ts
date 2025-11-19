/**
 * Sistema de sombras do PM Hub
 * Sombras sutis e modernas para criar profundidade
 */

export const shadows = {
  // Elevation levels
  none: 'none',

  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',

  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',

  DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',

  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',

  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',

  xl: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  '2xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',

  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',

  // Component-specific shadows
  card: {
    rest: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    hover: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  },

  button: {
    rest: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    hover: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    active: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  },

  dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',

  modal: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  toast: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',

  // Colored shadows for special elements
  colored: {
    primary: '0 4px 14px 0 rgba(16, 185, 129, 0.35)',
    accent: '0 4px 14px 0 rgba(99, 102, 241, 0.35)',
    error: '0 4px 14px 0 rgba(239, 68, 68, 0.35)',
    warning: '0 4px 14px 0 rgba(245, 158, 11, 0.35)',
  },

  // Focus shadows
  focus: {
    primary: '0 0 0 3px rgba(16, 185, 129, 0.5)',
    accent: '0 0 0 3px rgba(99, 102, 241, 0.5)',
    error: '0 0 0 3px rgba(239, 68, 68, 0.5)',
  },
} as const

export type Shadows = typeof shadows
