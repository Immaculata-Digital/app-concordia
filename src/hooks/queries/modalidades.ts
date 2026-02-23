import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    modalidadeRentabilidadeService,
    type CreateModalidadeRentabilidadePayload,
    type UpdateModalidadeRentabilidadePayload
} from '../../services/modalidadesRentabilidade'

export const modalidadeKeys = {
    all: ['modalidades'] as const,
    lists: () => [...modalidadeKeys.all, 'list'] as const,
    list: (search?: string) => [...modalidadeKeys.lists(), { search }] as const,
}

export const useModalidades = (search?: string) => {
    return useQuery({
        queryKey: modalidadeKeys.list(search),
        queryFn: () => modalidadeRentabilidadeService.list(search),
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

export const useCreateModalidade = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: CreateModalidadeRentabilidadePayload) =>
            modalidadeRentabilidadeService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: modalidadeKeys.lists() })
        }
    })
}

export const useUpdateModalidade = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateModalidadeRentabilidadePayload }) =>
            modalidadeRentabilidadeService.update(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: modalidadeKeys.lists() })
        }
    })
}

export const useDeleteModalidade = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => modalidadeRentabilidadeService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: modalidadeKeys.lists() })
        }
    })
}
