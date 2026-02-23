import React, { useState, useEffect } from 'react';
import {
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DropAnimation,
    defaultDropAnimationSideEffects,
    type DragStartEvent,
    type DragOverEvent,
    type DragEndEvent,
    useDroppable,
    type Modifier,
    closestCenter,
    pointerWithin,
    rectIntersection
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box, Grid, Stack, useTheme, useMediaQuery } from '@mui/material';
import { isHidden as checkIsHidden } from '../../utils/accessControl';
import './style.css';

// --- Sortable Item Wrapper ---
function SortableDashboardCard({ id, children, disabled }: { id: string, children: React.ReactNode, disabled?: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id,
        disabled
    });

    const isHidden = React.isValidElement(children) && (children.props as any).accessMode && checkIsHidden((children.props as any).accessMode);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        display: isHidden ? 'none' : 'block'
    };

    if (!children || isHidden) return null;

    if (!React.isValidElement(children)) {
        return <div ref={setNodeRef} style={style}>{children}</div>;
    }

    return (
        <div ref={setNodeRef} style={style}>
            {React.cloneElement(children as React.ReactElement, {
                // @ts-ignore
                dragHandleProps: disabled ? undefined : { ...attributes, ...listeners },
                isDragging
            } as any)}
        </div>
    );
}

// --- Droppable Column Container ---
function DroppableContainer({ id, children, items }: { id: string, children: React.ReactNode, items: string[] }) {
    const { setNodeRef } = useDroppable({
        id
    });

    return (
        <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
            <div ref={setNodeRef} style={{ minHeight: '150px' }}>
                {children}
            </div>
        </SortableContext>
    );
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
};

const snapToHandle: Modifier = ({ transform, active, activatorEvent }) => {
    if (!active || !activatorEvent || !active.rect.current.initial) {
        return transform;
    }

    const initialEvent = activatorEvent as any;
    const isTouchEvent = !!initialEvent.touches;
    const initialMouseX = isTouchEvent ? initialEvent.touches[0].clientX : initialEvent.clientX;
    const initialMouseY = isTouchEvent ? initialEvent.touches[0].clientY : initialEvent.clientY;

    if (initialMouseX === undefined || initialMouseY === undefined) {
        return transform;
    }

    const initialCardX = active.rect.current.initial.left;
    const initialCardY = active.rect.current.initial.top;

    const handleOffsetX = 34;
    const handleOffsetY = 34;

    return {
        ...transform,
        x: transform.x + (initialMouseX - initialCardX - handleOffsetX),
        y: transform.y + (initialMouseY - initialCardY - handleOffsetY),
    };
};

interface DashboardDnDGridProps {
    items: Record<string, React.ReactNode>;
    defaultLayout: { [key: string]: string[] };
    layoutKey: string;
    onReset?: () => void;
}

export const DashboardDnDGrid = ({ items, defaultLayout, layoutKey }: DashboardDnDGridProps) => {
    const [activeId, setActiveId] = useState<string | null>(null);
    const [columns, setColumns] = useState<{ [key: string]: string[] }>(() => {
        const saved = localStorage.getItem(layoutKey);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const allSavedItems = new Set(Object.values(parsed).flat());
                const updated = { ...parsed };

                Object.keys(defaultLayout).forEach(colId => {
                    defaultLayout[colId].forEach(itemId => {
                        if (!allSavedItems.has(itemId)) {
                            const targetCol = colId in updated ? colId : Object.keys(updated)[0];
                            if (targetCol) {
                                updated[targetCol] = [...updated[targetCol], itemId];
                            }
                        }
                    });
                });

                return updated;
            } catch (e) {
                console.error('Failed to parse dashboard layout', e);
            }
        }
        return defaultLayout;
    });

    useEffect(() => {
        localStorage.setItem(layoutKey, JSON.stringify(columns));
    }, [columns, layoutKey]);

    useEffect(() => {
        const handleGlobalReset = () => {
            setColumns(defaultLayout);
        };
        window.addEventListener(`dashboard-reset-${layoutKey}`, handleGlobalReset);
        return () => window.removeEventListener(`dashboard-reset-${layoutKey}`, handleGlobalReset);
    }, [layoutKey, defaultLayout]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const findContainer = (id: string) => {
        if (id in columns) {
            return id;
        }
        return Object.keys(columns).find((key) => columns[key].includes(id));
    };

    const [activeWidth, setActiveWidth] = useState<number | null>(null);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        setActiveId(active.id as string);
        if (active.rect.current.initial) {
            setActiveWidth(active.rect.current.initial.width);
        }
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        const overId = over?.id;

        if (overId == null || active.id === overId) {
            return;
        }

        const activeContainer = findContainer(active.id as string);
        const overContainer = findContainer(overId as string);

        if (
            !activeContainer ||
            !overContainer ||
            activeContainer === overContainer
        ) {
            return;
        }

        setColumns((prev) => {
            const activeItems = prev[activeContainer];
            const overItems = prev[overContainer];

            const activeIndex = activeItems.indexOf(active.id as string);
            const overIndex = overItems.indexOf(overId as string);

            let newIndex;
            if (overId in prev) {
                newIndex = overItems.length + 1;
            } else {
                const isBelowOverItem =
                    over &&
                    active.rect.current.translated &&
                    active.rect.current.translated.top >
                    over.rect.top + over.rect.height;

                const modifier = isBelowOverItem ? 1 : 0;

                newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
            }

            return {
                ...prev,
                [activeContainer]: [
                    ...prev[activeContainer].filter((item) => item !== active.id),
                ],
                [overContainer]: [
                    ...prev[overContainer].slice(0, newIndex),
                    columns[activeContainer][activeIndex],
                    ...prev[overContainer].slice(newIndex, prev[overContainer].length),
                ],
            };
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        const activeContainer = findContainer(active.id as string);
        const overContainer = over ? findContainer(over.id as string) : null;

        if (
            activeContainer &&
            overContainer &&
            activeContainer === overContainer
        ) {
            const activeIndex = columns[activeContainer].indexOf(active.id as string);
            const overIndex = columns[overContainer].indexOf(over!.id as string);

            if (activeIndex !== overIndex) {
                setColumns((prev) => ({
                    ...prev,
                    [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex),
                }));
            }
        }

        setActiveId(null);
        setActiveWidth(null);
    };

    const collisionDetectionStrategy = (args: any) => {
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length > 0) return pointerCollisions;
        const rectCollisions = rectIntersection(args);
        if (rectCollisions.length > 0) return rectCollisions;
        return closestCenter(args);
    };

    const isDraggingAny = activeId !== null;
    const theme = useTheme();
    // const isLg = useMediaQuery(theme.breakpoints.up('lg')); // Not strictly used if we rely on isMd switch
    const isMd = useMediaQuery(theme.breakpoints.between('md', 'lg')); // 2 columns range

    const allColIds = Object.keys(columns);

    // Grouping Strategy for 2-Column Mode (Md - Tablet/Small Desktop)
    // Request: Align Col 3 under Col 2 (Right Side)
    // Structure: Slot 1 = [Col 1] (Left), Slot 2 = [Col 2, Col 3] (Right)
    let displaySlots: string[][] = allColIds.map(id => [id]); // Default: 1 column per slot

    if (isMd && allColIds.length >= 3) {
        displaySlots = [
            [allColIds[0]], // Left
            allColIds.slice(1) // Right (merges all remaining columns)
        ];
    }

    // Calculate which slots are visibly active (or being interacted with)
    // This maintains the "Flexibility" to expand if other columns are empty.
    const activeSlots = displaySlots.filter(slotIds =>
        isDraggingAny ||
        slotIds.some(colId => columns[colId].some(cardId => items[cardId]))
    );

    // Dynamic Sizing:
    // 1 active slot -> 12 (Full Width)
    // 2 active slots -> 6 (Half Width)
    // 3 active slots -> 4 (Third Width - standard Desktop)
    const slotGridSize = activeSlots.length === 1 ? 12 : (activeSlots.length === 2 ? 6 : 4);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={collisionDetectionStrategy}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            autoScroll={false}
        >
            <Box className="dashboard-dnd-grid">
                <Grid container spacing={3}>
                    {displaySlots.map((slotIds, index) => {
                        // Check if this particular slot has content to show
                        const hasContent = slotIds.some(colId => columns[colId].some(cardId => items[cardId]));
                        const shouldShowSlot = isDraggingAny || hasContent;

                        if (!shouldShowSlot) return null;

                        return (
                            <Grid
                                key={`slot-${index}`}
                                size={{ xs: 12, md: slotGridSize }}
                                className={`dashboard-dnd-slot ${isDraggingAny ? 'dashboard-dnd-slot--dragging' : ''}`}
                            >
                                <Stack spacing={3}>
                                    {slotIds.map(colId => {
                                        const colItems = columns[colId];
                                        const hasItems = colItems.some(cardId => items[cardId]);

                                        // If not dragging, don't render empty droppables (prevents gaps)
                                        // But if dragging, we MUST render them to allow drops.
                                        if (!hasItems && !isDraggingAny) return null;

                                        return (
                                            <DroppableContainer key={colId} id={colId} items={colItems}>
                                                <Stack
                                                    spacing={3}
                                                    className={`dashboard-dnd-droppable ${isDraggingAny ? 'dashboard-dnd-droppable--dragging' : ''} ${isDraggingAny && !hasItems ? 'dashboard-dnd-droppable--dragging-empty' : ''}`}
                                                >
                                                    {colItems.map((cardId) => (
                                                        <SortableDashboardCard key={cardId} id={cardId}>
                                                            {items[cardId]}
                                                        </SortableDashboardCard>
                                                    ))}
                                                </Stack>
                                            </DroppableContainer>
                                        );
                                    })}
                                </Stack>
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>
            <DragOverlay dropAnimation={dropAnimation} modifiers={[snapToHandle]}>
                {activeId && items[activeId] ? (
                    <Box
                        className="dashboard-dnd-overlay-item"
                        sx={{
                            width: activeWidth ? `${activeWidth}px` : 'auto',
                        }}
                    >
                        {React.cloneElement(items[activeId] as React.ReactElement, { isDragging: true } as any)}
                    </Box>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};
