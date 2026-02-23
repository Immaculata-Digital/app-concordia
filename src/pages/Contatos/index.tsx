import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Stack,
} from "@mui/material";
import Toast from "../../components/Toast";

import { VisibilityOutlined, Link as LinkIcon, Check, Close } from "@mui/icons-material";
import TableCard, {
  type TableCardColumn,
  type TableCardFormField,
  type TableCardRow,
  type TableCardRowAction,
  type TableCardBulkAction,
} from "../../components/TableCard";
import TextPicker from "../../components/TextPicker";
import MailPicker from "../../components/MailPicker";
import PhonePicker from "../../components/PhonePicker";
import MultiSelectPicker from "../../components/MultiSelectPicker";
import SelectPicker from "../../components/SelectPicker";
import SwitchPicker from "../../components/SwitchPicker";
import BlockEditorPicker from "../../components/BlockEditorPicker";
import { useSearch } from "../../context/SearchContext";
import { useAuth } from "../../context/AuthContext";
import { getAccessMode } from "../../utils/accessControl";
import { type ContactDTO } from "../../services/contatos";
import { ibgeService } from "../../services/ibge";
import { contractsService } from "../../services/contracts";
import { comunicacaoService } from "../../services/comunicacoes";
import { parsePhoneNumber } from "../../components/PhonePicker/utils";
import ContactDashboard from "./ContactDashboard";
import GenerateLinkModal from "./components/GenerateLinkModal";
import LinkGeneratedModal from "./components/LinkGeneratedModal";
import {
  useContactList,
  useCreateContact,
  useDeleteContact,
  useInactivateContact,
  useReactivateContact
} from "../../hooks/queries/contacts";
import { useUsers } from "../../hooks/queries/users";
import { useEstados } from "../../hooks/queries/ibge";
import "./style.css";

type ContactRow = TableCardRow & ContactDTO;

const DEFAULT_USER = "admin";

const ContatosPage = () => {
  const [params, setParams] = useState<{
    page: number;
    limit: number;
    query: string;
    filters: any;
    sorts: any[];
  } | null>(null);

  const { data: contactsData, isLoading: loading, error: fetchError } = useContactList(params);

  const createContactMutation = useCreateContact();
  const deleteContactMutation = useDeleteContact();
  const inactivateMutation = useInactivateContact();
  const reactivateMutation = useReactivateContact();
  const { data: users = [] } = useUsers();

  const userOptions = useMemo(() =>
    users.map((u) => ({
      label: u.fullName,
      value: u.id,
    })), [users]
  );
  const { data: estadosData = [], isLoading: loadingEstados } = useEstados();

  const estados = useMemo(() =>
    estadosData.map((e) => ({
      label: `${e.sigla} - ${e.nome}`,
      value: e.sigla,
    })), [estadosData]
  );
  const [municipios, setMunicipios] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [dashboardContactId, setDashboardContactId] = useState<string | null>(
    null
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const [toast, setToast] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'warning' | 'info' }>({
    open: false,
    message: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { setFilters, setPlaceholder, setQuery } = useSearch();
  const { user: currentUser, permissions } = useAuth();
  const [generateLinkModalOpen, setGenerateLinkModalOpen] = useState(false);
  const [linkGeneratedModalOpen, setLinkGeneratedModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactRow | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [savingLink, setSavingLink] = useState(false);
  const lastLoadedUfRef = useRef<string | null>(null);

  const accessMode = useMemo(
    () => getAccessMode(permissions, "comercial:contatos"),
    [permissions]
  );

  // Verifica se o usuário tem permissão para visualizar detalhes
  const canVisualize = useMemo(
    () => permissions.includes("comercial:contatos:visualizar"),
    [permissions]
  );


  useEffect(() => {
    setPlaceholder("Pesquisar contatos...");
    const filters = [
      { id: 'name', label: 'Nome', field: 'name', type: 'text' as const, page: 'contacts' },
      { id: 'email', label: 'E-mail', field: 'email', type: 'text' as const, page: 'contacts' },
      { id: 'phone', label: 'Telefone', field: 'phone', type: 'text' as const, page: 'contacts' },
      { id: 'enterprise', label: 'Empresa', field: 'enterprise', type: 'text' as const, page: 'contacts' },
      { id: 'status', label: 'Status', field: 'status', type: 'boolean' as const, page: 'contacts' },
    ]
    setFilters(filters, 'name')

    return () => {
      setFilters([])
      setPlaceholder("");
      setQuery("");
    };
  }, [setFilters, setPlaceholder, setQuery]);

  // Removed loadUsers manual fetch as it is handled by useUsers hook

  // Removed loadEstados manual fetch as it is handled by useEstados hook

  const loadMunicipios = useCallback(async (ufSigla: string) => {
    // Evitar carregar novamente se já foi carregado para esta UF
    if (lastLoadedUfRef.current === ufSigla && municipios.length > 0) {
      return;
    }

    try {
      setLoadingMunicipios(true);
      const municipiosData = await ibgeService.getMunicipiosByUF(ufSigla);
      setMunicipios(
        municipiosData.map((m) => ({
          label: m.nome,
          value: m.nome,
        }))
      );
      lastLoadedUfRef.current = ufSigla;
    } catch (err) {
      console.error("Erro ao carregar municípios:", err);
      setToast({
        open: true,
        severity: "error",
        message: "Erro ao carregar municípios",
      });
    } finally {
      setLoadingMunicipios(false);
    }
  }, [municipios.length]);

  const fetchContacts = useCallback(async (newParams: any) => {
    setParams(newParams);
  }, []);

  const loadContatos = async () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    // ibge handles initialization
  }, []);

  // Sync Dashboard state with URL Query Params
  useEffect(() => {
    const contactIdParam = searchParams.get("contactId");

    if (contactIdParam) {
      if (dashboardContactId !== contactIdParam || !dashboardOpen) {
        setDashboardContactId(contactIdParam);
        setDashboardOpen(true);
      }
    } else {
      if (dashboardOpen) {
        setDashboardOpen(false);
        setDashboardContactId(null);
      }
    }
  }, [searchParams, dashboardContactId, dashboardOpen]);

  // Função auxiliar para validar formato do telefone
  const isValidPhoneFormat = (phoneNumber: string): boolean => {
    if (!phoneNumber || typeof phoneNumber !== "string") {
      return false;
    }

    // Remove caracteres não numéricos
    const cleanNumber = phoneNumber.replace(/\D/g, "");

    if (cleanNumber.length === 0) {
      return false;
    }

    // Parsear o número para obter o país
    const { country } = parsePhoneNumber(phoneNumber);

    // Validação específica para Brasil
    if (country.code === "BR") {
      // Verifica se começa com 55 (Brasil)
      if (!cleanNumber.startsWith("55")) return false;

      // Pode ter 12 dígitos (55 + 2 DDD + 8 fixo) ou 13 dígitos (55 + 2 DDD + 9 celular)
      if (cleanNumber.length === 12) {
        // Validação básica de fixo
        return true;
      }

      if (cleanNumber.length === 13) {
        // Celular: Pega o primeiro dígito do número (posição 4, após 55 + DDD)
        const firstDigit = cleanNumber.substring(4, 5);
        return firstDigit === "9";
      }

      return false;
    }

    // Regra genérica para outros países
    return cleanNumber.length >= 10 && cleanNumber.length <= 15;
  };

  const validateContact = (
    data: Partial<ContactRow>
  ): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Nome é obrigatório
    if (
      !data.name ||
      (typeof data.name === "string" && data.name.trim() === "")
    ) {
      errors.name = "Nome é obrigatório";
    }

    // WhatsApp é obrigatório
    if (
      !data.phone ||
      (typeof data.phone === "string" && data.phone.trim() === "")
    ) {
      errors.phone = "WhatsApp é obrigatório";
    } else if (data.phone && typeof data.phone === "string") {
      // Validar formato do telefone se foi preenchido
      if (!isValidPhoneFormat(data.phone)) {
        errors.phone = "Número de WhatsApp inválido";
      }
    }

    // Email é obrigatório
    if (
      !data.email ||
      (typeof data.email === "string" && data.email.trim() === "")
    ) {
      errors.email = "E-mail é obrigatório";
    }

    return errors;
  };

  const handleAddContact = async (data: Partial<ContactRow>) => {
    // Verificar todos os campos obrigatórios
    const missingFields: string[] = [];

    // Verificar Nome
    if (!data.name || (typeof data.name === "string" && data.name.trim() === "")) {
      missingFields.push("Nome");
    }

    // Verificar WhatsApp
    if (!data.phone || (typeof data.phone === "string" && data.phone.trim() === "")) {
      missingFields.push("WhatsApp");
    } else if (data.phone && typeof data.phone === "string") {
      // Validar formato do telefone se foi preenchido
      if (!isValidPhoneFormat(data.phone)) {
        missingFields.push("WhatsApp");
      }
    }

    // Verificar E-mail
    if (!data.email || (typeof data.email === "string" && data.email.trim() === "")) {
      missingFields.push("E-mail");
    }

    // Se houver campos obrigatórios faltando ou inválidos, exibir Toast
    if (missingFields.length > 0) {
      // Validar campos para exibir erros nos campos individuais
      const errors = validateContact(data);
      setFieldErrors(errors);

      // Sempre mostrar TODOS os campos obrigatórios no toast, mesmo que alguns já estejam preenchidos
      const allRequiredFields = ["Nome", "WhatsApp", "E-mail"];

      setToast({
        open: true,
        severity: "error",
        message: `Preencha os campos obrigatórios: ${allRequiredFields.join(", ")}`,
      });
      return false; // Não fechar o dialog
    }

    // Limpar erros se validação passou
    setFieldErrors({});

    try {
      // Combinar UF e Cidade no formato esperado
      const uf = (data.uf as string) || "";
      const cidade = (data.cidade as string) || "";
      const ufCidadeValue =
        uf && cidade ? `${uf}-${cidade}` : uf || cidade || undefined;

      const payload = {
        name: (data.name as string) ?? "",
        profession: (data.profession as string) || undefined,
        enterprise: (data.enterprise as string) || undefined,
        sector: (data.sector as string) || undefined,
        phone: (data.phone as string) || undefined,
        email: (data.email as string) || undefined,
        lgpdPrivacidade: Boolean(data.lgpdPrivacidade) || undefined,
        lgpdComunicacao: Boolean(data.lgpdComunicacao) || undefined,
        usuarioAcesso: Array.isArray(data.usuarioAcesso)
          ? (data.usuarioAcesso as string[])
          : [],
        ufCidade: ufCidadeValue,
        observacoes: (data.observacoes as string) || undefined,
        status: Boolean(data.status ?? true),
        createdBy: currentUser?.login || DEFAULT_USER,
      };

      await createContactMutation.mutateAsync(payload);
      setToast({ open: true, message: "Contato criado com sucesso", severity: "success" });
      return true; // Indica sucesso para fechar o dialog
    } catch (err) {
      console.error(err);
      setToast({
        open: true,
        severity: "error",
        message: err instanceof Error ? err.message : "Erro ao criar contato",
      });
      return false; // Indica erro para manter o dialog aberto
    }
  };

  const handleDeactivateContact = useCallback(async (id: ContactRow["id"]) => {
    try {
      await inactivateMutation.mutateAsync({
        id: id as string,
        updatedBy: currentUser?.login || DEFAULT_USER
      });
      setToast({ open: true, message: "Contato desativado com sucesso", severity: "success" });
    } catch (err) {
      console.error(err);
      setToast({
        open: true,
        severity: "error",
        message: err instanceof Error ? err.message : "Erro ao desativar",
      });
    }
  }, [currentUser, inactivateMutation]);

  const handleActivateContact = useCallback(async (id: ContactRow["id"]) => {
    try {
      await reactivateMutation.mutateAsync({
        id: id as string,
        updatedBy: currentUser?.login || DEFAULT_USER
      });
      setToast({ open: true, message: "Contato ativado com sucesso", severity: "success" });
    } catch (err) {
      console.error(err);
      setToast({
        open: true,
        severity: "error",
        message: err instanceof Error ? err.message : "Erro ao ativar",
      });
    }
  }, [currentUser, reactivateMutation]);

  const handleDeleteContact = async (id: ContactRow["id"]) => {
    try {
      await deleteContactMutation.mutateAsync(id as string);
      setToast({ open: true, message: "Contato excluído permanentemente", severity: "success" });
    } catch (err) {
      console.error(err);
      setToast({
        open: true,
        severity: "error",
        message: err instanceof Error ? err.message : "Erro ao excluir contato",
      });
    }
  };

  const handleBulkDeleteContact = async (ids: ContactRow["id"][]) => {
    try {
      await Promise.all(ids.map((id) => deleteContactMutation.mutateAsync(id as string)));
      setToast({ open: true, message: `${ids.length} contato(s) excluído(s) permanentemente`, severity: "success" });
    } catch (err) {
      console.error(err);
      setToast({
        open: true,
        severity: "error",
        message: err instanceof Error ? err.message : "Erro ao excluir contatos",
      });
    }
  };

  const handleOpenDashboard = useCallback((contact: ContactRow) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("contactId", contact.id as string);
      return newParams;
    });
  }, [setSearchParams]);

  const handleCloseDashboard = () => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.delete("contactId");
      return newParams;
    });
  };

  const handleGenerateLink = useCallback((contact: ContactRow) => {
    setSelectedContact(contact);
    setGenerateLinkModalOpen(true);
  }, []);

  const handleCloseGenerateLinkModal = () => {
    setGenerateLinkModalOpen(false);
    setSelectedContact(null);
  };

  const handleSaveGenerateLink = async (data: { cicloId: string; modalidadeId: string; valorContrato: number }) => {
    if (!selectedContact || !currentUser) {
      setToast({
        open: true,
        severity: "error",
        message: "Erro ao gerar link: dados incompletos",
      });
      return;
    }

    try {
      setSavingLink(true);
      const response = await contractsService.generateClientLink({
        contatoId: selectedContact.id as string,
        cicloId: data.cicloId,
        modalidadeId: data.modalidadeId,
        valorContrato: data.valorContrato,
        promotorId: currentUser.id,
        changeOrigin: "gerar-link-cliente",
        createdBy: currentUser.login || DEFAULT_USER,
      });

      // Gerar a URL base do frontend
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/contratos/form/new/${response.contractId}`;
      setGeneratedLink(link);
      setGenerateLinkModalOpen(false);
      setLinkGeneratedModalOpen(true);

      // Enviar email para o cliente se tiver email cadastrado
      if (selectedContact.email) {
        try {
          // Chave da comunicação de novo contrato
          const chaveComunicacao = "CLIENTE-NOVO-CONTRATO";

          // Preparar variáveis para substituição no template
          // O backend deve substituir {{nome}} e {{link}} no HTML
          // Formato: array de strings no formato "chave=valor"
          const nomeCliente = selectedContact.name || "Cliente"
          const variaveis = [
            `nome=${nomeCliente}`,
            `link=${link}`
          ];

          console.log('Enviando email:', {
            chave: chaveComunicacao,
            destinatario: selectedContact.email,
            variaveis: variaveis,
            detalhes: {
              nome: nomeCliente,
              link: link,
              esperado: {
                "{{nome}}": nomeCliente,
                "{{link}}": link
              }
            }
          });

          await comunicacaoService.send({
            chave: chaveComunicacao,
            destinatario: selectedContact.email,
            variaveis: variaveis,
          });

          setToast({
            open: true,
            severity: "success",
            message: "Link gerado e e-mail enviado com sucesso!",
          });
        } catch (emailError) {
          console.error("Erro ao enviar email:", emailError);
          // Não falhar o processo se o email não for enviado
          setToast({
            open: true,
            severity: "warning",
            message: "Link gerado, mas não foi possível enviar o e-mail automaticamente.",
          });
        }
      }
    } catch (err) {
      console.error(err);
      setToast({
        open: true,
        severity: "error",
        message: err instanceof Error ? err.message : "Erro ao gerar link",
      });
    } finally {
      setSavingLink(false);
    }
  };

  const handleCloseLinkGeneratedModal = () => {
    setLinkGeneratedModalOpen(false);
    setGeneratedLink("");
    setSelectedContact(null);
  };

  const contactFormFields: TableCardFormField<ContactRow>[] = useMemo(
    () => [
      {
        key: "name" as keyof ContactRow,
        label: "Nome",
        required: true,
        renderInput: ({ value, onChange, field }) => {
          const hasError = fieldErrors.name ? true : false;
          const errorMessage = fieldErrors.name || "";
          return (
            <TextPicker
              label={field.label}
              value={typeof value === "string" ? value : ""}
              onChange={(text) => {
                onChange(text);
                // Limpar erro quando começar a digitar
                if (hasError && fieldErrors.name) {
                  setFieldErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.name;
                    return newErrors;
                  });
                }
              }}
              fullWidth
              placeholder="Digite o nome"
              required
              error={hasError}
              helperText={errorMessage}
            />
          );
        },
      },
      {
        key: "profession",
        label: "Profissão",
        renderInput: ({ value, onChange, field }) => (
          <TextPicker
            label={field.label}
            value={typeof value === "string" ? value : ""}
            onChange={(text) => onChange(text)}
            fullWidth
            placeholder="Digite a profissão"
          />
        ),
      },
      {
        key: "enterprise",
        label: "Empresa",
        renderInput: ({ value, onChange, field }) => (
          <TextPicker
            label={field.label}
            value={typeof value === "string" ? value : ""}
            onChange={(text) => onChange(text)}
            fullWidth
            placeholder="Digite o nome da empresa"
          />
        ),
      },
      {
        key: "sector",
        label: "Setor",
        renderInput: ({ value, onChange, field }) => (
          <TextPicker
            label={field.label}
            value={typeof value === "string" ? value : ""}
            onChange={(text) => onChange(text)}
            fullWidth
            placeholder="Digite o setor"
          />
        ),
      },
      {
        key: "phone",
        label: "WhatsApp",
        required: true,
        renderInput: ({ value, onChange, field }) => {
          const hasError = !!fieldErrors.phone;
          const errorMessage = fieldErrors.phone || "";
          return (
            <PhonePicker
              label={field.label}
              value={typeof value === "string" ? value : ""}
              onChange={(text) => {
                onChange(text);
                // Limpar erro quando começar a digitar
                if (fieldErrors.phone) {
                  setFieldErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.phone;
                    return newErrors;
                  });
                }
              }}
              fullWidth
              placeholder="Digite o número do WhatsApp"
              required
              error={hasError}
              helperText={errorMessage}
            />
          );
        },
      },
      {
        key: "email",
        label: "E-mail",
        required: true,
        renderInput: ({ value, onChange, field }) => {
          const hasError = !!fieldErrors.email;
          const errorMessage = fieldErrors.email || "";
          return (
            <MailPicker
              label={field.label}
              value={typeof value === "string" ? value : ""}
              onChange={(text) => {
                onChange(text);
                // Limpar erro quando começar a digitar
                if (fieldErrors.email) {
                  setFieldErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.email;
                    return newErrors;
                  });
                }
              }}
              fullWidth
              placeholder="Digite o e-mail"
              required
              error={hasError}
              helperText={errorMessage}
            />
          );
        },
      },
      {
        key: "lgpdPrivacidade",
        label: "LGPD",
        renderInput: ({ value, onChange, formValues, setFieldValue }) => {
          const lgpdPrivacidade = Boolean(value);
          const lgpdComunicacao = Boolean(formValues.lgpdComunicacao);

          return (
            <Stack direction="row" spacing={3} sx={{ width: "100%" }}>
              <Box sx={{ flex: 1 }}>
                <SwitchPicker
                  label="Aceito os termos de privacidade"
                  checked={lgpdPrivacidade}
                  onChange={(checked) => onChange(checked)}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <SwitchPicker
                  label="Aceita receber conteúdos da Marshall"
                  checked={lgpdComunicacao}
                  onChange={(checked) =>
                    setFieldValue("lgpdComunicacao", checked)
                  }
                />
              </Box>
            </Stack>
          );
        },
      },
      {
        key: "lgpdComunicacao",
        label: "LGPD Comunicação",
        renderInput: () => null, // Renderizado junto com lgpdPrivacidade
      },
      {
        key: "usuarioAcesso",
        label: "Usuário Acesso",
        renderInput: ({ value, onChange, field }) => (
          <MultiSelectPicker
            label={field.label}
            value={Array.isArray(value) ? (value as (string | number)[]) : []}
            onChange={(vals) => onChange(vals)}
            options={userOptions}
            fullWidth
            placeholder="Selecione os usuários"
          />
        ),
      },
      {
        key: "ufCidade",
        label: "UF - Cidade",
        renderInput: ({ value, onChange, formValues, setFieldValue }) => {
          // Parsear ufCidade para separar UF e Cidade ao editar
          const parseUfCidade = (ufCidadeValue: string | null | undefined) => {
            if (!ufCidadeValue || typeof ufCidadeValue !== "string") {
              return { uf: null, cidade: null };
            }
            const parts = ufCidadeValue.split("-");
            if (parts.length >= 2) {
              return { uf: parts[0], cidade: parts.slice(1).join("-") };
            }
            return { uf: null, cidade: null };
          };

          const currentUfCidade = value as string | null | undefined;
          const parsed = parseUfCidade(currentUfCidade);
          const currentUf = (formValues.uf as string) || parsed.uf || null;
          const currentCidade =
            (formValues.cidade as string) || parsed.cidade || null;
          // Inicializar UF e Cidade no formValues se ainda não estiverem
          // Usar setTimeout para evitar chamadas durante o render
          if (parsed.uf && !formValues.uf) {
            setTimeout(() => {
              setFieldValue("uf", parsed.uf);
              // Carregar municípios se houver UF mas não houver municípios carregados para esta UF
              if (lastLoadedUfRef.current !== parsed.uf) {
                loadMunicipios(parsed.uf!);
              }
            }, 0);
          }
          if (parsed.cidade && !formValues.cidade) {
            setTimeout(() => {
              setFieldValue("cidade", parsed.cidade);
            }, 0);
          }

          // Carregar municípios quando UF mudar
          const handleUfChange = async (
            newUf: string | number | (string | number)[] | null
          ) => {
            // SelectPicker não é multiple, então sempre será string | number | null
            const ufValue = Array.isArray(newUf)
              ? null
              : (newUf as string | null);
            setFieldValue("uf", ufValue);
            setFieldValue("cidade", null); // Limpar cidade quando UF mudar

            if (ufValue) {
              // Limpar referência para forçar recarregamento
              lastLoadedUfRef.current = null;
              setMunicipios([]); // Limpar lista de municípios
              await loadMunicipios(ufValue);
            } else {
              setMunicipios([]); // Limpar lista de municípios
              lastLoadedUfRef.current = null;
            }
          };

          // Atualizar cidade e combinar com UF
          const handleCidadeChange = (
            newCidade: string | number | (string | number)[] | null
          ) => {
            // SelectPicker não é multiple, então sempre será string | number | null
            const cidadeValue = Array.isArray(newCidade)
              ? null
              : (newCidade as string | null);
            setFieldValue("cidade", cidadeValue);
            const ufValue = (formValues.uf as string) || currentUf;
            if (ufValue && cidadeValue) {
              onChange(`${ufValue}-${cidadeValue}`);
            } else {
              onChange(null);
            }
          };

          return (
            <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
              <Box sx={{ flex: "0 0 200px" }}>
                <SelectPicker
                  label="UF"
                  value={currentUf}
                  onChange={handleUfChange}
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
                  value={currentCidade}
                  onChange={handleCidadeChange}
                  options={municipios}
                  fullWidth
                  placeholder={
                    currentUf
                      ? loadingMunicipios
                        ? "Carregando..."
                        : "Selecione a cidade"
                      : "Selecione primeiro a UF"
                  }
                  clearable
                  disabled={!currentUf || loadingMunicipios}
                />
              </Box>
            </Stack>
          );
        },
      },
      {
        key: "observacoes",
        label: "Observações",
        renderInput: ({ value, onChange, field }) => (
          <BlockEditorPicker
            label={field.label}
            value={typeof value === "string" ? value : ""}
            onChange={(val) => onChange(val || "")}
          />
        ),
      },
      {
        key: "status",
        label: "Status",
        renderInput: ({ value, onChange }) => (
          <SwitchPicker
            label="Ativo"
            checked={Boolean(value ?? true)}
            onChange={(checked) => onChange(checked)}
          />
        ),
      },
    ],
    [
      userOptions,
      fieldErrors,
      estados,
      municipios,
      loadingEstados,
      loadingMunicipios,
    ]
  );

  const contactColumns: TableCardColumn<ContactRow>[] = useMemo(
    () => [
      {
        key: "name",
        label: "Nome",
        dataType: "text",
      },
      {
        key: "phone",
        label: "WhatsApp",
        dataType: "text",
      },
      {
        key: "email",
        label: "E-mail",
        dataType: "text",
      },
      {
        key: "status",
        label: "Status",
        dataType: "text",
        render: (value) => {
          const status = Boolean(value);
          return status ? "Ativo" : "Inativo";
        },
      },
    ],
    []
  );

  const rowActions: TableCardRowAction<ContactRow>[] = useMemo(
    () => {
      // Se não tiver permissão de visualizar, não mostra ações
      if (!canVisualize) {
        return [];
      }

      const actions: TableCardRowAction<ContactRow>[] = [];

      // Ação "Ver" sempre aparece quando tem permissão de visualizar
      actions.push({
        label: "Ver",
        icon: <VisibilityOutlined fontSize="small" />,
        onClick: handleOpenDashboard,
      });

      // Ação "Ativar" só aparece se tiver permissão de visualizar E reativar
      if (canVisualize && permissions.includes("comercial:contatos:reativar")) {
        actions.push({
          label: "Ativar",
          icon: <Check fontSize="small" />,
          onClick: (row: ContactRow) => {
            handleActivateContact(row.id);
          },
          hidden: (row: ContactRow) => Boolean(row.status),
        });
      }

      // Ação "Desativar" só aparece se tiver permissão de visualizar E inativar
      if (canVisualize && permissions.includes("comercial:contatos:inativar")) {
        actions.push({
          label: "Desativar",
          icon: <Close fontSize="small" />,
          onClick: (row: ContactRow) => {
            handleDeactivateContact(row.id);
          },
          hidden: (row: ContactRow) => !row.status,
        });
      }

      // Ação "Gerar link" só aparece se tiver a permissão específica
      if (permissions.includes("comercial:contatos:gerar-link-cliente")) {
        actions.push({
          label: "Gerar link",
          icon: <LinkIcon fontSize="small" />,
          onClick: handleGenerateLink,
        });
      }

      return actions;
    },
    [canVisualize, permissions, handleActivateContact, handleDeactivateContact, handleGenerateLink, handleOpenDashboard]
  );

  const bulkActions: TableCardBulkAction<ContactRow>[] = useMemo(
    () => {
      // Se não tiver permissão de visualizar, não mostra ações em massa
      if (!canVisualize) {
        return [];
      }

      const actions: TableCardBulkAction<ContactRow>[] = [];

      // Ação "Ver" só aparece se tiver permissão de visualizar e selecionar apenas 1 item
      actions.push({
        label: "Ver",
        icon: <VisibilityOutlined fontSize="small" />,
        onClick: (ids) => {
          if (ids.length === 1) {
            const contact = (contactsData?.data || []).find((c) => c.id === ids[0]);
            if (contact) {
              handleOpenDashboard(contact);
            }
          }
        },
        disabled: (ids) => ids.length !== 1,
      });

      // Ação "Ativar" só aparece se tiver permissão de visualizar E reativar
      if (canVisualize && permissions.includes("comercial:contatos:reativar")) {
        actions.push({
          label: "Ativar",
          icon: <Check fontSize="small" />,
          onClick: (ids) => {
            ids.forEach((id) => {
              const contact = (contactsData?.data || []).find((c) => c.id === id);
              if (contact && !contact.status) {
                handleActivateContact(id);
              }
            });
          },
          disabled: (ids) => {
            const selectedContacts = (contactsData?.data || []).filter((c) => ids.includes(c.id));
            return selectedContacts.every((c) => c.status);
          },
        });
      }

      // Ação "Desativar" só aparece se tiver permissão de visualizar E inativar
      if (canVisualize && permissions.includes("comercial:contatos:inativar")) {
        actions.push({
          label: "Desativar",
          icon: <Close fontSize="small" />,
          onClick: (ids) => {
            ids.forEach((id) => {
              const contact = (contactsData?.data || []).find((c) => c.id === id);
              if (contact && contact.status) {
                handleDeactivateContact(id);
              }
            });
          },
          disabled: (ids) => {
            const selectedContacts = (contactsData?.data || []).filter((c) => ids.includes(c.id));
            return selectedContacts.every((c) => !c.status);
          },
        });
      }

      // Ação "Gerar link" só aparece se tiver a permissão específica
      if (permissions.includes("comercial:contatos:gerar-link-cliente")) {
        actions.push({
          label: "Gerar link",
          icon: <LinkIcon fontSize="small" />,
          onClick: (ids) => {
            if (ids.length === 1) {
              const contact = (contactsData?.data || []).find((c) => c.id === ids[0]);
              if (contact) {
                handleGenerateLink(contact);
              }
            }
          },
          disabled: (ids) => ids.length !== 1,
        });
      }

      return actions;
    },
    [canVisualize, permissions, contactsData?.data, handleActivateContact, handleDeactivateContact, handleGenerateLink, handleOpenDashboard]
  );

  const handleDialogOpen = useCallback(() => {
    setFieldErrors({});
  }, []);

  if (fetchError) {
    return (
      <Box p={3}>
        <Typography color="error">Erro ao carregar contatos</Typography>
      </Box>
    );
  }

  if (!contactsData && loading) {
    return (
      <Box p={3}>
        <Typography>Carregando contatos...</Typography>
      </Box>
    );
  }

  return (
    <Box className="contatos-page">
      <TableCard
        title="Contatos Comerciais"
        columns={contactColumns}
        rows={contactsData?.data || []}
        totalRows={contactsData?.total || 0}
        onFetchData={fetchContacts}
        refreshTrigger={refreshTrigger}
        loading={loading}
        onAdd={handleAddContact}
        formFields={contactFormFields as any}
        rowActions={rowActions}
        bulkActions={bulkActions}
        onDelete={permissions.includes("comercial:contatos:excluir") ? handleDeleteContact : undefined}
        onBulkDelete={permissions.includes("comercial:contatos:excluir") ? handleBulkDeleteContact : undefined}
        disableDelete={!permissions.includes("comercial:contatos:excluir")}
        onRowClick={canVisualize ? handleOpenDashboard : undefined}
        accessMode={accessMode}
        onDialogOpen={handleDialogOpen}
        fieldErrors={fieldErrors}
      />
      <ContactDashboard
        contactId={dashboardContactId}
        open={dashboardOpen}
        onClose={handleCloseDashboard}
        onUpdate={loadContatos}
      />
      <GenerateLinkModal
        open={generateLinkModalOpen}
        onClose={handleCloseGenerateLinkModal}
        onSave={handleSaveGenerateLink}
        saving={savingLink}
      />
      <LinkGeneratedModal
        open={linkGeneratedModalOpen}
        onClose={handleCloseLinkGeneratedModal}
        link={generatedLink}
        contactPhone={selectedContact?.phone}
        contactName={selectedContact?.name}
      />
      <Toast
        open={toast.open}
        onClose={() => setToast({ open: false, message: "" })}
        message={toast.message}
        severity={toast.severity}
      />
    </Box>
  );
};

export default ContatosPage;
