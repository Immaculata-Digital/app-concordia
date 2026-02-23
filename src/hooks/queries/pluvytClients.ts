import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pluvytClientService, type CreatePluvytClientPayload, type UpdatePluvytClientPayload } from '../../services/pluvytClients'

export const usePluvytClients = () => {
    return useQuery({
        queryKey: ['pluvyt-clients'],
        queryFn: async () => {
            return pluvytClientService.list()
        }
    })
}

export const usePluvytClient = (id: string | null) => {
    return useQuery({
        queryKey: ['pluvyt-clients', id],
        queryFn: async () => {
            if (!id || id === 'undefined') return null
            return pluvytClientService.getById(id)
        },
        enabled: !!id && id !== 'undefined'
    })
}

export const useCreatePluvytClient = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: CreatePluvytClientPayload) => pluvytClientService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pluvyt-clients'] })
        }
    })
}

export const useUpdatePluvytClient = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, payload }: { id: string, payload: UpdatePluvytClientPayload }) =>
            pluvytClientService.update(id, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['pluvyt-clients'] })
            queryClient.invalidateQueries({ queryKey: ['pluvyt-clients', variables.id] })
        }
    })
}

export const useDeletePluvytClient = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => pluvytClientService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pluvyt-clients'] })
        }
    })
}
