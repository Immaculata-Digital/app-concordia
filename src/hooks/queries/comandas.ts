import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { CreateComandaPayload, AddItemPayload } from '../../services/comandas'
import { comandaService } from '../../services/comandas'

export const useComandasList = (filters?: { status?: string; mesaId?: string }) => {
    return useQuery({
        queryKey: ['comandas', filters],
        queryFn: async () => {
            const data = await comandaService.list(filters)
            return data
        }
    })
}

export const useComanda = (uuid: string | null) => {
    return useQuery({
        queryKey: ['comanda', uuid],
        queryFn: async () => {
            if (!uuid) return null
            const data = await comandaService.getById(uuid)
            return data
        },
        enabled: !!uuid
    })
}

export const useCreateComanda = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: CreateComandaPayload) => comandaService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['comandas'] })
        }
    })
}

export const useAddComandaItem = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ uuid, payload }: { uuid: string; payload: AddItemPayload }) =>
            comandaService.addItem(uuid, payload),
        onSuccess: (_, { uuid }) => {
            queryClient.invalidateQueries({ queryKey: ['comanda', uuid] })
            queryClient.invalidateQueries({ queryKey: ['comandas'] })
        }
    })
}

export const useUpdateComandaStatus = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ uuid, status }: { uuid: string; status: string }) =>
            comandaService.updateStatus(uuid, status),
        onSuccess: (_, { uuid }) => {
            queryClient.invalidateQueries({ queryKey: ['comanda', uuid] })
            queryClient.invalidateQueries({ queryKey: ['comandas'] })
        }
    })
}
