/**
 * Sistema de tipografia do CPOPM Hub
 * Escala tipográfica consistente e hierárquica
 */

export const typography = {
  // Font families
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
    mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'Consolas', 'Liberation Mono', 'monospace'],
  },

  // Font sizes with line heights
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
    '7xl': ['4.5rem', { lineHeight: '1' }],
    '8xl': ['6rem', { lineHeight: '1' }],
    '9xl': ['8rem', { lineHeight: '1' }],
  },

  // Font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },

  // Line heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
    '3': '.75rem',
    '4': '1rem',
    '5': '1.25rem',
    '6': '1.5rem',
    '7': '1.75rem',
    '8': '2rem',
    '9': '2.25rem',
    '10': '2.5rem',
  },

  // Text styles para componentes específicos
  textStyles: {
    // Headings
    h1: {
      fontSize: '3rem',
      lineHeight: '1',
      fontWeight: '700',
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '2.25rem',
      lineHeight: '2.5rem',
      fontWeight: '600',
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.875rem',
      lineHeight: '2.25rem',
      fontWeight: '600',
      letterSpacing: '-0.025em',
    },
    h4: {
      fontSize: '1.5rem',
      lineHeight: '2rem',
      fontWeight: '600',
    },
    h5: {
      fontSize: '1.25rem',
      lineHeight: '1.75rem',
      fontWeight: '600',
    },
    h6: {
      fontSize: '1.125rem',
      lineHeight: '1.75rem',
      fontWeight: '600',
    },

    // Body text
    bodyLarge: {
      fontSize: '1.125rem',
      lineHeight: '1.75rem',
      fontWeight: '400',
    },
    body: {
      fontSize: '1rem',
      lineHeight: '1.5rem',
      fontWeight: '400',
    },
    bodySmall: {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontWeight: '400',
    },

    // UI text
    label: {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontWeight: '500',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: '1rem',
      fontWeight: '400',
    },
    overline: {
      fontSize: '0.75rem',
      lineHeight: '1rem',
      fontWeight: '600',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
    },

    // Special
    code: {
      fontFamily: 'mono',
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontWeight: '400',
    },
    quote: {
      fontSize: '1.125rem',
      lineHeight: '1.75rem',
      fontWeight: '400',
      fontStyle: 'italic',
    },
  },
} as const

export type Typography = typeof typography
