import { useState, useEffect, useMemo } from 'react'
import { Grid } from '@mui/material'
import { TableCardModal } from '../../../components/Modals'
import SelectPicker from '../../../components/SelectPicker'
import TextPicker from '../../../components/TextPicker'
import DatePicker from '../../../components/DatePicker'
import { getContextualAccessMode, canEdit, getAccessMode } from '../../../utils/accessControl'
import { useAuth } from '../../../context/AuthContext'
import { type PeopleDTO } from '../../../services/people'

const MARITAL_STATUS_MAP: Record<string, string> = {
    'Single': 'Solteiro(a)',
    'Married': 'Casado(a)',
    'Divorced': 'Divorciado(a)',
    'Widowed': 'Viúvo(a)',
    'Separated': 'Separado(a)',
}

interface PeopleDetailsDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: any) => void
    people: PeopleDTO | null
    saving: boolean
}

const PeopleDetailsDialog = ({ open, onClose, onSave, people, saving }: PeopleDetailsDialogProps) => {
    const { permissions } = useAuth()
    const [detailsForm, setDetailsForm] = useState({
        firstName: '',
        surname: '',
        birthDate: null as string | null,
        sex: '',
        maritalStatus: '',
        nationality: '',
        occupation: '',
        legalName: '',
        tradeName: ''
    })

    const initialDetailsForm = useMemo(() => ({
        firstName: people?.details?.firstName || '',
        surname: people?.details?.surname || '',
        birthDate: people?.details?.birthDate || null,
        sex: people?.details?.sex || '',
        maritalStatus: people?.details?.maritalStatus || '',
        nationality: people?.details?.nationality || '',
        occupation: people?.details?.occupation || '',
        legalName: people?.details?.legalName || '',
        tradeName: people?.details?.tradeName || ''
    }), [people])

    useEffect(() => {
        if (open) {
            setDetailsForm(initialDetailsForm)
        }
    }, [open, initialDetailsForm])

    const isDetailsDirty = useMemo(() => JSON.stringify(detailsForm) !== JSON.stringify(initialDetailsForm), [detailsForm, initialDetailsForm])

    const handleSave = () => {
        onSave(detailsForm)
    }

    const accessMode = getAccessMode(permissions, 'erp:pessoas')

    if (!people) return null

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            mode="edit"
            saving={saving}
            isDirty={isDetailsDirty}
            title="Detalhes"
            maxWidth="sm"
            canSave={canEdit(accessMode)}
        >
            <Grid container spacing={2}>
                {people.cpfCnpj?.replace(/\D/g, '').length === 11 ? (
                    <>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextPicker
                                label="Nome"
                                value={detailsForm.firstName}
                                onChange={(val: any) => setDetailsForm(prev => ({ ...prev, firstName: val }))}
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextPicker
                                label="Sobrenome"
                                value={detailsForm.surname}
                                onChange={(val: any) => setDetailsForm(prev => ({ ...prev, surname: val }))}
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <DatePicker
                                label="Data de Nascimento"
                                value={detailsForm.birthDate ?? ''}
                                onChange={(val: any) => setDetailsForm(prev => ({ ...prev, birthDate: val }))}
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <SelectPicker
                                label="Sexo"
                                value={detailsForm.sex}
                                onChange={(val: any) => setDetailsForm(prev => ({ ...prev, sex: val as string }))}
                                options={[
                                    { value: 'Homem', label: 'Homem' },
                                    { value: 'Mulher', label: 'Mulher' }
                                ]}
                                fullWidth
                                placeholder="Selecione"
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <SelectPicker
                                label="Estado Civil"
                                value={detailsForm.maritalStatus}
                                onChange={(val: any) => setDetailsForm(prev => ({ ...prev, maritalStatus: val as string }))}
                                options={Object.entries(MARITAL_STATUS_MAP).map(([value, label]) => ({
                                    value,
                                    label
                                }))}
                                fullWidth
                                placeholder="Selecione"
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextPicker
                                label="Nacionalidade"
                                value={detailsForm.nationality}
                                onChange={(val: any) => setDetailsForm(prev => ({ ...prev, nationality: val }))}
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextPicker
                                label="Profissão"
                                value={detailsForm.occupation}
                                onChange={(val: any) => setDetailsForm(prev => ({ ...prev, occupation: val }))}
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                    </>
                ) : (
                    <>
                        <Grid size={{ xs: 12 }}>
                            <TextPicker
                                label="Razão Social"
                                value={detailsForm.legalName}
                                onChange={(val: any) => setDetailsForm(prev => ({ ...prev, legalName: val }))}
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextPicker
                                label="Nome Fantasia"
                                value={detailsForm.tradeName}
                                onChange={(val: any) => setDetailsForm(prev => ({ ...prev, tradeName: val }))}
                                fullWidth
                                accessMode={getContextualAccessMode(accessMode, true)}
                            />
                        </Grid>
                    </>
                )}
            </Grid>
        </TableCardModal>
    )
}

export default PeopleDetailsDialog
