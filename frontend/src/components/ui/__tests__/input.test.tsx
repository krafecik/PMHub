import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Input } from '../input'

describe('Input UI component', () => {
  it('renderiza input básico com atributos fornecidos', () => {
    render(<Input placeholder="Digite seu nome" />)
    const input = screen.getByPlaceholderText('Digite seu nome') as HTMLInputElement
    expect(input.type).toBe('text')
    expect(input.className).toContain('flex h-10 w-full')
  })

  it('aplica estilos de erro quando prop error é verdadeira', () => {
    render(<Input error placeholder="E-mail" />)
    const input = screen.getByPlaceholderText('E-mail')
    expect(input.className).toContain('border-error-DEFAULT')
  })
})
