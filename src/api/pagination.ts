/** O pagină dintr-o listă paginată pe server. */
export type Paginated<T> = {
  items: T[]
  /** Toate rândurile care corespund filtrelor, nu doar cele din pagină. */
  total: number
  page: number
  page_size: number
}

/** Pagina cerută API-ului: `page` începe de la 1. */
export type PageParams = {
  page: number
  page_size: number
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100]
export const DEFAULT_PAGE_SIZE = 25

/** Scoate filtrele goale, ca să nu ajungă în URL ca `?q=`. */
export function listParams<T extends object>(params: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
  ) as Partial<T>
}
