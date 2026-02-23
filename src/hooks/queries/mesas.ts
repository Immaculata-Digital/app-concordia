import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateMesaPayload, UpdateMesaPayload } from '../../services/mesas'
import { mesaService } from '../../services/mesas'

export const useMesasList = () => {
    return useQuery({
        queryKey: ['mesas'],
        queryFn: async () => {
            const data = await mesaService.list()
            return data
        }
    })
}

export const useCreateMesa = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: CreateMesaPayload) => mesaService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mesas'] })
        }
    })
}

export const useUpdateMesa = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ uuid, payload }: { uuid: string; payload: UpdateMesaPayload }) =>
            mesaService.update(uuid, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mesas'] })
        }
    })
}

export const useDeleteMesa = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (uuid: string) => mesaService.remove(uuid),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['mesas'] })
        }
    })
}
