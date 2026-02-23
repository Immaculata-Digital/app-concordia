import { useState, useEffect, useMemo } from 'react'
import { Grid } from '@mui/material'
import { TableCardModal } from '../../../components/Modals'
import SelectPicker from '../../../components/SelectPicker'
import MailPicker from '../../../components/MailPicker'
import PhonePicker from '../../../components/PhonePicker'
import TextPicker from '../../../components/TextPicker'
import { getContextualAccessMode, canEdit, canCreate, getAccessMode } from '../../../utils/accessControl'
import { useAuth } from '../../../context/AuthContext'
import { type PeopleContact } from '../../../services/people'

interface PeopleContactDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: any) => void
    editingContact: PeopleContact | null
    saving: boolean
}

const PeopleContactDialog = ({ open, onClose, onSave, editingContact, saving }: PeopleContactDialogProps) => {
    const { permissions } = useAuth()
    const [contactForm, setContactForm] = useState({
        contactType: 'Telefone',
        contactValue: '',
        label: ''
    })

    const initialContactForm = useMemo(() => ({
        contactType: editingContact?.contactType || 'Telefone',
        contactValue: editingContact?.contactValue || '',
        label: editingContact?.label || ''
    }), [editingContact])

    useEffect(() => {
        if (open) {
            setContactForm(initialContactForm)
        }
    }, [open, initialContactForm])

    const isContactDirty = useMemo(() => JSON.stringify(contactForm) !== JSON.stringify(initialContactForm), [contactForm, initialContactForm])

    const handleSave = () => {
        onSave(contactForm)
    }

    const accessMode = getAccessMode(permissions, 'erp:pessoas')

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            mode={editingContact ? 'edit' : 'add'}
            saving={saving}
            isDirty={isContactDirty}
            title="Contato"
            maxWidth="sm"
            canSave={(editingContact ? canEdit : canCreate)(accessMode)}
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
                        accessMode={getContextualAccessMode(accessMode, !!editingContact)}
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
                            accessMode={getContextualAccessMode(accessMode, !!editingContact)}
                        />
                    ) : ['Telefone', 'Whatsapp'].includes(contactForm.contactType) ? (
                        <PhonePicker
                            label={contactForm.contactType}
                            value={contactForm.contactValue}
                            onChange={(val: any) => setContactForm(prev => ({ ...prev, contactValue: val }))}
                            fullWidth
                            required
                            accessMode={getContextualAccessMode(accessMode, !!editingContact)}
                        />
                    ) : (
                        <TextPicker
                            label={contactForm.contactType}
                            value={contactForm.contactValue}
                            onChange={(val: any) => setContactForm(prev => ({ ...prev, contactValue: val }))}
                            fullWidth
                            required
                            accessMode={getContextualAccessMode(accessMode, !!editingContact)}
                        />
                    )}
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextPicker
                        label="Marcador"
                        value={contactForm.label}
                        onChange={(val: any) => setContactForm(prev => ({ ...prev, label: val }))}
                        fullWidth
                        placeholder="Ex: Casa, Trabalho, Comercial"
                        accessMode={getContextualAccessMode(accessMode, !!editingContact)}
                    />
                </Grid>
            </Grid>
        </TableCardModal>
    )
}

export default PeopleContactDialog
