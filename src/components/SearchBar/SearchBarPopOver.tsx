import React from 'react'
import {
    Box,
    Popover,
    Typography,
    Button,
} from '@mui/material'

interface SearchBarPopOverProps {
    open: boolean
    anchorEl: HTMLButtonElement | null
    onClose: () => void
    title: string
    children: React.ReactNode
    onClear?: () => void
    onSearch?: () => void
    clearLabel?: string
    searchLabel?: string
}

/**
 * SearchBarPopOver Component
 * A premium styled popover for search filters, maintaining consistency with TableCardModal.
 */
export const SearchBarPopOver = ({
    open,
    anchorEl,
    onClose,
    title,
    children,
    onClear,
    onSearch,
    clearLabel = 'Limpar Filtros',
    searchLabel = 'Filtrar',
}: SearchBarPopOverProps) => {
    return (
        <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={onClose}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            PaperProps={{
                sx: {
                    width: { xs: '100%', lg: 800 },
                    maxWidth: { xs: '95vw', lg: '90vw' },
                    maxHeight: { xs: '80vh', lg: 'auto' },
                    borderRadius: '20px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    overflow: 'hidden',
                    mt: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border-lighter)',
                }
            }}
            BackdropProps={{
                sx: {
                    backdropFilter: 'blur(4px)',
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                }
            }}
        >
            {/* Header style consistent with TableCardModal */}
            <Box sx={{ p: '24px 24px 16px 24px' }}>
                <Typography variant="h6" sx={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
                    {title}
                </Typography>
            </Box>

            {/* Content area */}
            <Box sx={{ flex: '1 1 auto', overflowY: 'auto' }}>
                {children}
            </Box>

            {/* Actions style consistent with TableCardModal */}
            <Box sx={{ p: '16px 24px 24px 24px', display: 'flex', justifyContent: 'space-between', gap: 1, borderTop: 'none' }}>
                <Button
                    onClick={onClear}
                    color="inherit"
                    className="button-cancel"
                    sx={{
                        borderRadius: '10px',
                        padding: '8px 16px',
                        textTransform: 'none',
                        fontWeight: 500,
                        fontSize: '15px',
                    }}
                >
                    {clearLabel}
                </Button>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={onSearch}
                    sx={{
                        borderRadius: '10px',
                        padding: '8px 20px',
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '15px',
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        },
                    }}
                >
                    {searchLabel}
                </Button>
            </Box>
        </Popover>
    )
}
