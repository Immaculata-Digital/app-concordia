import { useEffect } from 'react'
import {
    TextField,
    Grid
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { tenantService } from '../../../services/tenants'
import type { TenantDTO } from '../../../services/tenants'
import { TableCardModal } from '../../../components/Modals'
import { isFull } from '../../../utils/accessControl'
import type { AccessMode } from '../../../components/Dashboard/DashboardBodyCard'

type Props = {
    open: boolean
    onClose: () => void
    tenantToEdit?: TenantDTO | null
    onSuccess: (message: string) => void
    onError: (message: string) => void
    accessMode?: AccessMode
}

type FormValues = {
    name: string
    slug: string
}

export function TenantFormDialog({
    open,
    onClose,
    tenantToEdit,
    onSuccess,
    onError,
    accessMode = 'full'
}: Props) {
    const queryClient = useQueryClient()

    const { control, handleSubmit, reset, formState: { isDirty, errors } } = useForm<FormValues>({
        defaultValues: {
            name: '',
            slug: '',
        }
    })

    useEffect(() => {
        if (open) {
            reset({
                name: tenantToEdit?.name || '',
                slug: tenantToEdit?.slug || '',
            })
        }
    }, [open, tenantToEdit, reset])

    const mutation = useMutation({
        mutationFn: async (data: FormValues) => {
            if (tenantToEdit) {
                return tenantService.update(tenantToEdit.id, data)
            } else {
                return tenantService.create(data)
            }
        },
        onSuccess: () => {
            onSuccess(tenantToEdit ? 'Tenant atualizado com sucesso' : 'Tenant criado com sucesso')
            queryClient.invalidateQueries({ queryKey: ['tenants'] })
            onClose()
        },
        onError: (error: any) => {
            onError(error?.response?.data?.message || 'Erro ao salvar tenant')
        }
    })

    const onSubmit = (data: FormValues) => {
        mutation.mutate(data)
    }

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSubmit(onSubmit)}
            title="Tenant"
            mode={tenantToEdit ? 'edit' : 'add'}
            saving={mutation.isPending}
            isDirty={isDirty}
            canSave={isFull(accessMode)}
            maxWidth="sm"
        >
            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <Controller
                        name="name"
                        control={control}
                        rules={{ required: 'Nome é obrigatório' }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Nome"
                                placeholder="Ex: Matriz"
                                fullWidth
                                required
                                error={!!errors.name}
                                helperText={errors.name?.message}
                                disabled={!isFull(accessMode)}
                            />
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Controller
                        name="slug"
                        control={control}
                        rules={{ required: 'Slug é obrigatório' }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Slug / Chave"
                                placeholder="Ex: matriz"
                                fullWidth
                                required
                                error={!!errors.slug}
                                helperText={errors.slug?.message}
                                disabled={!isFull(accessMode)}
                            />
                        )}
                    />
                </Grid>
            </Grid>
        </TableCardModal>
    )
}
