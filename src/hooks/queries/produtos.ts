import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { produtoService, type Produto } from '../../services/produto'

export const produtoKeys = {
    all: ['produtos'] as const,
    lists: () => [...produtoKeys.all, 'list'] as const,
    list: (params: any) => [...produtoKeys.lists(), { ...params }] as const,
    details: () => [...produtoKeys.all, 'detail'] as const,
    detail: (id: string) => [...produtoKeys.details(), id] as const,
}

export const useProdutosList = (tenantId?: string) => {
    return useQuery({
        queryKey: produtoKeys.list({ tenantId }),
        queryFn: () => produtoService.list(tenantId),
        staleTime: 1000 * 60 * 5,
    })
}

export const useProduto = (id: string | undefined | null) => {
    return useQuery({
        queryKey: produtoKeys.detail(id || ''),
        queryFn: () => {
            if (!id) throw new Error('Produto ID is required')
            return produtoService.getById(id)
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    })
}

export const useCreateProduto = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: Partial<Produto>) => produtoService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: produtoKeys.lists() })
        }
    })
}

export const useUpdateProduto = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: Partial<Produto> }) =>
            produtoService.update(id, payload),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: produtoKeys.detail(data.uuid) })
            queryClient.invalidateQueries({ queryKey: produtoKeys.lists() })
        }
    })
}

export const useDeleteProduto = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => produtoService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: produtoKeys.lists() })
        }
    })
}

// Complementary Mutations
export const useUpdateProdutoComplementary = (type: 'fiscal' | 'logistica' | 'precos' | 'seo') => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => {
            switch (type) {
                case 'fiscal': return produtoService.updateFiscal(id, data)
                case 'logistica': return produtoService.updateLogistica(id, data)
                case 'precos': return produtoService.updatePrecos(id, data)
                case 'seo': return produtoService.updateSeo(id, data)
                default: throw new Error('Invalid type')
            }
        },
        onSuccess: (_data, { id }) => {
            queryClient.invalidateQueries({ queryKey: produtoKeys.detail(id) })
        }
    })
}

export const useAddProdutoSubResource = (type: 'ficha-tecnica' | 'media' | 'kit' | 'variacoes') => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => {
            switch (type) {
                case 'ficha-tecnica': return produtoService.addFichaTecnica(id, data)
                case 'media': return produtoService.addMedia(id, data)
                case 'kit': return produtoService.addKitItem(id, data)
                case 'variacoes': return produtoService.addVariacao(id, data)
                default: throw new Error('Invalid type')
            }
        },
        onSuccess: (_data, { id }) => {
            queryClient.invalidateQueries({ queryKey: produtoKeys.detail(id) })
        }
    })
}

export const useDeleteProdutoSubResource = (type: 'ficha-tecnica' | 'media' | 'kit' | 'variacoes') => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id: _id, itemId }: { id: string; itemId: string }) => {
            switch (type) {
                case 'ficha-tecnica': return produtoService.deleteFichaTecnica(itemId)
                case 'media': return produtoService.deleteMedia(itemId)
                case 'kit': return produtoService.deleteKitItem(itemId)
                case 'variacoes': return produtoService.deleteVariacao(itemId)
                default: throw new Error('Invalid type')
            }
        },
        onSuccess: (_data, { id }) => {
            queryClient.invalidateQueries({ queryKey: produtoKeys.detail(id) })
        }
    })
}

export const useUpdateProdutoSubResource = (type: 'ficha-tecnica' | 'media' | 'kit' | 'variacoes') => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id: _id, itemId, data }: { id: string; itemId: string; data: any }) => {
            switch (type) {
                case 'media': return produtoService.updateMedia(itemId, data)
                default: throw new Error('Update not implemented for this type yet')
            }
        },
        onSuccess: (_data, { id }) => {
            queryClient.invalidateQueries({ queryKey: produtoKeys.detail(id) })
        }
    })
}
