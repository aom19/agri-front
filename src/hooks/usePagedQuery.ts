import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { PageParams, Paginated } from '../api/pagination'
import { useAuthStore } from '../store/auth.store'

/**
 * O pagină dintr-o listă paginată pe server. Cheia începe cu cheia listei (`baseKey`), ca
 * invalidările existente după creare, editare sau ștergere să reîncarce și pagina. La schimbarea
 * paginii sau a filtrelor, rândurile vechi rămân pe ecran până sosesc cele noi.
 */
export function usePagedQuery<P extends Paginated<unknown>, F extends object>(
  baseKey: readonly unknown[],
  fetchPage: (params: F & PageParams) => Promise<P>,
  params: F & PageParams,
  enabled = true
) {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: [...baseKey, 'page', params],
    queryFn: () => fetchPage(params),
    enabled: enabled && initialized && !!accessToken,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  })
}
