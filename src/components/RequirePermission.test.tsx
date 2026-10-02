import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { RequirePermission } from './RequirePermission'
import { usePermissions } from '../hooks/usePermissions'
import { renderWithProviders, setAuth } from '../test/utils'

vi.mock('../hooks/usePermissions')

type PermissionsResult = ReturnType<typeof usePermissions>
const permissions = (
  data: { id: number; name: string; description: string }[] | undefined,
  isPending = false
) => vi.mocked(usePermissions).mockReturnValue({ data, isPending } as PermissionsResult)

function renderGuarded(permission = 'machines:read') {
  return renderWithProviders(
    <Routes>
      <Route
        path="/"
        element={<RequirePermission permission={permission}>Conținut protejat</RequirePermission>}
      />
      <Route path="/403" element={<div>Acces interzis</div>} />
    </Routes>
  )
}

describe('RequirePermission', () => {
  it('afișează loader-ul până se inițializează autentificarea', () => {
    setAuth('token', false)
    permissions(undefined, true)
    renderGuarded()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('afișează loader-ul cât timp se încarcă permisiunile', () => {
    setAuth('token')
    permissions(undefined, true)
    renderGuarded()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('redirecționează la /403 fără permisiune', () => {
    setAuth('token')
    permissions([{ id: 1, name: 'fields:read', description: '' }])
    renderGuarded()
    expect(screen.getByText('Acces interzis')).toBeInTheDocument()
  })

  it('afișează conținutul când permisiunea există', () => {
    setAuth('token')
    permissions([{ id: 1, name: 'machines:read', description: '' }])
    renderGuarded()
    expect(screen.getByText('Conținut protejat')).toBeInTheDocument()
  })

  it('tratează vizitatorii neautentificați ca fără permisiuni', () => {
    setAuth(null)
    permissions(undefined)
    renderGuarded()
    expect(screen.getByText('Acces interzis')).toBeInTheDocument()
  })
})
