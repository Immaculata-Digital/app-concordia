import { Visibility, Print } from '@mui/icons-material'
import { DashboardBodyCardActions } from '../../../components/Dashboard/DashboardBodyCardActions'
import { getAccessMode } from '../../../utils/accessControl'

type DashboardActionsCardProps = {
    permissions: string[]
    contractContent: string
    onPreview: () => void
    onPrint: () => void
    dragHandleProps?: any
    isDragging?: boolean
    className?: string
    loading?: boolean
}

export const DashboardActionsCard = ({
    permissions,
    contractContent,
    onPreview,
    onPrint,
    dragHandleProps,
    isDragging,
    className,
    loading
}: DashboardActionsCardProps) => {
    return (
        <DashboardBodyCardActions
            title="Ações"
            accessMode={getAccessMode(permissions, 'contratos:contratos:acoes')}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
            className={className}
            loading={loading}
            permissions={permissions}
            actions={[
                {
                    label: 'Visualizar Contrato',
                    icon: <Visibility />,
                    onClick: onPreview,
                    disabled: !contractContent || contractContent.trim() === '',
                    permissionKey: 'contratos:contratos:acoes:visualizar'
                },
                {
                    label: 'Imprimir Contrato',
                    icon: <Print />,
                    onClick: onPrint,
                    disabled: !contractContent || contractContent.trim() === '',
                    permissionKey: 'contratos:contratos:acoes:imprimir'
                }
            ]}
        />
    )
}
