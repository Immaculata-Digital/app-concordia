import { useEffect } from 'react'
import {
    TextField,
    Grid
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { peopleService } from '../../../services/people'
import type { PeopleRelationshipType } from '../../../services/people'
import { TableCardModal } from '../../../components/Modals'
import { isFull } from '../../../utils/accessControl'
import type { AccessMode } from '../../../components/Dashboard/DashboardBodyCard'
import { Typography } from '@mui/material'

type Props = {
    open: boolean
    onClose: () => void
    typeToEdit?: PeopleRelationshipType | null
    onSuccess: (message: string) => void
    onError: (message: string) => void
    accessMode?: AccessMode
}

type FormValues = {
    connectorPrefix: string
    relationshipSource: string
    connectorSuffix: string
    relationshipTarget: string
}

export function RelationshipTypeFormDialog({
    open,
    onClose,
    typeToEdit,
    onSuccess,
    onError,
    accessMode = 'full'
}: Props) {
    const queryClient = useQueryClient()

    const { control, handleSubmit, reset, watch, formState: { isDirty } } = useForm<FormValues>({
        defaultValues: {
            connectorPrefix: '',
            relationshipSource: '',
            connectorSuffix: '',
            relationshipTarget: '',
        }
    })

    useEffect(() => {
        if (open) {
            reset({
                connectorPrefix: typeToEdit?.connectorPrefix || '',
                relationshipSource: typeToEdit?.relationshipSource || '',
                connectorSuffix: typeToEdit?.connectorSuffix || '',
                relationshipTarget: typeToEdit?.relationshipTarget || '',
            })
        }
    }, [open, typeToEdit, reset])

    // Mutation
    const mutation = useMutation({
        mutationFn: async (data: FormValues) => {
            const payload = {
                ...data,
                inverseTypeId: typeToEdit?.inverseTypeId || crypto.randomUUID()
            }

            if (typeToEdit) {
                return peopleService.updateRelationshipType(typeToEdit.id, payload)
            } else {
                return peopleService.createRelationshipType(payload)
            }
        },
        onSuccess: () => {
            onSuccess(typeToEdit ? 'Tipo atualizado com sucesso' : 'Tipo criado com sucesso')
            queryClient.invalidateQueries({ queryKey: ['relationship-types'] })
            onClose()
        },
        onError: () => {
            onError('Erro ao salvar tipo de relacionamento')
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
            title="Tipo de Relacionamento"
            mode={typeToEdit ? 'edit' : 'add'}
            saving={mutation.isPending}
            isDirty={isDirty}
            canSave={isFull(accessMode)}
            maxWidth="sm"
        >
            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <Controller
                        name="connectorPrefix"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Prefixo"
                                placeholder="Ex: É"
                                fullWidth
                                required
                                disabled={!isFull(accessMode)}
                            />
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Controller
                        name="relationshipSource"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Origem"
                                placeholder="Ex: Pai"
                                fullWidth
                                required
                                disabled={!isFull(accessMode)}
                            />
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Controller
                        name="connectorSuffix"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Sufixo"
                                placeholder="Ex: de"
                                fullWidth
                                required
                                disabled={!isFull(accessMode)}
                            />
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <Controller
                        name="relationshipTarget"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Destino"
                                placeholder="Ex: Filho"
                                fullWidth
                                required
                                disabled={!isFull(accessMode)}
                            />
                        )}
                    />
                </Grid>

                {/* Sentence Builder Visual */}
                <Grid size={{ xs: 12 }} sx={{ mt: 1, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                        Visualização da frase:
                    </Typography>
                    <Typography variant="body2">
                        [Pessoa A] <strong>{watch('connectorPrefix') || '...'}</strong> <strong>{watch('relationshipSource') || '...'}</strong> <strong>{watch('connectorSuffix') || '...'}</strong> [Pessoa B]
                    </Typography>
                </Grid>
            </Grid>
        </TableCardModal>
    )
}

