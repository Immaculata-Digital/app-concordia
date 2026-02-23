import { Stack, Typography, IconButton, Button, Box } from '@mui/material'
import { Add } from '@mui/icons-material'
import { canCreate } from '../../../utils/accessControl'
import type { AccessMode } from '../index'
import { type ReactNode } from 'react'

interface TableToolbarProps {
    title?: string
    accessMode: AccessMode
    onAddClick?: () => void
    onAddEffect?: () => void // Internal callback to open dialog
    canAdd: boolean
    children?: ReactNode
}

export const TableToolbar = ({
    title,
    accessMode,
    onAddClick,
    onAddEffect,
    canAdd,
    children,
}: TableToolbarProps) => {
    const showAdd = canAdd && canCreate(accessMode)

    return (
        <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', md: 'center' }}
            justifyContent="space-between"
            className="table-card__toolbar table-card__toolbar-container"
        >
            <Stack direction="row" alignItems="center" justifyContent="space-between" className="table-card__toolbar-title-wrapper">
                <Typography variant="h5" fontWeight={700} className="table-card__toolbar-title">
                    {title}
                </Typography>

                {/* Mobile Add Button */}
                {showAdd && (
                    <IconButton
                        onClick={() => onAddClick ? onAddClick() : onAddEffect?.()}
                        className="table-card__add-btn table-card__add-btn-mobile"
                    >
                        <Add fontSize="small" />
                    </IconButton>
                )}
            </Stack>

            <Stack
                direction="row"
                spacing={1.5}
                alignItems="center"
                justifyContent="flex-end"
                className="table-card__toolbar-controls-wrapper"
            >
                {/* Visual Controls (Grid, Density, Columns) */}
                <Box className="table-card__controls-container">
                    {children}
                </Box>

                {/* Desktop Add Button */}
                {showAdd && (
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => onAddClick ? onAddClick() : onAddEffect?.()}
                        className="table-card__add-btn table-card__add-btn-desktop"
                    >
                        Adicionar
                    </Button>
                )}
            </Stack>
        </Stack>
    )
}
