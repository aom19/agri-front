import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NotificationListItem from './NotificationListItem'
import type { UserNotification } from '../api/notifications.api'

function makeNotification(
  overrides: Partial<UserNotification['notification']> = {},
  readAt: string | null = null
): UserNotification {
  return {
    id: 1,
    notification_id: 1,
    user_id: 1,
    read_at: readAt,
    created_at: '2026-03-15T10:30:00Z',
    notification: {
      id: 1,
      type: 'resource_issue',
      title: 'Titlu',
      message: 'Mesaj',
      entity_type: 'machine',
      entity_id: '1',
      created_at: '2026-03-15T10:30:00Z',
      ...overrides,
    },
  }
}

describe('NotificationListItem', () => {
  it.each([
    ['operation_overdue', 'Oricare', '', 'Timp estimat depășit'],
    ['operation_completed', 'Oricare', '', 'Lucrare finalizată'],
    ['resource_issue', 'Echipament activat', '', 'Activare echipament'],
    ['resource_issue', 'Echipament dezactivat', '', 'Status echipament'],
    ['resource_issue', 'Echipament', 'este indisponibil', 'Status echipament'],
    ['resource_issue', 'Utilizator nou', '', 'Cont utilizator'],
    ['stock_low', 'Motorină', '', 'Actualizare stoc'],
    ['resource_issue', 'Stoc actualizat', '', 'Actualizare stoc'],
    ['resource_issue', 'Resursă nouă', '', 'Resursă operațională'],
    ['operation_started', 'Lucrare', '', 'Lucrare pornită'],
    ['other', 'Ceva', '', 'Notificare sistem'],
  ])('eticheta pentru tipul %s cu titlul „%s”', (type, title, message, label) => {
    render(<NotificationListItem notification={makeNotification({ type, title, message })} />)
    expect(screen.getByText(label)).toBeInTheDocument()
    expect(screen.getByText(title)).toBeInTheDocument()
  })

  it('afișează data formatată și butonul de citire doar pentru notificările necitite', async () => {
    const onMarkRead = vi.fn()
    const notification = makeNotification()
    const { rerender } = render(
      <NotificationListItem notification={notification} onMarkRead={onMarkRead} />
    )
    expect(screen.getByText(/15\.03\.2026/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Marchează ca citită' }))
    expect(onMarkRead).toHaveBeenCalledWith(notification)

    rerender(
      <NotificationListItem
        notification={makeNotification({}, '2026-03-15T11:00:00Z')}
        onMarkRead={onMarkRead}
        compact
      />
    )
    expect(screen.queryByRole('button', { name: 'Marchează ca citită' })).not.toBeInTheDocument()
  })

  it('dezactivează butonul când se procesează și ascunde data invalidă', () => {
    render(
      <NotificationListItem
        notification={makeNotification({ created_at: 'nu-e-data', message: '' })}
        onMarkRead={vi.fn()}
        markReadDisabled
      />
    )
    expect(screen.getByRole('button', { name: 'Marchează ca citită' })).toBeDisabled()
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument()
  })
})
