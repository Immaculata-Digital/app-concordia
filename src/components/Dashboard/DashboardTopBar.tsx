import { useState } from 'react'
import { DialogTitle, Box, Typography, Tooltip, Stack } from '@mui/material'
import { Close, Refresh, UnfoldMore, UnfoldLess } from '@mui/icons-material'

type DashboardTopBarProps = {
    title: string
    onClose: () => void
    layoutKey?: string
}

export const DashboardTopBar = ({ title, onClose, layoutKey }: DashboardTopBarProps) => {
    const [isAllExpanded, setIsAllExpanded] = useState(true);

    const handleReset = () => {
        if (layoutKey) {
            localStorage.removeItem(layoutKey);
            window.dispatchEvent(new CustomEvent(`dashboard-reset-${layoutKey}`));
        }
    }

    const handleToggleAll = () => {
        if (isAllExpanded) {
            window.dispatchEvent(new CustomEvent('dashboard-collapse-all'));
        } else {
            window.dispatchEvent(new CustomEvent('dashboard-expand-all'));
        }
        setIsAllExpanded(!isAllExpanded);
    }

    return (
        <DialogTitle className="dashboard-header-premium">
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="h6" className="dashboard-header__title">
                    {title}
                </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title={isAllExpanded ? "Recolher todos os cards" : "Expandir todos os cards"}>
                    <Box
                        component="button"
                        onClick={handleToggleAll}
                        className="dashboard-close-btn"
                        sx={{ background: 'none', outline: 'none' }}
                    >
                        {isAllExpanded ? <UnfoldLess /> : <UnfoldMore />}
                    </Box>
                </Tooltip>

                {layoutKey && (
                    <Tooltip title="Restaurar layout original">
                        <Box component="button" onClick={handleReset} className="dashboard-close-btn" sx={{ background: 'none', outline: 'none' }}>
                            <Refresh />
                        </Box>
                    </Tooltip>
                )}

                <Tooltip title="Fechar Dashboard">
                    <Box
                        component="button"
                        onClick={onClose}
                        className="dashboard-close-btn"
                        aria-label="Fechar"
                        sx={{
                            background: 'none',
                            outline: 'none',
                        }}
                    >
                        <Close />
                    </Box>
                </Tooltip>
            </Stack>
        </DialogTitle>
    )
}
