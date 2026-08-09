import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuthStore } from "../store/auth.store"
import { machineApi, type Machine } from "../api/machine.api"

export const MACHINE_KEY = ['my-machines']

export function useMachines() {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: MACHINE_KEY,
    queryFn: machineApi.getAllMachines,
    enabled: initialized && !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 min — machines don't change often
    gcTime: 10 * 60 * 1000,
  })
}

export function useMachineById(id: string) {
  const initialized = useAuthStore((s) => s.initialized)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useQuery({
    queryKey: ['machine', id],
    queryFn: () => machineApi.getMachineById(id),
    enabled: initialized && !!accessToken,
    staleTime: 5 * 60 * 1000, // 5 min — machines don't change often
    gcTime: 10 * 60 * 1000,
  })
}


export function useCreateMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Omit<Machine, 'id'>) => machineApi.createMachine(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MACHINE_KEY }),
  })
}

export function useUpdateMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Omit<Machine, 'id'> }) =>
      machineApi.updateMachine(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MACHINE_KEY }),
  })
}

export function useDeleteMachine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => machineApi.deleteMachine(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: MACHINE_KEY }),
  })
}