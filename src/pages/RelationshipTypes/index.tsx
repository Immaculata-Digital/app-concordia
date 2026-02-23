import { useState, useMemo } from 'react'
import {
    Box,
} from '@mui/material'
import { EditOutlined } from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { peopleService } from '../../services/people'
import type { PeopleRelationshipType } from '../../services/people'
import { RelationshipTypeFormDialog } from './components/RelationshipTypeFormDialog'
import Toast from '../../components/Toast'
import TableCard, { type TableCardColumn, type TableCardRow, type TableCardRowAction } from '../../components/TableCard'
import { useAuth } from '../../context/AuthContext'
import { getAccessMode } from '../../utils/accessControl'

type RelationshipTypeRow = TableCardRow & PeopleRelationshipType

export default function RelationshipTypes() {
    const [openDialog, setOpenDialog] = useState(false)
    const [selectedType, setSelectedType] = useState<PeopleRelationshipType | null>(null)
    const queryClient = useQueryClient()
    const { permissions } = useAuth()
    const accessMode = useMemo(() => getAccessMode(permissions, 'erp:pessoas:tipos-relacionamento'), [permissions])

    // Toast State
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'warning' | 'info' }>({
        open: false,
        message: '',
        severity: 'success'
    })

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false })
    }

    const { data: relationshipTypes = [], isLoading } = useQuery({
        queryKey: ['relationship-types'],
        queryFn: peopleService.listRelationshipTypes
    })

    const deleteMutation = useMutation({
        mutationFn: peopleService.removeRelationshipType,
        onSuccess: () => {
            setSnackbar({ open: true, message: 'Tipo de relacionamento removido', severity: 'success' })
            queryClient.invalidateQueries({ queryKey: ['relationship-types'] })
        },
        onError: () => setSnackbar({ open: true, message: 'Erro ao remover tipo de relacionamento', severity: 'error' })
    })

    const handleCreate = () => {
        setSelectedType(null)
        setOpenDialog(true)
    }

    const handleEdit = (type: PeopleRelationshipType) => {
        setSelectedType(type)
        setOpenDialog(true)
    }

    const handleDelete = (id: string | number) => {
        deleteMutation.mutate(id as string)
    }

    const handleFormSuccess = (msg: string) => {
        setSnackbar({ open: true, message: msg, severity: 'success' })
    }

    const handleBulkDelete = async (ids: (string | number)[]) => {
        try {
            await Promise.all(ids.map(id => deleteMutation.mutateAsync(id as string)))
            setSnackbar({ open: true, message: 'Tipos de relacionamento removidos', severity: 'success' })
        } catch (error) {
            setSnackbar({ open: true, message: 'Erro ao remover tipos de relacionamento', severity: 'error' })
        }
    }

    const handleFormError = (msg: string) => {
        setSnackbar({ open: true, message: msg, severity: 'error' })
    }

    const columns = useMemo<TableCardColumn<RelationshipTypeRow>[]>(() => [
        { key: 'connectorPrefix', label: 'Prefixo' },
        { key: 'relationshipSource', label: 'Origem' },
        { key: 'connectorSuffix', label: 'Sufixo' },
        { key: 'relationshipTarget', label: 'Destino' },
        { key: 'createdAt', label: 'Cadastro', dataType: 'date' as const },
    ], [])

    const rowActions = useMemo<TableCardRowAction<RelationshipTypeRow>[]>(() => [
        {
            label: 'Editar',
            icon: <EditOutlined fontSize="small" />,
            onClick: (row) => handleEdit(row as unknown as PeopleRelationshipType),
        },
    ], [])

    return (
        <Box p={0}>
            <TableCard
                title="Tipos de Relacionamento"
                columns={columns}
                rows={relationshipTypes as RelationshipTypeRow[]}
                loading={isLoading}
                onAddClick={handleCreate}
                onDelete={handleDelete}
                onBulkDelete={handleBulkDelete}
                rowActions={rowActions}
                accessMode={accessMode}
            />

            {openDialog && (
                <RelationshipTypeFormDialog
                    open={openDialog}
                    onClose={() => setOpenDialog(false)}
                    typeToEdit={selectedType}
                    onSuccess={handleFormSuccess}
                    onError={handleFormError}
                    accessMode={accessMode}
                />
            )}

            <Toast
                open={snackbar.open}
                message={snackbar.message}
                severity={snackbar.severity}
                onClose={handleCloseSnackbar}
            />
        </Box>
    )
}

