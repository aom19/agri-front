import PermissionFiltersForm from './PermissionFiltersForm'
import PermissionModal from './PermissionModal'
import PermissionModalActions from './PermissionModalActions'

type PermissionFiltersModalProps = {
  open: boolean
  title: string
  value: string
  onChange: (value: string) => void
  onReset: () => void
  onClose: () => void
  onApply: () => void
}

export default function PermissionFiltersModal({
  open,
  title,
  value,
  onChange,
  onReset,
  onClose,
  onApply,
}: PermissionFiltersModalProps) {
  return (
    <PermissionModal open={open} title={title} onClose={onClose}>
      <PermissionFiltersForm value={value} onChange={onChange} />
      <PermissionModalActions onReset={onReset} onClose={onClose} onApply={onApply} />
    </PermissionModal>
  )
}