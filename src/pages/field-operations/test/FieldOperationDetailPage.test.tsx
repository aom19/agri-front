import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { fieldOperationsApi, type FieldOperation } from '../../../api/fieldOperation.api'
import { permissionsApi, type Permission } from '../../../api/permissions.api'
import { renderWithProviders, setAuth } from '../../../test/utils'
import FieldOperationDetailPage from '../FieldOperationDetailPage'

vi.mock('../../../api/fieldOperation.api')
vi.mock('../../../api/permissions.api')

const planned = {
  id: 7,
  status: 'planned',
  field_id: 'f1',
  field_name: 'Lot Nord',
  operation_type_name: 'Arat',
  notes: '',
  completion_notes: '',
} as FieldOperation

function permissions(...names: string[]): Permission[] {
  return names.map((name, index) => ({ id: index + 1, name, description: '' }))
}

function renderPage() {
  return renderWithProviders(
    <Routes>
      <Route path="/field-operations/:id" element={<FieldOperationDetailPage />} />
    </Routes>,
    { route: '/field-operations/7' }
  )
}

// T10: o singură confirmare, nesalvată, înainte de start; mașina și echipamentul le verifică API-ul.
describe('FieldOperationDetailPage – pornirea lucrării', { timeout: 20000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
    vi.mocked(permissionsApi.getMyPermissions).mockResolvedValue(
      permissions('field_operations:read', 'field_operations:start')
    )
    vi.mocked(fieldOperationsApi.start).mockResolvedValue({ ...planned, status: 'in_progress' })
  })

  it('pornește lucrarea după o singură confirmare', async () => {
    vi.mocked(fieldOperationsApi.getById).mockResolvedValue(planned)
    renderPage()

    const confirm = await screen.findByRole('checkbox', {
      name: 'Am verificat utilajul și terenul',
    })
    expect(screen.getAllByRole('checkbox')).toHaveLength(1)
    const start = screen.getByRole('button', { name: 'Start lucrare' })
    expect(start).toBeDisabled()

    await userEvent.click(confirm)
    expect(start).toBeEnabled()
    await userEvent.click(start)
    await waitFor(() => expect(fieldOperationsApi.start).toHaveBeenCalledWith(7))
  })

  it('nu se poate porni cu mașina în mentenanță', async () => {
    vi.mocked(fieldOperationsApi.getById).mockResolvedValue({
      ...planned,
      machine_id: 2,
      machine_name: 'Tractor',
      machine_status: 'maintenance',
    })
    renderPage()

    expect(await screen.findByText('Lucrarea nu poate fi pornită.')).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: 'Am verificat utilajul și terenul' })
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Resurse indisponibile' })).toBeDisabled()
  })

  it('fără permisiunea de start nu afișează confirmarea', async () => {
    vi.mocked(permissionsApi.getMyPermissions).mockResolvedValue(
      permissions('field_operations:read')
    )
    vi.mocked(fieldOperationsApi.getById).mockResolvedValue(planned)
    renderPage()

    expect((await screen.findAllByText('Lot Nord')).length).toBeGreaterThan(0)
    await waitFor(() => expect(permissionsApi.getMyPermissions).toHaveBeenCalled())
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Start lucrare' })).not.toBeInTheDocument()
  })
})
