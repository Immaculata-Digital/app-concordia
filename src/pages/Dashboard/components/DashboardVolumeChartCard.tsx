import { Box, Button } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { DashboardBodyCard } from "../../../components/Dashboard/DashboardBodyCard";

type DashboardVolumeChartCardProps = {
    selectedPeriodo: number;
    setSelectedPeriodo: (periodo: number) => void;
    data: any[];
    isMobile: boolean;
    formatValueInMillions: (value: number) => string;
    dragHandleProps?: any;
    isDragging?: boolean;
    className?: string;
    loading?: boolean;
};

import "./chart-style.css";

export const DashboardVolumeChartCard = ({
    selectedPeriodo,
    setSelectedPeriodo,
    data,
    isMobile,
    formatValueInMillions,
    dragHandleProps,
    isDragging,
    className,
    loading,
}: DashboardVolumeChartCardProps) => {
    // Calcular valor máximo uma vez para reutilizar
    const maxValue = Math.max(...data.map((d) => d.valor), 0);

    // Arredondar para cima o valor máximo para o próximo valor "redondo"
    let roundedMax = maxValue;
    if (!isMobile && maxValue > 0) {
        if (maxValue >= 1000000) {
            const millions = maxValue / 1000000;
            roundedMax = Math.ceil(millions * 2) / 2 * 1000000;
            if (roundedMax <= maxValue || roundedMax - maxValue < 50000) {
                roundedMax += 0.5 * 1000000;
            }
        } else if (maxValue >= 1000) {
            const thousands = maxValue / 900;
            let roundedThousands;
            if (thousands <= 10) {
                roundedThousands = Math.ceil(thousands / 2) * 2 + 2;
            } else if (thousands <= 50) {
                roundedThousands = Math.ceil(thousands / 5) * 5 + 5;
            } else {
                roundedThousands = Math.ceil(thousands / 10) * 10 + 10;
            }
            roundedMax = roundedThousands * 1000;
        }
    }

    return (
        <DashboardBodyCard
            id="volume-operacao-card"
            title="Volume em Operação"
            dragHandleProps={dragHandleProps}
            isDragging={isDragging}
            className={className}
            loading={loading}
        >
            <Box className="volume-chart__header">
                <Box className="volume-chart__period-picker">
                    {[7, 30, 90, 365].map((p) => (
                        <Button
                            key={p}
                            variant="text"
                            onClick={() => setSelectedPeriodo(p)}
                            size="small"
                            className={`volume-chart__period-btn ${selectedPeriodo === p ? 'volume-chart__period-btn--active' : 'volume-chart__period-btn--inactive'}`}
                        >
                            {p === 365 ? "Ano" : `${p}D`}
                        </Button>
                    ))}
                </Box>
            </Box>

            <Box className="volume-chart__chart-box">
                <svg width="0" height="0" style={{ position: "absolute" }}>
                    <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.4} />
                        </linearGradient>
                    </defs>
                </svg>
                {data.length > 0 && (
                    <BarChart
                        xAxis={[
                            {
                                data: data.map((d) => d.periodo),
                                scaleType: "band",
                                tickLabelStyle: {
                                    fontSize: 8,
                                    fill: 'var(--color-on-secondary)',
                                }
                            },
                        ]}
                        yAxis={[
                            {
                                valueFormatter: (value: number) => formatValueInMillions(value),
                                tickLabelStyle: {
                                    fontSize: 8,
                                    fill: 'var(--color-on-secondary)',
                                },
                                ...(!isMobile && maxValue > 0 ? { max: roundedMax } : {}),
                            },
                        ]}
                        series={[{
                            data: data.map((d) => d.valor),
                            label: "Volume (R$)",
                            color: 'var(--color-primary)',
                        }]}
                        height={isMobile ? 220 : 280}
                        margin={{
                            left: isMobile ? 35 : 40,
                            right: 20,
                            top: 10,
                            bottom: isMobile ? 25 : 30
                        }}
                        className="volume-chart__bar-chart"
                        slotProps={{
                            legend: { sx: { display: 'none' } }
                        }}
                    />

                )}
            </Box>
        </DashboardBodyCard>
    );
};

