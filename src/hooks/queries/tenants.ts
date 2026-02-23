import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tenantService } from '../../services/tenants'

export const useTenants = () => {
    return useQuery({
        queryKey: ['tenants'],
        queryFn: () => tenantService.list()
    })
}

export const useTenant = (id: string | null) => {
    return useQuery({
        queryKey: ['tenants', id],
        queryFn: async () => {
            if (!id || id === 'undefined') return null
            return tenantService.getById(id)
        },
        enabled: !!id && id !== 'undefined'
    })
}

export const useUpdateTenant = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => tenantService.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] })
            queryClient.invalidateQueries({ queryKey: ['tenants', variables.id] })
        }
    })
}

export const useDeleteTenant = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => tenantService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tenants'] })
        }
    })
}

export const useSaveTenantAddress = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ tenantId, data }: { tenantId: string, data: any }) => tenantService.saveAddress(tenantId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['tenants', variables.tenantId] })
        }
    })
}

export const useTenantContactMutations = (tenantId: string) => {
    const queryClient = useQueryClient()

    const create = useMutation({
        mutationFn: (data: any) => tenantService.createContact(tenantId, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants', tenantId] })
    })

    const update = useMutation({
        mutationFn: ({ contactId, data }: { contactId: string, data: any }) => tenantService.updateContact(tenantId, contactId, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants', tenantId] })
    })

    const remove = useMutation({
        mutationFn: (contactId: string) => tenantService.removeContact(tenantId, contactId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenants', tenantId] })
    })

    return { create, update, remove }
}
