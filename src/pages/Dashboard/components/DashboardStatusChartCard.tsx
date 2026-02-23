import { useState, useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import { PieChart } from "@mui/x-charts/PieChart";
import { DashboardBodyCard } from "../../../components/Dashboard/DashboardBodyCard";
import "./chart-style.css";

const LEGEND_VISIBILITY_KEY = "dashboard-status-chart-legend-visible";

type DashboardStatusChartCardProps = {
    data: any[];
    isMobile: boolean;
    formatCurrency: (value: number) => string;
    formatPercentage: (value: number, total: number) => string;
    dragHandleProps?: any;
    isDragging?: boolean;
    className?: string;
    loading?: boolean;
};

export const DashboardStatusChartCard = ({
    data,
    isMobile,
    formatCurrency,
    formatPercentage,
    dragHandleProps,
    isDragging,
    className,
    loading,
}: DashboardStatusChartCardProps) => {

    const [showLegend, setShowLegend] = useState<boolean>(() => {
        const stored = localStorage.getItem(LEGEND_VISIBILITY_KEY);
        return stored === "true";
    });

    useEffect(() => {
        localStorage.setItem(LEGEND_VISIBILITY_KEY, String(showLegend));
    }, [showLegend]);

    const toggleLegend = () => setShowLegend((prev) => !prev);
    const chartColors = [
        '#dbaa3d', // Primary
        '#9c27b0', // Secondary (Purple adjusted to brand if needed, but here using standards)
        '#4caf50', // Success
        '#f44336', // Error
        '#ff9800', // Warning
        '#2196f3', // Info
    ];

    const totalValor = data.reduce((sum, item) => sum + item.valor, 0);
    const totalQuantidade = data.reduce((sum, item) => sum + item.quantidade, 0);

    const dadosGrafico = data
        .filter((item) => item.valor > 0 || item.quantidade > 0)
        .map((item, index) => ({
            id: index,
            value: item.valor,
            label: `${item.status} (${formatCurrency(item.valor)})`,
            color: chartColors[index % chartColors.length],
        }));

    if (dadosGrafico.length === 0) {
        return (
            <DashboardBodyCard title="Volume por Status" loading={loading} className={className}>
                <Box className="status-chart__empty-box">
                    <Typography variant="body2" color="text.secondary">Nenhum dado disponível</Typography>
                </Box>
            </DashboardBodyCard>
        );
    }

    return (
        <DashboardBodyCard
            id="volume-por-contratos-card"
            title="Volume por Status"
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
            className={className}
            loading={loading}
        >
            <Box className="status-chart__content">
                <Box className="status-chart__chart-box">
                    <PieChart
                        series={[{
                            data: dadosGrafico,
                            innerRadius: isMobile ? 55 : 70,
                            outerRadius: isMobile ? 85 : 100,
                            paddingAngle: 4,
                            cornerRadius: 6,
                            cx: '50%',
                            cy: '50%',
                        }]}
                        colors={chartColors}
                        height={isMobile ? 200 : 240}
                        width={isMobile ? 200 : 240}
                        margin={{ top: 0, bottom: 0, left: 0, right: 0 }}
                        className="status-chart__pie-chart"
                        slotProps={{
                            legend: { sx: { display: 'none' } }
                        }}
                    />
                    <Box className="status-chart__center-info">
                        <Typography variant="caption" className="status-chart__center-label">
                            Total
                        </Typography>
                        <Typography variant="h6" className="status-chart__center-value">
                            {formatCurrency(totalValor).split(',')[0]}
                        </Typography>
                        <Typography variant="caption" className="status-chart__center-count">
                            {totalQuantidade} Contratos
                        </Typography>
                    </Box>
                </Box>

                <Box className="status-chart__legend-box">
                    <Button
                        variant="text"
                        size="small"
                        onClick={toggleLegend}
                        startIcon={showLegend ? <ExpandLess /> : <ExpandMore />}
                        className="status-chart__legend-toggle"
                    >
                        {showLegend ? 'Ver menos' : 'Ver mais'}
                    </Button>


                    {showLegend && (
                        <Box className="status-chart__legend-grid">
                            {data.map((item, index) => (
                                <Box key={index} className="status-chart__legend-item">
                                    <Box
                                        className="status-chart__legend-dot"
                                        style={{
                                            backgroundColor: chartColors[index % chartColors.length],
                                            boxShadow: `0 0 8px ${chartColors[index % chartColors.length]}44`
                                        }}
                                    />
                                    <Box className="status-chart__legend-content">
                                        <Box className="status-chart__legend-header">
                                            <Typography className="status-chart__legend-title">
                                                {item.status}
                                            </Typography>
                                            <Typography className="status-chart__legend-percentage">
                                                {formatPercentage(item.valor, totalValor)}
                                            </Typography>
                                        </Box>
                                        <Typography variant="caption" className="status-chart__legend-footer">
                                            <span>{formatCurrency(item.valor)}</span>
                                            {isMobile ? null : <span>•</span>}
                                            <span>{item.quantidade} un</span>
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            </Box>
        </DashboardBodyCard>
    );
};

