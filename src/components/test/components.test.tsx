import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import AppLogo from '../AppLogo'
import ModalConfirmAction from '../ModalConfirmAction'
import NotificationBar from '../NotificationBar'
import PasswordField from '../PasswordField'
import PasswordRequirements, { passwordRules } from '../PasswordRequirements'
import { GuestRoute, ProtectedRoute } from '../RouteGuards'
import { PasswordField as ExportedPasswordField } from '../index'
import { useNotificationStore } from '../../store/notification.store'
import { renderWithProviders, setAuth } from '../../test/utils'

describe('AppLogo', () => {
  it('afișează numele aplicației, iar în modul compact doar sigla', () => {
    const { rerender } = render(<AppLogo />)
    expect(screen.getByText('AgriERP')).toBeInTheDocument()
    expect(screen.getByAltText('AgriERP')).toBeInTheDocument()
    rerender(<AppLogo compact color="white" />)
    expect(screen.queryByText('AgriERP')).not.toBeInTheDocument()
  })
})

describe('ModalConfirmAction', () => {
  it('afișează textele și apelează acțiunile', async () => {
    const onClose = vi.fn()
    const onConfirm = vi.fn()
    render(
      <ModalConfirmAction
        open
        title="Ștergi?"
        description="Acțiunea e definitivă."
        onClose={onClose}
        onConfirm={onConfirm}
      />
    )
    expect(screen.getByText('Ștergi?')).toBeInTheDocument()
    expect(screen.getByText('Acțiunea e definitivă.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Anulează' }))
    await userEvent.click(screen.getByRole('button', { name: 'Confirmă' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('dezactivează butoanele cât timp se procesează', () => {
    render(
      <ModalConfirmAction
        open
        loading
        title="T"
        description="D"
        confirmText="Da"
        cancelText="Nu"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Da' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Nu' })).toBeDisabled()
  })
})

describe('NotificationBar', () => {
  it('afișează mesajul din store și îl închide', async () => {
    render(<NotificationBar />)
    useNotificationStore.getState().show('Salvat cu succes', 'success')
    expect(await screen.findByText('Salvat cu succes')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button'))
    expect(useNotificationStore.getState().open).toBe(false)
  })
})

describe('PasswordField', () => {
  it('comută vizibilitatea parolei', async () => {
    render(<PasswordField label="Parola" />)
    const input = screen.getByLabelText('Parola') as HTMLInputElement
    expect(input.type).toBe('password')
    await userEvent.click(screen.getByRole('button', { name: 'Arată parola' }))
    expect(input.type).toBe('text')
    await userEvent.click(screen.getByRole('button', { name: 'Ascunde parola' }))
    expect(input.type).toBe('password')
    expect(ExportedPasswordField).toBe(PasswordField)
  })
})

describe('PasswordRequirements', () => {
  it('evaluează fiecare regulă', () => {
    const results = passwordRules.map((r) => [r.key, r.test('Parola1!')])
    expect(results).toEqual([
      ['min', true],
      ['lower', true],
      ['upper', true],
      ['digit', true],
      ['special', true],
    ])
    expect(passwordRules.find((r) => r.key === 'digit')!.test('Parola!')).toBe(false)
  })

  it('afișează toate regulile', () => {
    render(<PasswordRequirements value="abc" />)
    for (const rule of passwordRules) {
      expect(screen.getByText(rule.label)).toBeInTheDocument()
    }
  })
})

describe('RouteGuards', () => {
  const app = (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<div>Pagina de login</div>} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<div>Tablou de bord</div>} />
      </Route>
    </Routes>
  )

  it('trimite vizitatorii la login și utilizatorii logați la tabloul de bord', () => {
    setAuth(null)
    renderWithProviders(app, { route: '/' })
    expect(screen.getByText('Pagina de login')).toBeInTheDocument()
  })

  it('lasă utilizatorii logați pe rutele protejate și îi ține departe de login', () => {
    setAuth('token')
    renderWithProviders(app, { route: '/login' })
    expect(screen.getByText('Tablou de bord')).toBeInTheDocument()
  })
})
