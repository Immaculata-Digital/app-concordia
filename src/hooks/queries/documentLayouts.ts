import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentService, type CreateDocumentLayoutDTO } from '../../services/documents'

export const layoutKeys = {
    all: ['document-layouts'] as const,
    screenData: () => [...layoutKeys.all, 'screenData'] as const,
    lists: () => [...layoutKeys.all, 'list'] as const,
    list: (filters: any) => [...layoutKeys.lists(), filters] as const,
    details: () => [...layoutKeys.all, 'detail'] as const,
    detail: (id: string) => [...layoutKeys.details(), id] as const,
    categories: () => [...layoutKeys.all, 'categories'] as const,
}

export const useLayoutList = (params: { name?: string, category_code?: string, enabled?: boolean } = {}) => {
    return useQuery({
        queryKey: layoutKeys.list(params),
        queryFn: () => documentService.listLayouts(params),
        staleTime: 1000 * 60 * 5,
    })
}

export const useLayoutsScreenData = () => {
    return useQuery({
        queryKey: layoutKeys.all,
        queryFn: () => documentService.getLayoutsScreenData(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

export const useLayout = (id: string | null) => {
    return useQuery({
        queryKey: layoutKeys.detail(id || ''),
        queryFn: () => documentService.getLayoutById(id!),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    })
}

export const useLayoutCategories = () => {
    return useQuery({
        queryKey: layoutKeys.categories(),
        queryFn: () => documentService.listLayoutCategories(),
        staleTime: 1000 * 60 * 60, // 1 hour for categories as they rarely change
    })
}

export const useDocumentLayoutsScreenData = () => {
    return useQuery({
        queryKey: layoutKeys.screenData(),
        queryFn: () => documentService.getLayoutsScreenData(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

export const useCreateLayoutMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: CreateDocumentLayoutDTO) => documentService.createLayout(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: layoutKeys.lists() })
        }
    })
}

export const useUpdateLayoutMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string, data: Partial<CreateDocumentLayoutDTO> & { updated_by: string } }) =>
            documentService.updateLayout(id, data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: layoutKeys.lists() })
            queryClient.invalidateQueries({ queryKey: layoutKeys.detail(data.id) })
        }
    })
}

export const useDeleteLayoutMutation = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => documentService.deleteLayout(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: layoutKeys.lists() })
        }
    })
}
