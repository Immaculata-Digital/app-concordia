
import { useState, useEffect, useMemo } from 'react'
import { Grid } from '@mui/material'
import { TableCardModal } from '../../../components/Modals'
import SelectPicker from '../../../components/SelectPicker'
import MailPicker from '../../../components/MailPicker'
import PhonePicker from '../../../components/PhonePicker'
import TextPicker from '../../../components/TextPicker'
import { getAccessMode, canEdit, canCreate } from '../../../utils/accessControl'
import { useAuth } from '../../../context/AuthContext'
import { type TenantContactDTO } from '../../../services/tenants'
import type { AccessMode } from '../../../components/Dashboard/DashboardBodyCard'

interface TenantContactDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: any) => void
    editingContact: TenantContactDTO | null
    saving: boolean
    accessMode: AccessMode
}

const TenantContactDialog = ({ open, onClose, onSave, editingContact, saving, accessMode }: TenantContactDialogProps) => {
    const { permissions } = useAuth()
    const [contactForm, setContactForm] = useState({
        contactType: 'Telefone',
        contactValue: '',
        label: '',
        isDefault: false
    })

    const memoizedInitialForm = useMemo(() => ({
        contactType: editingContact?.contactType || 'Telefone',
        contactValue: editingContact?.contactValue || '',
        label: editingContact?.label || '',
        isDefault: editingContact?.isDefault || false
    }), [editingContact])

    useEffect(() => {
        if (open) {
            setContactForm(memoizedInitialForm)
        }
    }, [open, memoizedInitialForm])

    const isDirty = useMemo(() => JSON.stringify(contactForm) !== JSON.stringify(memoizedInitialForm), [contactForm, memoizedInitialForm])

    const handleSave = () => {
        onSave(contactForm)
    }

    const erpAccessMode = getAccessMode(permissions, 'erp:tenants')

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            mode={editingContact ? 'edit' : 'add'}
            saving={saving}
            isDirty={isDirty}
            title="Contato do Tenant"
            maxWidth="sm"
            canSave={(editingContact ? canEdit : canCreate)(erpAccessMode)}
        >
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <SelectPicker
                        label="Tipo"
                        value={contactForm.contactType}
                        onChange={(val: any) => setContactForm(prev => ({
                            ...prev,
                            contactType: val as string,
                            contactValue: ''
                        }))}
                        options={[
                            { value: 'Telefone', label: 'Telefone' },
                            { value: 'Email', label: 'Email' },
                            { value: 'Whatsapp', label: 'Whatsapp' }
                        ]}
                        fullWidth
                        required
                        accessMode={accessMode}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                    {contactForm.contactType === 'Email' ? (
                        <MailPicker
                            label="Email"
                            value={contactForm.contactValue}
                            onChange={(val: any) => setContactForm(prev => ({ ...prev, contactValue: val }))}
                            fullWidth
                            required
                            accessMode={accessMode}
                        />
                    ) : ['Telefone', 'Whatsapp'].includes(contactForm.contactType) ? (
                        <PhonePicker
                            label={contactForm.contactType}
                            value={contactForm.contactValue}
                            onChange={(val: any) => setContactForm(prev => ({ ...prev, contactValue: val }))}
                            fullWidth
                            required
                            accessMode={accessMode}
                        />
                    ) : (
                        <TextPicker
                            label={contactForm.contactType}
                            value={contactForm.contactValue}
                            onChange={(val: any) => setContactForm(prev => ({ ...prev, contactValue: val }))}
                            fullWidth
                            required
                            accessMode={accessMode}
                        />
                    )}
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextPicker
                        label="Marcador"
                        value={contactForm.label}
                        onChange={(val: any) => setContactForm(prev => ({ ...prev, label: val }))}
                        fullWidth
                        placeholder="Ex: Trabalho, Financeiro, Comercial"
                        accessMode={accessMode}
                    />
                </Grid>
            </Grid>
        </TableCardModal>
    )
}

export default TenantContactDialog
