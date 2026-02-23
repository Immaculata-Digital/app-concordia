import { Box, Table, TableHead, TableRow, TableCell, Checkbox, TableBody, Typography, IconButton } from '@mui/material'
import { MoreVert } from '@mui/icons-material'
import { canVisualizeItem } from '../../../utils/accessControl'
import type { TableCardRow, TableCardColumn, AccessMode } from '../index'

interface TableViewProps<T extends TableCardRow> {
    rows: T[]
    effectiveColumns: (TableCardColumn<T> & { widthLevel: number })[]
    totalWidthUnits: number
    allSelected: boolean
    handleToggleSelectAll: () => void
    selectedIds: Array<T['id']>
    handleToggleSelectRow: (id: T['id']) => void
    disableView: boolean
    accessMode: AccessMode
    onRowClick?: (row: T) => void
    onEditEffect: (row: T) => void
    handleOpenMenu: (event: React.MouseEvent<HTMLButtonElement>, row: T) => void
    renderCell: (row: T, column: TableCardColumn<T>) => React.ReactNode
    showActionsColumn?: boolean
}

const UncheckedIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
        <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" />
    </svg>
)

const CheckedIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
        <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" />
        <path d="M8 12.5L10.5 15L16 9.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const IndeterminateIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'middle' }}>
        <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" />
        <path d="M8 12H16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

export const TableView = <T extends TableCardRow>({
    rows,
    effectiveColumns,
    totalWidthUnits,
    allSelected,
    handleToggleSelectAll,
    selectedIds,
    handleToggleSelectRow,
    disableView,
    accessMode,
    onRowClick,
    onEditEffect,
    handleOpenMenu,
    renderCell,
    showActionsColumn = true,
}: TableViewProps<T>) => {
    return (
        <Box className="table-card__table-container">
            <Box className="table-card__table-wrapper">
                <Table size="small" className="table-card__table--fixed" stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox" className="table-card__cell-checkbox">
                                <Checkbox
                                    checked={allSelected}
                                    onChange={handleToggleSelectAll}
                                    indeterminate={selectedIds.length > 0 && !allSelected && rows.length > 0}
                                    icon={<UncheckedIcon />}
                                    checkedIcon={<CheckedIcon />}
                                    indeterminateIcon={<IndeterminateIcon />}
                                />
                            </TableCell>
                            {effectiveColumns.map((column) => (
                                <TableCell
                                    key={String(column.key)}
                                    className="table-card__cell-header"
                                    style={{
                                        width: totalWidthUnits > 0 ? `${(column.widthLevel / totalWidthUnits) * 100}%` : 'auto',
                                    }}
                                >
                                    {column.label}
                                </TableCell>
                            ))}
                            {showActionsColumn && (
                                <TableCell align="right" className="table-card__cell-actions">Ações</TableCell>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row, index) => (
                            <TableRow
                                key={row.id}
                                hover
                                className={`table-card__row ${selectedIds.includes(row.id) ? 'table-card__row--selected' : ''}`}
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
                                <TableCell padding="checkbox" onClick={(event) => event.stopPropagation()}>
                                    <Checkbox
                                        checked={selectedIds.includes(row.id)}
                                        onChange={() => handleToggleSelectRow(row.id)}
                                        icon={<UncheckedIcon />}
                                        checkedIcon={<CheckedIcon />}
                                        indeterminateIcon={<IndeterminateIcon />}
                                    />
                                </TableCell>
                                {effectiveColumns.map((column) => (
                                    <TableCell
                                        key={String(column.key)}
                                        className="table-card__cell-content"
                                    >
                                        {renderCell(row, column)}
                                    </TableCell>
                                ))}
                                {showActionsColumn && (
                                    <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                                        <IconButton
                                            onClick={(event) => {
                                                event.stopPropagation()
                                                handleOpenMenu(event, row)
                                            }}
                                            size="small"
                                        >
                                            <MoreVert fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={effectiveColumns.length + (showActionsColumn ? 2 : 1)}>
                                    <Typography align="center" color="text.secondary" className="table-card__empty-text">
                                        Nenhum registro encontrado.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Box>
        </Box>
    )
}
