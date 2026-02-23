import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pointTransactionService, type CreatePointTransactionPayload, type UpdatePointTransactionPayload } from '../../services/pointTransactions'

export const usePointTransactions = (filters?: { clientId?: string }) => {
    return useQuery({
        queryKey: ['point-transactions', filters],
        queryFn: () => pointTransactionService.list(filters)
    })
}

export const usePointTransaction = (id: string | null) => {
    return useQuery({
        queryKey: ['point-transactions', id],
        queryFn: async () => {
            if (!id) return null
            return pointTransactionService.getById(id)
        },
        enabled: !!id
    })
}

export const useCreatePointTransaction = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: CreatePointTransactionPayload) => pointTransactionService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['point-transactions'] })
            // Also invalidate pluvyt clients as their balances might have changed
            queryClient.invalidateQueries({ queryKey: ['pluvyt-clients'] })
        }
    })
}

export const useUpdatePointTransaction = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, payload }: { id: string, payload: UpdatePointTransactionPayload }) =>
            pointTransactionService.update(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['point-transactions'] })
            queryClient.invalidateQueries({ queryKey: ['pluvyt-clients'] })
        }
    })
}

export const useDeletePointTransaction = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => pointTransactionService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['point-transactions'] })
            queryClient.invalidateQueries({ queryKey: ['pluvyt-clients'] })
        }
    })
}
