
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    contractTemplateService,
    type CreateContractTemplatePayload,
    type UpdateContractTemplatePayload
} from '../../services/contractTemplates'

export const contractTemplateKeys = {
    all: ['contractTemplates'] as const,
    lists: () => [...contractTemplateKeys.all, 'list'] as const,
    list: (filters: any) => [...contractTemplateKeys.lists(), filters] as const,
    details: () => [...contractTemplateKeys.all, 'detail'] as const,
    detail: (id: string) => [...contractTemplateKeys.details(), id] as const,
    variables: () => [...contractTemplateKeys.all, 'variables'] as const,
    screen: () => [...contractTemplateKeys.all, 'screen'] as const,
}

export const useContractTemplateList = (filters: any = {}) => {
    return useQuery({
        queryKey: contractTemplateKeys.list(filters),
        queryFn: () => contractTemplateService.list(),
        staleTime: 1000 * 60 * 5, // 5 minutes
        placeholderData: (previousData) => previousData,
    })
}

export const useContractTemplateScreenData = () => {
    return useQuery({
        queryKey: contractTemplateKeys.screen(),
        queryFn: () => contractTemplateService.getScreenData(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

export const useContractTemplateVariables = () => {
    return useQuery({
        queryKey: contractTemplateKeys.variables(),
        queryFn: () => contractTemplateService.getVariables(),
        staleTime: 1000 * 60 * 60, // 1 hour (variables change rarely)
    })
}

export const useContractTemplate = (id: string | null | undefined) => {
    return useQuery({
        queryKey: contractTemplateKeys.detail(id || ''),
        queryFn: async () => {
            if (!id) throw new Error('ID is required')
            return contractTemplateService.getById(id)
        },
        enabled: !!id,
    })
}

export const useCreateContractTemplate = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: CreateContractTemplatePayload) => contractTemplateService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contractTemplateKeys.lists() })
            queryClient.invalidateQueries({ queryKey: contractTemplateKeys.screen() })
        },
    })
}

export const useUpdateContractTemplate = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateContractTemplatePayload }) =>
            contractTemplateService.update(id, payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: contractTemplateKeys.detail(variables.id) })
            queryClient.invalidateQueries({ queryKey: contractTemplateKeys.lists() })
            queryClient.invalidateQueries({ queryKey: contractTemplateKeys.screen() })
        },
    })
}

export const useRemoveContractTemplate = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => contractTemplateService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contractTemplateKeys.lists() })
            queryClient.invalidateQueries({ queryKey: contractTemplateKeys.screen() })
        },
    })
}
