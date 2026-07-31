import type { FC } from 'react'
import type { SvgIconProps } from '@mui/material'
import {
  DashboardOutlined,
  AgricultureOutlined,
  Inventory2Outlined,
  PrecisionManufacturingOutlined,
  LandscapeOutlined,
  PeopleOutlined,
  AssignmentOutlined,
  AdminPanelSettingsOutlined,
  PeopleAltOutlined,
  SecurityOutlined,
  VpnKeyOutlined,
  CategoryOutlined,
} from '@mui/icons-material'
type IconComponent = FC<SvgIconProps>
export type NavLeaf = {
  type: 'leaf'
  label: string
  path: string
  icon: IconComponent
  permission?: string
}

export type NavGroup = {
  type: 'group'
  label: string
  icon: IconComponent
  children: NavLeaf[]
}

export type NavItem = NavLeaf | NavGroup

export const navConfig: NavItem[] = [
  {
    type: 'leaf',
    label: 'Tablou de bord',
    path: '/',
    icon: DashboardOutlined,
    // no permission → visible to all authenticated users
  },
  {
    type: 'leaf',
    label: 'Mașini',
    path: '/machines',
    icon: AgricultureOutlined,
    permission: 'machines:read',
  },
  {
    type: 'leaf',
    label: 'Resurse',
    path: '/resources',
    icon: Inventory2Outlined,
    permission: 'resources:read',
  },
  {
    type: 'leaf',
    label: 'Echipament agricol',
    path: '/implements',
    icon: PrecisionManufacturingOutlined,
  },
  {
    type: 'leaf',
    label: 'Terenuri',
    path: '/fields',
    icon: LandscapeOutlined,
    permission: 'fields:read',
  },
  {
    type: 'leaf',
    label: 'Operatori',
    path: '/operators',
    icon: PeopleOutlined,
    permission: 'operators:read',
  },
  {
    type: 'leaf',
    label: 'Alocări',
    path: '/assignments',
    icon: AssignmentOutlined,
    permission: 'assignments:read',
  },
  {
    type: 'group',
    label: 'Administrare',
    icon: AdminPanelSettingsOutlined,
    children: [
      {
        type: 'leaf',
        label: 'Categorii de resurse',
        path: '/admin/resource-types',
        icon: CategoryOutlined,
        permission: 'resources:read',
      },
      {
        type: 'leaf',
        label: 'Utilizatori',
        path: '/admin/users',
        icon: PeopleAltOutlined,
        permission: 'users:read',
      },
      {
        type: 'leaf',
        label: 'Roluri',
        path: '/admin/roles',
        icon: SecurityOutlined,
        permission: 'roles:read',
      },
      {
        type: 'leaf',
        label: 'Permisiuni',
        path: '/admin/permissions',
        icon: VpnKeyOutlined,
        permission: 'permissions:read',
      },
    ],
  },
]

/** Returns the nav label for a given pathname (searches flat + nested). */
export function findNavLabel(pathname: string): string | undefined {
  for (const item of navConfig) {
    if (item.type === 'leaf' && item.path === pathname) return item.label
    if (item.type === 'group') {
      const child = item.children.find((c) => c.path === pathname)
      if (child) return child.label
    }
  }
  return undefined
}
