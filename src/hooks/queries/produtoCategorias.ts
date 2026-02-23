import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { produtoCategoriaService, type CreateProdutoCategoriaPayload, type UpdateProdutoCategoriaPayload } from '../../services/produtoCategorias'

export const useProdutoCategorias = () => {
    return useQuery({
        queryKey: ['produto-categorias'],
        queryFn: async () => {
            return produtoCategoriaService.list()
        }
    })
}

export const useCreateProdutoCategoria = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: produtoCategoriaService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['produto-categorias'] })
        }
    })
}

export const useUpdateProdutoCategoria = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ uuid, payload }: { uuid: string, payload: UpdateProdutoCategoriaPayload }) =>
            produtoCategoriaService.update(uuid, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['produto-categorias'] })
        }
    })
}

export const useDeleteProdutoCategoria = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: produtoCategoriaService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['produto-categorias'] })
        }
    })
}
