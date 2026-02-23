import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Typography, IconButton, Tooltip } from '@mui/material'
import Toast from '../../components/Toast'

import { ContentCopy, Check } from '@mui/icons-material'
import TableCard, {
  type TableCardColumn,
  type TableCardFormField,
  type TableCardRow,
} from '../../components/TableCard'
import TextPicker from '../../components/TextPicker'
import SelectPicker from '../../components/SelectPicker'
import HtmlEditor from '../../components/HtmlEditor'
import KeyPicker from '../../components/KeyPicker'
import { useSearch } from '../../context/SearchContext'
import { useAuth } from '../../context/AuthContext'
import { comunicacaoService, type ComunicacaoDTO } from '../../services/comunicacoes'
import { getAccessMode } from '../../utils/accessControl'
import { remetenteService, type RemetenteDTO } from '../../services/remetentes'
import './style.css'

type ComunicacaoRow = TableCardRow & ComunicacaoDTO

const DEFAULT_USER = 'admin'

const ComunicacoesPage = () => {
  const [comunicacoes, setComunicacoes] = useState<ComunicacaoRow[]>([])
  const [remetentes, setRemetentes] = useState<RemetenteDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '' })
  const [error, setError] = useState<string | null>(null)
  const { setFilters, setPlaceholder, setQuery } = useSearch()
  const { user: currentUser, permissions } = useAuth()

  const accessMode = useMemo(() => getAccessMode(permissions, 'comunicacoes:comunicacoes'), [permissions])

  const remetenteOptions = useMemo(() =>
    remetentes.map((r) => ({ label: r.nome, value: r.id })),
    [remetentes]
  )

  useEffect(() => {
    setPlaceholder('')
    const filters = [
      { id: 'descricao', label: 'Descrição', field: 'descricao', type: 'text' as const, page: 'comunicacoes' },
      { id: 'assunto', label: 'Assunto', field: 'assunto', type: 'text' as const, page: 'comunicacoes' },
      { id: 'chave', label: 'Chave', field: 'chave', type: 'text' as const, page: 'comunicacoes' },
      {
        id: 'tipo',
        label: 'Tipo',
        field: 'tipo',
        type: 'select' as const,
        options: [{ label: 'E-mail', value: 'email' }],
        page: 'comunicacoes'
      },
      {
        id: 'tipoEnvio',
        label: 'Tipo de Envio',
        field: 'tipoEnvio',
        type: 'select' as const,
        options: [
          { label: 'Imediato', value: 'imediato' },
          { label: 'Agendado', value: 'agendado' }
        ],
        page: 'comunicacoes'
      },
      {
        id: 'remetenteId',
        label: 'Remetente',
        field: 'remetenteId',
        type: 'select' as const,
        options: remetenteOptions,
        page: 'comunicacoes'
      },
    ]
    setFilters(filters, 'descricao')
    return () => {
      setFilters([])
      setPlaceholder('')
      setQuery('')
    }
  }, [setFilters, setPlaceholder, setQuery, remetenteOptions])

  const loadRemetentes = async () => {
    try {
      const data = await remetenteService.list()
      setRemetentes(data)
    } catch (err) {
      console.error(err)
    }
  }

  const loadComunicacoes = async () => {
    try {
      const data = await comunicacaoService.list()
      setComunicacoes(data.map((c) => ({ ...c })))
    } catch (err) {
      console.error(err)
      setError('Não foi possível carregar comunicações')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchAll = async () => {
      await loadRemetentes()
      await loadComunicacoes()
    }
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getRemetenteNome = useCallback((remetenteId: string) => {
    const remetente = remetentes.find((r) => r.id === remetenteId)
    return remetente?.nome ?? remetenteId
  }, [remetentes])

  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopyKey = async (chave: string) => {
    try {
      await navigator.clipboard.writeText(chave)
      setCopiedKey(chave)
      setToast({ open: true, message: 'Chave copiada para a área de transferência', severity: 'info' })
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (err) {
      console.error('Erro ao copiar chave:', err)
      setToast({ open: true, message: 'Erro ao copiar chave', severity: 'error' })
    }
  }

  const handleAddComunicacao = async (data: Partial<ComunicacaoRow>) => {
    try {
      const payload = {
        tipo: 'email' as const,
        descricao: (data.descricao as string) ?? '',
        assunto: (data.assunto as string) ?? '',
        html: (data.html as string) ?? '',
        remetenteId: (data.remetenteId as string) ?? '',
        tipoEnvio: (data.tipoEnvio as 'imediato' | 'agendado') ?? 'imediato',
        chave: data.chave ? (data.chave as string).trim() : undefined,
        createdBy: currentUser?.login ?? DEFAULT_USER,
      }
      const created = await comunicacaoService.create(payload)
      setComunicacoes((prev) => [...prev, { ...created }])
      setToast({ open: true, message: 'Comunicação criada com sucesso', severity: 'success' })
    } catch (err) {
      console.error(err)
      setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao criar comunicação', severity: 'error' })
    }
  }

  const handleEditComunicacao = async (id: ComunicacaoRow['id'], data: Partial<ComunicacaoRow>) => {
    try {
      // A chave não pode ser alterada após a criação, então não incluímos no payload
      const payload = {
        tipo: data.tipo as 'email' | undefined,
        descricao: data.descricao as string,
        assunto: data.assunto as string,
        html: data.html as string,
        remetenteId: data.remetenteId as string,
        tipoEnvio: data.tipoEnvio as 'imediato' | 'agendado' | undefined,
        updatedBy: currentUser?.login ?? DEFAULT_USER,
      }
      const updated = await comunicacaoService.update(id as string, payload)
      setComunicacoes((prev) => prev.map((c) => (c.id === id ? { ...updated } : c)))
      setToast({ open: true, message: 'Comunicação atualizada', severity: 'success' })
    } catch (err) {
      console.error(err)
      setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao atualizar', severity: 'error' })
    }
  }

  const handleDeleteComunicacao = async (id: ComunicacaoRow['id']) => {
    try {
      await comunicacaoService.remove(id as string)
      setComunicacoes((prev) => prev.filter((c) => c.id !== id))
      setToast({ open: true, message: 'Comunicação removida', severity: 'success' })
    } catch (err) {
      console.error(err)
      setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao remover comunicação', severity: 'error' })
    }
  }

  const handleBulkDelete = async (ids: ComunicacaoRow['id'][]) => {
    try {
      await Promise.all(ids.map((id) => comunicacaoService.remove(id as string)))
      setComunicacoes((prev) => prev.filter((c) => !ids.includes(c.id)))
      setToast({ open: true, message: 'Comunicações removidas', severity: 'success' })
    } catch (err) {
      console.error(err)
      setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao remover comunicações', severity: 'error' })
    }
  }



  const comunicacaoFormFields: TableCardFormField<ComunicacaoRow>[] = useMemo(
    () => [
      {
        key: 'tipo',
        label: 'Tipo de comunicação',
        required: true,
        defaultValue: 'email',
        renderInput: ({ value, onChange, field }) => {
          const tipoValue = (value && typeof value === 'string' ? value : 'email') || 'email'
          return (
            <SelectPicker
              label={field.label}
              value={tipoValue}
              onChange={(val: any) => onChange(val || 'email')}
              options={[
                { label: 'E-mail', value: 'email' },
              ]}
              fullWidth
              required
              disabled
            />
          )
        },
      },
      {
        key: 'descricao',
        label: 'Descrição',
        required: true,
        renderInput: ({ value, onChange, field }) => (
          <TextPicker
            label={field.label}
            value={typeof value === 'string' ? value : ''}
            onChange={(text) => onChange(text)}
            fullWidth
            placeholder="Informe a descrição da comunicação"
            required
          />
        ),
      },
      {
        key: 'assunto',
        label: 'Assunto',
        required: true,
        renderInput: ({ value, onChange, field }) => (
          <TextPicker
            label={field.label}
            value={typeof value === 'string' ? value : ''}
            onChange={(text) => onChange(text)}
            fullWidth
            placeholder="Informe o assunto do e-mail"
            required
          />
        ),
      },
      {
        key: 'html',
        label: 'HTML',
        required: true,
        renderInput: ({ value, onChange, field }) => (
          <HtmlEditor
            label={field.label}
            value={typeof value === 'string' ? value : ''}
            onChange={(text) => onChange(text)}
            fullWidth
            placeholder="Digite o HTML do e-mail aqui..."
            required
          />
        ),
      },
      {
        key: 'remetenteId',
        label: 'Remetente',
        required: true,
        renderInput: ({ value, onChange, field }) => (
          <SelectPicker
            label={field.label}
            value={typeof value === 'string' ? value : ''}
            onChange={(val: any) => onChange(val)}
            options={remetenteOptions}
            fullWidth
            placeholder="Selecione o remetente"
            required
          />
        ),
      },
      {
        key: 'chave',
        label: 'Chave',
        required: false,
        renderInput: ({ value, onChange, field, formValues, disabled, setFieldValue }) => {
          // Sempre permite editar o campo chave
          // Usa formValues.chave se existir, senão usa o value original, senão string vazia
          const currentChave = (formValues.chave && typeof formValues.chave === 'string') 
            ? formValues.chave 
            : (value && typeof value === 'string') 
              ? value 
              : ''
          
          return (
            <KeyPicker
              label={field.label}
              value={currentChave}
              onChange={(text) => {
                // Atualiza o valor no formulário
                setFieldValue('chave', text)
                onChange(text)
              }}
              fullWidth
              placeholder="Ex: EMAIL-RESET-PASSWORD"
              disabled={disabled}
              helperText="Apenas letras maiúsculas e hífens."
            />
          )
        },
      },
      {
        key: 'tipoEnvio',
        label: 'Tipo de envio',
        required: true,
        renderInput: ({ value, onChange, field }) => (
          <SelectPicker
            label={field.label}
            value={typeof value === 'string' ? value : 'imediato'}
            onChange={(val: any) => onChange(val)}
            options={[
              { label: 'Imediato', value: 'imediato' },
              { label: 'Agendado (em desenvolvimento)', value: 'agendado', disabled: true },
            ]}
            fullWidth
            required
          />
        ),
      },
    ],
    [remetenteOptions, copiedKey],
  )

  const tableColumns = useMemo<TableCardColumn<ComunicacaoRow>[]>(() => [
    { key: 'descricao', label: 'Descrição' },
    { key: 'assunto', label: 'Assunto' },
    {
      key: 'remetenteId',
      label: 'Remetente',
      render: (value: ComunicacaoRow['remetenteId']) => (
        <Typography variant="body2">{getRemetenteNome(value)}</Typography>
      ),
    },
    { key: 'tipo', label: 'Tipo' },
    { key: 'tipoEnvio', label: 'Tipo de envio' },
    {
      key: 'chave',
      label: 'Chave',
      render: (value: ComunicacaoRow['chave']) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
            {value}
          </Typography>
          <Tooltip title={copiedKey === value ? 'Copiado!' : 'Copiar chave'}>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                handleCopyKey(value)
              }}
              sx={{ padding: '4px' }}
            >
              {copiedKey === value ? (
                <Check sx={{ fontSize: '16px', color: 'success.main' }} />
              ) : (
                <ContentCopy sx={{ fontSize: '16px' }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ], [getRemetenteNome, copiedKey])

  return (
    <Box className="comunicacoes-page">
      <TableCard
        title="Comunicações"
        columns={tableColumns}
        rows={comunicacoes}
        onAdd={handleAddComunicacao}
        onEdit={handleEditComunicacao}
        onDelete={handleDeleteComunicacao}
        onBulkDelete={handleBulkDelete}
        formFields={comunicacaoFormFields}
        modalTitle="Comunicação"
        modalMaxWidth="md"
        accessMode={accessMode}
        loading={loading}
      />

      <Toast
        open={toast.open || Boolean(error)}
        onClose={() => {
          setToast({ open: false, message: '' })
          setError(null)
        }}
        message={toast.open ? toast.message : error}
        severity={error ? 'error' : toast.severity}
      />
    </Box>
  )
}

export default ComunicacoesPage

