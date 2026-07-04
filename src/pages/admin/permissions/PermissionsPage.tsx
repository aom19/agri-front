import { useMemo, useState } from 'react'
import { Box } from '@mui/material'
import { useAllPermissions } from '../../../hooks/usePermissions'
import { RequirePermission } from '../../../components/RequirePermission'
import {
  PermissionModal,
  PermissionTable,
  PermissionsPageHeader,
  PermissionFiltersModal,
  SinglePermissionInfo,
  type Permission,
} from './components'

export default function PermissionsPage() {
  const [filterNameDraft, setFilterNameDraft] = useState('')
  const [filterName, setFilterName] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null)
  const [sortBy, setSortBy] = useState<'name' | 'id'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const { data: permissions, isLoading } = useAllPermissions()

  const filteredSortedPermissions = useMemo(() => {
    return [...(permissions ?? [])]
      .filter(
        (perm) =>
          perm.name.toLowerCase().includes(filterName.trim().toLowerCase()) ||
          perm.description?.toLowerCase().includes(filterName.trim().toLowerCase())
      )
      .sort((a, b) => {
        const direction = sortOrder === 'asc' ? 1 : -1

        if (sortBy === 'name') {
          return a.name.localeCompare(b.name, 'ro') * direction
        }

        return (a.id - b.id) * direction
      })
  }, [permissions, filterName, sortBy, sortOrder])

  const handleSortClick = (column: 'name' | 'id') => {
    if (sortBy !== column) {
      setSortBy(column)
      setSortOrder('asc')
      return
    }
    setSortOrder((currentOrder) => (currentOrder === 'asc' ? 'desc' : 'asc'))
  }

  const openFiltersDialog = () => {
    setFilterNameDraft(filterName)
    setFiltersOpen(true)
  }

  const closeFiltersDialog = () => {
    setFiltersOpen(false)
  }

  const applyFilters = () => {
    setFilterName(filterNameDraft)
    setFiltersOpen(false)
  }

  const clearFilters = () => {
    setFilterNameDraft('')
    setFilterName('')
  }

  const openDetails = (permission: Permission) => {
    setSelectedPermission(permission)
    setDetailsOpen(true)
  }

  const closeDetails = () => {
    setDetailsOpen(false)
    setSelectedPermission(null)
  }

  const activeFilterCount = Number(Boolean(filterName.trim()))

  return (
    <RequirePermission permission="permissions:read">
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: 2 }}>
          <PermissionsPageHeader
            title="Permisiuni"
            description="Vizualizare completă a tuturor permisiunilor disponibile în sistem."
            chips={[
              { label: `${filteredSortedPermissions.length} rezultate` },
              ...(activeFilterCount > 0
                ? [{ label: `${activeFilterCount} filtre active`, color: 'primary' as const }]
                : []),
            ]}
          />
        </Box>

        <PermissionTable
          permissions={filteredSortedPermissions}
          isLoading={isLoading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onOpenFilters={openFiltersDialog}
          onSortClick={handleSortClick}
          onOpenDetails={openDetails}
        />
      </Box>

      <PermissionFiltersModal
        open={filtersOpen}
        title="Filtrare permisiuni"
        onClose={closeFiltersDialog}
        value={filterNameDraft}
        onChange={setFilterNameDraft}
        onReset={clearFilters}
        onApply={applyFilters}
      />

      <PermissionModal open={detailsOpen} title="Detalii permisiune" onClose={closeDetails}>
        {selectedPermission && <SinglePermissionInfo selectedPermission={selectedPermission} />}
      </PermissionModal>
    </RequirePermission>
  )
}
