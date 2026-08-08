import { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import type { SxProps, Theme } from '@mui/material'
import {
  NotificationsOutlined,
  SearchOutlined,
  LogoutOutlined,
  KeyboardArrowDown,
  MenuOutlined,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material'
import AppLogo from '../components/AppLogo'
import { useAuthStore } from '../store/auth.store'
import { useLogout } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { usePermissions } from '../hooks/usePermissions'
import { useCurrentWeather } from '../hooks/useWeather'
import { navConfig, findNavLabel, type NavLeaf } from '../routes/routeConfig'

const SIDEBAR_WIDTH = 240

const weatherIconSymbols = {
  sunny: '☀️',
  moon: '🌙',
  partly_cloudy: '🌤',
  cloudy: '☁️',
  rain: '🌧',
  snow: '❄️',
  showers: '🌦',
  storm: '⛈',
}

function navItemSx(isActive: boolean): SxProps<Theme> {
  return {
    borderRadius: '8px',
    height: 44,
    px: 1.5,
    mb: 0.5,
    color: isActive ? '#10b981' : '#a8bdb4',
    bgcolor: isActive ? 'rgba(16,185,129,0.15)' : 'transparent',
    borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent',
    transition: 'all 0.15s ease',
    '&:hover': {
      bgcolor: isActive ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
      color: '#ffffff',
    },
  }
}

function NavLeafItem({
  item,
  isActive,
  onNavigate,
  indent = false,
}: {
  item: NavLeaf
  isActive: boolean
  onNavigate: (path: string) => void
  indent?: boolean
}) {
  return (
    <ListItemButton
      onClick={() => onNavigate(item.path)}
      aria-current={isActive ? 'page' : undefined}
      sx={{ ...(navItemSx(isActive) as object), ...(indent ? { pl: 2.5 } : {}) }}
    >
      <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
        <item.icon sx={{ fontSize: indent ? 18 : 20 }} />
      </ListItemIcon>
      <ListItemText
        primary={item.label}
        slotProps={{
          primary: {
            sx: { fontSize: indent ? '0.8rem' : '0.875rem', fontWeight: isActive ? 600 : 400 },
          },
        }}
      />
    </ListItemButton>
  )
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const accessToken = useAuthStore((s) => s.accessToken)
  const logout = useLogout()
  const { data: profile } = useProfile()
  const { data: permissions, isPending: permissionsPending } = usePermissions()
  const [adminOpen, setAdminOpen] = useState(() => location.pathname.startsWith('/admin'))
  const { data: weather } = useCurrentWeather()

  const permSet = useMemo(() => new Set(permissions?.map((p) => p.name) ?? []), [permissions])
  const isMenuLoading = Boolean(accessToken) && permissionsPending
  const can = (perm?: string) => !perm || permSet.has(perm)
  const canOpenWeather = !isMenuLoading && can('fields:read')

  const handleNav = (path: string) => {
    navigate(path)
    onNavigate?.()
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box sx={{ px: 2.5, py: 3 }}>
        <AppLogo color="white" />
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mx: 2 }} />

      {/* Navigation */}
      <List component="nav" aria-label="Navigare principală" sx={{ px: 1.5, py: 2, flex: 1 }}>
        {isMenuLoading ? (
          <Stack spacing={1} sx={{ px: 0.5, py: 0.5 }} aria-label="Se încarcă meniul">
            {[0, 1, 2].map((item) => (
              <Skeleton
                key={item}
                variant="rounded"
                height={44}
                sx={{ borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.08)' }}
              />
            ))}
          </Stack>
        ) : (
          navConfig.map((item) => {
            if (item.type === 'leaf') {
              if (!can(item.permission)) return null
              return (
                <NavLeafItem
                  key={item.path}
                  item={item}
                  isActive={location.pathname === item.path}
                  onNavigate={handleNav}
                />
              )
            }

            if (item.type === 'group') {
              const visibleChildren = item.children.filter((c) => can(c.permission))
              if (visibleChildren.length === 0) return null
              const isGroupActive = visibleChildren.some((c) => location.pathname === c.path)

              return (
                <Box key={item.label}>
                  <ListItemButton
                    onClick={() => setAdminOpen((o) => !o)}
                    sx={{
                      ...(navItemSx(isGroupActive) as object),
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                        <item.icon sx={{ fontSize: 20 }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        slotProps={{
                          primary: {
                            sx: { fontSize: '0.875rem', fontWeight: isGroupActive ? 600 : 400 },
                          },
                        }}
                      />
                    </Box>
                    {adminOpen ? (
                      <ExpandLess sx={{ fontSize: 16 }} />
                    ) : (
                      <ExpandMore sx={{ fontSize: 16 }} />
                    )}
                  </ListItemButton>
                  <Collapse in={adminOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {visibleChildren.map((child) => (
                        <NavLeafItem
                          key={child.path}
                          item={child}
                          isActive={location.pathname === child.path}
                          onNavigate={handleNav}
                          indent
                        />
                      ))}
                    </List>
                  </Collapse>
                </Box>
              )
            }

            return null
          })
        )}
      </List>

      {/* Bottom weather widget */}
      <Box sx={{ px: 2, pb: 1.5 }}>
        <Box
          role="button"
          tabIndex={0}
          aria-label="Deschide harta meteo"
          onClick={() => {
            if (canOpenWeather) handleNav('/weather-map')
          }}
          onKeyDown={(event) => {
            if (!canOpenWeather) return
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              handleNav('/weather-map')
            }
          }}
          sx={{
            bgcolor:
              location.pathname === '/weather-map'
                ? 'rgba(16,185,129,0.15)'
                : 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            border:
              location.pathname === '/weather-map'
                ? '1px solid rgba(16,185,129,0.4)'
                : '1px solid transparent',
            cursor: 'pointer',
            px: 2,
            py: 1.5,
            transition: 'all 0.15s ease',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.09)',
            },
            '&:focus-visible': {
              outline: '2px solid #10b981',
              outlineOffset: 2,
            },
          }}
        >
          <Typography sx={{ color: '#a8bdb4', fontSize: '0.7rem' }} noWrap>
            {weather
              ? `${weatherIconSymbols[weather.icon]} ${weather.location} ${weather.temperature_c}°C • ${weather.condition}`
              : 'Cantemir • Meteo indisponibil'}
          </Typography>
        </Box>
      </Box>

      {/* User section */}
      <Box sx={{ px: 2, pb: 2, pt: 1 }}>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 1.5 }} />
        <Stack direction="row" sx={{ alignItems: 'center' }} spacing={1.5}>
          <Avatar
            src={profile?.profile_photo || undefined}
            alt={
              profile?.first_name
                ? `${profile.first_name} ${profile.last_name}`
                : (user?.email ?? 'User')
            }
            sx={{ width: 32, height: 32, bgcolor: '#2d8653', fontSize: '0.8rem' }}
          >
            {profile?.first_name?.[0]?.toUpperCase() ?? user?.email?.charAt(0).toUpperCase() ?? 'U'}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              sx={{
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {profile?.first_name
                ? `${profile.first_name} ${profile.last_name}`
                : user?.email || 'User'}
            </Typography>
            <Typography sx={{ color: '#8faaa0', fontSize: '0.65rem', textTransform: 'capitalize' }}>
              {profile?.role || user?.role || 'operator'}
            </Typography>
          </Box>
          <IconButton
            size="small"
            aria-label="Deconectare"
            onClick={() => logout()}
            sx={{ color: '#8faaa0', '&:hover': { color: '#dc2626' } }}
          >
            <LogoutOutlined sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  )
}

export default function DashboardLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const { data: profile } = useProfile()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const pageTitle =
    findNavLabel(location.pathname) ??
    (location.pathname === '/profile' ? 'Profil' : 'Tablou de bord')

  const drawerSx = {
    '& .MuiDrawer-paper': {
      width: SIDEBAR_WIDTH,
      bgcolor: '#0d1f17',
      borderRight: 'none',
      borderRadius: '0 8px 8px 0',
    },
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f0f2f0' }}>
      {/* Desktop: permanent sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          display: { xs: 'none', md: 'block' },
          ...drawerSx,
        }}
      >
        <SidebarContent />
      </Drawer>

      {/* Mobile: temporary drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, ...drawerSx }}
      >
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </Drawer>

      {/* Main content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
        }}
      >
        {/* Topbar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: '#ffffff', borderBottom: '1px solid #e0e6e2' }}
        >
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Stack direction="row" sx={{ alignItems: 'center' }} spacing={1}>
              {isMobile && (
                <IconButton
                  size="small"
                  aria-label="Deschide meniu"
                  onClick={() => setMobileOpen(true)}
                  sx={{ color: '#0d1f17', mr: 0.5 }}
                >
                  <MenuOutlined />
                </IconButton>
              )}
              <Typography sx={{ fontWeight: 600, fontSize: '1.125rem', color: '#0d1f17' }}>
                {pageTitle}
              </Typography>
            </Stack>

            <Stack direction="row" sx={{ alignItems: 'center' }} spacing={1}>
              <IconButton size="small" aria-label="Căutare" sx={{ color: 'text.secondary' }}>
                <SearchOutlined />
              </IconButton>

              <IconButton size="small" aria-label="Notificări" sx={{ color: 'text.secondary' }}>
                <Badge badgeContent={3} color="error" variant="dot">
                  <NotificationsOutlined />
                </Badge>
              </IconButton>

              <Divider
                orientation="vertical"
                flexItem
                sx={{ mx: 1, height: 20, alignSelf: 'center' }}
              />

              <Box
                role="button"
                tabIndex={0}
                aria-label="Meniu utilizator"
                aria-haspopup="true"
                aria-expanded={Boolean(anchorEl)}
                onClick={(e) => setAnchorEl(e.currentTarget)}
                onKeyDown={(e) => e.key === 'Enter' && setAnchorEl(e.currentTarget as HTMLElement)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  cursor: 'pointer',
                  borderRadius: '8px',
                  px: 1,
                  py: 0.5,
                  '&:hover': { bgcolor: '#f0f2f0' },
                }}
              >
                <Avatar
                  src={profile?.profile_photo || undefined}
                  alt={
                    profile?.first_name
                      ? `${profile.first_name} ${profile.last_name}`
                      : (user?.email ?? 'User')
                  }
                  sx={{ width: 28, height: 28, bgcolor: '#1a5c38', fontSize: '0.75rem' }}
                >
                  {profile?.first_name?.[0]?.toUpperCase() ??
                    user?.email?.charAt(0).toUpperCase() ??
                    'U'}
                </Avatar>
                <Typography
                  sx={{
                    fontSize: '0.8rem',
                    color: '#0d1f17',
                    fontWeight: 500,
                    display: { xs: 'none', sm: 'block' },
                  }}
                >
                  {profile?.first_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : user?.email?.split('@')[0] || 'User'}
                </Typography>
                <KeyboardArrowDown
                  aria-hidden="true"
                  sx={{ fontSize: 16, color: 'text.secondary' }}
                />
              </Box>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null)
                    navigate('/profile')
                  }}
                >
                  Profil
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null)
                    navigate('/settings')
                  }}
                >
                  Setări
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null)
                    logout()
                  }}
                >
                  Deconectare
                </MenuItem>
              </Menu>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Page content */}
        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
