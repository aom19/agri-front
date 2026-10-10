import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { reportsExtraApi } from '../../../api/reports.api'
import { useNotificationStore } from '../../../store/notification.store'
import { renderWithProviders, setAuth } from '../../../test/utils'
import ReportsPage from '../ReportsPage'

vi.mock('../../../api/reports.api')
// tab-urile și filtrele au interogările lor; aici verificăm doar antetul paginii
vi.mock('../tabs/SummaryTab', () => ({ default: () => null }))
vi.mock('../components/ReportFilters', () => ({ default: () => null }))

// T17: nu mai există abonamente; sumarul se trimite pe e-mail doar la cerere.
describe('ReportsPage – trimitere pe e-mail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setAuth()
  })

  it('trimite sumarul perioadei din pagină', async () => {
    vi.mocked(reportsExtraApi.emailSummary).mockResolvedValue({
      message: 'Raportul a fost trimis pe ana@x.ro',
    })
    renderWithProviders(<ReportsPage />, {
      route: '/reports?from=2026-03-01&to=2026-03-14&field_id=F-1',
    })

    await userEvent.click(screen.getByRole('button', { name: 'Trimite pe e-mail' }))

    expect(reportsExtraApi.emailSummary).toHaveBeenCalledWith({
      from: '2026-03-01',
      to: '2026-03-14',
    })
    await waitFor(() =>
      expect(useNotificationStore.getState().message).toBe('Raportul a fost trimis pe ana@x.ro')
    )
    expect(screen.queryByText('Raport pe e-mail')).not.toBeInTheDocument()
  })
})
