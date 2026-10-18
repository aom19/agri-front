import { useState } from 'react'
import { DEFAULT_PAGE_SIZE, type PageParams } from '../api/pagination'

/**
 * Starea paginării unui tabel paginat pe server. `resetKey` sunt filtrele curente: când se schimbă,
 * tabelul revine la prima pagină (o pagină 4 dintr-o căutare nouă poate să nu existe).
 * `page` e de la 0, ca în TablePagination; `params` e de la 1, ca în API.
 */
export function usePagination(resetKey: unknown = null, initialPageSize = DEFAULT_PAGE_SIZE) {
  const key = JSON.stringify(resetKey ?? null)
  const [state, setState] = useState({ key, page: 0 })
  const [pageSize, setPageSizeState] = useState(initialPageSize)
  const page = state.key === key ? state.page : 0

  const params: PageParams = { page: page + 1, page_size: pageSize }

  return {
    page,
    pageSize,
    params,
    setPage: (next: number) => setState({ key, page: next }),
    setPageSize: (next: number) => {
      setPageSizeState(next)
      setState({ key, page: 0 })
    },
  }
}

export type Pagination = ReturnType<typeof usePagination>
