import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentService, type DocumentDTO } from '../../services/documents'

export const documentKeys = {
    all: ['documents'] as const,
    lists: () => [...documentKeys.all, 'list'] as const,
    list: (filters: any) => [...documentKeys.lists(), filters] as const,
    details: () => [...documentKeys.all, 'detail'] as const,
    detail: (id: string) => [...documentKeys.details(), id] as const,
}

export const useDocumentList = (params: { title?: string, code?: string, category_code?: string, enabled?: boolean } = {}) => {
    return useQuery({
        queryKey: documentKeys.list(params),
        queryFn: async () => {
            // Mapping filters to what the API expects
            // documentService.listDocuments currently doesn't take params but we should update it if needed
            // Actually, let's update documentService.listDocuments to accept filters
            return documentService.listDocuments(params)
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

export const useDocument = (id: string | null) => {
    return useQuery({
        queryKey: documentKeys.detail(id || ''),
        queryFn: () => documentService.getDocumentById(id!),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    })
}

export const useDocumentMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (data: Partial<DocumentDTO>) => documentService.saveDocument(data),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
            if (data.id) {
                queryClient.invalidateQueries({ queryKey: documentKeys.detail(data.id) })
            }
        }
    })
}

export const useDeleteDocumentMutation = () => {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: (id: string) => documentService.deleteDocument(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: documentKeys.lists() })
        }
    })
}
