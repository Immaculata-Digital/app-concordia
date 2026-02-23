import { useState, useEffect, useMemo } from 'react'
import { Grid, TextField, MenuItem, Alert } from '@mui/material'
import { TableCardModal } from '../../../components/Modals/TableCardModal'
import SelectPicker from '../../../components/SelectPicker'
import { usePluvytClients } from '../../../hooks/queries/pluvytClients'
import { useCreatePointTransaction, useUpdatePointTransaction } from '../../../hooks/queries/pointTransactions'
import { useTenants } from '../../../hooks/queries/tenants'
import { useRecompensasList } from '../../../hooks/queries/recompensas'
import type { PointTransactionDTO, CreatePointTransactionPayload } from '../../../services/pointTransactions'

import type { AccessMode } from '../../../components/TableCard'
import { canEdit, canCreate } from '../../../utils/accessControl'

interface PointTransactionFormDialogProps {
    open: boolean
    onClose: () => void
    transactionToEdit: PointTransactionDTO | null
    onSuccess: (message: string) => void
    onError: (message: string) => void
    accessMode: AccessMode
}

export function PointTransactionFormDialog({
    open,
    onClose,
    transactionToEdit,
    onSuccess,
    onError,
    accessMode
}: PointTransactionFormDialogProps) {
    const isEdit = !!transactionToEdit
    const mode = isEdit ? (canEdit(accessMode) ? 'edit' : 'view') : (canCreate(accessMode) ? 'add' : 'view')

    const [form, setForm] = useState<CreatePointTransactionPayload>({
        clientId: '',
        type: 'CREDITO',
        points: 0,
        resultingBalance: 0,
        origin: 'MANUAL',
        observation: ''
    })

    const { data: clients } = usePluvytClients()
    const { data: tenants } = useTenants()
    const { data: recompensas } = useRecompensasList()
    const createMutation = useCreatePointTransaction()
    const updateMutation = useUpdatePointTransaction()

    useEffect(() => {
        if (transactionToEdit) {
            setForm({
                clientId: transactionToEdit.clientId,
                type: transactionToEdit.type,
                points: transactionToEdit.points,
                resultingBalance: transactionToEdit.resultingBalance,
                origin: transactionToEdit.origin,
                observation: transactionToEdit.observation || '',
                rewardItemId: transactionToEdit.rewardItemId,
                lojaId: transactionToEdit.lojaId
            })
        }
    }, [transactionToEdit])

    useEffect(() => {
        if (!isEdit && form.clientId && clients) {
            const client = clients.find(c => c.id === form.clientId)
            if (client) {
                let initialSaldo = client.saldo

                let balance = initialSaldo
                if (form.type === 'CREDITO') {
                    balance = initialSaldo + form.points
                } else if (form.type === 'DEBITO' || form.type === 'ESTORNO') {
                    balance = initialSaldo - form.points
                }

                // Evita loops impedindo que setState rode se for igual
                if (balance !== form.resultingBalance) {
                    setForm(prev => ({ ...prev, resultingBalance: balance }))
                }
            }
        }
    }, [form.clientId, form.type, form.points, clients, isEdit])

    const clientOptions = useMemo(() => {
        return (clients || []).map(c => ({
            value: c.id,
            label: `${c.personName} (Saldo: ${c.saldo})`
        }))
    }, [clients])

    const tenantOptions = useMemo(() => {
        return (tenants || []).map(t => ({
            value: t.id,
            label: t.name
        }))
    }, [tenants])

    const recompensaOptions = useMemo(() => {
        return (recompensas || []).map(r => ({
            value: r.uuid,
            label: r.produto?.nome ? `${r.produto.nome} (${r.qtd_pontos_resgate} pts)` : 'Resgate de Recompensa'
        }))
    }, [recompensas])

    const handleSave = async () => {
        if (!form.clientId) {
            onError('Selecione um cliente')
            return
        }

        try {
            if (isEdit) {
                await updateMutation.mutateAsync({ id: transactionToEdit.id, payload: form })
                onSuccess('Transação atualizada com sucesso')
            } else {
                await createMutation.mutateAsync(form)
                onSuccess('Transação criada com sucesso')
            }
            onClose()
        } catch (error) {
            onError('Erro ao salvar transação')
        }
    }

    const isViewOnly = mode === 'view'

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            mode={mode}
            title="Transação de Pontos"
            saving={createMutation.isPending || updateMutation.isPending}
            maxWidth="sm"
        >
            <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12 }}>
                    <SelectPicker
                        label="Cliente"
                        value={form.clientId}
                        onChange={(val: any) => setForm({ ...form, clientId: val as string })}
                        options={clientOptions}
                        fullWidth
                        disabled={isViewOnly || isEdit}
                    />
                </Grid>

                <Grid size={{ xs: 6 }}>
                    <TextField
                        select
                        fullWidth
                        label="Tipo"
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                        disabled={isViewOnly || isEdit}
                    >
                        <MenuItem value="CREDITO">Crédito (+)</MenuItem>
                        <MenuItem value="DEBITO">Débito (-)</MenuItem>
                        <MenuItem value="ESTORNO">Estorno</MenuItem>
                    </TextField>
                </Grid>

                <Grid size={{ xs: 6 }}>
                    <TextField
                        select
                        fullWidth
                        label="Origem"
                        value={form.origin}
                        onChange={(e) => {
                            const newOrigin = e.target.value as any
                            const clearReward = newOrigin !== 'RESGATE' ? { rewardItemId: undefined } : {}
                            setForm({ ...form, origin: newOrigin, ...clearReward })
                        }}
                        disabled={isViewOnly}
                    >
                        <MenuItem value="MANUAL">Manual</MenuItem>
                        <MenuItem value="RESGATE">Resgate</MenuItem>
                        <MenuItem value="AJUSTE">Ajuste</MenuItem>
                        <MenuItem value="PROMO">Promoção</MenuItem>
                        <MenuItem value="OUTRO">Outro</MenuItem>
                    </TextField>
                </Grid>

                {form.type === 'CREDITO' && (
                    <Grid size={{ xs: 12 }}>
                        <SelectPicker
                            label="Loja (Tenant) de Crédito"
                            value={form.lojaId || ''}
                            onChange={(val: any) => setForm({ ...form, lojaId: val as string })}
                            options={tenantOptions}
                            fullWidth
                            disabled={isViewOnly}
                        />
                    </Grid>
                )}

                {form.origin === 'RESGATE' && (
                    <Grid size={{ xs: 12 }}>
                        <SelectPicker
                            label="Item de Recompensa"
                            value={form.rewardItemId || ''}
                            onChange={(val: any) => {
                                const recompensaOptionId = val as string
                                const recompensaObj = recompensas?.find(r => r.uuid === recompensaOptionId)
                                setForm({
                                    ...form,
                                    rewardItemId: recompensaOptionId,
                                    points: recompensaObj ? recompensaObj.qtd_pontos_resgate : form.points
                                })
                            }}
                            options={recompensaOptions}
                            fullWidth
                            disabled={isViewOnly}
                        />
                    </Grid>
                )}

                <Grid size={{ xs: 6 }}>
                    <TextField
                        fullWidth
                        label="Pontos"
                        type="number"
                        value={form.points || ''}
                        onChange={(e) => {
                            let val = Number(e.target.value)

                            // Limitar débito ou estorno ao saldo atual do cliente
                            if (form.clientId && (form.type === 'DEBITO' || form.type === 'ESTORNO')) {
                                const client = clients?.find(c => c.id === form.clientId)
                                const currentBalance = client?.saldo || 0
                                if (val > currentBalance) {
                                    val = currentBalance
                                }
                            }

                            setForm({ ...form, points: val })
                        }}
                        disabled={isViewOnly || !form.clientId || form.origin === 'RESGATE'}
                    />
                </Grid>

                <Grid size={{ xs: 6 }}>
                    <TextField
                        fullWidth
                        label="Saldo Resultante"
                        type="number"
                        value={form.resultingBalance}
                        disabled
                        helperText="Calculado automaticamente"
                    />
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <TextField
                        fullWidth
                        label="Observação"
                        multiline
                        rows={3}
                        value={form.observation}
                        onChange={(e) => setForm({ ...form, observation: e.target.value })}
                        disabled={isViewOnly}
                    />
                </Grid>

                {isEdit && (
                    <Grid size={{ xs: 12 }}>
                        <Alert severity="info">
                            Esta transação gerou o saldo resultante de {form.resultingBalance} pontos.
                        </Alert>
                    </Grid>
                )}
            </Grid>
        </TableCardModal>
    )
}
