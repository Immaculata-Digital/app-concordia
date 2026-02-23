import { useState } from 'react'
import {
    Stack,
    IconButton,
    Tooltip,
    Popover,
    Typography,
    ToggleButtonGroup,
    ToggleButton,
    Box,
    Checkbox,
} from '@mui/material'
import {
    ViewModule,
    TableChart,
    DensityMedium,
    ViewColumn,
    DensitySmall,
    DensityLarge,
    ViewStream,
    VisibilityOff,
    Visibility,
    DragIndicator,
    KeyboardArrowUp,
    KeyboardArrowDown,
    UnfoldMore
} from '@mui/icons-material'
import type { TableDensity, ColumnSetting } from '../hooks/useTableSettings'
import type { TableCardColumn, TableCardRow } from '../index'

interface TableControlsProps<T extends TableCardRow> {
    viewMode: 'card' | 'table'
    setViewMode: (mode: 'card' | 'table') => void
    density: TableDensity
    setDensity: (density: TableDensity) => void
    columnSettings: ColumnSetting[]
    toggleColumnVisibility: (key: string) => void
    changeColumnWidth: (key: string, widthLevel: number) => void
    reorderColumns: (newSettings: ColumnSetting[]) => void
    columns: TableCardColumn<T>[]
}

export const TableControls = <T extends TableCardRow>({
    viewMode,
    setViewMode,
    density,
    setDensity,
    columnSettings,
    toggleColumnVisibility,
    changeColumnWidth,
    reorderColumns,
    columns,
}: TableControlsProps<T>) => {
    const [densityAnchorEl, setDensityAnchorEl] = useState<HTMLElement | null>(null)
    const [columnsAnchorEl, setColumnsAnchorEl] = useState<HTMLElement | null>(null)
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

    const isDensityOpen = Boolean(densityAnchorEl)
    const isColumnsOpen = Boolean(columnsAnchorEl)

    const handleDensityClick = (event: React.MouseEvent<HTMLElement>) => setDensityAnchorEl(event.currentTarget)
    const handleDensityClose = () => setDensityAnchorEl(null)
    const handleColumnsClick = (event: React.MouseEvent<HTMLElement>) => setColumnsAnchorEl(event.currentTarget)
    const handleColumnsClose = () => setColumnsAnchorEl(null)

    const handleDensityChange = (
        _event: React.MouseEvent<HTMLElement>,
        newDensity: TableDensity | null,
    ) => {
        if (newDensity !== null) {
            setDensity(newDensity)
        }
    }

    // Drag and Drop logic
    const handleDragStart = (index: number) => setDraggedIndex(index)
    const handleDragOver = (e: React.DragEvent) => e.preventDefault()
    const handleDragEnter = (index: number) => setDragOverIndex(index)
    const handleDragLeave = () => setDragOverIndex(null)
    const handleDrop = (index: number) => {
        setDragOverIndex(null)
        if (draggedIndex === null || draggedIndex === index) return
        const newSettings = [...columnSettings]
        const [movedItem] = newSettings.splice(draggedIndex, 1)
        newSettings.splice(index, 0, movedItem)
        reorderColumns(newSettings)
        setDraggedIndex(null)
    }

    const moveColumn = (index: number, direction: 'up' | 'down') => {
        const newSettings = [...columnSettings]
        const targetIndex = direction === 'up' ? index - 1 : index + 1
        if (targetIndex >= 0 && targetIndex < newSettings.length) {
            const [movedItem] = newSettings.splice(index, 1)
            newSettings.splice(targetIndex, 0, movedItem)
            reorderColumns(newSettings)
        }
    }

    return (
        <Stack direction="row" spacing={1.5} alignItems="center">
            <Stack direction="row" spacing={0.5} className="table-card__view-toggle">
                <IconButton
                    size="small"
                    onClick={() => setViewMode('card')}
                    className={viewMode === 'card' ? 'table-card__view-toggle--active gold-contrast-label' : ''}
                    aria-label="Visualização em cards"
                >
                    <ViewModule fontSize="small" className={viewMode === 'card' ? 'gold-contrast-label' : ''} />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => setViewMode('table')}
                    className={viewMode === 'table' ? 'table-card__view-toggle--active gold-contrast-label' : ''}
                    aria-label="Visualização em tabela"
                >
                    <TableChart fontSize="small" className={viewMode === 'table' ? 'gold-contrast-label' : ''} />
                </IconButton>
            </Stack>

            <Tooltip title="Ajustar densidade">
                <IconButton
                    size="small"
                    onClick={handleDensityClick}
                    className={`table-card__density-btn ${isDensityOpen ? 'table-card__density-btn--active' : ''}`}
                >
                    <DensityMedium fontSize="small" />
                </IconButton>
            </Tooltip>

            <Tooltip title="Gerenciar colunas">
                <IconButton
                    size="small"
                    onClick={handleColumnsClick}
                    className={`table-card__density-btn ${isColumnsOpen ? 'table-card__density-btn--active' : ''}`}
                >
                    <ViewColumn fontSize="small" />
                </IconButton>
            </Tooltip>

            <Popover
                open={isDensityOpen}
                anchorEl={densityAnchorEl}
                onClose={handleDensityClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                className="table-card__density-popover"
                slotProps={{ paper: { className: 'table-card__density-popover-paper' } }}
            >
                <Stack spacing={0.5} className="table-card__popover-content">
                    <Typography variant="caption" className="table-card__density-popover-header table-card__popover-header">
                        Densidade de exibição
                    </Typography>
                    <ToggleButtonGroup
                        value={density}
                        exclusive
                        onChange={handleDensityChange}
                        aria-label="Densidade da tabela"
                        size="small"
                        orientation="vertical"
                        className="table-card__density-toggle"
                    >
                        <ToggleButton value="ultra-thin" aria-label="Ultra Fina" onClick={handleDensityClose}>
                            <DensitySmall /><Typography variant="body2">Ultra Fina</Typography>
                        </ToggleButton>
                        <ToggleButton value="thin" aria-label="Fina" onClick={handleDensityClose}>
                            <DensitySmall /><Typography variant="body2">Fina</Typography>
                        </ToggleButton>
                        <ToggleButton value="medium" aria-label="Média" onClick={handleDensityClose}>
                            <DensityMedium /><Typography variant="body2">Média</Typography>
                        </ToggleButton>
                        <ToggleButton value="high" aria-label="Ampla" onClick={handleDensityClose}>
                            <DensityLarge /><Typography variant="body2">Ampla</Typography>
                        </ToggleButton>
                        <ToggleButton value="ultra-high" aria-label="Ultra Ampla" onClick={handleDensityClose}>
                            <ViewStream /><Typography variant="body2">Ultra Ampla</Typography>
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Stack>
            </Popover>

            <Popover
                open={isColumnsOpen}
                anchorEl={columnsAnchorEl}
                onClose={handleColumnsClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                className="table-card__density-popover"
                slotProps={{
                    paper: {
                        className: 'table-card__columns-popover-paper'
                    }
                }}
            >
                <Stack spacing={0.5} className="table-card__popover-content">
                    <Typography variant="caption" className="table-card__density-popover-header table-card__popover-header">
                        Configurações de Colunas
                    </Typography>
                    <Stack spacing={0.5} className="table-card__density-list">
                        {columnSettings.map((setting, index) => {
                            const col = columns.find(c => String(c.key) === setting.key)
                            if (!col) return null
                            return (
                                <Box
                                    key={setting.key}
                                    className={`table-card__column-item ${draggedIndex === index ? 'table-card__column-item--dragging' : ''} ${dragOverIndex === index ? 'table-card__column-item--drag-over' : ''}`}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={handleDragOver}
                                    onDragEnter={() => handleDragEnter(index)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={() => handleDrop(index)}
                                    onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }}
                                >
                                    {/* Desktop View */}
                                    <Box className="table-card__column-item-desktop">
                                        <IconButton size="small" className="table-card__drag-handle"><DragIndicator fontSize="small" /></IconButton>
                                        <Checkbox
                                            size="small"
                                            checked={setting.visible}
                                            onChange={() => toggleColumnVisibility(setting.key)}
                                            icon={<VisibilityOff fontSize="small" className="table-card__visibility-icon-off" />}
                                            checkedIcon={<Visibility fontSize="small" />}
                                            className="table-card__visibility-checkbox"
                                        />
                                        <Typography variant="body2" className="table-card__column-label">{col.label}</Typography>
                                        <Stack direction="row" alignItems="center" spacing={1.5} className="table-card__span-control-group">
                                            <Tooltip title="Largura da coluna (Span)">
                                                <UnfoldMore className="table-card__width-icon" fontSize="small" />
                                            </Tooltip>
                                            <Stack direction="row" spacing={0.5} className="table-card__span-selector">
                                                {[1, 2, 3].map((level) => (
                                                    <Box key={level} onClick={() => changeColumnWidth(setting.key, level)}
                                                        className={`table-card__span-level ${level === setting.widthLevel ? 'table-card__span-level--active' : ''}`}
                                                    >
                                                        {level}
                                                    </Box>
                                                ))}
                                            </Stack>
                                        </Stack>
                                    </Box>

                                    {/* Mobile View */}
                                    <Box className="table-card__column-item-mobile">
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Checkbox
                                                size="small" checked={setting.visible}
                                                onChange={() => toggleColumnVisibility(setting.key)}
                                                icon={<VisibilityOff fontSize="small" className="table-card__visibility-icon-off" />}
                                                checkedIcon={<Visibility fontSize="small" />}
                                                className="table-card__visibility-checkbox"
                                            />
                                            <Typography variant="body2" className="table-card__column-label">{col.label}</Typography>
                                        </Stack>
                                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ gap: 2 }}>
                                            <Stack direction="row" alignItems="center" className="table-card__mobile-reorder-group">
                                                <IconButton size="small" disabled={index === 0} onClick={() => moveColumn(index, 'up')} className="table-card__mobile-reorder-btn"><KeyboardArrowUp /></IconButton>
                                                <Box className="table-card__mobile-divider" />
                                                <IconButton size="small" disabled={index === columnSettings.length - 1} onClick={() => moveColumn(index, 'down')} className="table-card__mobile-reorder-btn"><KeyboardArrowDown /></IconButton>
                                            </Stack>
                                            <Stack direction="row" alignItems="center" spacing={1.25}>
                                                <UnfoldMore className="table-card__width-icon" fontSize="small" />
                                                <Stack direction="row" spacing={0.5} className="table-card__span-selector">
                                                    {[1, 2, 3].map((level) => (
                                                        <Box key={level} onClick={() => changeColumnWidth(setting.key, level)}
                                                            className={`table-card__span-level ${level === setting.widthLevel ? 'table-card__span-level--active' : ''}`}
                                                        >
                                                            {level}
                                                        </Box>
                                                    ))}
                                                </Stack>
                                            </Stack>
                                        </Stack>
                                    </Box>
                                </Box>
                            )
                        })}
                    </Stack>
                </Stack>
            </Popover>
        </Stack>
    )
}
