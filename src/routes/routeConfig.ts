import type { FC } from 'react'
import type { SvgIconProps } from '@mui/material'
import {
  DashboardOutlined,
  AssessmentOutlined,
  EventNoteOutlined,
  AssignmentOutlined,
  GrassOutlined,
  LandscapeOutlined,
  AgricultureOutlined,
  PrecisionManufacturingOutlined,
  PeopleOutlined,
  WarehouseOutlined,
  TuneOutlined,
  CategoryOutlined,
  AccountTreeOutlined,
  Inventory2Outlined,
  LabelOutlined,
  AdminPanelSettingsOutlined,
  PeopleAltOutlined,
  SecurityOutlined,
  VpnKeyOutlined,
  HistoryOutlined,
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

/** A titled block of the sidebar; the first section has no title. */
export type NavSection = {
  label?: string
  items: NavItem[]
}

// Ordinea urmează fluxul de lucru: privire de ansamblu → activitatea zilnică →
// ce deține ferma → configurări folosite rar (restrânse în grupuri).
export const navConfig: NavSection[] = [
  {
    items: [
      {
        type: 'leaf',
        label: 'Tablou de bord',
        path: '/',
        icon: DashboardOutlined,
        // no permission → visible to all authenticated users
      },
      {
        type: 'leaf',
        label: 'Rapoarte',
        path: '/reports',
        icon: AssessmentOutlined,
        permission: 'reports:read',
      },
    ],
  },
  {
    label: 'Activitate',
    items: [
      {
        type: 'leaf',
        label: 'Operațiuni pe teren',
        path: '/field-operations',
        icon: EventNoteOutlined,
        permission: 'field_operations:read',
      },
      {
        type: 'leaf',
        label: 'Alocări',
        path: '/assignments',
        icon: AssignmentOutlined,
        permission: 'field_operations:read',
      },
      {
        type: 'leaf',
        label: 'Culturi',
        path: '/crops',
        icon: GrassOutlined,
        permission: 'crops:read',
      },
    ],
  },
  {
    label: 'Fermă',
    items: [
      {
        type: 'leaf',
        label: 'Terenuri',
        path: '/fields',
        icon: LandscapeOutlined,
        permission: 'fields:read',
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
        label: 'Echipament agricol',
        path: '/implements',
        icon: PrecisionManufacturingOutlined,
        permission: 'implements:read',
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
        label: 'Stocuri',
        path: '/stocks',
        icon: WarehouseOutlined,
        permission: 'stock.view',
      },
    ],
  },
  {
    label: 'Configurare',
    items: [
      {
        type: 'group',
        label: 'Nomenclatoare',
        icon: TuneOutlined,
        children: [
          {
            type: 'leaf',
            label: 'Tipuri operațiuni',
            path: '/operation-types',
            icon: CategoryOutlined,
            permission: 'operations:read',
          },
          {
            type: 'leaf',
            label: 'Template-uri',
            path: '/operation-templates',
            icon: AccountTreeOutlined,
            permission: 'operations:read',
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
            label: 'Categorii de resurse',
            path: '/admin/resource-types',
            icon: LabelOutlined,
            permission: 'resources:read',
          },
        ],
      },
      {
        type: 'group',
        label: 'Administrare',
        icon: AdminPanelSettingsOutlined,
        children: [
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
          {
            type: 'leaf',
            label: 'Jurnal audit',
            path: '/admin/audit',
            icon: HistoryOutlined,
            permission: 'audit:read',
          },
        ],
      },
    ],
  },
]

/** True when `pathname` is `path` itself or one of its sub-pages (e.g. /machines/12). */
export function isNavPathActive(pathname: string, path: string): boolean {
  if (path === '/') return pathname === '/'
  return pathname === path || pathname.startsWith(`${path}/`)
}

/** Returns the nav label for a given pathname, matching sub-pages to their menu entry. */
export function findNavLabel(pathname: string): string | undefined {
  const leaves = navConfig.flatMap((section) =>
    section.items.flatMap((item) => (item.type === 'leaf' ? [item] : item.children))
  )
  // Longest matching path wins, so /admin/users/5 resolves to "Utilizatori".
  const match = leaves
    .filter((leaf) => isNavPathActive(pathname, leaf.path))
    .sort((a, b) => b.path.length - a.path.length)[0]
  if (match) return match.label
  if (pathname === '/weather-map') return 'Hartă meteo'
  return undefined
}
