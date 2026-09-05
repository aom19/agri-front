import type { ReactNode } from 'react'
import { DownloadOutlined } from '@mui/icons-material'
import {
  Box,
  Button,
  Card,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { downloadCsv, type CsvCell } from '../reportUtils'

export type ReportColumn<T> = {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  render: (row: T) => ReactNode
  csv?: (row: T) => CsvCell
}

type ReportTableProps<T> = {
  title: string
  subtitle?: string
  columns: ReportColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string | number
  csvName: string
  emptyText?: string
  maxHeight?: number
  onRowClick?: (row: T) => void
}

function cellToCsv(node: ReactNode): CsvCell {
  return typeof node === 'string' || typeof node === 'number' ? node : ''
}

export default function ReportTable<T>({
  title,
  subtitle,
  columns,
  rows,
  rowKey,
  csvName,
  emptyText = 'Nu există înregistrări pentru filtrele selectate.',
  maxHeight = 480,
  onRowClick,
}: ReportTableProps<T>) {
  const handleExport = () => {
    downloadCsv(
      `${csvName}.csv`,
      columns.map((column) => column.label),
      rows.map((row) =>
        columns.map((column) => (column.csv ? column.csv(row) : cellToCsv(column.render(row))))
      )
    )
  }

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}
      >
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: '#0d1f17' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Button
          className="no-print"
          size="small"
          variant="outlined"
          startIcon={<DownloadOutlined />}
          onClick={handleExport}
          disabled={rows.length === 0}
        >
          Export CSV
        </Button>
      </Stack>
      <Box className="report-table-scroll" sx={{ overflow: 'auto', maxHeight }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align}
                  sx={{ fontWeight: 700, whiteSpace: 'nowrap', bgcolor: '#ffffff' }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <Typography
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.85rem',
                      textAlign: 'center',
                      py: 3,
                    }}
                  >
                    {emptyText}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  hover
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      align={column.align}
                      sx={{
                        whiteSpace: 'nowrap',
                        fontVariantNumeric: column.align === 'right' ? 'tabular-nums' : undefined,
                      }}
                    >
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>
    </Card>
  )
}
