
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    accessGroupService,
    type CreateAccessGroupPayload,
    type UpdateAccessGroupPayload,
} from '../../services/accessGroups'

export const accessGroupKeys = {
    all: ['accessGroups'] as const,
    lists: () => [...accessGroupKeys.all, 'list'] as const,
    features: () => ['features'] as const,
}

export const useAccessGroupList = () => {
    return useQuery({
        queryKey: accessGroupKeys.lists(),
        queryFn: () => accessGroupService.list(),
        staleTime: 1000 * 60 * 30, // 30 minutes
    })
}

export const useFeatureList = () => {
    return useQuery({
        queryKey: accessGroupKeys.features(),
        queryFn: () => accessGroupService.listFeatures(),
        staleTime: 1000 * 60 * 60, // 1 hour (features rarely change)
    })
}

export const useCreateAccessGroup = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateAccessGroupPayload) => accessGroupService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accessGroupKeys.lists() })
        },
    })
}

export const useUpdateAccessGroup = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateAccessGroupPayload }) =>
            accessGroupService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accessGroupKeys.lists() })
        },
    })
}

export const useDeleteAccessGroup = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => accessGroupService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: accessGroupKeys.lists() })
        },
    })
}
