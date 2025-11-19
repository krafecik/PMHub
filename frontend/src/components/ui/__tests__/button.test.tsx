import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button, buttonVariants } from '../button'

describe('Button UI component', () => {
  it('renderiza com variantes padrão', () => {
    render(<Button>Enviar</Button>)

    const button = screen.getByRole('button', { name: /enviar/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass(buttonVariants({ variant: 'default', size: 'default' }))
    expect(button).not.toBeDisabled()
  })

  it('suporta variantes e estado de loading', () => {
    render(
      <Button variant="destructive" size="lg" loading>
        Excluir
      </Button>,
    )

    const button = screen.getByRole('button', { name: /excluir/i })
    expect(button).toBeDisabled()
    expect(button).toHaveClass(buttonVariants({ variant: 'destructive', size: 'lg' }))
    expect(button.querySelector('svg')).toBeInTheDocument()
  })
})
