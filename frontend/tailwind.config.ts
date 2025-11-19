import type { Config } from 'tailwindcss'
import { designTokens } from './src/lib/design-tokens'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: designTokens.colors.primary,
        secondary: designTokens.colors.secondary,
        accent: designTokens.colors.accent,
        success: designTokens.colors.success,
        warning: designTokens.colors.warning,
        error: designTokens.colors.error,
        info: designTokens.colors.info,
        border: designTokens.colors.border,
        hover: designTokens.colors.hover,
        focus: designTokens.colors.focus,
        chart: designTokens.colors.chart,
        background: designTokens.colors.background,
        text: designTokens.colors.text,
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        ring: 'hsl(var(--ring))',
        input: 'hsl(var(--input))',
      },
      fontFamily: {
        sans: [...designTokens.typography.fontFamily.sans],
        mono: [...designTokens.typography.fontFamily.mono],
      },
      fontSize: {
        ...(designTokens.typography.fontSize as any),
      },
      fontWeight: {
        ...designTokens.typography.fontWeight,
      },
      letterSpacing: {
        ...designTokens.typography.letterSpacing,
      },
      lineHeight: {
        ...designTokens.typography.lineHeight,
      },
      spacing: {
        ...(Object.fromEntries(
          Object.entries(designTokens.spacing).filter(([_, value]) => typeof value === 'string'),
        ) as any),
      },
      boxShadow: {
        ...(Object.fromEntries(
          Object.entries(designTokens.shadows).filter(([_, value]) => typeof value === 'string'),
        ) as any),
      },
      borderRadius: {
        ...(Object.fromEntries(
          Object.entries(designTokens.borders.radius).filter(
            ([_, value]) => typeof value === 'string',
          ),
        ) as any),
      },
      borderWidth: {
        ...designTokens.borders.width,
      },
      transitionDuration: {
        ...designTokens.animations.duration,
      },
      transitionTimingFunction: {
        ...designTokens.animations.timingFunction,
      },
      keyframes: {
        ...designTokens.animations.keyframes,
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        ...designTokens.animations.animation,
        shimmer: 'shimmer 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
