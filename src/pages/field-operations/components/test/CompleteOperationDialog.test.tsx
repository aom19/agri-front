import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  fieldOperationsApi,
  type ConsumptionEstimate,
  type FieldOperation,
} from '../../../../api/fieldOperation.api'
import { renderWithProviders, setAuth } from '../../../../test/utils'
import CompleteOperationDialog from '../CompleteOperationDialog'

vi.mock('../../../../api/fieldOperation.api')

const operation = {
  id: 7,
  status: 'in_progress',
  operation_type_name: 'Fertilizare',
  field_name: 'Lot Nord',
  operation_template_id: 3,
  area_planned_ha: 10,
  machine_id: 2,
} as FieldOperation

// Estimarea vine de la server; testul verifică doar că dialogul o afișează și trimite corecțiile.
function estimateFor(area: number): ConsumptionEstimate {
  return {
    area_ha: area,
    items: [
      {
        resource_id: 1,
        resource_name: 'Uree',
        category: 'fertilizer',
        unit: 'kg',
        quantity_per_unit: 2,
        quantity: area * 2,
      },
      {
        resource_id: 5,
        resource_name: 'Motorină',
        category: 'fuel',
        unit: 'l',
        quantity_per_unit: 8,
        quantity: area * 8,
      },
    ],
    fuel_resources: [
      { resource_id: 5, resource_name: 'Motorină', unit: 'l', quantity: 900 },
      { resource_id: 6, resource_name: 'Benzină', unit: 'l', quantity: 50 },
    ],
  }
}

// Dialogul MUI cu tastare reală e lent în jsdom când rulează toată suita; 5 s nu ajung mereu.
describe('CompleteOperationDialog', { timeout: 20000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
    vi.mocked(fieldOperationsApi.getConsumptionEstimate).mockImplementation(async (_id, area) =>
      estimateFor(area ?? 10)
    )
    vi.mocked(fieldOperationsApi.complete).mockResolvedValue({ operation, movements: [] })
  })

  it('afișează estimarea serverului și lasă calculul în backend', async () => {
    renderWithProviders(<CompleteOperationDialog open operation={operation} onClose={vi.fn()} />)

    const urea = await screen.findByLabelText('Cantitate consumată Uree')
    expect(urea).toHaveValue('20')
    expect(screen.getAllByText('estimare')).toHaveLength(2)
    expect(fieldOperationsApi.getConsumptionEstimate).toHaveBeenCalledWith(7, 10)

    await userEvent.click(screen.getByRole('button', { name: 'Finalizează lucrarea' }))
    await waitFor(() => expect(fieldOperationsApi.complete).toHaveBeenCalled())
    expect(vi.mocked(fieldOperationsApi.complete).mock.calls[0][1]).toEqual({
      area_completed_ha: 10,
      fuel_used_l: null,
      fuel_resource_id: null,
      machine_hours: null,
      notes: '',
      resources: [],
      consume_from_template: true,
    })
  })

  it('cere o estimare nouă la schimbarea suprafeței și trimite corecțiile și motorina', async () => {
    renderWithProviders(<CompleteOperationDialog open operation={operation} onClose={vi.fn()} />)
    await screen.findByLabelText('Cantitate consumată Uree')

    const area = screen.getByLabelText('Suprafață realizată (ha)')
    await userEvent.clear(area)
    await userEvent.type(area, '4')
    await waitFor(() => expect(screen.getByLabelText('Cantitate consumată Uree')).toHaveValue('8'))
    expect(fieldOperationsApi.getConsumptionEstimate).toHaveBeenLastCalledWith(7, 4)

    const urea = screen.getByLabelText('Cantitate consumată Uree')
    await userEvent.clear(urea)
    await userEvent.type(urea, '9,5')
    expect(screen.getByText('estimare: 8')).toBeInTheDocument()

    // motorina raportată înlocuiește norma resursei de combustibil propuse din șablon
    await userEvent.type(screen.getByLabelText('Combustibil consumat (l)'), '100')
    expect(screen.getByLabelText('Cantitate consumată Motorină')).toHaveValue('100')
    expect(screen.getByText('din câmpul de combustibil')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Finalizează lucrarea' }))
    await waitFor(() => expect(fieldOperationsApi.complete).toHaveBeenCalled())
    expect(vi.mocked(fieldOperationsApi.complete).mock.calls[0][1]).toMatchObject({
      area_completed_ha: 4,
      fuel_used_l: 100,
      fuel_resource_id: 5,
      resources: [{ resource_id: 1, quantity: 9.5 }],
      consume_from_template: true,
    })
  })

  it('cere resursa de combustibil când nu poate fi propusă', async () => {
    vi.mocked(fieldOperationsApi.getConsumptionEstimate).mockResolvedValue({
      ...estimateFor(10),
      items: [],
    })
    renderWithProviders(<CompleteOperationDialog open operation={operation} onClose={vi.fn()} />)
    await screen.findByText(/Lucrarea nu are șablon cu resurse/)

    await userEvent.type(screen.getByLabelText('Combustibil consumat (l)'), '30')
    await userEvent.click(screen.getByRole('button', { name: 'Finalizează lucrarea' }))
    expect(
      await screen.findByText('Alege resursa de combustibil din care se scade consumul.')
    ).toBeInTheDocument()
    expect(fieldOperationsApi.complete).not.toHaveBeenCalled()

    await userEvent.click(screen.getByLabelText('Din stocul'))
    await userEvent.click(await screen.findByRole('option', { name: /Benzină/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Finalizează lucrarea' }))
    await waitFor(() => expect(fieldOperationsApi.complete).toHaveBeenCalled())
    expect(vi.mocked(fieldOperationsApi.complete).mock.calls[0][1]).toMatchObject({
      fuel_used_l: 30,
      fuel_resource_id: 6,
      resources: [],
    })
  })
})
