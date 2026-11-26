import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CargadorDiferido } from './Cargador'

afterEach(() => vi.useRealTimers())

describe('CargadorDiferido', () => {
  it('no muestra nada si la carga es rápida y aparece solo cuando tarda', () => {
    vi.useFakeTimers()
    render(<CargadorDiferido label="Cargando mesas..." retardoMs={250} />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.getByRole('status')).toHaveTextContent('Cargando mesas...')
  })

  it('si se desmonta antes del retardo no deja temporizadores pendientes', () => {
    vi.useFakeTimers()
    const { unmount } = render(<CargadorDiferido label="Cargando" />)

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
