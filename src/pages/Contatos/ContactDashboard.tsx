import { useEffect, useState, useCallback, useRef, useMemo, type ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Box,
  Chip,
  Stack,
  Typography,
  Grid,
  Button,
  IconButton,
} from "@mui/material";
import Toast from "../../components/Toast";

import { DashboardModal, TableCardModal } from "../../components/Modals";
import { Phone, Email, LocationOn, Edit, Visibility } from "@mui/icons-material";
import { DashboardTopCard } from "../../components/Dashboard/DashboardTopCard";
import { DashboardBodyCard } from "../../components/Dashboard/DashboardBodyCard";
import { DashboardDnDGrid } from "../../components/Dashboard/DashboardDnDGrid";
import { DashboardStack } from "../../components/Dashboard/DashboardStack";
import { useEstados, useMunicipios } from "../../hooks/queries/ibge";
import LinkGeneratedModal from "./components/LinkGeneratedModal";
import { getAccessMode, canEdit } from "../../utils/accessControl";
import { formatDateDisplay } from "../../utils/date";
import TextPicker from "../../components/TextPicker";
import PhonePicker from "../../components/PhonePicker";
import MailPicker from "../../components/MailPicker";
import MultiSelectPicker from "../../components/MultiSelectPicker";
import SelectPicker from "../../components/SelectPicker";
import SwitchPicker from "../../components/SwitchPicker";
import BlockEditorPicker from "../../components/BlockEditorPicker";
import { useContactDashboard, useUpdateContact } from "../../hooks/queries/contacts";
import { useUsers } from "../../hooks/queries/users";

type ContactDashboardProps = {
  contactId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
};

const ContactDashboard = ({
  contactId,
  open,
  onClose,
  onUpdate: _onUpdate, // Prefixo _ indica que será usado no futuro
}: ContactDashboardProps) => {
  const { data: dashboardData, isLoading: loadingDashboard } = useContactDashboard(open ? contactId : null);
  const contact = dashboardData?.contact || null;
  const draftContracts = dashboardData?.draftContracts || [];
  const updateContactMutation = useUpdateContact();
  const { data: users = [] } = useUsers();
  const loading = open && loadingDashboard;

  const { permissions, user: currentUser } = useAuth();

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedContractLink, setSelectedContractLink] = useState<string>("");

  // Estados para modais de edição
  const [editBasicInfoOpen, setEditBasicInfoOpen] = useState(false);
  const [editTermsOpen, setEditTermsOpen] = useState(false);
  const [editUsersOpen, setEditUsersOpen] = useState(false);
  const [editObservationsOpen, setEditObservationsOpen] = useState(false);

  // Estados para formulários
  const [basicInfoForm, setBasicInfoForm] = useState({
    name: "",
    phone: "",
    email: "",
    uf: "",
    cidade: "",
    profession: "",
    enterprise: "",
    sector: "",
  });
  const [initialBasicInfoForm, setInitialBasicInfoForm] = useState(basicInfoForm);

  const [termsForm, setTermsForm] = useState({
    lgpdPrivacidade: false,
    lgpdComunicacao: false,
  });
  const [initialTermsForm, setInitialTermsForm] = useState(termsForm);

  const [usersForm, setUsersForm] = useState<string[]>([]);
  const [initialUsersForm, setInitialUsersForm] = useState<string[]>([]);

  const [observationsForm, setObservationsForm] = useState("");
  const [initialObservationsForm, setInitialObservationsForm] = useState("");

  const isBasicInfoDirty = useMemo(() => JSON.stringify(basicInfoForm) !== JSON.stringify(initialBasicInfoForm), [basicInfoForm, initialBasicInfoForm]);
  const isTermsDirty = useMemo(() => JSON.stringify(termsForm) !== JSON.stringify(initialTermsForm), [termsForm, initialTermsForm]);
  const isUsersDirty = useMemo(() => JSON.stringify(usersForm) !== JSON.stringify(initialUsersForm), [usersForm, initialUsersForm]);
  const isObservationsDirty = useMemo(() => observationsForm !== initialObservationsForm, [observationsForm, initialObservationsForm]);

  const { data: estadosData = [], isLoading: loadingEstados } = useEstados();
  const { data: municipiosData = [], isLoading: loadingMunicipios } = useMunicipios(basicInfoForm.uf || null);

  const estados = useMemo(() =>
    estadosData.map((e) => ({
      label: `${e.sigla} - ${e.nome}`,
      value: e.sigla,
    })), [estadosData]
  );

  const municipios = useMemo(() =>
    municipiosData.map((m) => ({
      label: m.nome,
      value: m.nome,
    })), [municipiosData]
  );
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity?: "success" | "error" | "warning" | "info";
  }>({ open: false, message: "" });
  const pendingUpdateRef = useRef(false);

  useEffect(() => {
    if (!open && pendingUpdateRef.current && _onUpdate) {
      pendingUpdateRef.current = false;
      // Delay para garantir que o dashboard feche completamente
      setTimeout(() => {
        _onUpdate();
      }, 200);
    }
  }, [open, _onUpdate]);

  const getUserName = useCallback(
    (userId: string) => {
      const user = users.find((u) => u.id === userId);
      return user?.fullName || userId;
    },
    [users]
  );

  // Handler para fechar o Snackbar
  // Não chamamos _onUpdate() aqui para evitar o "piscar" da tela
  // A lista será atualizada quando o dashboard fechar (via useEffect)
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar({ open: false, message: "" });
  }, []);

  const parseUfCidade = (ufCidade?: string) => {
    if (!ufCidade) return { uf: null, cidade: null };
    const parts = ufCidade.split("-");
    if (parts.length >= 2) {
      return { uf: parts[0], cidade: parts.slice(1).join("-") };
    }
    return { uf: null, cidade: null };
  };

  // IBGE hooks handle loading states

  const handleOpenBasicInfo = () => {
    if (!contact) return;
    const { uf, cidade } = parseUfCidade(contact.ufCidade);
    const initialValues = {
      name: contact.name || "",
      phone: contact.phone || "",
      email: contact.email || "",
      uf: uf || "",
      cidade: cidade || "",
      profession: contact.profession || "",
      enterprise: contact.enterprise || "",
      sector: contact.sector || "",
    };
    setBasicInfoForm(initialValues);
    setInitialBasicInfoForm(initialValues);
    setBasicInfoForm(initialValues);
    setInitialBasicInfoForm(initialValues);
    setEditBasicInfoOpen(true);
  };

  const handleOpenTerms = () => {
    if (!contact) return;
    const initialValues = {
      lgpdPrivacidade: contact.lgpdPrivacidade || false,
      lgpdComunicacao: contact.lgpdComunicacao || false,
    };
    setTermsForm(initialValues);
    setInitialTermsForm(initialValues);
    setEditTermsOpen(true);
  };

  const handleOpenUsers = () => {
    if (!contact) return;
    const initialValues = contact.usuarioAcesso || [];
    setUsersForm(initialValues);
    setInitialUsersForm(initialValues);
    setEditUsersOpen(true);
  };

  const handleOpenObservations = () => {
    if (!contact) return;
    const initialValues = contact.observacoes || "";
    setObservationsForm(initialValues);
    setInitialObservationsForm(initialValues);
    setEditObservationsOpen(true);
  };

  // Extrai texto exibível do content (string ou TextSegment[])
  const getBlockDisplayContent = (content: unknown): string => {
    if (typeof content === "string") return content.trim();
    if (Array.isArray(content)) {
      return content
        .map((s: { text?: string }) => s?.text ?? "")
        .join("")
        .trim();
    }
    return "";
  };

  // Função para renderizar blocos do BlockEditorPicker como HTML
  const renderBlockEditorContent = (jsonContent: string | null | undefined) => {
    if (!jsonContent) return null;

    try {
      const blocks = JSON.parse(jsonContent);
      if (!Array.isArray(blocks)) return null;

      const elements: ReactNode[] = [];
      type ListType = { type: "bullet" | "number"; items: ReactNode[] };
      let currentList: ListType | null = null;

      blocks.forEach((block: any, index: number) => {
        const { type, content } = (block || {}) as { type: string; content: unknown };
        const displayText = getBlockDisplayContent(content);
        if (!displayText) return;

        const key = `block-${index}-${block.id || index}`;

        if (type === "bullet" || type === "number") {
          if (!currentList || currentList.type !== type) {
            // Fechar lista anterior se existir
            if (currentList) {
              const ListComponent = currentList.type === "bullet" ? "ul" : "ol";
              elements.push(
                <Box
                  key={`list-${elements.length}`}
                  component={ListComponent}
                  sx={{ mb: 1, pl: 3 }}
                >
                  {currentList.items}
                </Box>
              );
            }
            // Iniciar nova lista
            currentList = { type: type as "bullet" | "number", items: [] };
          }
          // currentList não pode ser null aqui devido à verificação acima
          const list = currentList as ListType;
          list.items.push(
            <Typography key={key} component="li" variant="body2">
              {displayText}
            </Typography>
          );
        } else {
          // Fechar lista anterior se existir
          if (currentList) {
            const ListComponent = currentList.type === "bullet" ? "ul" : "ol";
            elements.push(
              <Box
                key={`list-${elements.length}`}
                component={ListComponent}
                sx={{ mb: 1, pl: 3 }}
              >
                {currentList.items}
              </Box>
            );
            currentList = null;
          }
          // Adicionar elemento não-lista
          switch (type) {
            case "h1":
              elements.push(
                <Typography
                  key={key}
                  variant="h4"
                  component="h1"
                  sx={{ mb: 1 }}
                >
                  {displayText}
                </Typography>
              );
              break;
            case "h2":
              elements.push(
                <Typography
                  key={key}
                  variant="h5"
                  component="h2"
                  sx={{ mb: 1 }}
                >
                  {displayText}
                </Typography>
              );
              break;
            case "h3":
              elements.push(
                <Typography
                  key={key}
                  variant="h6"
                  component="h3"
                  sx={{ mb: 1 }}
                >
                  {displayText}
                </Typography>
              );
              break;
            case "text":
            default:
              elements.push(
                <Typography
                  key={key}
                  variant="body2"
                  component="p"
                  sx={{ mb: 1 }}
                >
                  {displayText}
                </Typography>
              );
              break;
          }
        }
      });

      // Fechar lista final se existir
      if (currentList) {
        const list = currentList as ListType;
        const ListComponent = list.type === "bullet" ? "ul" : "ol";
        elements.push(
          <Box
            key={`list-${elements.length}`}
            component={ListComponent}
            sx={{ mb: 1, pl: 3 }}
          >
            {list.items}
          </Box>
        );
      }

      return elements.length > 0 ? elements : null;
    } catch (e) {
      // Se não for JSON válido, tratar como texto simples (compatibilidade com dados antigos)
      return (
        <Typography
          variant="body2"
          dangerouslySetInnerHTML={{ __html: jsonContent }}
        />
      );
    }
  };

  // Handlers para salvar
  const handleSaveBasicInfo = async () => {
    if (!contact) return;
    if (!basicInfoForm.name.trim()) {
      setSnackbar({
        open: true,
        message: "Nome é obrigatório",
        severity: "warning",
      });
      return;
    }

    try {
      setSaving(true);
      const ufCidadeValue =
        basicInfoForm.uf && basicInfoForm.cidade
          ? `${basicInfoForm.uf}-${basicInfoForm.cidade}`
          : basicInfoForm.uf || basicInfoForm.cidade || undefined;

      await updateContactMutation.mutateAsync({
        id: contact.id,
        data: {
          name: basicInfoForm.name,
          phone: basicInfoForm.phone || undefined,
          email: basicInfoForm.email || undefined,
          ufCidade: ufCidadeValue,
          profession: basicInfoForm.profession || undefined,
          enterprise: basicInfoForm.enterprise || undefined,
          sector: basicInfoForm.sector || undefined,
          updatedBy: currentUser?.login || "admin",
        }
      });

      setEditBasicInfoOpen(false);
      setSnackbar({
        open: true,
        message: "Detalhes atualizados com sucesso!",
        severity: "success",
      });
      // Marcar que precisamos atualizar a lista quando o Snackbar fechar
      if (_onUpdate) {
        pendingUpdateRef.current = true;
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "Erro ao salvar",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTerms = async () => {
    if (!contact) return;

    try {
      setSaving(true);
      await updateContactMutation.mutateAsync({
        id: contact.id,
        data: {
          lgpdPrivacidade: termsForm.lgpdPrivacidade,
          lgpdComunicacao: termsForm.lgpdComunicacao,
          updatedBy: currentUser?.login || "admin",
        }
      });

      setEditTermsOpen(false);
      setSnackbar({
        open: true,
        message: "Detalhes atualizados com sucesso!",
        severity: "success",
      });
      // Marcar que precisamos atualizar a lista quando o Snackbar fechar
      if (_onUpdate) {
        pendingUpdateRef.current = true;
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "Erro ao salvar",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUsers = async () => {
    if (!contact) return;

    try {
      setSaving(true);
      await updateContactMutation.mutateAsync({
        id: contact.id,
        data: {
          usuarioAcesso: usersForm,
          updatedBy: currentUser?.login || "admin",
        }
      });

      setEditUsersOpen(false);
      setSnackbar({
        open: true,
        message: "Detalhes atualizados com sucesso!",
        severity: "success",
      });
      // Marcar que precisamos atualizar a lista quando o Snackbar fechar
      if (_onUpdate) {
        pendingUpdateRef.current = true;
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "Erro ao salvar",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveObservations = async () => {
    if (!contact) return;

    try {
      setSaving(true);
      await updateContactMutation.mutateAsync({
        id: contact.id,
        data: {
          observacoes: observationsForm || undefined,
          updatedBy: currentUser?.login || "admin",
        }
      });

      setEditObservationsOpen(false);
      setSnackbar({
        open: true,
        message: "Detalhes atualizados com sucesso!",
        severity: "success",
      });
      // Marcar que precisamos atualizar a lista quando o Snackbar fechar
      if (_onUpdate) {
        pendingUpdateRef.current = true;
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "Erro ao salvar",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const contactAccessMode = getAccessMode(permissions, "comercial:contatos");

  if (!open) return null;

  const personalInfoCard = contact && (
    <DashboardBodyCard
      title="Informações Pessoais"
      accessMode={contactAccessMode}
      action={
        canEdit(contactAccessMode) && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleOpenBasicInfo}
          >
            <Edit fontSize="small" />
          </Button>
        )
      }
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant="caption" className="dashboard-label">
            Nome
          </Typography>
          <Typography variant="body2" className="dashboard-value">
            {contact.name}
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 6 }}>
            {contact.phone && (
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Phone color="action" sx={{ mt: 0.5 }} />
                <Box>
                  <Typography variant="caption" className="dashboard-label">
                    Telefone
                  </Typography>
                  <Typography variant="body2" className="dashboard-value">
                    {contact.phone}
                  </Typography>
                </Box>
              </Stack>
            )}
          </Grid>
          <Grid size={{ xs: 6 }}>
            {contact.profession && (
              <Box>
                <Typography variant="caption" className="dashboard-label">
                  Profissão
                </Typography>
                <Typography variant="body2" className="dashboard-value">
                  {contact.profession}
                </Typography>
              </Box>
            )}
          </Grid>
          <Grid size={{ xs: 6 }}>
            {contact.email && (
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Email color="action" sx={{ mt: 0.5 }} />
                <Box>
                  <Typography variant="caption" className="dashboard-label">
                    E-mail
                  </Typography>
                  <Typography variant="body2" className="dashboard-value">
                    {contact.email}
                  </Typography>
                </Box>
              </Stack>
            )}
          </Grid>
          <Grid size={{ xs: 6 }}>
            {contact.enterprise && (
              <Box>
                <Typography variant="caption" className="dashboard-label">
                  Empresa
                </Typography>
                <Typography variant="body2" className="dashboard-value">
                  {contact.enterprise}
                </Typography>
              </Box>
            )}
          </Grid>
          <Grid size={{ xs: 6 }}>
            {contact.ufCidade && (
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <LocationOn color="action" sx={{ mt: 0.5 }} />
                <Box>
                  <Typography variant="caption" className="dashboard-label">
                    Localização
                  </Typography>
                  <Typography variant="body2" className="dashboard-value">
                    {parseUfCidade(contact.ufCidade).uf &&
                      parseUfCidade(contact.ufCidade).cidade
                      ? `${parseUfCidade(contact.ufCidade).uf} - ${parseUfCidade(contact.ufCidade).cidade
                      }`
                      : contact.ufCidade}
                  </Typography>
                </Box>
              </Stack>
            )}
          </Grid>
          <Grid size={{ xs: 6 }}>
            {contact.sector && (
              <Box>
                <Typography variant="caption" className="dashboard-label">
                  Setor
                </Typography>
                <Typography variant="body2" className="dashboard-value">
                  {contact.sector}
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Stack>
    </DashboardBodyCard>
  );

  const termsCard = contact && (
    <DashboardBodyCard
      title="Termos de Uso"
      accessMode={contactAccessMode}
      action={
        canEdit(contactAccessMode) && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleOpenTerms}
          >
            <Edit fontSize="small" />
          </Button>
        )
      }
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant="caption" className="dashboard-label">
            Aceita os termos de privacidade
          </Typography>
          <Typography variant="body2" className="dashboard-value">
            {contact.lgpdPrivacidade ? "Sim" : "Não"}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" className="dashboard-label">
            Aceita receber conteúdos da Marshall
          </Typography>
          <Typography variant="body2" className="dashboard-value">
            {contact.lgpdComunicacao ? "Sim" : "Não"}
          </Typography>
        </Box>
      </Stack>
    </DashboardBodyCard>
  );

  const usersCard = contact && (
    <DashboardBodyCard
      title="Usuários com Acesso"
      accessMode={contactAccessMode}
      action={
        canEdit(contactAccessMode) && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleOpenUsers}
          >
            <Edit fontSize="small" />
          </Button>
        )
      }
    >
      {contact.usuarioAcesso && contact.usuarioAcesso.length > 0 ? (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {contact.usuarioAcesso.map((usuarioId) => (
            <Chip key={usuarioId} label={getUserName(usuarioId)} size="small" />
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" className="dashboard-text-secondary">
          Nenhum usuário com acesso registrado.
        </Typography>
      )}
    </DashboardBodyCard>
  );

  const observationsCard = contact && (
    <DashboardBodyCard
      title="Observações"
      accessMode={contactAccessMode}
      action={
        canEdit(contactAccessMode) && (
          <Button
            variant="outlined"
            size="small"
            onClick={handleOpenObservations}
          >
            <Edit fontSize="small" />
          </Button>
        )
      }
    >
      {(() => {
        const content = renderBlockEditorContent(contact.observacoes);
        if (content) {
          return <Box>{content}</Box>;
        }
        return (
          <Typography variant="body2" className="dashboard-text-secondary">
            Nenhuma observação encontrada.
          </Typography>
        );
      })()}
    </DashboardBodyCard>
  );

  const handleOpenLinkModal = (contractId: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/contratos/form/new/${contractId}`;
    setSelectedContractLink(link);
    setLinkModalOpen(true);
  };

  const draftContractsCard = contact && (
    <DashboardBodyCard
      title="Contratos em Rascunho"
      accessMode={contactAccessMode}
    >
      {loading ? (
        <Typography variant="body2" className="dashboard-text-secondary">
          Carregando...
        </Typography>
      ) : draftContracts.length > 0 ? (
        <Stack spacing={1}>
          {draftContracts.map((contract) => (
            <Box
              key={contract.id}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderRadius: "8px",
                backgroundColor: "action.hover",
                "&:hover": {
                  backgroundColor: "action.selected",
                },
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" className="dashboard-value">
                  Contrato #{contract.seqId || contract.id.slice(0, 8)}
                </Typography>
                {contract.valorContrato && (
                  <Typography variant="caption" className="dashboard-text-secondary">
                    Valor: R$ {contract.valorContrato.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Typography>
                )}
              </Box>
              <IconButton
                size="small"
                onClick={() => handleOpenLinkModal(contract.id)}
                sx={{
                  color: "primary.main",
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
              >
                <Visibility fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" className="dashboard-text-secondary">
          Nenhum contrato em rascunho encontrado.
        </Typography>
      )}
    </DashboardBodyCard>
  );

  const systemInfoCard = contact && (
    <DashboardBodyCard
      title="Informações do Sistema"
      accessMode={contactAccessMode}
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" className="dashboard-label">
            ID do Sistema
          </Typography>
          <Typography
            variant="body2"
            className="dashboard-value"
            sx={{ fontFamily: "monospace" }}
          >
            {contact.id}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" className="dashboard-label">
            Criado por
          </Typography>
          <Typography variant="body2" className="dashboard-value">
            {contact.createdBy} em{" "}
            {new Date(contact.createdAt).toLocaleString("pt-BR")}
          </Typography>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" className="dashboard-label">
            Atualizado por
          </Typography>
          <Typography variant="body2" className="dashboard-value">
            {contact.updatedBy} em{" "}
            {new Date(contact.updatedAt).toLocaleString("pt-BR")}
          </Typography>
        </Grid>
      </Grid>
    </DashboardBodyCard>
  );

  return (
    <>
      <DashboardModal
        open={open}
        onClose={onClose}
        title="Contato Comercial"
        loading={loading}
        hasData={!!contact}
        useSkeleton={true}
        layoutKey="contacts-dashboard-layout"
      >
        {contact && (
          <>
            {/* Header Area */}
            <DashboardTopCard
              title={`${contact.name}`}
              accessMode={contactAccessMode}
            >
              {contact.createdAt && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2 }}
                >
                  Cadastrado em: {formatDateDisplay(contact.createdAt)}
                </Typography>
              )}
            </DashboardTopCard>

            {/* Main Content Grid */}
            {/* Desktop Layout */}
            <Box sx={{ display: { xs: "none", md: "block" } }}>
              {(() => {
                const cardComponents = {
                  personalInfo: personalInfoCard,
                  systemInfo: systemInfoCard,
                  users: usersCard,
                  observations: observationsCard,
                  terms: termsCard,
                  draftContracts: draftContractsCard
                }
                return (
                  <DashboardDnDGrid
                    items={cardComponents}
                    layoutKey="contacts-dashboard-layout"
                    defaultLayout={{
                      col1: ['personalInfo', 'systemInfo'],
                      col2: ['users', 'observations', 'draftContracts'],
                      col3: ['terms']
                    }}
                  />
                )
              })()}
            </Box>

            {/* Mobile/Tablet Layout (Sorted) */}
            <DashboardStack spacing={3} sx={{ display: { xs: "flex", md: "none" } }}>
              {personalInfoCard}
              {termsCard}
              {usersCard}
              {draftContractsCard}
              {observationsCard}
              {systemInfoCard}
            </DashboardStack>
          </>
        )}
      </DashboardModal>

      {/* Modal de Edição - Informações Básicas */}
      <TableCardModal
        open={editBasicInfoOpen}
        onClose={() => setEditBasicInfoOpen(false)}
        title="Informações Básicas"
        mode="edit"
        onSave={handleSaveBasicInfo}
        saving={saving}
        isDirty={isBasicInfoDirty}
        canSave={canEdit(contactAccessMode)}
        maxWidth="sm"
      >
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextPicker
            label="Nome"
            value={basicInfoForm.name}
            onChange={(val) =>
              setBasicInfoForm((prev) => ({ ...prev, name: val }))
            }
            fullWidth
            required
          />
          <PhonePicker
            label="Telefone"
            value={basicInfoForm.phone}
            onChange={(val) =>
              setBasicInfoForm((prev) => ({ ...prev, phone: val }))
            }
            fullWidth
          />
          <MailPicker
            label="E-mail"
            value={basicInfoForm.email}
            onChange={(val) =>
              setBasicInfoForm((prev) => ({ ...prev, email: val }))
            }
            fullWidth
          />
          <Stack direction="row" spacing={2}>
            <Box sx={{ flex: "0 0 200px" }}>
              <SelectPicker
                label="UF"
                value={basicInfoForm.uf}
                onChange={(val: any) => {
                  const ufValue = Array.isArray(val)
                    ? null
                    : (val as string | null);
                  setBasicInfoForm((prev) => ({
                    ...prev,
                    uf: ufValue || "",
                    cidade: "",
                  }));
                }}
                options={estados}
                fullWidth
                placeholder="Selecione a UF"
                clearable
                disabled={loadingEstados}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <SelectPicker
                label="Cidade"
                value={basicInfoForm.cidade}
                onChange={(val: any) => {
                  const cidadeValue = Array.isArray(val)
                    ? null
                    : (val as string | null);
                  setBasicInfoForm((prev) => ({
                    ...prev,
                    cidade: cidadeValue || "",
                  }));
                }}
                options={municipios}
                fullWidth
                placeholder={
                  basicInfoForm.uf
                    ? loadingMunicipios
                      ? "Carregando..."
                      : "Selecione a cidade"
                    : "Selecione primeiro a UF"
                }
                clearable
                disabled={!basicInfoForm.uf || loadingMunicipios}
              />
            </Box>
          </Stack>
          <Box sx={{ pt: 2, borderTop: 1, borderColor: "divider", mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
              Informações Profissionais
            </Typography>
            <Stack spacing={2}>
              <TextPicker
                label="Profissão"
                value={basicInfoForm.profession}
                onChange={(val) =>
                  setBasicInfoForm((prev) => ({ ...prev, profession: val }))
                }
                fullWidth
              />
              <TextPicker
                label="Empresa"
                value={basicInfoForm.enterprise}
                onChange={(val) =>
                  setBasicInfoForm((prev) => ({ ...prev, enterprise: val }))
                }
                fullWidth
              />
              <TextPicker
                label="Setor"
                value={basicInfoForm.sector}
                onChange={(val) =>
                  setBasicInfoForm((prev) => ({ ...prev, sector: val }))
                }
                fullWidth
              />
            </Stack>
          </Box>
        </Stack>
      </TableCardModal>

      {/* Modal de Edição - Termos de Uso */}
      <TableCardModal
        open={editTermsOpen}
        onClose={() => setEditTermsOpen(false)}
        title="Termos de Uso"
        mode="edit"
        onSave={handleSaveTerms}
        saving={saving}
        isDirty={isTermsDirty}
        canSave={canEdit(contactAccessMode)}
        maxWidth="sm"
      >
        <Stack spacing={2} sx={{ mt: 1 }}>
          <SwitchPicker
            label="Aceita os termos de privacidade"
            checked={termsForm.lgpdPrivacidade}
            onChange={(checked) =>
              setTermsForm((prev) => ({ ...prev, lgpdPrivacidade: checked }))
            }
          />
          <SwitchPicker
            label="Aceita receber conteúdos da Marshall"
            checked={termsForm.lgpdComunicacao}
            onChange={(checked) =>
              setTermsForm((prev) => ({ ...prev, lgpdComunicacao: checked }))
            }
          />
        </Stack>
      </TableCardModal>

      {/* Modal de Edição - Usuários com Acesso */}
      <TableCardModal
        open={editUsersOpen}
        onClose={() => setEditUsersOpen(false)}
        title="Usuários com Acesso"
        mode="edit"
        onSave={handleSaveUsers}
        saving={saving}
        isDirty={isUsersDirty}
        canSave={canEdit(contactAccessMode)}
        maxWidth="sm"
      >
        <Stack spacing={2} sx={{ mt: 1 }}>
          <MultiSelectPicker
            label="Usuários com Acesso"
            value={usersForm}
            onChange={(vals) => setUsersForm(vals as string[])}
            options={users.map((u) => ({ label: u.fullName, value: u.id }))}
            fullWidth
            placeholder="Selecione os usuários"
          />
        </Stack>
      </TableCardModal>

      {/* Modal de Edição - Observações */}
      <TableCardModal
        open={editObservationsOpen}
        onClose={() => setEditObservationsOpen(false)}
        title="Observações"
        mode="edit"
        onSave={handleSaveObservations}
        saving={saving}
        isDirty={isObservationsDirty}
        canSave={canEdit(contactAccessMode)}
        maxWidth="md"
      >
        <Stack spacing={2} sx={{ mt: 1 }}>
          <BlockEditorPicker
            label="Observações"
            value={observationsForm}
            onChange={(val) => setObservationsForm(val || "")}
          />
        </Stack>
      </TableCardModal>

      {/* Modal de Link Gerado */}
      <LinkGeneratedModal
        open={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        link={selectedContractLink}
        contactPhone={contact?.phone}
        contactName={contact?.name}
      />

      {/* Snackbar para feedback */}
      <Toast
        open={snackbar.open}
        message={snackbar.message}
        onClose={handleCloseSnackbar}
        severity={snackbar.severity || "info"}
      />
    </>
  );
};

export default ContactDashboard;
