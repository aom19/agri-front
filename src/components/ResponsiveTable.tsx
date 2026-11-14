import { useLayoutEffect, useRef, useState } from 'react'
import { Table, type TableProps } from '@mui/material'
import type { Theme } from '@mui/material/styles'

/** Coloana de acțiuni (butoanele de la final) e recunoscută după eticheta din antet. */
const ACTIONS_LABELS = new Set(['', 'actiuni'])

/** „Acțiuni”, „Actiuni” sau „ACȚIUNI” sunt aceeași etichetă. */
function isActionsLabel(label: string) {
  const plain = label.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
  return ACTIONS_LABELS.has(plain)
}

function readHeaderLabels(table: HTMLTableElement | null): string[] {
  const cells = table?.querySelectorAll<HTMLTableCellElement>('thead tr:first-of-type > th')
  return Array.from(cells ?? [], (cell) => cell.textContent?.trim() ?? '')
}

function cssString(value: string) {
  return `"${value.replace(/["\\]/g, '\\$&')}"`
}

/**
 * Un tabel MUI care, pe telefon, își arată fiecare rând ca un card: prima coloană e titlul,
 * celelalte apar ca „etichetă: valoare”, cu eticheta luată din antetul tabelului, iar coloana
 * de acțiuni rămâne jos, la dreapta. Pe ecrane mai late e un tabel obișnuit.
 *
 * Se folosește exact ca `Table`; antetul trebuie să aibă câte o celulă pentru fiecare coloană.
 */
export default function ResponsiveTable({ sx, children, ...props }: TableProps) {
  const ref = useRef<HTMLTableElement>(null)
  const [labels, setLabels] = useState<string[]>([])

  // Etichetele se citesc din antet după fiecare randare; starea se schimbă doar când diferă.
  useLayoutEffect(() => {
    const next = readHeaderLabels(ref.current)
    setLabels((current) => (current.join('\u0000') === next.join('\u0000') ? current : next))
  })

  const columnRules = Object.fromEntries(
    labels.flatMap((label, index) => {
      const selector = `& tbody td:nth-of-type(${index + 1})`
      if (index === 0) return []
      if (isActionsLabel(label)) {
        return [[selector, { justifyContent: 'flex-end', pt: 1, '&::before': { display: 'none' } }]]
      }
      return [[`${selector}::before`, { content: cssString(label) }]]
    })
  )

  return (
    <Table
      ref={ref}
      {...props}
      sx={[
        (theme: Theme) => ({
          [theme.breakpoints.down('sm')]: {
            // tabelul are exact lățimea ecranului: conținutul lat nu mai împinge valorile în afară
            '&, & tbody, & thead': { display: 'block', width: '100%' },
            // antetul dispare, în afară de celulele cu butoane (filtre, sortare), care rămân sus,
            // una lângă alta pe același rând
            '& thead tr': {
              display: 'flex',
              flexWrap: 'wrap',
              columnGap: 2,
              px: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              '&:not(:has(th button, th [role="button"]))': { display: 'none' },
            },
            '& thead th': { display: 'none' },
            '& thead th:has(button, [role="button"])': {
              display: 'block',
              flex: '0 0 auto',
              width: 'auto',
              '& .MuiTypography-root': { fontSize: '0.9rem' },
              p: 0,
              py: 1,
              border: 0,
            },
            '& tbody td > *': { minWidth: 0, maxWidth: '100%' },
            '& tbody tr': {
              display: 'block',
              px: 2,
              py: 1.5,
              borderBottom: `1px solid ${theme.palette.divider}`,
            },
            '& tbody td': {
              display: 'flex',
              // MUI întoarce rândul la celulele align="right"; în card eticheta rămâne în stânga
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              minWidth: 0,
              p: 0,
              py: 0.4,
              border: 0,
              textAlign: 'right',
              fontSize: '0.85rem',
              '&::before': {
                flexShrink: 0,
                color: 'text.secondary',
                fontSize: '0.75rem',
                textAlign: 'left',
              },
            },
            // prima coloană e titlul cardului
            '& tbody td:first-of-type': {
              justifyContent: 'flex-start',
              textAlign: 'left',
              fontWeight: 600,
              fontSize: '0.95rem',
              pb: 0.75,
            },
            // rândurile cu o singură celulă (listă goală, încărcare) rămân centrate
            '& tbody td[colspan]': {
              justifyContent: 'center',
              textAlign: 'center',
              fontWeight: 400,
              '&::before': { display: 'none' },
            },
            ...columnRules,
          },
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Table>
  )
}
