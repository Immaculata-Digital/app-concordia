
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    parameterizationService,
    type CreateParameterizationPayload,
    type UpdateParameterizationPayload,
} from '../../services/parameterizations'

export const parameterizationKeys = {
    all: ['parameterizations'] as const,
    lists: () => [...parameterizationKeys.all, 'list'] as const,
    details: () => [...parameterizationKeys.all, 'detail'] as const,
    detail: (id: string) => [...parameterizationKeys.details(), id] as const,
}

export const useParameterizationList = () => {
    return useQuery({
        queryKey: parameterizationKeys.lists(),
        queryFn: () => parameterizationService.list(),
        staleTime: 1000 * 60 * 10, // 10 minutes cache
    })
}

export const useCreateParameterization = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateParameterizationPayload) => parameterizationService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: parameterizationKeys.lists() })
        },
    })
}

export const useUpdateParameterization = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateParameterizationPayload }) =>
            parameterizationService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: parameterizationKeys.lists() })
        },
    })
}

export const useDeleteParameterization = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => parameterizationService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: parameterizationKeys.lists() })
        },
    })
}
