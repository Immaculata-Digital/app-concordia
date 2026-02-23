import { Box, Grid, Stack, Typography, Tooltip, Zoom, useMediaQuery } from "@mui/material";
import { TrendingUp, AttachMoney, Assignment, Description, InfoOutlined } from "@mui/icons-material";
import { DashboardBodyCard } from "../../../components/Dashboard/DashboardBodyCard";
import './kpi-style.css';

/** Só usa 2 colunas quando a largura for >= 1800px, evitando sobreposição ao dar zoom */
const KPI_TWO_COLUMNS_MIN_WIDTH = 1800;

type DashboardKPIsCardProps = {
    valorEmOperacao: number;
    volumeTotalContratos: number;
    contratosEmOperacao: number;
    totalContratos: number;
    formatCurrency: (value: number) => string;
    dragHandleProps?: any;
    isDragging?: boolean;
    className?: string;
    loading?: boolean;
};

const KPICard = ({
    icon: Icon,
    label,
    value,
    tooltip,
    variant = 'primary',
    gridSize,
}: {
    icon: any,
    label: string,
    value: string | number,
    tooltip: string,
    variant?: 'primary' | 'warning' | 'success' | 'info',
    gridSize: { xs: number; sm: number; md: number; lg: number; xl: number }
}) => (
    <Grid size={gridSize}>
        <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            className="animate-entrance dashboard-kpi-card"
        >
            <Box className={`dashboard-kpi-icon-box dashboard-kpi-icon-box--${variant}`}>
                <Icon className="dashboard-kpi-icon" />
            </Box>
            <Box className="dashboard-kpi-content">
                <Box className="dashboard-kpi-header">
                    <Typography variant="caption" className="dashboard-kpi-label">
                        {label}
                    </Typography>
                    <Tooltip title={tooltip} arrow TransitionComponent={Zoom} placement="top">
                        <InfoOutlined className="dashboard-kpi-info-icon" />
                    </Tooltip>
                </Box>
                <Typography
                    variant="h5"
                    className="dashboard-kpi-value"
                >
                    {value}
                </Typography>
            </Box>
        </Stack>
    </Grid>
);

export const DashboardKPIsCard = ({
    valorEmOperacao,
    volumeTotalContratos,
    contratosEmOperacao,
    totalContratos,
    formatCurrency,
    dragHandleProps,
    isDragging,
    className,
    loading,
}: DashboardKPIsCardProps) => {
    const useTwoColumns = useMediaQuery(`(min-width:${KPI_TWO_COLUMNS_MIN_WIDTH}px)`);
    const gridSize = useTwoColumns
        ? { xs: 12, sm: 12, md: 12, lg: 12, xl: 6 }
        : { xs: 12, sm: 12, md: 12, lg: 12, xl: 12 };

    return (
        <DashboardBodyCard
            id="kpi-card"
            title="Informações gerais"
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
            className={`${className || ''} dashboard-kpi-container`}
            loading={loading}
        >
            <Box className="dashboard-body-card-content">
                <Grid container spacing={2}>
                    <KPICard
                        icon={AttachMoney}
                        label="Volume em Contratos"
                        value={formatCurrency(volumeTotalContratos)}
                        tooltip="Soma de todos os contratos"
                        variant="warning"
                        gridSize={gridSize}
                    />
                    <KPICard
                        icon={TrendingUp}
                        label="Valor em Operação"
                        value={formatCurrency(valorEmOperacao)}
                        tooltip="Soma dos contratos vigentes"
                        variant="primary"
                        gridSize={gridSize}
                    />
                    <KPICard
                        icon={Assignment}
                        label="Contratos em Operação"
                        value={contratosEmOperacao}
                        tooltip="Contratos ativos no sistema"
                        variant="success"
                        gridSize={gridSize}
                    />
                    <KPICard
                        icon={Description}
                        label="Total de Contratos"
                        value={totalContratos}
                        tooltip="Total solicitado (todos os status)"
                        variant="info"
                        gridSize={gridSize}
                    />
                </Grid>
            </Box>
        </DashboardBodyCard>
    );
};
