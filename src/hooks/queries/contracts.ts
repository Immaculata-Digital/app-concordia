
import { useQuery, useMutation, type UseQueryOptions, useQueryClient } from '@tanstack/react-query'
import {
    contractsService,
    type ContractDashboardDetailsDTO,
    type UpdateContractPayload,
    type CreateContractAttachmentPayload,
    type UpdateContractAttachmentPayload
} from '../../services/contracts'

export const contractKeys = {
    all: ['contracts'] as const,
    lists: () => [...contractKeys.all, 'list'] as const,
    list: (filters: any) => [...contractKeys.lists(), filters] as const,
    details: () => [...contractKeys.all, 'detail'] as const,
    detail: (id: string) => [...contractKeys.details(), id] as const,
    dashboard: (id: string) => [...contractKeys.detail(id), 'dashboard'] as const,
    statuses: () => [...contractKeys.all, 'statuses'] as const
}

export const useContractStatus = () => {
    return useQuery({
        queryKey: contractKeys.statuses(),
        queryFn: contractsService.status.list,
        staleTime: 1000 * 60 * 60, // 1 hour
    })
}

export const useContractDashboardDetails = (
    contractId: string | null | undefined,
    options?: Omit<UseQueryOptions<ContractDashboardDetailsDTO, Error, ContractDashboardDetailsDTO, readonly ["contracts", "detail", string, "dashboard"]>, 'queryKey' | 'queryFn'>
) => {
    return useQuery({
        queryKey: contractKeys.dashboard(contractId || ''),
        queryFn: async () => {
            if (!contractId) throw new Error('Contract ID is required')
            return contractsService.getDashboardDetails(contractId)
        },
        enabled: !!contractId,
        staleTime: 1000 * 60 * 5, // 5 minutes
        ...options,
    })
}

export const useContract = (id: string | null | undefined) => {
    return useQuery({
        queryKey: contractKeys.detail(id || ''),
        queryFn: async () => {
            if (!id) throw new Error('ID is required')
            return contractsService.getById(id)
        },
        enabled: !!id,
    })
}

export const useUpdateContract = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateContractPayload }) =>
            contractsService.update(id, payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: contractKeys.detail(variables.id) })
            queryClient.invalidateQueries({ queryKey: contractKeys.lists() })
        },
    })
}

// ... more hooks for attachments/signers to invalidate cache ...
export const useAddAttachment = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: CreateContractAttachmentPayload) => contractsService.attachments.create(payload),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: contractKeys.dashboard(variables.contractId) })
        },
    })
}

export const useUpdateAttachment = () => {
    // const queryClient = useQueryClient()
    // Need contractId to invalidate correct query
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdateContractAttachmentPayload }) =>
            contractsService.attachments.update(id, payload),
        onSuccess: (_data, _variables, _context: any) => {
            // We don't have contractId in payload easily unless we pass it.
            // Or invalidate ALL dashboards? No.
            // Best practice: return context with contractId or optimize cache updates.
            // Since we use global state for dashboard, we can refetch the active dashboard query if id matches.
        },
    })
}

export const useContractList = (params: any) => {
    return useQuery({
        queryKey: contractKeys.list(params),
        queryFn: async () => contractsService.listPaginated(params),
        placeholderData: (previousData) => previousData, // keep previous data while fetching new page
        staleTime: 1000 * 60, // 1 minute
    })
}

export const useRemoveAttachment = () => {
    // const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id }: { id: string }) => contractsService.attachments.remove(id),
        // difficult to know which contract to invalidate without passing it.
    })
}
