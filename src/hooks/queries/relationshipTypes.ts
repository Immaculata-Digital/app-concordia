
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { relationshipTypeService, type CreateRelationshipTypePayload, type UpdateRelationshipTypePayload } from '../../services/relationshipTypes'

export const relationshipTypeKeys = {
    all: ['relationship-types'] as const,
    lists: () => [...relationshipTypeKeys.all, 'list'] as const,
    list: (params?: any) => [...relationshipTypeKeys.lists(), params] as const,
    details: () => [...relationshipTypeKeys.all, 'detail'] as const,
    detail: (id: string) => [...relationshipTypeKeys.details(), id] as const,
}

export const useRelationshipTypeList = (params?: any) => {
    return useQuery({
        queryKey: relationshipTypeKeys.list(params),
        queryFn: () => relationshipTypeService.list(),
        staleTime: 1000 * 60 * 5, // 5 minutes cache
    })
}

export const useRelationshipTypeMutation = () => {
    const queryClient = useQueryClient()

    const createMutation = useMutation({
        mutationFn: (payload: CreateRelationshipTypePayload) => relationshipTypeService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: relationshipTypeKeys.lists() })
        }
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateRelationshipTypePayload }) =>
            relationshipTypeService.update(id, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: relationshipTypeKeys.lists() })
            queryClient.invalidateQueries({ queryKey: relationshipTypeKeys.detail(variables.id) })
        }
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => relationshipTypeService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: relationshipTypeKeys.lists() })
        }
    })

    return {
        createMutation,
        updateMutation,
        deleteMutation,
    }
}
