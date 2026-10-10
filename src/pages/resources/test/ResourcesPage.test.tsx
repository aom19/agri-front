import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { permissionsApi, type Permission } from '../../../api/permissions.api'
import { resourceApi, type Resource, type ResourceType } from '../../../api/resource.api'
import { stockMovementsApi, type StockMovement } from '../../../api/stockMovement.api'
import { renderWithProviders, setAuth } from '../../../test/utils'
import ResourcesPage from '../ResourcesPage'

vi.mock('../../../api/permissions.api')
vi.mock('../../../api/resource.api')
vi.mock('../../../api/stockMovement.api')

const fuel = { id: 1, name: 'Combustibil', category: 'fuel', default_unit: 'l' } as ResourceType

const diesel = {
  id: 4,
  name: 'Motorină',
  resource_type_id: 1,
  price_per_unit: 7,
  quantity: 5,
  minimum_quantity: 10,
  notes: null,
} as Resource

const harvest = {
  id: 5,
  name: 'Recoltă grâu',
  resource_type_id: 1,
  price_per_unit: 0,
  quantity: 0,
  minimum_quantity: 0,
  notes: null,
} as Resource

function permissions(...names: string[]): Permission[] {
  return names.map((name, index) => ({ id: index + 1, name, description: '' }))
}

// T12: stocul face parte din resursă, deci resursele și stocurile sunt pe aceeași pagină.
describe('ResourcesPage – resurse cu stoc', { timeout: 20000 }, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
    vi.mocked(permissionsApi.getMyPermissions).mockResolvedValue(
      permissions('resources:read', 'resources:write', 'resources:delete')
    )
    vi.mocked(resourceApi.getAllResources).mockResolvedValue([diesel, harvest])
    vi.mocked(resourceApi.getAllResourceTypes).mockResolvedValue([fuel])
    vi.mocked(resourceApi.createResource).mockResolvedValue(diesel)
    vi.mocked(resourceApi.updateResource).mockResolvedValue(diesel)
    vi.mocked(stockMovementsApi.list).mockResolvedValue([])
    vi.mocked(stockMovementsApi.create).mockResolvedValue({ id: 1 } as StockMovement)
  })

  it('arată stocul fiecărei resurse; fără prag minim, stocul nu e redus', async () => {
    renderWithProviders(<ResourcesPage />)

    const dieselRow = (await screen.findByText('Motorină')).closest('tr')!
    expect(within(dieselRow).getByText('5 l')).toBeInTheDocument()
    expect(within(dieselRow).getByText('Stoc redus')).toBeInTheDocument()
    const harvestRow = screen.getByText('Recoltă grâu').closest('tr')!
    expect(within(harvestRow).getByText('În limite')).toBeInTheDocument()
  })

  it('creează resursa cu stocul inițial într-un singur pas', async () => {
    renderWithProviders(<ResourcesPage />)

    await userEvent.click(await screen.findByRole('button', { name: 'Resursă nouă' }))
    const dialog = screen.getByRole('dialog')
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Nume' }), 'Benzină')
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Tip resursă' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Combustibil (Combustibil)' }))
    await userEvent.type(within(dialog).getByRole('textbox', { name: /Preț per unitate/ }), '8')
    const quantity = within(dialog).getByRole('textbox', { name: /Cantitate inițială/ })
    await userEvent.clear(quantity)
    await userEvent.type(quantity, '120')
    const minimum = within(dialog).getByRole('textbox', { name: /Cantitate minimă/ })
    await userEvent.clear(minimum)
    await userEvent.type(minimum, '30')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Creează' }))

    await waitFor(() =>
      expect(resourceApi.createResource).toHaveBeenCalledWith({
        name: 'Benzină',
        resource_type_id: 1,
        price_per_unit: 8,
        quantity: 120,
        minimum_quantity: 30,
        notes: null,
      })
    )
  })

  it('la editare cantitatea nu se modifică și nu se trimite', async () => {
    renderWithProviders(<ResourcesPage />)

    const dieselRow = (await screen.findByText('Motorină')).closest('tr')!
    await userEvent.click(within(dieselRow).getByRole('button', { name: 'Editează resursa' }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('textbox', { name: 'Cantitate' })).toBeDisabled()
    const minimum = within(dialog).getByRole('textbox', { name: /Cantitate minimă/ })
    await userEvent.clear(minimum)
    await userEvent.type(minimum, '3')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvează' }))

    await waitFor(() =>
      expect(resourceApi.updateResource).toHaveBeenCalledWith('4', {
        name: 'Motorină',
        resource_type_id: 1,
        price_per_unit: 7,
        minimum_quantity: 3,
        notes: null,
      })
    )
  })

  it('mișcările de stoc se înregistrează pe resursă', async () => {
    renderWithProviders(<ResourcesPage />)

    const dieselRow = (await screen.findByText('Motorină')).closest('tr')!
    await userEvent.click(within(dieselRow).getByRole('button', { name: 'Mișcări de stoc' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/Stoc curent: 5 l/)).toBeInTheDocument()
    await waitFor(() => expect(stockMovementsApi.list).toHaveBeenCalledWith({ resource_id: 4 }))

    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Cantitate (l)' }), '50')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvează' }))
    await waitFor(() =>
      expect(stockMovementsApi.create).toHaveBeenCalledWith({
        resource_id: 4,
        movement_type: 'in',
        quantity: 50,
        unit_cost: null,
        notes: '',
      })
    )
  })
})
