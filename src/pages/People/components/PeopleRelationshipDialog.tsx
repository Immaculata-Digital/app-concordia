import { useState, useEffect, useMemo } from 'react'
import { Grid } from '@mui/material'
import { TableCardModal } from '../../../components/Modals'
import SelectPicker from '../../../components/SelectPicker'
import { getContextualAccessMode, canEdit, getAccessMode } from '../../../utils/accessControl'
import { useAuth } from '../../../context/AuthContext'
import { type PeopleDTO, type PeopleRelationship, type PeopleRelationshipType } from '../../../services/people'

interface PeopleRelationshipDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: any) => void
    editingRelationship: PeopleRelationship | null
    relationshipTypes: PeopleRelationshipType[]
    allPeoples: PeopleDTO[]
    saving: boolean
}

const PeopleRelationshipDialog = ({
    open,
    onClose,
    onSave,
    editingRelationship,
    relationshipTypes,
    allPeoples,
    saving
}: PeopleRelationshipDialogProps) => {
    const { permissions } = useAuth()
    const [relationshipForm, setRelationshipForm] = useState({
        peopleRelationshipTypesId: '',
        peopleIdTarget: '',
        inverseTypeId: ''
    })

    const initialRelationshipForm = useMemo(() => ({
        peopleRelationshipTypesId: editingRelationship?.peopleRelationshipTypesId || '',
        peopleIdTarget: editingRelationship?.peopleIdTarget || '',
        inverseTypeId: editingRelationship?.inverseTypeId || ''
    }), [editingRelationship])

    useEffect(() => {
        if (open) {
            setRelationshipForm(initialRelationshipForm)
        }
    }, [open, initialRelationshipForm])

    const isRelationshipDirty = useMemo(() => JSON.stringify(relationshipForm) !== JSON.stringify(initialRelationshipForm), [relationshipForm, initialRelationshipForm])

    const handleSave = () => {
        onSave(relationshipForm)
    }

    const accessMode = getAccessMode(permissions, 'erp:pessoas')

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            mode={editingRelationship ? 'edit' : 'add'}
            saving={saving}
            isDirty={isRelationshipDirty}
            title="Relacionamento"
            maxWidth="sm"
            canSave={canEdit(accessMode)}
        >
            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <SelectPicker
                        label="Tipo de Relacionamento"
                        value={relationshipForm.peopleRelationshipTypesId}
                        onChange={(val: any) => {
                            const selectedType = relationshipTypes.find(t => t.id === val)
                            setRelationshipForm(prev => ({
                                ...prev,
                                peopleRelationshipTypesId: val as string,
                                inverseTypeId: selectedType?.inverseTypeId || ''
                            }))
                        }}
                        options={relationshipTypes.map(t => ({
                            value: t.id,
                            label: `${t.connectorPrefix} ${t.relationshipSource} ${t.connectorSuffix}`.trim()
                        }))}
                        fullWidth
                        placeholder="Selecione o tipo"
                        accessMode={getContextualAccessMode(accessMode, !!editingRelationship)}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <SelectPicker
                        label="Pessoa Relacionada"
                        value={relationshipForm.peopleIdTarget}
                        onChange={(val: any) => setRelationshipForm(prev => ({ ...prev, peopleIdTarget: val as string }))}
                        options={allPeoples.map(p => ({
                            value: p.id,
                            label: `${p.name} (${p.cpfCnpj})`
                        }))}
                        fullWidth
                        placeholder="Selecione a pessoa"
                        accessMode={getContextualAccessMode(accessMode, !!editingRelationship)}
                    />
                </Grid>
            </Grid>
        </TableCardModal>
    )
}

export default PeopleRelationshipDialog
