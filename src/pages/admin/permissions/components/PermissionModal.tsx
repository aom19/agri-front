import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@mui/material'

type PermissionModalProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

export default function PermissionModal({
  open,
  title,
  onClose,
  children,
  maxWidth = 'sm',
}: PermissionModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={maxWidth}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  )
}
