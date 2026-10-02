import type { ReactElement, ReactNode } from 'react'
import { act, render, renderHook, waitFor, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider, type UseQueryResult } from '@tanstack/react-query'
import { expect, vi, type MockInstance } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

type WrapperOptions = { route?: string; queryClient?: QueryClient }

/** Wrapper cu react-query și router, folosit atât pentru render cât și pentru renderHook. */
export function createWrapper({
  route = '/',
  queryClient = createTestQueryClient(),
}: WrapperOptions = {}) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </QueryClientProvider>
    )
  }
}

export function renderWithProviders(
  ui: ReactElement,
  options: WrapperOptions & Omit<RenderOptions, 'wrapper'> = {}
) {
  const { route, queryClient, ...renderOptions } = options
  return render(ui, { wrapper: createWrapper({ route, queryClient }), ...renderOptions })
}

/** Pune store-ul de autentificare într-o stare „logat” (sau delogat, cu token null). */
export function setAuth(accessToken: string | null = 'token', initialized = true) {
  useAuthStore.setState({
    accessToken,
    refreshToken: accessToken ? 'refresh' : null,
    user: accessToken ? { id: 1, email: 'ana@x.ro', role: 'admin' } : null,
    initialized,
  })
}

export function resetAuth() {
  useAuthStore.setState({ accessToken: null, refreshToken: null, user: null, initialized: false })
}

// ─── Ajutoare pentru hook-uri react-query ────────────────────────────────────

/** Randează un hook de tip useQuery și așteaptă datele. */
export async function expectQueryData<T>(useHook: () => UseQueryResult<T>, expected: unknown) {
  const { result } = renderHook(useHook, { wrapper: createWrapper() })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))
  expect(result.current.data).toEqual(expected)
  return result
}

/** Verifică că un hook de tip useQuery nu pornește cererea (ex.: utilizator neautentificat). */
export function expectQueryDisabled<T>(useHook: () => UseQueryResult<T>) {
  const { result } = renderHook(useHook, { wrapper: createWrapper() })
  expect(result.current.fetchStatus).toBe('idle')
  expect(result.current.data).toBeUndefined()
}

/** Rulează o mutație și întoarce spion-ii pentru invalidarea cache-ului. */
export async function runMutation<TData, TVariables>(
  useHook: () => { mutateAsync: (variables: TVariables) => Promise<TData> },
  variables: TVariables
) {
  const queryClient = createTestQueryClient()
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  const remove = vi.spyOn(queryClient, 'removeQueries')
  const { result } = renderHook(useHook, { wrapper: createWrapper({ queryClient }) })
  let data: TData | undefined
  await act(async () => {
    data = await result.current.mutateAsync(variables)
  })
  return { data, invalidate, remove, queryClient }
}

/** Cheile de query invalidate de o mutație, în ordinea apelurilor. */
export function invalidatedKeys(spy: MockInstance) {
  return spy.mock.calls.map(
    ([filters]) => (filters as { queryKey?: unknown } | undefined)?.queryKey
  )
}
