import React, { useState } from 'react'
import {
    Box,
    Button,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    ClickAwayListener,
    Typography,
    Tooltip,
    Collapse,
    Skeleton
} from '@mui/material'
import { Add, Delete, Visibility, Download } from '@mui/icons-material'
import { DashboardBodyCard, type AccessMode } from './DashboardBodyCard'
import {
    canCreate as checkCanCreate,
    canEdit as checkCanEdit,
    canDelete as checkCanDelete,
    canVisualizeItem as checkCanVisualizeItem,
    canPreview as checkCanPreview,
    canDownload as checkCanDownload
} from '../../utils/accessControl'

type DashboardBodyCardListProps<T> = {
    title: string
    items: T[]
    keyExtractor: (item: T) => string
    renderIcon?: (item: T) => React.ReactNode
    renderText: (item: T) => React.ReactNode
    renderSecondaryText?: (item: T) => React.ReactNode
    onAdd?: () => void
    onEdit?: (item: T) => void
    onDelete?: (item: T) => void
    onPreview?: (item: T) => void
    onDownload?: (item: T) => void
    showPreview?: boolean
    showDownload?: boolean
    emptyText?: string
    primaryClassName?: string
    secondaryClassName?: string
    listItemClassName?: string
    accessMode?: AccessMode
    dragHandleProps?: Record<string, any>
    isDragging?: boolean
    alignTop?: boolean
    expandable?: boolean
    initialItemsCount?: number
    sx?: any
    className?: string
    loading?: boolean
    id?: string
    allowMinimize?: boolean
    defaultMinimized?: boolean
}

const DeleteButton = ({ onDelete }: { onDelete: () => void }) => {
    const [confirming, setConfirming] = useState(false)

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirming) {
            onDelete()
            setConfirming(false)
        } else {
            setConfirming(true)
            // Reset confirmation after 4 seconds
            setTimeout(() => setConfirming(false), 4000)
        }
    }

    return (
        <ClickAwayListener onClickAway={() => setConfirming(false)}>
            <Tooltip title={confirming ? "Clique para confirmar a exclusão" : "Excluir"}>
                <Box
                    component="button"
                    onClick={handleClick}
                    className={`delete-button-confirm ${confirming ? 'confirming' : ''}`}
                    sx={{
                        background: 'none',
                        outline: 'none',
                        '&:focus-visible': {
                            outline: '2px solid var(--color-primary)',
                            outlineOffset: '2px'
                        }
                    }}
                >
                    <Delete />
                    <span className="delete-text">Excluir?</span>
                </Box>
            </Tooltip>
        </ClickAwayListener>
    )
}

export function DashboardBodyCardList<T>({
    title,
    items,
    keyExtractor,
    renderIcon,
    renderText,
    renderSecondaryText,
    onAdd,
    onEdit,
    onDelete,
    onPreview,
    onDownload,
    showPreview = false,
    showDownload = false,
    emptyText = 'Nenhum item registrado.',
    primaryClassName = 'dashboard-text-primary',
    secondaryClassName = 'dashboard-text-secondary',
    listItemClassName,
    accessMode = 'full',
    dragHandleProps,
    isDragging,
    alignTop = false,
    expandable = false,
    initialItemsCount = 3,
    sx,
    className,
    loading,
    id,
    allowMinimize,
    defaultMinimized
}: DashboardBodyCardListProps<T>) {
    const [isExpanded, setIsExpanded] = useState(false)
    const canCreate = checkCanCreate(accessMode)
    const canEdit = checkCanEdit(accessMode)
    const canDelete = checkCanDelete(accessMode)
    const canVisualize = checkCanVisualizeItem(accessMode)
    const canPreview = checkCanPreview(accessMode)
    const canDownload = checkCanDownload(accessMode)

    const finalShowPreview = (showPreview || canPreview) && !!onPreview
    const finalShowDownload = (showDownload || canDownload) && !!onDownload

    const initialItems = expandable ? items.slice(0, initialItemsCount) : items
    const extraItems = expandable ? items.slice(initialItemsCount) : []
    const hasMoreItems = items.length > initialItemsCount

    const renderItems = (itemsList: T[]) => itemsList.map((item) => (
        <ListItem
            key={keyExtractor(item)}
            disablePadding
            sx={{
                borderBottom: '1px solid transparent',
                display: 'flex',
                alignItems: alignTop ? 'flex-start' : 'center',
                gap: 1,
                pr: 1 // Padding on the right for the actions
            }}
            className={`${listItemClassName || 'dashboard-list-item-border'}`}
        >
            <Box sx={{
                display: 'flex',
                alignItems: alignTop ? 'flex-start' : 'center',
                flexGrow: 1,
                minWidth: 0, // Critical for text truncation/wrapping inside flex
                width: '100%'
            }}>
                {onEdit && (canEdit || canVisualize) ? (
                    <ListItemButton
                        onClick={() => onEdit(item)}
                        sx={{
                            borderRadius: 'inherit',
                            alignItems: alignTop ? 'flex-start' : 'center',
                            py: 1,
                            px: 1,
                            flexGrow: 1,
                            minWidth: 0
                        }}
                    >
                        {renderIcon && (
                            <ListItemIcon sx={{
                                minWidth: { xs: 32, sm: 36, md: 40 },
                                mt: alignTop ? 0.5 : 0
                            }}>
                                {renderIcon(item)}
                            </ListItemIcon>
                        )}
                        <ListItemText
                            primary={renderText(item)}
                            secondary={renderSecondaryText && renderSecondaryText(item)}
                            primaryTypographyProps={{
                                className: primaryClassName,
                                component: 'div',
                                sx: {
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                }
                            }}
                            secondaryTypographyProps={{
                                className: secondaryClassName,
                                component: 'div',
                                sx: {
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                }
                            }}
                            sx={{ m: 0, minWidth: 0 }}
                        />
                    </ListItemButton>
                ) : (
                    <Box sx={{
                        display: 'flex',
                        width: '100%',
                        px: 1,
                        py: 1,
                        alignItems: alignTop ? 'flex-start' : 'center',
                        minWidth: 0
                    }}>
                        {renderIcon && (
                            <ListItemIcon sx={{
                                minWidth: { xs: 32, sm: 36, md: 40 },
                                mt: alignTop ? 0.5 : 0
                            }}>
                                {renderIcon(item)}
                            </ListItemIcon>
                        )}
                        <ListItemText
                            primary={renderText(item)}
                            secondary={renderSecondaryText && renderSecondaryText(item)}
                            primaryTypographyProps={{
                                className: primaryClassName,
                                component: 'div',
                                sx: {
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                }
                            }}
                            secondaryTypographyProps={{
                                className: secondaryClassName,
                                component: 'div',
                                sx: {
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                }
                            }}
                            sx={{ m: 0, minWidth: 0 }}
                        />
                    </Box>
                )}
            </Box>

            {/* Actions moved into the flow to prevent overlap */}
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                flexShrink: 0, // Prevent actions from shrinking
                ml: 'auto'
            }}>
                {finalShowPreview && (
                    <Tooltip title="Visualizar">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation()
                                onPreview(item)
                            }}
                            sx={{ p: { xs: 0.5, sm: 1 } }}
                        >
                            <Visibility sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />
                        </IconButton>
                    </Tooltip>
                )}
                {finalShowDownload && (
                    <Tooltip title="Download">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation()
                                onDownload(item)
                            }}
                            sx={{ p: { xs: 0.5, sm: 1 } }}
                        >
                            <Download sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }} />
                        </IconButton>
                    </Tooltip>
                )}
                {canDelete && onDelete && (
                    <DeleteButton onDelete={() => onDelete(item)} />
                )}
            </Box>
        </ListItem>
    ))

    return (
        <DashboardBodyCard
            id={id}
            title={title}
            accessMode={accessMode}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
            sx={sx}
            className={className}
            loading={loading}
            allowMinimize={allowMinimize}
            defaultMinimized={defaultMinimized}
            action={onAdd && canCreate && (
                <Button
                    variant="outlined"
                    size="small"
                    onClick={onAdd}
                >
                    <Add fontSize="small" />
                </Button>
            )}
        >
            <List dense disablePadding>
                {loading ? (
                    <>
                        {[1, 2, 3].map((i) => (
                            <ListItem key={i} sx={{ py: 1 }}>
                                <ListItemIcon>
                                    <Skeleton variant="circular" width={32} height={32} />
                                </ListItemIcon>
                                <ListItemText
                                    primary={<Skeleton variant="text" width="60%" />}
                                    secondary={<Skeleton variant="text" width="40%" />}
                                />
                            </ListItem>
                        ))}
                    </>
                ) : initialItems && initialItems.length > 0 ? (
                    <>
                        {renderItems(initialItems)}
                        {expandable && extraItems.length > 0 && (
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit={false}>
                                {renderItems(extraItems)}
                            </Collapse>
                        )}
                    </>
                ) : (
                    <Box className="dashboard-empty-state">
                        <Typography variant="body2" className="dashboard-empty-text">
                            {emptyText}
                        </Typography>
                    </Box>
                )}
            </List>
            {expandable && hasMoreItems && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Button
                        size="small"
                        onClick={() => setIsExpanded(!isExpanded)}
                        sx={{
                            textTransform: 'none',
                            color: 'var(--color-text)',
                            opacity: 0.8,
                            '&:hover': {
                                backgroundColor: 'transparent',
                                opacity: 1,
                                color: 'var(--color-primary)'
                            }
                        }}
                    >
                        {isExpanded ? 'Ver menos' : 'Ver mais'}
                    </Button>
                </Box>
            )}
        </DashboardBodyCard>
    )
}

