import { useState } from 'react'
import { Box, Tooltip, Stack } from '@mui/material'
import { Refresh, UnfoldMore, UnfoldLess } from '@mui/icons-material'

type DashboardActionBarProps = {
    layoutKey: string
    title?: string
}

export const DashboardActionBar = ({ layoutKey, title }: DashboardActionBarProps) => {
    const [isAllExpanded, setIsAllExpanded] = useState(true);

    const handleReset = () => {
        localStorage.removeItem(layoutKey);
        window.dispatchEvent(new CustomEvent(`dashboard-reset-${layoutKey}`));
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
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                mb: 2
            }}
        >
            {title && (
                <Box component="h1" sx={{
                    fontSize: { xs: '1.5rem', sm: '1.75rem' },
                    fontWeight: 700,
                    color: 'text.primary',
                    m: 0
                }}>
                    {title}
                </Box>
            )}

            <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 'auto' }}>
                <Tooltip title={isAllExpanded ? "Recolher todos os cards" : "Expandir todos os cards"}>
                    <button
                        onClick={handleToggleAll}
                        className="dashboard-action-btn"
                    >
                        {isAllExpanded ? <UnfoldLess fontSize="small" /> : <UnfoldMore fontSize="small" />}
                    </button>
                </Tooltip>

                <Tooltip title="Restaurar layout original">
                    <button
                        onClick={handleReset}
                        className="dashboard-action-btn"
                    >
                        <Refresh fontSize="small" />
                    </button>
                </Tooltip>
            </Stack>
        </Box>
    )
}
