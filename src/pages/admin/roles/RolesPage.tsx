import { useMemo, useState } from 'react'
import { SearchOutlined } from '@mui/icons-material'
import { Box, CircularProgress, InputAdornment, TextField } from '@mui/material'
import { useRoles } from '../../../hooks/useRoles'
import { type Role } from '../../../api/roles.api'
import { RolePermissionsDialog, RolesPageHeader, RolesTable } from './components'

// Rolurile sunt fixe (admin, manager, operator, viewer) și definite în API, deci pagina doar
// le afișează, împreună cu permisiunile fiecăruia.
export default function RolesPage() {
  const [search, setSearch] = useState('')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)

  const { data: roles, isPending } = useRoles()

  const filteredRoles = useMemo(() => {
    const value = search.trim().toLowerCase()
    return [...(roles ?? [])]
      .filter((role) => {
        if (!value) return true
        return (
          role.code.toLowerCase().includes(value) ||
          role.name.toLowerCase().includes(value) ||
          role.description?.toLowerCase().includes(value)
        )
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ro'))
  }, [roles, search])

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <RolesPageHeader />

      <Box sx={{ mb: 2 }}>
        <TextField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          label="Caută rol"
          placeholder="după cod, nume sau descriere"
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlined sx={{ fontSize: 18, color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      {isPending ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <RolesTable roles={filteredRoles} isLoading={isPending} onView={setSelectedRole} />
      )}

      <RolePermissionsDialog role={selectedRole} onClose={() => setSelectedRole(null)} />
    </Box>
  )
}
