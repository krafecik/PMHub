/**
 * Sistema de animações do CPOPM Hub
 * Transições e animações consistentes para microinterações
 */

export const animations = {
  // Duration
  duration: {
    instant: '50ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '700ms',
    slowest: '1000ms',
  },

  // Timing functions
  timingFunction: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Transition presets
  transition: {
    all: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    colors:
      'background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms cubic-bezier(0.4, 0, 0.2, 1), color 300ms cubic-bezier(0.4, 0, 0.2, 1), fill 300ms cubic-bezier(0.4, 0, 0.2, 1), stroke 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    opacity: 'opacity 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    shadow: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    transform: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Keyframe animations
  keyframes: {
    fadeIn: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    fadeOut: {
      '0%': { opacity: '1' },
      '100%': { opacity: '0' },
    },
    slideInFromTop: {
      '0%': { transform: 'translateY(-100%)' },
      '100%': { transform: 'translateY(0)' },
    },
    slideInFromBottom: {
      '0%': { transform: 'translateY(100%)' },
      '100%': { transform: 'translateY(0)' },
    },
    slideInFromLeft: {
      '0%': { transform: 'translateX(-100%)' },
      '100%': { transform: 'translateX(0)' },
    },
    slideInFromRight: {
      '0%': { transform: 'translateX(100%)' },
      '100%': { transform: 'translateX(0)' },
    },
    scaleIn: {
      '0%': { transform: 'scale(0.9)', opacity: '0' },
      '100%': { transform: 'scale(1)', opacity: '1' },
    },
    scaleOut: {
      '0%': { transform: 'scale(1)', opacity: '1' },
      '100%': { transform: 'scale(0.9)', opacity: '0' },
    },
    spin: {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' },
    },
    bounce: {
      '0%, 100%': {
        transform: 'translateY(-25%)',
        animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
      },
      '50%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
    },
    shimmer: {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
  },

  // Animation presets
  animation: {
    none: 'none',
    spin: 'spin 1s linear infinite',
    ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
    pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    bounce: 'bounce 1s infinite',
    fadeIn: 'fadeIn 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    fadeOut: 'fadeOut 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    scaleIn: 'scaleIn 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    scaleOut: 'scaleOut 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slideInFromTop: 'slideInFromTop 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slideInFromBottom: 'slideInFromBottom 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slideInFromLeft: 'slideInFromLeft 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    slideInFromRight: 'slideInFromRight 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    shimmer: 'shimmer 2s linear infinite',
  },
} as const

export type Animations = typeof animations
