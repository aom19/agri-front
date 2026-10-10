import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { rolesApi, type Role } from '../../../../api/roles.api'
import { renderWithProviders, setAuth } from '../../../../test/utils'
import RolesPage from '../RolesPage'

vi.mock('../../../../api/roles.api')

const operator = {
  id: 3,
  code: 'operator',
  name: 'Operator',
  description: 'Operator de teren',
  created_at: '2026-01-01T00:00:00Z',
} as Role

// T18: rolurile sunt fixe, deci pagina doar le afișează, cu permisiunile fiecăruia.
describe('RolesPage – roluri fixe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
    vi.mocked(rolesApi.getAll).mockResolvedValue([operator])
    vi.mocked(rolesApi.getRolePermissions).mockResolvedValue([
      { id: 1, name: 'field_operations:execute', description: 'Pornire și finalizare' },
    ])
  })

  it('nu se pot crea, edita sau șterge roluri', async () => {
    renderWithProviders(<RolesPage />)

    const row = (await screen.findByText('operator')).closest('tr')!
    expect(within(row).getAllByRole('button')).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /rol nou/i })).not.toBeInTheDocument()
  })

  it('arată permisiunile rolului', async () => {
    renderWithProviders(<RolesPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Vezi permisiunile rolului' }))

    expect(rolesApi.getRolePermissions).toHaveBeenCalledWith('3')
    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByText('field_operations:execute')).toBeInTheDocument()
    expect(within(dialog).getByText('Pornire și finalizare')).toBeInTheDocument()
  })
})
