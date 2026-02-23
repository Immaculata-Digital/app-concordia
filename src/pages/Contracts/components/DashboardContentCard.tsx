import { Box, Button, Stack, Typography } from '@mui/material'
import { Edit, Description, NoteAdd } from '@mui/icons-material'
import { DashboardBodyCard } from '../../../components/Dashboard/DashboardBodyCard'
import { getAccessMode, canEdit } from '../../../utils/accessControl'

type DashboardContentCardProps = {
    permissions: string[]
    contractContent: string
    onEdit: () => void
    dragHandleProps?: any
    isDragging?: boolean
    sx?: any
    className?: string
    loading?: boolean
}

export const DashboardContentCard = ({ permissions, contractContent, onEdit, dragHandleProps, isDragging, sx, className, loading }: DashboardContentCardProps) => {
    const accessMode = getAccessMode(permissions, 'contratos:contratos:conteudo')
    const hasContent = contractContent && contractContent !== '[]' && contractContent.replace(/<[^>]+>/g, '').trim().length > 0

    return (
        <DashboardBodyCard
            title="Conteúdo"
            accessMode={accessMode}
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
            sx={sx}
            className={className}
            loading={loading}
            action={canEdit(accessMode) && (
                <Button
                    variant="outlined"
                    size="small"
                    onClick={onEdit}
                >
                    <Edit fontSize="small" />
                </Button>
            )}
        >
            <Box className="dashboard-content-card__container">
                {hasContent ? (
                    <Stack alignItems="center" spacing={1}>
                        <Box className="dashboard-content-card__icon-badge dashboard-content-card__icon-badge--has-content">
                            <Description className="dashboard-content-card__icon dashboard-content-card__icon--primary" />
                        </Box>
                        <Box textAlign="center">
                            <Typography variant="subtitle2" color="text.primary" className="dashboard-text--semibold">
                                Conteúdo Registrado
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block">
                                O documento possui cláusulas definidas
                            </Typography>
                        </Box>
                    </Stack>
                ) : (
                    <Stack alignItems="center" spacing={1}>
                        <Box className="dashboard-content-card__icon-badge dashboard-content-card__icon-badge--empty">
                            <NoteAdd color="disabled" className="dashboard-content-card__icon" />
                        </Box>
                        <Box textAlign="center">
                            <Typography variant="subtitle2" color="text.secondary" className="dashboard-text--medium">
                                Aguardando Conteúdo
                            </Typography>
                            <Typography variant="caption" color="text.disabled" display="block">
                                Edite para adicionar cláusulas
                            </Typography>
                        </Box>
                    </Stack>
                )}
            </Box>
        </DashboardBodyCard>
    )
}
