
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { recompensaService, type Recompensa } from '../../services/recompensa'

export const recompensaKeys = {
    all: ['recompensas'] as const,
    lists: () => [...recompensaKeys.all, 'list'] as const,
    list: (params: any) => [...recompensaKeys.lists(), { ...params }] as const,
    details: () => [...recompensaKeys.all, 'detail'] as const,
    detail: (id: string) => [...recompensaKeys.details(), id] as const,
}

export const useRecompensasList = (tenantId?: string) => {
    return useQuery({
        queryKey: recompensaKeys.list({ tenantId }),
        queryFn: () => recompensaService.list(tenantId),
        staleTime: 1000 * 60 * 5,
    })
}

export const useRecompensa = (id: string | undefined | null) => {
    return useQuery({
        queryKey: recompensaKeys.detail(id || ''),
        queryFn: () => {
            if (!id) throw new Error('Recompensa ID is required')
            return recompensaService.getById(id)
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    })
}

export const useCreateRecompensa = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: Partial<Recompensa>) => recompensaService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: recompensaKeys.lists() })
        }
    })
}

export const useUpdateRecompensa = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<Recompensa> }) =>
            recompensaService.update(id, payload),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: recompensaKeys.detail(data.uuid) })
            queryClient.invalidateQueries({ queryKey: recompensaKeys.lists() })
        }
    })
}

export const useDeleteRecompensa = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => recompensaService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: recompensaKeys.lists() })
        }
    })
}
