import { Button, Box } from '@mui/material'
import { DashboardBodyCard, type AccessMode } from './DashboardBodyCard'

export type ActionButton = {
    label: string
    icon: React.ReactNode
    onClick: () => void
    disabled?: boolean
    permissionKey?: string
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
    fullWidth?: boolean
}

type DashboardBodyCardActionsProps = {
    title?: string
    accessMode: AccessMode
    permissions: string[]
    actions: ActionButton[]
    dragHandleProps?: Record<string, any>
    isDragging?: boolean
    className?: string
    loading?: boolean
    id?: string
    allowMinimize?: boolean
    defaultMinimized?: boolean
}

const PremiumActionButton = ({ action, isDisabled }: { action: ActionButton; isDisabled: boolean }) => {
    const isPrimary = action.variant === 'primary'
    const isDanger = action.variant === 'danger'

    const variantClass = isPrimary
        ? 'dashboard-actions-card__button--primary'
        : isDanger
            ? 'dashboard-actions-card__button--danger'
            : 'dashboard-actions-card__button--outline'

    return (
        <Button
            variant={isPrimary ? "contained" : "outlined"}
            fullWidth
            startIcon={action.icon}
            onClick={action.onClick}
            disabled={isDisabled}
            className={`dashboard-actions-card__button ${variantClass}`}
        >
            {action.label}
        </Button>
    )
}

export const DashboardBodyCardActions = ({
    title = 'Ações',
    accessMode,
    permissions,
    actions,
    dragHandleProps,
    isDragging,
    className,
    loading,
    id,
    allowMinimize,
    defaultMinimized
}: DashboardBodyCardActionsProps) => {
    const visibleActions = actions.filter(action =>
        action.permissionKey ? permissions.includes(action.permissionKey) : true
    )

    if (visibleActions.length === 0 && !loading) return null

    const gridClassName = `dashboard-actions-card__grid ${visibleActions.length > 2 ? 'dashboard-actions-card__grid--two-cols' : ''}`

    return (
        <DashboardBodyCard
            id={id}
            title={title}
            accessMode={accessMode}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
            className={className}
            loading={loading}
            allowMinimize={allowMinimize}
            defaultMinimized={defaultMinimized}
        >
            <Box className={gridClassName}>
                {visibleActions.map((action, index) => (
                    <PremiumActionButton
                        key={index}
                        action={action}
                        isDisabled={action.disabled || false}
                    />
                ))}
            </Box>
        </DashboardBodyCard>
    )
}

