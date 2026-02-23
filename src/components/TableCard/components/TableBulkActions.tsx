import { createPortal } from 'react-dom'
import { Box, Stack, Typography, Tooltip, IconButton, Checkbox } from '@mui/material'
import { Delete, DeleteOutline } from '@mui/icons-material'
import { canDelete } from '../../../utils/accessControl'
import type { TableCardRow, TableCardBulkAction, AccessMode } from '../index'

interface TableBulkActionsProps<T extends TableCardRow> {
    selectedIds: Array<T['id']>
    allSelected: boolean
    handleToggleSelectAll: () => void
    handleBulkDelete: () => void
    bulkActions?: TableCardBulkAction<T>[]
    onBulkDelete?: (ids: T['id'][]) => void
    accessMode: AccessMode
    isBulkDeleteArmed: boolean
    rowsLength: number
}

const UncheckedIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="table-card__icon--middle">
        <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" />
    </svg>
)

const CheckedIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="table-card__icon--middle">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" />
        <path d="M8 12.5L10.5 15L16 9.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const IndeterminateIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="table-card__icon--middle">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" />
        <path d="M8 12H16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

export const TableBulkActions = <T extends TableCardRow>({
    selectedIds,
    allSelected,
    handleToggleSelectAll,
    handleBulkDelete,
    bulkActions,
    onBulkDelete,
    accessMode,
    isBulkDeleteArmed,
    rowsLength,
}: TableBulkActionsProps<T>) => {
    if (selectedIds.length === 0) return null

    return createPortal(
        <Box className="table-card__top-actions">
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                justifyContent="space-between"
                spacing={1.5}
            >
                <Typography variant="body1" fontWeight={600}>
                    {selectedIds.length} registro(s) selecionado(s)
                </Typography>
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    className="table-card__bulk-action-stack"
                >
                    {bulkActions?.filter(action => !action.hidden).map((action) => (
                        <Tooltip key={action.label} title={action.label}>
                            <span>
                                <IconButton
                                    color="primary"
                                    onClick={() => action.onClick(selectedIds)}
                                    disabled={typeof action.disabled === 'function' ? action.disabled(selectedIds) : action.disabled}
                                >
                                    {action.icon}
                                </IconButton>
                            </span>
                        </Tooltip>
                    ))}
                    <Tooltip title={isBulkDeleteArmed ? 'Confirmar exclusão' : 'Excluir selecionados'}>
                        <span>
                            <IconButton
                                color="error"
                                onClick={handleBulkDelete}
                                disabled={!onBulkDelete || !canDelete(accessMode)}
                                aria-label="Excluir selecionados"
                                className={isBulkDeleteArmed ? 'table-card__bulk-delete-btn--armed' : ''}
                            >
                                {isBulkDeleteArmed ? <Delete /> : <DeleteOutline />}
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="Selecionar todos">
                        <Checkbox
                            checked={allSelected}
                            onChange={handleToggleSelectAll}
                            indeterminate={selectedIds.length > 0 && !allSelected && rowsLength > 0}
                            aria-label="Selecionar todos"
                            icon={<UncheckedIcon />}
                            checkedIcon={<CheckedIcon />}
                            indeterminateIcon={<IndeterminateIcon />}
                        />
                    </Tooltip>
                </Stack>
            </Stack>
        </Box>,
        document.body
    )
}
