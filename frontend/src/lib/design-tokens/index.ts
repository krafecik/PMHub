/**
 * Design Tokens centralizados do CPOPM Hub
 * Exporta todos os tokens para uso consistente
 */

export * from './colors'
export * from './typography'
export * from './spacing'
export * from './shadows'
export * from './animations'
export * from './borders'

// Importar todos os tokens
import { colors } from './colors'
import { typography } from './typography'
import { spacing } from './spacing'
import { shadows } from './shadows'
import { animations } from './animations'
import { borders } from './borders'

// Exportar objeto unificado
export const designTokens = {
  colors,
  typography,
  spacing,
  shadows,
  animations,
  borders,
} as const

export type DesignTokens = typeof designTokens

// Utilitário para gerar classes CSS custom properties
export function generateCSSVariables() {
  const cssVariables: Record<string, string> = {}

  // Colors
  Object.entries(colors).forEach(([colorName, colorValue]) => {
    if (typeof colorValue === 'object') {
      Object.entries(colorValue).forEach(([shade, value]) => {
        if (typeof value === 'string') {
          cssVariables[`--color-${colorName}-${shade}`] = value
        }
      })
    }
  })

  // Spacing
  Object.entries(spacing).forEach(([spaceName, spaceValue]) => {
    if (typeof spaceValue === 'string') {
      cssVariables[`--spacing-${spaceName}`] = spaceValue
    }
  })

  // Typography
  Object.entries(typography.fontSize).forEach(([sizeName, sizeValue]) => {
    if (Array.isArray(sizeValue)) {
      cssVariables[`--font-size-${sizeName}`] = sizeValue[0]
    }
  })

  return cssVariables
}
