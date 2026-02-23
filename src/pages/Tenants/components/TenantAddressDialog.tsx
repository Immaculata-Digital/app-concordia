
import { useState, useEffect, useMemo } from 'react'
import { Grid } from '@mui/material'
import { TableCardModal } from '../../../components/Modals'
import CEPPicker from '../../../components/CEPPicker'
import TextPicker from '../../../components/TextPicker'
import { getAccessMode, canEdit } from '../../../utils/accessControl'
import { useAuth } from '../../../context/AuthContext'
import { type TenantAddressDTO } from '../../../services/tenants'
import type { AccessMode } from '../../../components/Dashboard/DashboardBodyCard'

interface TenantAddressDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: any) => void
    initialData: TenantAddressDTO | null | undefined
    saving: boolean
    accessMode: AccessMode
}

const TenantAddressDialog = ({ open, onClose, onSave, initialData, saving, accessMode }: TenantAddressDialogProps) => {
    const { permissions } = useAuth()
    const [addressForm, setAddressForm] = useState({
        postalCode: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: ''
    })

    const memoizedInitialForm = useMemo(() => ({
        postalCode: initialData?.postalCode || '',
        street: initialData?.street || '',
        number: initialData?.number || '',
        complement: initialData?.complement || '',
        neighborhood: initialData?.neighborhood || '',
        city: initialData?.city || '',
        state: initialData?.state || ''
    }), [initialData])

    useEffect(() => {
        if (open) {
            setAddressForm(memoizedInitialForm)
        }
    }, [open, memoizedInitialForm])

    const isDirty = useMemo(() => JSON.stringify(addressForm) !== JSON.stringify(memoizedInitialForm), [addressForm, memoizedInitialForm])

    const handleSave = () => {
        onSave(addressForm)
    }

    const erpAccessMode = getAccessMode(permissions, 'erp:tenants')

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            mode={initialData ? 'edit' : 'add'}
            saving={saving}
            isDirty={isDirty}
            title="Endereço do Tenant"
            maxWidth="md"
            canSave={canEdit(erpAccessMode)}
        >
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <CEPPicker
                        label="CEP"
                        value={addressForm.postalCode}
                        onChange={(val: any) => setAddressForm(prev => ({ ...prev, postalCode: val }))}
                        onAddressFetched={(data: any) => {
                            setAddressForm(prev => ({
                                ...prev,
                                street: data.street,
                                neighborhood: data.neighborhood,
                                city: data.city,
                                state: data.state
                            }))
                        }}
                        fullWidth
                        required
                        accessMode={accessMode}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextPicker
                        label="Estado (UF)"
                        value={addressForm.state}
                        onChange={(val: any) => setAddressForm(prev => ({ ...prev, state: val }))}
                        fullWidth
                        required
                        maxLength={2}
                        accessMode={accessMode}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 9 }}>
                    <TextPicker
                        label="Rua"
                        value={addressForm.street}
                        onChange={(val: any) => setAddressForm(prev => ({ ...prev, street: val }))}
                        fullWidth
                        required
                        accessMode={accessMode}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                    <TextPicker
                        label="Número"
                        value={addressForm.number}
                        onChange={(val: any) => setAddressForm(prev => ({ ...prev, number: val }))}
                        fullWidth
                        required
                        accessMode={accessMode}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextPicker
                        label="Bairro"
                        value={addressForm.neighborhood}
                        onChange={(val: any) => setAddressForm(prev => ({ ...prev, neighborhood: val }))}
                        fullWidth
                        required
                        accessMode={accessMode}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextPicker
                        label="Cidade"
                        value={addressForm.city}
                        onChange={(val: any) => setAddressForm(prev => ({ ...prev, city: val }))}
                        fullWidth
                        required
                        accessMode={accessMode}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextPicker
                        label="Complemento"
                        value={addressForm.complement}
                        onChange={(val: any) => setAddressForm(prev => ({ ...prev, complement: val }))}
                        fullWidth
                        accessMode={accessMode}
                    />
                </Grid>
            </Grid>
        </TableCardModal>
    )
}

export default TenantAddressDialog
