import { useEffect } from 'react'
import { TablePagination } from '@mui/material'
import { PAGE_SIZE_OPTIONS } from '../api/pagination'
import type { Pagination } from '../hooks/usePagination'

type Props = {
  pagination: Pagination
  /** Totalul de rânduri filtrate, din răspunsul API-ului. */
  total: number | undefined
}

/** Bara de paginare a unui tabel paginat pe server, în română. */
export default function TablePaginationBar({ pagination, total }: Props) {
  const count = total ?? 0
  const lastPage = Math.max(0, Math.ceil(count / pagination.pageSize) - 1)

  // după o ștergere pe ultima pagină, pagina curentă poate să nu mai existe
  useEffect(() => {
    if (total !== undefined && pagination.page > lastPage) pagination.setPage(lastPage)
  }, [total, lastPage, pagination])

  if (total === undefined || total === 0) return null

  return (
    <TablePagination
      component="div"
      count={count}
      page={Math.min(pagination.page, lastPage)}
      rowsPerPage={pagination.pageSize}
      rowsPerPageOptions={PAGE_SIZE_OPTIONS}
      onPageChange={(_, next) => pagination.setPage(next)}
      onRowsPerPageChange={(event) => pagination.setPageSize(Number(event.target.value))}
      labelRowsPerPage="Rânduri pe pagină:"
      labelDisplayedRows={({ from, to, count: all }) => `${from}–${to} din ${all}`}
      getItemAriaLabel={(type) =>
        ({
          first: 'Prima pagină',
          last: 'Ultima pagină',
          next: 'Pagina următoare',
          previous: 'Pagina anterioară',
        })[type]
      }
      sx={{ borderTop: '1px solid', borderColor: 'divider' }}
    />
  )
}
