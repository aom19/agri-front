import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { cropsApi, type FieldCrop } from '../../../api/crops.api'
import { permissionsApi, type Permission } from '../../../api/permissions.api'
import { resourceApi, type Resource, type ResourceType } from '../../../api/resource.api'
import { stockMovementsApi, type StockMovement } from '../../../api/stockMovement.api'
import { renderWithProviders, setAuth } from '../../../test/utils'
import ResourcesPage from '../ResourcesPage'

vi.mock('../../../api/permissions.api')
vi.mock('../../../api/resource.api')
vi.mock('../../../api/stockMovement.api')
vi.mock('../../../api/crops.api')

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
      permissions('resources:read', 'resources:write')
    )
    vi.mocked(resourceApi.getResourcesPage).mockResolvedValue({
      items: [diesel, harvest],
      total: 2,
      page: 1,
      page_size: 25,
    })
    vi.mocked(resourceApi.getAllResourceTypes).mockResolvedValue([fuel])
    vi.mocked(resourceApi.getResourceCategoryCounts).mockResolvedValue({
      total: 2,
      by_category: [{ category: 'fuel', count: 2 }],
    })
    vi.mocked(cropsApi.getFieldCrops).mockResolvedValue([])
    vi.mocked(resourceApi.createResource).mockResolvedValue(diesel)
    vi.mocked(resourceApi.updateResource).mockResolvedValue(diesel)
    vi.mocked(stockMovementsApi.listPage).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
    })
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
    await waitFor(() =>
      expect(stockMovementsApi.listPage).toHaveBeenCalledWith({
        resource_id: 4,
        page: 1,
        page_size: 10,
      })
    )

    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Cantitate (l)' }), '50')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Salvează' }))
    await waitFor(() =>
      expect(stockMovementsApi.create).toHaveBeenCalledWith({
        resource_id: 4,
        movement_type: 'in',
        quantity: 50,
        unit_cost: null,
        field_crop_id: null,
        notes: '',
      })
    )
  })

  it('dialogul de mișcări: stocul rezultat, ieșirea peste stoc și culturile închise', async () => {
    vi.mocked(cropsApi.getFieldCrops).mockResolvedValue([
      {
        id: 31,
        field_name: 'Tarla Mica',
        crop_name: 'Grâu',
        season_name: 'Sezon 2025/2026',
        status: 'closed',
        closed_at: '2026-07-10',
      } as FieldCrop,
    ])
    renderWithProviders(<ResourcesPage />)

    const dieselRow = (await screen.findByText('Motorină')).closest('tr')!
    await userEvent.click(within(dieselRow).getByRole('button', { name: 'Mișcări de stoc' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Sub pragul minim')).toBeInTheDocument()

    const quantity = within(dialog).getByRole('textbox', { name: 'Cantitate (l)' })
    await userEvent.type(quantity, '3')
    expect(within(dialog).getByText('Stoc după mișcare: 8 l')).toBeInTheDocument()

    // paiele balotate după închiderea culturii se pot lega de ea
    await userEvent.click(within(dialog).getByRole('combobox', { name: /Cultură pe teren/ }))
    expect(
      await screen.findByRole('option', { name: 'Grâu · Tarla Mica · Sezon 2025/2026' })
    ).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')

    await userEvent.click(within(dialog).getByRole('button', { name: 'Ieșire' }))
    await userEvent.clear(quantity)
    await userEvent.type(quantity, '7')
    expect(within(dialog).getAllByText(/Ieșirea depășește stocul curent/).length).toBeGreaterThan(0)
    expect(within(dialog).getByRole('button', { name: 'Salvează' })).toBeDisabled()
    expect(stockMovementsApi.create).not.toHaveBeenCalled()
  })

  it('paginarea și filtrele se trimit la API; un filtru nou revine la prima pagină', async () => {
    vi.mocked(resourceApi.getResourcesPage).mockResolvedValue({
      items: [diesel, harvest],
      total: 60,
      page: 1,
      page_size: 25,
    })
    renderWithProviders(<ResourcesPage />)

    expect(await screen.findByText('1–25 din 60')).toBeInTheDocument()
    expect(resourceApi.getResourcesPage).toHaveBeenLastCalledWith({
      category: '',
      q: '',
      page: 1,
      page_size: 25,
    })

    await userEvent.click(screen.getByRole('button', { name: 'Pagina următoare' }))
    await waitFor(() =>
      expect(resourceApi.getResourcesPage).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2, page_size: 25 })
      )
    )

    await userEvent.type(screen.getByRole('textbox', { name: 'Caută resursă' }), 'mot')
    await waitFor(() =>
      expect(resourceApi.getResourcesPage).toHaveBeenLastCalledWith(
        expect.objectContaining({ q: 'mot', page: 1 })
      )
    )
  })
})
