import { useMemo } from 'react'
import { Box, Button, GlobalStyles, Stack, Tab, Tabs, Tooltip, Typography } from '@mui/material'
import {
  AgricultureOutlined,
  BuildOutlined,
  DashboardOutlined,
  GrassOutlined,
  LandscapeOutlined,
  PeopleOutlined,
  PrintOutlined,
  SendOutlined,
  WarehouseOutlined,
  WbSunnyOutlined,
} from '@mui/icons-material'
import { useSearchParams } from 'react-router-dom'
import type { ReportFilters as ReportFilterParams } from '../../api/reports.api'
import { useEmailReportSummary } from '../../hooks/useReports'
import { useNotificationStore } from '../../store/notification.store'
import { getApiErrorMessage } from '../../utils/getApiErrorMessage'
import ReportFilters from './components/ReportFilters'
import { defaultReportFilterState, type ReportFilterState } from './reportFilterState'
import SummaryTab from './tabs/SummaryTab'
import OperationsTab from './tabs/OperationsTab'
import FieldsTab from './tabs/FieldsTab'
import FleetTab from './tabs/FleetTab'
import OperatorsTab from './tabs/OperatorsTab'
import StocksTab from './tabs/StocksTab'
import CropsTab from './tabs/CropsTab'
import WeatherTab from './tabs/WeatherTab'
import { isOperationType } from '../../schemas/operation.schema'

const TABS = [
  { key: 'summary', label: 'Sumar', icon: DashboardOutlined },
  { key: 'operations', label: 'Operațiuni', icon: BuildOutlined },
  { key: 'fields', label: 'Terenuri', icon: LandscapeOutlined },
  { key: 'fleet', label: 'Flotă', icon: AgricultureOutlined },
  { key: 'operators', label: 'Operatori', icon: PeopleOutlined },
  { key: 'stocks', label: 'Stocuri', icon: WarehouseOutlined },
  { key: 'crops', label: 'Culturi', icon: GrassOutlined },
  { key: 'weather', label: 'Meteo', icon: WbSunnyOutlined },
] as const

type TabKey = (typeof TABS)[number]['key']

const PARAM_NAMES: Record<keyof ReportFilterState, string> = {
  from: 'from',
  to: 'to',
  fieldId: 'field_id',
  operationType: 'operation_type',
  machineId: 'machine_id',
  operatorId: 'operator_id',
}

function isTabKey(value: string | null): value is TabKey {
  return TABS.some((tab) => tab.key === value)
}

function toNumberOrUndefined(value: string) {
  const parsed = Number(value)
  return value !== '' && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const defaults = useMemo(() => defaultReportFilterState(), [])
  const show = useNotificationStore((state) => state.show)
  const emailSummary = useEmailReportSummary()

  const tab: TabKey = isTabKey(searchParams.get('tab'))
    ? (searchParams.get('tab') as TabKey)
    : 'summary'
  const state: ReportFilterState = {
    from: searchParams.get(PARAM_NAMES.from) ?? defaults.from,
    to: searchParams.get(PARAM_NAMES.to) ?? defaults.to,
    fieldId: searchParams.get(PARAM_NAMES.fieldId) ?? '',
    operationType: searchParams.get(PARAM_NAMES.operationType) ?? '',
    machineId: searchParams.get(PARAM_NAMES.machineId) ?? '',
    operatorId: searchParams.get(PARAM_NAMES.operatorId) ?? '',
  }

  const updateFilters = (patch: Partial<ReportFilterState>) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        for (const [key, value] of Object.entries(patch) as Array<
          [keyof ReportFilterState, string]
        >) {
          const paramName = PARAM_NAMES[key]
          if (!value || value === defaults[key]) next.delete(paramName)
          else next.set(paramName, value)
        }
        return next
      },
      { replace: true }
    )
  }

  const resetFilters = () => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams()
        const currentTab = previous.get('tab')
        if (currentTab) next.set('tab', currentTab)
        return next
      },
      { replace: true }
    )
  }

  const changeTab = (nextTab: TabKey) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (nextTab === 'summary') next.delete('tab')
        else next.set('tab', nextTab)
        return next
      },
      { replace: true }
    )
  }

  const sendSummaryByEmail = () => {
    emailSummary.mutate(
      { from: state.from, to: state.to },
      {
        onSuccess: (result) => show(result.message, 'success'),
        onError: (error) =>
          show(getApiErrorMessage(error, 'Nu am putut trimite raportul.'), 'error'),
      }
    )
  }

  const filters: ReportFilterParams = useMemo(
    () => ({
      from: state.from,
      to: state.to,
      field_id: state.fieldId || undefined,
      operation_type: isOperationType(state.operationType) ? state.operationType : undefined,
      machine_id: toNumberOrUndefined(state.machineId),
      operator_id: toNumberOrUndefined(state.operatorId),
    }),
    [state.from, state.to, state.fieldId, state.operationType, state.machineId, state.operatorId]
  )

  return (
    <Box>
      <GlobalStyles
        styles={{
          '@media print': {
            '.MuiDrawer-root, .MuiAppBar-root, .no-print': { display: 'none !important' },
            main: { padding: '0 !important' },
            body: { background: '#ffffff' },
            '.report-table-scroll': {
              maxHeight: 'none !important',
              overflow: 'visible !important',
            },
            '.MuiCard-root': {
              boxShadow: 'none !important',
              border: '1px solid #e0e6e2',
              breakInside: 'avoid',
            },
          },
        }}
      />
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ mb: 2.5, justifyContent: 'space-between', alignItems: { sm: 'flex-start' } }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '1.5rem', color: '#0d1f17' }}>
            Rapoarte
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
            Analize pe operațiuni, terenuri, flotă, operatori, stocuri, culturi și meteo, calculate
            din datele fermei · {state.from} – {state.to}
          </Typography>
        </Box>
        <Stack className="no-print" direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <Tooltip
            describeChild
            title="Trimite pe e-mailul tău sumarul perioadei alese, fără celelalte filtre"
          >
            <Button
              variant="outlined"
              startIcon={<SendOutlined />}
              onClick={sendSummaryByEmail}
              disabled={emailSummary.isPending}
            >
              {emailSummary.isPending ? 'Se trimite...' : 'Trimite pe e-mail'}
            </Button>
          </Tooltip>
          <Button variant="outlined" startIcon={<PrintOutlined />} onClick={() => window.print()}>
            Export PDF
          </Button>
        </Stack>
      </Stack>

      <Box className="no-print">
        <ReportFilters value={state} onChange={updateFilters} onReset={resetFilters} />
      </Box>

      <Tabs
        value={tab}
        onChange={(_, value: TabKey) => changeTab(value)}
        variant="scrollable"
        allowScrollButtonsMobile
        className="no-print"
        sx={{ mb: 2.5, borderBottom: '1px solid #e0e6e2' }}
      >
        {TABS.map((item) => {
          const Icon = item.icon
          return (
            <Tab
              key={item.key}
              value={item.key}
              label={item.label}
              icon={<Icon sx={{ fontSize: 18 }} />}
              iconPosition="start"
              sx={{ minHeight: 48, textTransform: 'none', fontWeight: 600 }}
            />
          )
        })}
      </Tabs>

      {tab === 'summary' && <SummaryTab filters={filters} />}
      {tab === 'operations' && <OperationsTab filters={filters} />}
      {tab === 'fields' && <FieldsTab filters={filters} />}
      {tab === 'fleet' && <FleetTab filters={filters} />}
      {tab === 'operators' && <OperatorsTab filters={filters} />}
      {tab === 'stocks' && <StocksTab filters={filters} />}
      {tab === 'crops' && <CropsTab filters={filters} />}
      {tab === 'weather' && <WeatherTab filters={filters} />}
    </Box>
  )
}
