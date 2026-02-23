import { Box, Stack, Checkbox, Typography, IconButton } from '@mui/material'
import { MoreVert } from '@mui/icons-material'
import { canVisualizeItem } from '../../../utils/accessControl'
import type { TableCardRow, TableCardColumn, AccessMode } from '../index'

interface CardViewProps<T extends TableCardRow> {
    rows: T[]
    selectedIds: Array<T['id']>
    handleToggleSelectRow: (id: T['id']) => void
    disableView: boolean
    accessMode: AccessMode
    onRowClick?: (row: T) => void
    onEditEffect: (row: T) => void
    primaryColumn?: TableCardColumn<T>
    secondaryColumns: TableCardColumn<T>[]
    handleOpenMenu: (event: React.MouseEvent<HTMLButtonElement>, row: T) => void
    renderCell: (row: T, column: TableCardColumn<T>) => React.ReactNode
    showActionsButton?: boolean
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

export const CardView = <T extends TableCardRow>({
    rows,
    selectedIds,
    handleToggleSelectRow,
    disableView,
    accessMode,
    onRowClick,
    onEditEffect,
    primaryColumn,
    secondaryColumns,
    handleOpenMenu,
    renderCell,
    showActionsButton = true,
}: CardViewProps<T>) => {
    return (
        <Box className="table-card__list-container">
            <Stack spacing={0.5} className="table-card__list">
                {rows.map((row, index) => {
                    const isSelected = selectedIds.includes(row.id)

                    return (
                        <Box
                            key={row.id}
                            className={`table-card__gmail-card ${isSelected ? 'table-card__gmail-card--selected' : ''}`}
                            onClick={() => {
                                if (!disableView && canVisualizeItem(accessMode)) {
                                    if (onRowClick) {
                                        onRowClick(row)
                                    } else {
                                        onEditEffect(row)
                                    }
                                }
                            }}
                            style={{
                                cursor: (!disableView && canVisualizeItem(accessMode)) ? 'pointer' : 'default',
                                '--index': index
                            } as React.CSSProperties}
                        >
                            <Box className="table-card__gmail-card-content">
                                <Checkbox
                                    checked={isSelected}
                                    onChange={() => handleToggleSelectRow(row.id)}
                                    onClick={(event) => event.stopPropagation()}
                                    className="table-card__checkbox"
                                    icon={<UncheckedIcon />}
                                    checkedIcon={<CheckedIcon />}
                                    indeterminateIcon={<IndeterminateIcon />}
                                />

                                <Box className="table-card__gmail-card-main" flex={1}>
                                    <Box className="table-card__gmail-card-header">
                                        {primaryColumn && (
                                            <Typography
                                                variant="subtitle1"
                                                fontWeight={600}
                                                className="table-card__gmail-title"
                                                component="div"
                                            >
                                                {renderCell(row, primaryColumn)}
                                            </Typography>
                                        )}

                                        {showActionsButton && (
                                            <IconButton
                                                className="table-card__gmail-actions"
                                                onClick={(event) => {
                                                    event.stopPropagation()
                                                    handleOpenMenu(event, row)
                                                }}
                                                size="small"
                                            >
                                                <MoreVert fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>

                                    {secondaryColumns.length > 0 && (
                                        <Box className="table-card__gmail-card-preview">
                                            {secondaryColumns.map((column) => (
                                                <Typography
                                                    key={String(column.key)}
                                                    variant="body2"
                                                    color="text.secondary"
                                                    className="table-card__gmail-preview-item"
                                                    component="div"
                                                >
                                                    <span className="table-card__gmail-preview-label">{column.label}:</span>{' '}
                                                    {renderCell(row, column)}
                                                </Typography>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    )
                })}

                {rows.length === 0 && (
                    <Box className="table-card__empty-state">
                        <Typography align="center" color="text.secondary" variant="body1" className="table-card__empty-text">
                            Nenhum registro encontrado.
                        </Typography>
                    </Box>
                )}
            </Stack>
        </Box>
    )
}
