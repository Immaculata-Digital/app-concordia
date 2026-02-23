import { useEffect, useState, useMemo } from 'react'
import { Grid } from '@mui/material'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { pluvytClientService } from '../../../services/pluvytClients'
import { peopleService } from '../../../services/people'
import type { PluvytClientDTO } from '../../../services/pluvytClients'
import { TableCardModal } from '../../../components/Modals'
import { isFull } from '../../../utils/accessControl'
import type { AccessMode } from '../../../components/Dashboard/DashboardBodyCard'
import SelectPicker from '../../../components/SelectPicker'
import NumberPicker from '../../../components/NumberPicker'
import Toast from '../../../components/Toast'

type Props = {
    open: boolean
    onClose: () => void
    clientToEdit?: PluvytClientDTO | null
    onSuccess: (message: string) => void
    onError: (message: string) => void
    accessMode?: AccessMode
}

export function PluvytClientFormDialog({
    open,
    onClose,
    clientToEdit,
    onSuccess,
    onError,
    accessMode = 'full'
}: Props) {
    const queryClient = useQueryClient()
    const [error, setError] = useState<string | null>(null)

    const [form, setForm] = useState({
        personId: '',
        saldo: 0
    })

    const [initialForm, setInitialForm] = useState({
        personId: '',
        saldo: 0
    })

    // Fetch people for selection
    const { data: people = [] } = useQuery({
        queryKey: ['people-list-for-picker'],
        queryFn: () => peopleService.list(),
        enabled: open && !clientToEdit
    })

    const peopleOptions = useMemo(() =>
        people.map(p => ({ label: `${p.name} (${p.cpfCnpj})`, value: p.id })),
        [people])

    useEffect(() => {
        if (open) {
            const initial = {
                personId: clientToEdit?.personId || '',
                saldo: clientToEdit?.saldo || 0
            }
            setForm(initial)
            setInitialForm(initial)
            setError(null)
        }
    }, [open, clientToEdit])

    const mutation = useMutation({
        mutationFn: async (data: typeof form) => {
            if (clientToEdit) {
                return pluvytClientService.update(clientToEdit.id, { saldo: data.saldo })
            } else {
                return pluvytClientService.create(data)
            }
        },
        onSuccess: () => {
            onSuccess(clientToEdit ? 'Cliente atualizado com sucesso' : 'Cliente registrado com sucesso')
            queryClient.invalidateQueries({ queryKey: ['pluvyt-clients'] })
            onClose()
        },
        onError: (err: any) => {
            onError(err.response?.data?.message || 'Erro ao salvar cliente Pluvyt')
        }
    })

    const handleSave = () => {
        if (!form.personId) {
            setError('Selecione uma pessoa para ser o cliente')
            return
        }
        mutation.mutate(form)
    }

    const isDirty = useMemo(() => {
        return JSON.stringify(form) !== JSON.stringify(initialForm)
    }, [form, initialForm])

    return (
        <>
            <TableCardModal
                open={open}
                onClose={onClose}
                onSave={handleSave}
                title="Cliente Pluvyt"
                mode={clientToEdit ? 'edit' : 'add'}
                saving={mutation.isPending}
                isDirty={isDirty}
                canSave={isFull(accessMode)}
                maxWidth="sm"
            >
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <SelectPicker
                            label="Pessoa"
                            value={form.personId}
                            onChange={(val) => setForm(prev => ({ ...prev, personId: val as string }))}
                            options={clientToEdit ? [{ label: clientToEdit.personName || 'Sem nome', value: clientToEdit.personId }] : peopleOptions}
                            fullWidth
                            placeholder="Selecione a pessoa"
                            required
                            disabled={!!clientToEdit || !isFull(accessMode)}
                            accessMode={accessMode}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <NumberPicker
                            label="Saldo"
                            value={form.saldo}
                            onChange={(val) => setForm(prev => ({ ...prev, saldo: val || 0 }))}
                            fullWidth
                            required
                            disabled={!isFull(accessMode)}
                            format="integer"
                        />
                    </Grid>
                </Grid>
            </TableCardModal>
            <Toast
                open={Boolean(error)}
                message={error}
                onClose={() => setError(null)}
                severity="error"
            />
        </>
    )
}
