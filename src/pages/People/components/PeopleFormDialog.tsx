
import {
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress
} from '@mui/material'
import TextPicker from '../../../components/TextPicker'
import CPFCNPJPicker, { cleanString, validateCPF, validateCNPJ } from '../../../components/CPFCNPJPicker'
import SelectPicker from '../../../components/SelectPicker'
import { useState, useEffect, useMemo } from 'react'
import { isFull } from '../../../utils/accessControl'
import { type AccessMode } from '../../../components/Dashboard/DashboardBodyCard'
import { TableCardModal } from '../../../components/Modals'
import Toast from '../../../components/Toast'
import { useQuery } from '@tanstack/react-query'
import { tenantService } from '../../../services/tenants'
import { useUserList } from '../../../hooks/queries/users'

type PeopleFormDialogProps = {
    open: boolean
    onClose: () => void
    onSave: (data: { name: string; cpfCnpj: string; tenantId?: string; usuarioId?: string | null }) => void
    initialValues?: { name: string; cpfCnpj: string; tenantId?: string; usuarioId?: string | null }
    title?: string
    saving?: boolean
    accessMode?: AccessMode
}

const PeopleFormDialog = ({
    open,
    onClose,
    onSave,
    initialValues,
    title = 'Pessoa',
    saving = false,
    accessMode = 'full'
}: PeopleFormDialogProps) => {
    const [form, setForm] = useState({
        name: '',
        cpfCnpj: '',
        tenantId: '',
        usuarioId: '' as string | null
    })
    const [initialForm, setInitialForm] = useState({
        name: '',
        cpfCnpj: '',
        tenantId: '',
        usuarioId: '' as string | null
    })

    const [error, setError] = useState<string | null>(null)

    const { data: tenants = [], isLoading: isLoadingTenants } = useQuery({
        queryKey: ['tenants'],
        queryFn: tenantService.list,
        enabled: open
    })

    // Fetch users for the selected tenant
    const { data: users = [], isLoading: isLoadingUsers } = useUserList({
        tenantId: form.tenantId
    })

    const userOptions = useMemo(() => {
        return (users || []).map(u => ({
            value: u.id || (u as any).uuid,
            label: `${u.login} (${u.fullName})`
        }))
    }, [users])

    useEffect(() => {
        if (open) {
            const initial = {
                name: initialValues?.name || '',
                cpfCnpj: initialValues?.cpfCnpj || '',
                tenantId: initialValues?.tenantId || '',
                usuarioId: initialValues?.usuarioId || null
            }
            setForm(initial)
            setInitialForm(initial)
            setError(null)
        }
    }, [open]) // Remove initialValues para evitar reset ao atualizar estado local

    // Pre-selection logic: if name matches a user's full name, auto-select
    useEffect(() => {
        if (!isFull(accessMode) || initialValues?.usuarioId) return

        if (form.name && users.length > 0 && !form.usuarioId) {
            const matchedUser = users.find(u =>
                u.fullName.toLowerCase() === form.name.toLowerCase() ||
                u.login.toLowerCase() === form.name.toLowerCase().replace(/\s/g, '')
            )
            if (matchedUser) {
                setForm(prev => ({ ...prev, usuarioId: matchedUser.id }))
            }
        }
    }, [form.name, users, accessMode, initialValues])

    const handleSave = () => {
        const requiredFields = []
        if (!form.cpfCnpj) requiredFields.push('CPF/CNPJ')
        if (!form.name) requiredFields.push('Nome')
        if (!form.tenantId) requiredFields.push('Tenant')

        if (requiredFields.length > 0) {
            setError(`Preencha os campos obrigatórios: ${requiredFields.join(', ')}`)
            return
        }

        const clean = cleanString(form.cpfCnpj)
        let isValid = false

        if (clean.length === 11) {
            isValid = validateCPF(clean)
        } else if (clean.length === 14) {
            isValid = validateCNPJ(clean)
        }

        if (!isValid) {
            setError('CPF/CNPJ inválido')
            return
        }

        onSave(form)
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
                title={title}
                mode={initialValues ? 'edit' : 'add'}
                saving={saving}
                isDirty={isDirty}
                canSave={isFull(accessMode)}
                maxWidth="sm"
            >
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <CPFCNPJPicker
                            label="CPF/CNPJ"
                            value={form.cpfCnpj}
                            onChange={(val) => setForm(prev => ({ ...prev, cpfCnpj: val }))}
                            fullWidth
                            required
                            accessMode={accessMode}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <TextPicker
                            label="Nome"
                            value={form.name}
                            onChange={(val) => setForm(prev => ({ ...prev, name: val }))}
                            fullWidth
                            required
                            placeholder="Nome da pessoa"
                            accessMode={accessMode}
                        />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <FormControl fullWidth required>
                            <InputLabel id="tenant-select-label">Tenant</InputLabel>
                            <Select
                                id="tenant-select"
                                labelId="tenant-select-label"
                                value={form.tenantId}
                                label="Tenant"
                                onChange={(e) => setForm(prev => ({ ...prev, tenantId: e.target.value as string, usuarioId: null }))}
                                disabled={!isFull(accessMode) || isLoadingTenants}
                            >
                                {isLoadingTenants ? (
                                    <MenuItem disabled>
                                        <CircularProgress size={20} sx={{ mr: 1 }} /> Carregando...
                                    </MenuItem>
                                ) : (
                                    tenants.length === 0 ? (
                                        <MenuItem disabled>Nenhum tenant encontrado</MenuItem>
                                    ) : (
                                        tenants.map(t => (
                                            <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                                        ))
                                    )
                                )}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <SelectPicker
                            label="Vincular Usuário"
                            value={form.usuarioId}
                            onChange={(val) => setForm(prev => ({ ...prev, usuarioId: (val as string) || null }))}
                            options={userOptions}
                            fullWidth
                            accessMode={accessMode}
                            disabled={!form.tenantId || isLoadingUsers}
                            placeholder={form.tenantId ? "Selecione um usuário" : "Selecione um tenant primeiro"}
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

export default PeopleFormDialog
