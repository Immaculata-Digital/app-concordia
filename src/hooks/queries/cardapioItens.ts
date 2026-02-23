import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cardapioItemService, type CreateCardapioItemPayload, type UpdateCardapioItemPayload } from '../../services/cardapioItens'

export const useCardapioItens = (filters?: { categoriaCode?: string }) => {
    return useQuery({
        queryKey: ['cardapio-itens', filters],
        queryFn: () => cardapioItemService.list(filters)
    })
}

export const useCardapioItem = (uuid: string | null) => {
    return useQuery({
        queryKey: ['cardapio-itens', uuid],
        queryFn: async () => {
            if (!uuid) return null
            return cardapioItemService.getById(uuid)
        },
        enabled: !!uuid
    })
}

export const useCreateCardapioItem = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: CreateCardapioItemPayload) => cardapioItemService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cardapio-itens'] })
        }
    })
}

export const useUpdateCardapioItem = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ uuid, payload }: { uuid: string, payload: UpdateCardapioItemPayload }) =>
            cardapioItemService.update(uuid, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cardapio-itens'] })
        }
    })
}

export const useDeleteCardapioItem = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (uuid: string) => cardapioItemService.remove(uuid),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cardapio-itens'] })
        }
    })
}
