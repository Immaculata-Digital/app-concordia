import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    type CreateRemetentePayload,
    type RemetenteDTO,
    remetenteService,
    type UpdateRemetentePayload,
} from '../../services/remetentes'

export const remetenteKeys = {
    all: ['remetentes'] as const,
    lists: () => [...remetenteKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...remetenteKeys.lists(), filters] as const,
    details: () => [...remetenteKeys.all, 'detail'] as const,
    detail: (id: string) => [...remetenteKeys.details(), id] as const,
}

export const useRemetentes = (filters?: Record<string, unknown>) => {
    return useQuery<RemetenteDTO[]>({
        queryKey: remetenteKeys.list(filters || {}),
        queryFn: () => remetenteService.list(filters as Record<string, any>),
        staleTime: 1000 * 60 * 5, // 5 minutes
        placeholderData: (previousData) => previousData,
    })
}

export const useCreateRemetente = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (payload: CreateRemetentePayload) => remetenteService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: remetenteKeys.lists() })
        },
    })
}

export const useUpdateRemetente = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateRemetentePayload }) =>
            remetenteService.update(id, payload),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: remetenteKeys.lists() })
            queryClient.invalidateQueries({ queryKey: remetenteKeys.detail(id) })
        },
    })
}

export const useDeleteRemetente = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => remetenteService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: remetenteKeys.lists() })
        },
    })
}
