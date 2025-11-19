/**
 * Sistema de bordas do PM Hub
 * Border radius e larguras para componentes
 */

export const borders = {
  // Border radius
  radius: {
    none: '0px',
    sm: '0.125rem', // 2px
    DEFAULT: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.5rem', // 24px
    '3xl': '2rem', // 32px
    full: '9999px',

    // Component-specific radius
    button: {
      sm: '0.375rem',
      md: '0.5rem',
      lg: '0.625rem',
    },

    card: {
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
    },

    modal: '1rem',

    input: '0.5rem',

    badge: '9999px',

    toast: '0.75rem',
  },

  // Border widths
  width: {
    none: '0px',
    DEFAULT: '1px',
    2: '2px',
    4: '4px',
    8: '8px',
  },

  // Border styles
  style: {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted',
    double: 'double',
    none: 'none',
  },

  // Focus ring
  ring: {
    width: '3px',
    offset: '2px',
  },
} as const

export type Borders = typeof borders
