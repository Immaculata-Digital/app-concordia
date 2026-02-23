import { Card, CardContent, Typography, type SxProps, type Theme, Stack, Box, Skeleton, Collapse, IconButton, Tooltip } from '@mui/material'
import { DragIndicator, ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import { isHidden as checkIsHidden } from '../../utils/accessControl'
import { useState, useEffect } from 'react'

export type AccessMode = 'full' | 'read-only' | 'hidden' | {
    view?: boolean;
    visualizeItem?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
    preview?: boolean;
    download?: boolean;
}

type DashboardBodyCardProps = {
    id?: string
    title: string
    action?: React.ReactNode
    children: React.ReactNode
    sx?: SxProps<Theme>
    style?: React.CSSProperties
    accessMode?: AccessMode
    dragHandleProps?: Record<string, any>
    isDragging?: boolean
    className?: string
    loading?: boolean
    allowMinimize?: boolean
    defaultMinimized?: boolean
}

export const DashboardBodyCard = ({
    id,
    title,
    action,
    children,
    sx,
    style,
    accessMode = 'full',
    dragHandleProps,
    isDragging,
    className,
    loading,
    allowMinimize = true,
    defaultMinimized = false
}: DashboardBodyCardProps) => {
    const isHidden = checkIsHidden(accessMode)

    // Persistence logic
    const storageKey = id ? `dashboard-card-minimized-${id}` : (title ? `dashboard-card-minimized-${title.toLowerCase().replace(/\s+/g, '-')}` : null);

    const [isMinimized, setIsMinimized] = useState(() => {
        if (typeof window !== 'undefined' && storageKey) {
            const saved = localStorage.getItem(storageKey);
            if (saved !== null) return saved === 'true';
        }
        return defaultMinimized;
    });

    useEffect(() => {
        if (storageKey) {
            localStorage.setItem(storageKey, String(isMinimized));
        }
    }, [isMinimized, storageKey]);

    useEffect(() => {
        const handleExpandAll = () => setIsMinimized(false);
        const handleCollapseAll = () => setIsMinimized(true);

        window.addEventListener('dashboard-expand-all', handleExpandAll);
        window.addEventListener('dashboard-collapse-all', handleCollapseAll);

        return () => {
            window.removeEventListener('dashboard-expand-all', handleExpandAll);
            window.removeEventListener('dashboard-collapse-all', handleCollapseAll);
        };
    }, []);

    if (isHidden) return null

    return (
        <Card
            variant="outlined"
            className={`dashboard-card ${className || ''}`}
            sx={{
                borderRadius: 2,
                opacity: isDragging ? 0.5 : 1,
                cursor: isDragging ? 'grabbing' : undefined,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                ...sx
            }}
            style={style}
        >
            <CardContent sx={{
                display: 'flex',
                flexDirection: 'column',
                ...(isMinimized && {
                    padding: '12px 16px',
                    '&:last-child': {
                        paddingBottom: '12px'
                    }
                })
            }}>
                <Stack
                    direction="row"
                    alignItems="flex-start"
                    justifyContent="space-between"
                    flexWrap="wrap"
                    gap={2}
                    className="dashboard-section-title"
                    sx={{ mb: isMinimized ? 0 : 2 }}
                >
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: '1 1 auto', minWidth: 'min-content' }}>
                        {dragHandleProps && !loading && (
                            <Box
                                {...dragHandleProps}
                                sx={{
                                    cursor: 'grab',
                                    opacity: 0.3,
                                    '&:hover': { opacity: 1 },
                                    display: 'flex',
                                    alignItems: 'center',
                                    '&:active': { cursor: 'grabbing' },
                                    touchAction: 'none'
                                }}
                            >
                                <DragIndicator fontSize="small" />
                            </Box>
                        )}
                        <Typography variant="h6" component="div" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                            {title}
                        </Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: '0 0 auto', ml: 'auto' }}>
                        {action && !loading && !isMinimized && <Box>{action}</Box>}
                        {allowMinimize && (
                            <Tooltip title={isMinimized ? "Expandir" : "Minimizar"}>
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMinimized(!isMinimized);
                                    }}
                                    sx={{
                                        color: 'text.secondary',
                                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        transform: isMinimized ? 'rotate(-90deg)' : 'rotate(0deg)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(var(--color-primary-rgb), 0.08)',
                                            color: 'var(--color-primary)'
                                        }
                                    }}
                                >
                                    <ExpandMoreIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                </Stack>

                <Collapse in={!isMinimized} timeout="auto">
                    {loading ? (
                        <Box sx={{ flex: 1, pt: 1 }}>
                            <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} />
                            <Skeleton variant="text" width="60%" height={20} sx={{ mb: 1 }} />
                            <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 1 }} />
                        </Box>
                    ) : (
                        <Box sx={{ pt: 1 }}>
                            {children}
                        </Box>
                    )}
                </Collapse>
            </CardContent>
        </Card>
    )
}
