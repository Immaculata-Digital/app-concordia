
import { useQuery } from '@tanstack/react-query'
import { ibgeService } from '../../services/ibge'

export const ibgeKeys = {
    all: ['ibge'] as const,
    estados: () => [...ibgeKeys.all, 'estados'] as const,
    municipios: (uf: string) => [...ibgeKeys.all, 'municipios', uf] as const,
}

export const useEstados = () => {
    return useQuery({
        queryKey: ibgeKeys.estados(),
        queryFn: () => ibgeService.getEstados(),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    })
}

export const useMunicipios = (uf: string | null) => {
    return useQuery({
        queryKey: ibgeKeys.municipios(uf || ''),
        queryFn: () => {
            if (!uf) return Promise.resolve([])
            return ibgeService.getMunicipiosByUF(uf)
        },
        enabled: !!uf,
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    })
}
