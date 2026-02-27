import React, { useState, useEffect } from 'react'
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
import { Add, Delete, Visibility, Download, DragIndicator } from '@mui/icons-material'
import { DashboardBodyCard, type AccessMode } from './DashboardBodyCard'
import {
    canCreate as checkCanCreate,
    canEdit as checkCanEdit,
    canDelete as checkCanDelete,
    canVisualizeItem as checkCanVisualizeItem,
    canPreview as checkCanPreview,
    canDownload as checkCanDownload
} from '../../utils/accessControl'

type DashboardBodyCardDnDListProps<T> = {
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
    onReorder?: (items: T[]) => void
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

function SortableItem({
    id,
    item,
    disabled,
    renderItemContent
}: { 
    id: string; 
    item: any; 
    disabled?: boolean;
    renderItemContent: (item: any, dragHandleProps?: any, isDragging?: boolean) => React.ReactNode 
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        position: 'relative' as const,
    }

    const dragHandleProps = disabled ? undefined : { ...attributes, ...listeners }

    return (
        <div ref={setNodeRef} style={style}>
            {renderItemContent(item, dragHandleProps, isDragging)}
        </div>
    )
}

export function DashboardBodyCardDnDList<T>({
    title,
    items: propItems,
    keyExtractor,
    renderIcon,
    renderText,
    renderSecondaryText,
    onAdd,
    onEdit,
    onDelete,
    onPreview,
    onDownload,
    onReorder,
    showPreview = false,
    showDownload = false,
    emptyText = 'Nenhum item registrado.',
    primaryClassName = 'dashboard-text-primary',
    secondaryClassName = 'dashboard-text-secondary',
    listItemClassName,
    accessMode = 'full',
    dragHandleProps,
    isDragging: cardIsDragging,
    alignTop = false,
    expandable = false,
    initialItemsCount = 3,
    sx,
    className,
    loading,
    id,
    allowMinimize,
    defaultMinimized
}: DashboardBodyCardDnDListProps<T>) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [items, setItems] = useState<T[]>(propItems)

    useEffect(() => {
        setItems(propItems)
    }, [propItems])

    const canCreate = checkCanCreate(accessMode)
    const canEdit = checkCanEdit(accessMode)
    const canDelete = checkCanDelete(accessMode)
    const canVisualize = checkCanVisualizeItem(accessMode)
    const canPreview = checkCanPreview(accessMode)
    const canDownload = checkCanDownload(accessMode)

    const finalShowPreview = (showPreview || canPreview) && !!onPreview
    const finalShowDownload = (showDownload || canDownload) && !!onDownload

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            setItems((itemsList) => {
                const oldIndex = itemsList.findIndex(item => keyExtractor(item) === active.id)
                const newIndex = itemsList.findIndex(item => keyExtractor(item) === over.id)
                const newItems = arrayMove(itemsList, oldIndex, newIndex)
                if (onReorder) {
                    onReorder(newItems)
                }
                return newItems
            })
        }
    }

    const initialItems = expandable ? items.slice(0, initialItemsCount) : items
    const extraItems = expandable ? items.slice(initialItemsCount) : []
    const hasMoreItems = items.length > initialItemsCount

    const renderItemContent = (item: T, itemDragHandleProps?: any, isDragging?: boolean) => {
        return (
            <ListItem
                disablePadding
                sx={{
                    borderBottom: '1px solid transparent',
                    display: 'flex',
                    alignItems: alignTop ? 'flex-start' : 'center',
                    gap: 1,
                    pr: 1,
                    bgcolor: isDragging ? 'action.hover' : 'background.paper',
                    borderRadius: 1,
                    mb: 0.5,
                    boxShadow: isDragging ? 3 : 0,
                    '&:hover .drag-indicator': {
                        opacity: 1
                    }
                }}
                className={`${listItemClassName || 'dashboard-list-item-border'}`}
            >
                <Box sx={{
                    display: 'flex',
                    alignItems: alignTop ? 'flex-start' : 'center',
                    flexGrow: 1,
                    minWidth: 0,
                    width: '100%'
                }}>
                    {canEdit && onReorder && (
                        <Box
                            className="drag-indicator"
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: isDragging ? 0.8 : 0.3,
                                cursor: isDragging ? 'grabbing' : 'grab',
                                p: 1,
                                transition: 'opacity 0.2s',
                            }}
                            {...(itemDragHandleProps || {})}
                        >
                            <DragIndicator sx={{ fontSize: '1.2rem', color: 'text.secondary' }} />
                        </Box>
                    )}
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

                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    flexShrink: 0,
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
        )
    }

    const renderItems = (itemsList: T[]) => itemsList.map((item) => {
        const itemId = keyExtractor(item)
        return (
            <SortableItem 
                key={itemId} 
                id={itemId} 
                item={item}
                disabled={!canEdit || !onReorder}
                renderItemContent={renderItemContent}
            />
        )
    })

    return (
        <DashboardBodyCard
            id={id}
            title={title}
            accessMode={accessMode}
            dragHandleProps={dragHandleProps}
            isDragging={cardIsDragging}
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
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={items.map(i => keyExtractor(i))}
                    strategy={verticalListSortingStrategy}
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
                </SortableContext>
            </DndContext>
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
