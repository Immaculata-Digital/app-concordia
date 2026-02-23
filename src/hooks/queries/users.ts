
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    userService,
    type CreateUserPayload,
    type UpdateUserBasicPayload,
    type UpdateUserGroupsPayload,
    type UpdateUserPermissionsPayload,
} from '../../services/users'

export const userKeys = {
    all: ['users'] as const,
    lists: () => [...userKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...userKeys.lists(), filters] as const,
    details: () => [...userKeys.all, 'detail'] as const,
    detail: (id: string) => [...userKeys.details(), id] as const,
}

export const useUserList = (filters?: { search?: string; groupId?: string; feature?: string; tenantId?: string }) => {
    return useQuery({
        queryKey: userKeys.list(filters || {}),
        queryFn: () => userService.list(filters),
        staleTime: 1000 * 60 * 5, // 5 minutes
        placeholderData: (previousData) => previousData,
    })
}

export const useUsers = useUserList

export const useUser = (id: string | undefined | null) => {
    return useQuery({
        queryKey: userKeys.detail(id || ''),
        queryFn: () => {
            if (!id) throw new Error('User ID is required')
            return userService.getById(id)
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 30, // 30 minutes
    })
}

export const useCreateUser = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateUserPayload) => userService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() })
        },
    })
}

export const useUpdateUserBasic = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateUserBasicPayload }) =>
            userService.updateBasic(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
            queryClient.invalidateQueries({ queryKey: userKeys.lists() })
        },
    })
}

export const useUpdateUserGroups = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateUserGroupsPayload }) =>
            userService.updateGroups(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
            queryClient.invalidateQueries({ queryKey: userKeys.lists() })
        },
    })
}

export const useUpdateUserPermissions = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateUserPermissionsPayload }) =>
            userService.updatePermissions(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) })
            queryClient.invalidateQueries({ queryKey: userKeys.lists() })
        },
    })
}

export const useDeleteUser = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => userService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() })
        },
    })
}

export const useResetPassword = () => {
    return useMutation({
        mutationFn: (email: string) => userService.requestPasswordReset(email),
    })
}
