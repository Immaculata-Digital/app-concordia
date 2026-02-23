import { useState, useEffect, useMemo } from 'react'
import { Grid } from '@mui/material'
import { TableCardModal } from '../../../components/Modals'
import SelectPicker from '../../../components/SelectPicker'
import CEPPicker from '../../../components/CEPPicker'
import TextPicker from '../../../components/TextPicker'
import { getContextualAccessMode, canEdit, canCreate, getAccessMode } from '../../../utils/accessControl'
import { useAuth } from '../../../context/AuthContext'
import { type PeopleAddress } from '../../../services/people'

interface PeopleAddressDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: any) => void
    editingAddress: PeopleAddress | null
    saving: boolean
}

const PeopleAddressDialog = ({ open, onClose, onSave, editingAddress, saving }: PeopleAddressDialogProps) => {
    const { permissions } = useAuth()
    const [addressForm, setAddressForm] = useState({
        addressType: 'Residencial',
        postalCode: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: ''
    })

    const initialAddressForm = useMemo(() => ({
        addressType: editingAddress?.addressType || 'Residencial',
        postalCode: editingAddress?.postalCode || '',
        street: editingAddress?.street || '',
        number: editingAddress?.number || '',
        complement: editingAddress?.complement || '',
        neighborhood: editingAddress?.neighborhood || '',
        city: editingAddress?.city || '',
        state: editingAddress?.state || ''
    }), [editingAddress])

    useEffect(() => {
        if (open) {
            setAddressForm(initialAddressForm)
        }
    }, [open, initialAddressForm])

    const isAddressDirty = useMemo(() => JSON.stringify(addressForm) !== JSON.stringify(initialAddressForm), [addressForm, initialAddressForm])

    const handleSave = () => {
        onSave(addressForm)
    }

    const accessMode = getAccessMode(permissions, 'erp:pessoas')

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            mode={editingAddress ? 'edit' : 'add'}
            saving={saving}
            isDirty={isAddressDirty}
            title="Endereço"
            maxWidth="md"
            canSave={(editingAddress ? canEdit : canCreate)(accessMode)}
        >
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <SelectPicker
                        label="Tipo"
                        value={addressForm.addressType}
                        onChange={(val: any) => setAddressForm(prev => ({ ...prev, addressType: val as string }))}
                        options={[
                            { value: 'Residencial', label: 'Residencial' },
                            { value: 'Comercial', label: 'Comercial' },
                            { value: 'Outros', label: 'Outros' }
                        ]}
                        fullWidth
                        required
                        accessMode={getContextualAccessMode(accessMode, !!editingAddress)}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
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
                        accessMode={getContextualAccessMode(accessMode, !!editingAddress)}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextPicker
                        label="Estado (UF)"
                        value={addressForm.state}
                        onChange={(val: any) => setAddressForm(prev => ({ ...prev, state: val }))}
                        fullWidth
                        required
                        maxLength={2}
                        accessMode={getContextualAccessMode(accessMode, !!editingAddress)}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 9 }}>
                    <TextPicker
                        label="Rua"
                        value={addressForm.street}
                        onChange={(val: any) => setAddressForm(prev => ({ ...prev, street: val }))}
                        fullWidth
                        required
                        accessMode={getContextualAccessMode(accessMode, !!editingAddress)}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                    <TextPicker
                        label="Número"
                        value={addressForm.number}
                        onChange={(val: any) => setAddressForm(prev => ({ ...prev, number: val }))}
                        fullWidth
                        required
                        accessMode={getContextualAccessMode(accessMode, !!editingAddress)}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextPicker
                        label="Bairro"
                        value={addressForm.neighborhood}
                        onChange={(val: any) => setAddressForm(prev => ({ ...prev, neighborhood: val }))}
                        fullWidth
                        required
                        accessMode={getContextualAccessMode(accessMode, !!editingAddress)}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextPicker
                        label="Cidade"
                        value={addressForm.city}
                        onChange={(val: any) => setAddressForm(prev => ({ ...prev, city: val }))}
                        fullWidth
                        required
                        accessMode={getContextualAccessMode(accessMode, !!editingAddress)}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextPicker
                        label="Complemento"
                        value={addressForm.complement}
                        onChange={(val: any) => setAddressForm(prev => ({ ...prev, complement: val }))}
                        fullWidth
                        accessMode={getContextualAccessMode(accessMode, !!editingAddress)}
                    />
                </Grid>
            </Grid>
        </TableCardModal>
    )
}

export default PeopleAddressDialog
