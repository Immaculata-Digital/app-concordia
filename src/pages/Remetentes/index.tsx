import { useEffect, useMemo, useState } from 'react'
import { Box, Typography } from '@mui/material'
import Toast from '../../components/Toast'

import TableCard, {
  type TableCardColumn,
  type TableCardFormField,
  type TableCardRow,
} from '../../components/TableCard'
import TextPicker from '../../components/TextPicker'
import MailPicker from '../../components/MailPicker'
import PasswordPicker from '../../components/PasswordPicker'
import SelectPicker from '../../components/SelectPicker'
import { useSearch } from '../../context/SearchContext'
import { useAuth } from '../../context/AuthContext'
import { remetenteService, type RemetenteDTO } from '../../services/remetentes'
import { getAccessMode } from '../../utils/accessControl'
import { useDebounce } from '../../hooks/useDebounce'
import {
  useCreateRemetente,
  useDeleteRemetente,
  useRemetentes,
  useUpdateRemetente,
} from '../../hooks/queries/useRemetentes'
import './style.css'

type RemetenteRow = TableCardRow & RemetenteDTO

const DEFAULT_USER = 'admin'

const RemetentesPage = () => {
  const [toast, setToast] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '' })
  const { setFilters, setPlaceholder, setQuery, query, selectedFilter } = useSearch()
  const { user: currentUser, permissions } = useAuth()
  const debouncedQuery = useDebounce(query, 500)

  const accessMode = useMemo(() => getAccessMode(permissions, 'comunicacoes:remetentes'), [permissions])

  useEffect(() => {
    setPlaceholder('')
    const filters = [
      { id: 'nome', label: 'Nome', field: 'nome', type: 'text' as const, page: 'remetentes' },
      { id: 'email', label: 'E-mail', field: 'email', type: 'text' as const, page: 'remetentes' },
      { id: 'smtpHost', label: 'Servidor SMTP', field: 'smtpHost', type: 'text' as const, page: 'remetentes' },
      { id: 'smtpPort', label: 'Porta SMTP', field: 'smtpPort', type: 'number' as const, page: 'remetentes' },
      {
        id: 'smtpSecure',
        label: 'Seguro',
        field: 'smtpSecure',
        type: 'boolean' as const,
        page: 'remetentes'
      },
    ]
    setFilters(filters, 'nome')
    return () => {
      setFilters([])
      setPlaceholder('')
      setQuery('')
    }
  }, [setFilters, setPlaceholder, setQuery])

  const searchParams = useMemo(() => {
    if (!debouncedQuery) return {}
    if (selectedFilter?.field) {
      if (selectedFilter.type === 'number') {
        const num = Number(debouncedQuery)
        if (!isNaN(num)) return { [selectedFilter.field]: num }
      }
      return { [selectedFilter.field]: debouncedQuery }
    }
    return { nome: debouncedQuery }
  }, [debouncedQuery, selectedFilter])

  const { data: remetentes = [], isLoading, error } = useRemetentes(searchParams)

  const createMutation = useCreateRemetente()
  const updateMutation = useUpdateRemetente()
  const deleteMutation = useDeleteRemetente()

  const handleAddRemetente = async (data: Partial<RemetenteRow>) => {
    if (!data.senha || (data.senha as string).trim() === '') {
      setToast({ open: true, message: 'A senha é obrigatória na criação', severity: 'warning' })
      return
    }
    const payload = {
      nome: data.nome ?? '',
      email: data.email ?? '',
      senha: data.senha ?? '',
      smtpHost: data.smtpHost ?? '',
      smtpPort: Number(data.smtpPort) ?? 587,
      smtpSecure: Boolean(data.smtpSecure) ?? false,
      createdBy: currentUser?.login ?? DEFAULT_USER,
    }

    createMutation.mutate(payload, {
      onSuccess: () => setToast({ open: true, message: 'Remetente criado com sucesso', severity: 'success' }),
      onError: (err) => setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao criar remetente', severity: 'error' })
    })
  }

  const handleEditRemetente = async (id: RemetenteRow['id'], data: Partial<RemetenteRow>) => {
    const payload = {
      nome: data.nome as string,
      email: data.email as string,
      ...(data.senha ? { senha: data.senha as string } : {}),
      smtpHost: data.smtpHost as string,
      smtpPort: Number(data.smtpPort),
      smtpSecure: Boolean(data.smtpSecure),
      updatedBy: currentUser?.login ?? DEFAULT_USER,
    }

    updateMutation.mutate({ id: id as string, payload }, {
      onSuccess: () => setToast({ open: true, message: 'Remetente atualizado', severity: 'success' }),
      onError: (err) => setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao atualizar', severity: 'error' })
    })
  }

  const handleDeleteRemetente = async (id: RemetenteRow['id']) => {
    deleteMutation.mutate(id as string, {
      onSuccess: () => setToast({ open: true, message: 'Remetente removido', severity: 'success' }),
      onError: (err) => setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao remover remetente', severity: 'error' })
    })
  }

  const handleBulkDelete = async (ids: RemetenteRow['id'][]) => {
    // Bulk delete is not implemented in the new hooks yet with a single call, 
    // but we can iterate. Ideally should be a new mutation.
    // For now, iterate.
    try {
      await Promise.all(ids.map((id) => remetenteService.remove(id as string)))
      // Invalidate queries manually or assume page refresh, but better to use the hook's context if we exposed queryClient.
      // For simplicity reusing the service directly here but we should probably improve this.
      // Or loop and use mutation? Mutation parallel execution might be tricky with callbacks.
      // Let's keep it simple:
      await Promise.all(ids.map((id) => deleteMutation.mutateAsync(id as string)))

      setToast({ open: true, message: 'Remetentes removidos', severity: 'success' })
    } catch (err) {
      setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao remover remetentes', severity: 'error' })
    }
  }

  const remetenteFormFields: TableCardFormField<RemetenteRow>[] = useMemo(
    () => [
      {
        key: 'nome',
        label: 'Nome descritivo',
        required: true,
        renderInput: ({ value, onChange, field }) => (
          <TextPicker
            label={field.label}
            value={typeof value === 'string' ? value : ''}
            onChange={(text) => onChange(text)}
            fullWidth
            placeholder="Informe o nome descritivo do remetente"
            required
          />
        ),
      },
      {
        key: 'email',
        label: 'E-mail',
        required: true,
        renderInput: ({ value, onChange, field }) => (
          <MailPicker
            label={field.label}
            value={typeof value === 'string' ? value : ''}
            onChange={(text) => onChange(text)}
            fullWidth
            placeholder="remetente@empresa.com"
            required
          />
        ),
      },
      {
        key: 'senha',
        label: 'Senha',
        required: false,
        renderInput: ({ value, onChange, field }) => (
          <PasswordPicker
            label={field.label}
            value={typeof value === 'string' ? value : ''}
            onChange={(text) => onChange(text)}
            fullWidth
            placeholder="Deixe em branco para manter a senha atual (apenas na edição)"
          />
        ),
      },
      {
        key: 'smtpHost',
        label: 'Servidor SMTP',
        required: true,
        renderInput: ({ value, onChange, field }) => (
          <TextPicker
            label={field.label}
            value={typeof value === 'string' ? value : ''}
            onChange={(text) => onChange(text)}
            fullWidth
            placeholder="smtp.empresa.com"
            required
          />
        ),
      },
      {
        key: 'smtpPort',
        label: 'Porta SMTP',
        required: true,
        renderInput: ({ value, onChange, field }) => (
          <TextPicker
            label={field.label}
            value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
            onChange={(text) => onChange(Number(text))}
            fullWidth
            placeholder="587"
            required
            type="number"
          />
        ),
      },
      {
        key: 'smtpSecure',
        label: 'Conexão segura (TLS/SSL)',
        required: true,
        renderInput: ({ value, onChange, field }) => (
          <SelectPicker
            label={field.label}
            value={typeof value === 'boolean' ? String(value) : 'false'}
            onChange={(val: string | number | (string | number)[] | null) => onChange(val === 'true')}
            options={[
              { label: 'Sim', value: 'true' },
              { label: 'Não', value: 'false' },
            ]}
            fullWidth
            required
          />
        ),
      },
    ],
    [],
  )

  const tableColumns = useMemo<TableCardColumn<RemetenteRow>[]>(() => [
    { key: 'nome', label: 'Nome' },
    { key: 'email', label: 'E-mail' },
    { key: 'smtpHost', label: 'Servidor SMTP' },
    { key: 'smtpPort', label: 'Porta' },
    {
      key: 'smtpSecure',
      label: 'Seguro',
      render: (value: RemetenteRow['smtpSecure']) => (
        <Typography variant="body2">{value ? 'Sim' : 'Não'}</Typography>
      ),
    },
  ], [])

  return (
    <Box className="remetentes-page">
      <TableCard
        loading={isLoading}
        title="Remetentes"
        columns={tableColumns}
        rows={remetentes as RemetenteRow[]}
        onAdd={handleAddRemetente}
        onEdit={handleEditRemetente}
        onDelete={handleDeleteRemetente}
        onBulkDelete={handleBulkDelete}
        formFields={remetenteFormFields}
        modalTitle="Remetente"
        accessMode={accessMode}
      />

      <Toast
        open={toast.open || Boolean(error)}
        onClose={() => {
          setToast({ open: false, message: '' })
        }}
        message={toast.open ? toast.message : (error instanceof Error ? error.message : 'Erro ao carregar remetentes')}
        severity={error && !toast.open ? 'error' : toast.severity}
      />
    </Box>
  )
}

export default RemetentesPage

