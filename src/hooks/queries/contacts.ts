import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contatosService, type CreateContactDTO, type UpdateContactDTO } from '../../services/contatos';
import { contractsService } from '../../services/contracts';

export const contactKeys = {
    all: ['contacts'] as const,
    lists: () => [...contactKeys.all, 'list'] as const,
    list: (params: any) => [...contactKeys.lists(), params] as const,
    details: () => [...contactKeys.all, 'detail'] as const,
    detail: (id: string) => [...contactKeys.details(), id] as const,
    dashboards: () => [...contactKeys.all, 'dashboard'] as const,
    dashboard: (id: string) => [...contactKeys.dashboards(), id] as const,
};

export function useContactList(params: {
    page: number;
    limit: number;
    query?: string;
    filters?: any;
    sorts?: any[];
} | null | undefined) {
    return useQuery({
        queryKey: contactKeys.list(params || {}),
        queryFn: () => contatosService.listPaginated(params!),
        enabled: !!params,
        placeholderData: (previousData) => previousData,
        staleTime: 5000,
    });
}

export function useContact(id: string | null) {
    return useQuery({
        queryKey: contactKeys.detail(id || ''),
        queryFn: () => contatosService.getById(id!),
        enabled: !!id,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

export function useContactDashboard(id: string | null) {
    return useQuery({
        queryKey: contactKeys.dashboard(id || ''),
        queryFn: async () => {
            const [dashboardResponse, draftContractsResponse] = await Promise.all([
                contatosService.getDashboardDetails(id!),
                contractsService.listPaginated({
                    page: 1,
                    limit: 100,
                    filters: {
                        clienteId: id,
                        status: 'draft',
                    },
                }),
            ]);

            return {
                contact: dashboardResponse.contact,
                draftContracts: draftContractsResponse.data,
            };
        },
        enabled: !!id,
        staleTime: 1000 * 60, // 1 minute
    });
}

export function useCreateContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateContactDTO) => contatosService.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
        },
    });
}

export function useUpdateContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateContactDTO }) =>
            contatosService.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
            queryClient.invalidateQueries({ queryKey: contactKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: contactKeys.dashboard(variables.id) });
        },
    });
}

export function useDeleteContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => contatosService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
        },
    });
}

export function useInactivateContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updatedBy }: { id: string; updatedBy: string }) =>
            contatosService.inactivate(id, updatedBy),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
            queryClient.invalidateQueries({ queryKey: contactKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: contactKeys.dashboard(variables.id) });
        },
    });
}

export function useReactivateContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updatedBy }: { id: string; updatedBy: string }) =>
            contatosService.reactivate(id, updatedBy),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
            queryClient.invalidateQueries({ queryKey: contactKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: contactKeys.dashboard(variables.id) });
        },
    });
}
