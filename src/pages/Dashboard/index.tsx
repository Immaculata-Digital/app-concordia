import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Assignment, DashboardOutlined } from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { dashboardService, type DashboardData } from "../../services/dashboard";
import { DashboardContent } from "../../components/Dashboard/DashboardContent";
import { DashboardDnDGrid } from "../../components/Dashboard/DashboardDnDGrid";
import { DashboardStack } from "../../components/Dashboard/DashboardStack";
import { DashboardActionBar } from "../../components/Dashboard/DashboardActionBar";
import { getAccessMode, isHidden } from "../../utils/accessControl";
import { formatCurrency } from "../../utils/format";

// Specialized Card Components
import { DashboardKPIsCard } from "./components/DashboardKPIsCard";
import { DashboardVolumeChartCard } from "./components/DashboardVolumeChartCard";
import { DashboardStatusChartCard } from "./components/DashboardStatusChartCard";

import "./style.css";

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>({
    volumePorPeriodo: [],
    volumePorStatus: [],
    valorEmOperacao: 0,
    volumeTotalContratos: 0,
    contratosEmOperacao: 0,
    totalContratos: 0,
  });

  const VOLUME_PERIOD_KEY = 'dashboard-volume-period';
  const [selectedPeriodo, setSelectedPeriodo] = useState<number>(() => {
    const saved = localStorage.getItem(VOLUME_PERIOD_KEY);
    return saved ? Number(saved) : 7;
  });
  const { permissions } = useAuth();

  useEffect(() => {
    localStorage.setItem(VOLUME_PERIOD_KEY, String(selectedPeriodo));
  }, [selectedPeriodo]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const dashboardData = await dashboardService.getDashboardData();
        setData(dashboardData);
      } catch (err) {
        console.error("Erro ao carregar dados do dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    if (permissions.includes("contratos:dashboard:visualizar") || permissions.includes("contratos:contratos:listar")) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [permissions]);

  // Dynamically fetch volume by period when filter changes
  useEffect(() => {
    const loadVolumeByPeriod = async () => {
      try {
        const volumeData = await dashboardService.getVolumePorPeriodo(selectedPeriodo);
        setData(prev => prev ? { ...prev, volumePorPeriodo: volumeData } : prev);
      } catch (err) {
        console.error("Erro ao carregar volume por período:", err);
      }
    };

    if (permissions.includes("contratos:dashboard:visualizar") || permissions.includes("contratos:contratos:listar")) {
      loadVolumeByPeriod();
    }
  }, [selectedPeriodo, permissions]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));


  const formatPercentage = (value: number, total: number): string => {
    if (total === 0) return "0%";
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(1).replace(".", ",")}%`;
  };

  const formatValueInMillions = (value: number): string => {
    if (value >= 1000000) {
      const millions = value / 1000000;
      return `${millions.toFixed(1).replace(".", ",")}M`;
    } else {
      const thousands = value / 1000;
      const formattedThousands = thousands % 1 === 0
        ? thousands.toString()
        : thousands.toFixed(1).replace(".", ",");
      return `${formattedThousands} mil`;
    }
  };

  const hasData = (data?.totalContratos ?? 0) > 0;

  const isCardVisible = (permission: string) => !isHidden(getAccessMode(permissions, permission));

  const cardComponents = {
    kpis: isCardVisible('dashboard:contratos-info-geral') ? (
      <DashboardKPIsCard
        className="animate-entrance delay-1"
        valorEmOperacao={data?.valorEmOperacao || 0}
        volumeTotalContratos={data?.volumeTotalContratos || 0}
        contratosEmOperacao={data?.contratosEmOperacao || 0}
        totalContratos={data?.totalContratos || 0}
        formatCurrency={formatCurrency}
        loading={loading}
      />
    ) : null,
    volume: isCardVisible('dashboard:contratos-volume-por-status') ? (
      <DashboardStatusChartCard
        className="animate-entrance delay-2"
        data={data?.volumePorStatus || []}
        isMobile={isMobile}
        formatCurrency={formatCurrency}
        formatPercentage={formatPercentage}
        loading={loading}
      />
    ) : null,
    operacao: isCardVisible('dashboard:contratos-volume-em-operacao') ? (
      <DashboardVolumeChartCard
        className="animate-entrance delay-3"
        selectedPeriodo={selectedPeriodo}
        setSelectedPeriodo={setSelectedPeriodo}
        data={data?.volumePorPeriodo || []}
        isMobile={isMobile}
        formatValueInMillions={formatValueInMillions}
        loading={loading}
      />
    ) : null
  };

  const hasVisibleCards = Object.values(cardComponents).some(card => card !== null);

  return (
    <DashboardContent loading={loading} hasData={hasData}>
      <Stack spacing={3}>
        {!loading && !hasData ? (
          <Box className="dashboard-page__empty-state">
            <Assignment className="dashboard-page__empty-icon" />
            <Typography variant="h5" className="dashboard-page__empty-title">
              Dashboard Vazio
            </Typography>
            <Typography variant="body1" className="dashboard-page__empty-text">
              Ainda não há informações para exibir neste dashboard. Assim que você cadastrar contratos ativos, os gráficos e indicadores aparecerão aqui em tempo real.
            </Typography>
          </Box>
        ) : !loading && !hasVisibleCards ? (
          <Box className="dashboard-page__empty-state">
            <DashboardOutlined className="dashboard-page__empty-icon" />
            <Typography variant="h5" className="dashboard-page__empty-title">
              Nenhum Dashboard Disponível
            </Typography>
            <Typography variant="body1" className="dashboard-page__empty-text">
              Você não possui permissão para visualizar os cards do dashboard. Entre em contato com o administrador do sistema para solicitar acesso.
            </Typography>
          </Box>
        ) : (
          <Box className="dashboard-page__container">
            {/* Action Bar with reset and expand/collapse buttons */}
            {!isMobile && (
              <DashboardActionBar layoutKey="dashboard-main-layout" />
            )}
            {/* Liquid Grid: Handles XS, SM, MD, LG, XL internally */}
            {!isMobile ? (
              <DashboardDnDGrid
                items={cardComponents}
                layoutKey="dashboard-main-layout"
                defaultLayout={{
                  col1: ['kpis'],
                  col2: ['volume'],
                  col3: ['operacao']
                }}
              />
            ) : (
              /* Mobile optimized stack */
              <DashboardStack spacing={3} className="dashboard-page__stack--mobile">
                {cardComponents.kpis}
                {cardComponents.volume}
                {cardComponents.operacao}
              </DashboardStack>
            )}
          </Box>
        )}
      </Stack>
    </DashboardContent>
  );
};

export default DashboardPage;

