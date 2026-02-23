
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
    peopleService,
    type CreatePeoplePayload,
    type UpdatePeoplePayload,
    type CreateContactPayload,
    type UpdateContactPayload,
    type CreateAddressPayload,
    type UpdateAddressPayload,
    type CreateBankAccountPayload,
    type UpdateBankAccountPayload,
    type CreateDocumentPayload,
    type UpdateDocumentPayload,
    type CreateDetailPayload,
    type UpdateDetailPayload,
    type CreateRelationshipPayload,

} from '../../services/people'

export const peopleKeys = {
    all: ['people'] as const,
    lists: () => [...peopleKeys.all, 'list'] as const,
    list: (params: any) => [...peopleKeys.lists(), { ...params }] as const,
    details: () => [...peopleKeys.all, 'detail'] as const,
    detail: (id: string) => [...peopleKeys.details(), id] as const,
    relationshipTypes: () => [...peopleKeys.all, 'relationship-types'] as const,
    // Add sub-resources keys if needed for specific caching strategies, 
    // but usually invalidating the detail is enough for sub-resources embedded in the detail.
}

export const usePeopleList = (params: any) => {
    return useQuery({
        queryKey: peopleKeys.list(params),
        queryFn: () => peopleService.listPaginated(params),
        staleTime: 1000 * 60 * 5, // 5 minutes
        placeholderData: (previousData) => previousData,
    })
}

export const usePeople = () => {
    // Keeping the original simpler list for compatibility if needed, but prefere usePeopleList
    return useQuery({
        queryKey: peopleKeys.lists(),
        queryFn: () => peopleService.list(),
        staleTime: 1000 * 60 * 10,
    })
}

export const usePerson = (id: string | undefined | null) => {
    return useQuery({
        queryKey: peopleKeys.detail(id || ''),
        queryFn: () => {
            if (!id) throw new Error('Person ID is required')
            return peopleService.getById(id)
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 5, // 5 minutes
    })
}

export const useRelationshipTypes = () => {
    return useQuery({
        queryKey: peopleKeys.relationshipTypes(),
        queryFn: () => peopleService.listRelationshipTypes(),
        staleTime: 1000 * 60 * 60, // 1 hour
    })
}

// Mutations
export const useCreatePerson = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: CreatePeoplePayload) => peopleService.create(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.lists() })
        }
    })
}

export const useUpdatePerson = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, payload }: { id: string; payload: UpdatePeoplePayload }) =>
            peopleService.update(id, payload),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.detail(data.id) })
            queryClient.invalidateQueries({ queryKey: peopleKeys.lists() })
        }
    })
}

export const useDeletePerson = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => peopleService.remove(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.lists() })
        }
    })
}

// Sub-resources Mutations Helper
// Since most sub-resources update the main Person object structure in the dashboard,
// we generally want to invalidate the specific Person query.

export const usePersonMutation = <TData, TVariables>(
    mutationFn: (variables: TVariables) => Promise<TData>,
    personIdExtractor: (variables: TVariables) => string
) => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn,
        onSuccess: (_data, variables) => {
            const personId = personIdExtractor(variables)
            queryClient.invalidateQueries({ queryKey: peopleKeys.detail(personId) })
        }
    })
}

// Contacts
export const useAddContact = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ peopleId, payload }: { peopleId: string; payload: CreateContactPayload }) =>
            peopleService.createContact(peopleId, payload),
        onSuccess: (_data, { peopleId }) => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.detail(peopleId) })
        }
    })
}

export const useUpdateContact = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ peopleId, contactId, payload }: { peopleId: string; contactId: string; payload: UpdateContactPayload }) =>
            peopleService.updateContact(peopleId, contactId, payload),
        onSuccess: (_data, { peopleId }) => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.detail(peopleId) })
        }
    })
}

export const useRemoveContact = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ peopleId, contactId }: { peopleId: string; contactId: string }) =>
            peopleService.removeContact(peopleId, contactId),
        onSuccess: (_data, { peopleId }) => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.detail(peopleId) })
        }
    })
}

// Addresses
export const useAddAddress = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ peopleId, payload }: { peopleId: string; payload: CreateAddressPayload }) =>
            peopleService.createAddress(peopleId, payload),
        onSuccess: (_data, { peopleId }) => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.detail(peopleId) })
        }
    })
}

export const useUpdateAddress = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ peopleId, addressId, payload }: { peopleId: string; addressId: string; payload: UpdateAddressPayload }) =>
            peopleService.updateAddress(peopleId, addressId, payload),
        onSuccess: (_data, { peopleId }) => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.detail(peopleId) })
        }
    })
}

export const useRemoveAddress = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ peopleId, addressId }: { peopleId: string; addressId: string }) =>
            peopleService.removeAddress(peopleId, addressId),
        onSuccess: (_data, { peopleId }) => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.detail(peopleId) })
        }
    })
}

// Bank Accounts
export const useAddBankAccount = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ peopleId, payload }: { peopleId: string; payload: CreateBankAccountPayload }) =>
            peopleService.createBankAccount(peopleId, payload),
        onSuccess: (_data, { peopleId }) => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.detail(peopleId) })
        }
    })
}

export const useUpdateBankAccount = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ peopleId, accountId, payload }: { peopleId: string; accountId: string; payload: UpdateBankAccountPayload }) =>
            peopleService.updateBankAccount(peopleId, accountId, payload),
        onSuccess: (_data, { peopleId }) => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.detail(peopleId) })
        }
    })
}

export const useRemoveBankAccount = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ peopleId, accountId }: { peopleId: string; accountId: string }) =>
            peopleService.removeBankAccount(peopleId, accountId),
        onSuccess: (_data, { peopleId }) => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.detail(peopleId) })
        }
    })
}

// Documents
export const useAddDocument = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ peopleId, payload }: { peopleId: string; payload: CreateDocumentPayload }) =>
            peopleService.createDocument(peopleId, payload),
        onSuccess: (_data, { peopleId }) => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.detail(peopleId) })
        }
    })
}

export const useUpdateDocument = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ peopleId, documentId, payload }: { peopleId: string; documentId: string; payload: UpdateDocumentPayload }) =>
            peopleService.updateDocument(peopleId, documentId, payload),
        onSuccess: (_data, { peopleId }) => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.detail(peopleId) })
        }
    })
}

export const useRemoveDocument = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ peopleId, documentId }: { peopleId: string; documentId: string }) =>
            peopleService.removeDocument(peopleId, documentId),
        onSuccess: (_data, { peopleId }) => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.detail(peopleId) })
        }
    })
}

// Details
export const useUpdateDetail = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ peopleId, detailId, payload }: { peopleId: string; detailId: string; payload: UpdateDetailPayload }) =>
            peopleService.updateDetail(peopleId, detailId, payload),
        onSuccess: (_data, { peopleId }) => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.detail(peopleId) })
        }
    })
}

export const useCreateDetail = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ peopleId, payload }: { peopleId: string; payload: CreateDetailPayload }) =>
            peopleService.createDetail(peopleId, payload),
        onSuccess: (_data, { peopleId }) => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.detail(peopleId) })
        }
    })
}

// Relationships
export const useAddRelationship = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ peopleId, payload }: { peopleId: string; payload: CreateRelationshipPayload }) =>
            peopleService.createRelationship(peopleId, payload),
        onSuccess: (_data, { peopleId }) => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.detail(peopleId) })
        }
    })
}

export const useUpdateRelationship = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ peopleId, relationshipId, payload }: { peopleId: string; relationshipId: string; payload: any }) =>
            peopleService.updateRelationship(peopleId, relationshipId, payload),
        onSuccess: (_data, { peopleId }) => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.detail(peopleId) })
        }
    })
}

export const useRemoveRelationship = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ peopleId, relationshipId }: { peopleId: string; relationshipId: string }) =>
            peopleService.removeRelationship(peopleId, relationshipId),
        onSuccess: (_data, { peopleId }) => {
            queryClient.invalidateQueries({ queryKey: peopleKeys.detail(peopleId) })
        }
    })
}
