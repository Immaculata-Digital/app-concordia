
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cicloPagamentoService, type CreateCicloPagamentoPayload, type UpdateCicloPagamentoPayload } from '../../services/ciclosPagamento'

export const cicloKeys = {
    all: ['ciclos'] as const,
    lists: () => [...cicloKeys.all, 'list'] as const,
    list: (filters: any) => [...cicloKeys.lists(), filters] as const,
    details: () => [...cicloKeys.all, 'detail'] as const,
    detail: (id: string) => [...cicloKeys.details(), id] as const,
}

export const useCiclos = () => {
    return useQuery({
        queryKey: cicloKeys.lists(),
        queryFn: () => cicloPagamentoService.list(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

export const useCreateCiclo = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: CreateCicloPagamentoPayload) => cicloPagamentoService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cicloKeys.lists() })
        }
    })
}

export const useUpdateCiclo = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateCicloPagamentoPayload }) =>
            cicloPagamentoService.update(id, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: cicloKeys.lists() })
            queryClient.invalidateQueries({ queryKey: cicloKeys.detail(variables.id) })
        }
    })
}

export const useDeleteCiclo = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => cicloPagamentoService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: cicloKeys.lists() })
        }
    })
}
