
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Typography,
  Chip,
} from '@mui/material'
import Toast from '../../components/Toast'

import TableCard, {
  type TableCardColumn,
  type TableCardFormField,
  type TableCardRow,
} from '../../components/TableCard'
import { useSearch } from '../../context/SearchContext'
import { useAuth } from '../../context/AuthContext'
import TextPicker from '../../components/TextPicker'
import NumberPicker from '../../components/NumberPicker'
import DatePicker from '../../components/DatePicker'
import SelectPicker, { type SelectOption } from '../../components/SelectPicker'
import MultiSelectPicker, { type MultiSelectOption } from '../../components/MultiSelectPicker'
import { type ParameterizationDTO } from '../../services/parameterizations'
import {
  useParameterizationList,
  useCreateParameterization,
  useUpdateParameterization,
  useDeleteParameterization
} from '../../hooks/queries/parameterizations'
import { useUserList } from '../../hooks/queries/users'
import './style.css'

type ParameterizationRow = TableCardRow & ParameterizationDTO

const DEFAULT_USER = 'admin'

const ParametrizacoesPage = () => {
  const { setFilters, setPlaceholder, setQuery } = useSearch()
  const { user: currentUser, permissions } = useAuth()

  // Queries
  const { data: paramData, isLoading: loadingParams, error: paramError } = useParameterizationList()
  const { data: usersData, isLoading: loadingUsers } = useUserList()

  const parameterizations = useMemo<ParameterizationRow[]>(() =>
    paramData?.map(p => ({ ...p })) || [],
    [paramData])

  const users = useMemo(() => usersData || [], [usersData])
  const loading = loadingParams || loadingUsers

  const [toast, setToast] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '' })

  // Mutations
  const createMutation = useCreateParameterization()
  const updateMutation = useUpdateParameterization()
  const deleteMutation = useDeleteParameterization()

  const hasPermission = useCallback(
    (permission: string) => {
      return permissions.includes(permission)
    },
    [permissions],
  )

  const canEditAllFields = hasPermission('erp:parametros:editar-todos-campos')
  const canEditNonEditable = hasPermission('erp:parametros:editar-nao-editaveis')
  const canEdit = hasPermission('erp:parametros:editar')

  // Determina se um campo específico deve estar desabilitado durante edição
  const isFieldDisabled = useCallback(
    (fieldKey: string, formValues: Partial<ParameterizationRow>) => {
      // Se não tiver permissão de editar, todos os campos ficam desabilitados
      if (!canEdit) {
        return true
      }

      // Se for criação (não tem id), todos os campos ficam habilitados
      const isEditMode = Boolean(formValues.id)
      if (!isEditMode) {
        return false
      }

      // Verifica se o parâmetro é editável
      // Pode ser boolean true ou string 'true'
      const editableValue = formValues.editable
      const parameterIsEditable = editableValue === true || String(editableValue) === 'true'

      // Se o parâmetro NÃO é editável E o usuário NÃO tem permissão para editar não editáveis
      // TODOS os campos (incluindo value) ficam desabilitados
      if (!parameterIsEditable && !canEditNonEditable) {
        return true
      }

      // Se chegou aqui, o parâmetro é editável OU o usuário pode editar não editáveis
      // Campo "value" sempre pode editar nesse caso
      if (fieldKey === 'value') {
        return false
      }

      // Para outros campos, só pode editar se tiver permissão de editar todos os campos
      if (!canEditAllFields) {
        return true
      }

      return false
    },
    [canEdit, canEditAllFields, canEditNonEditable],
  )

  useEffect(() => {
    setPlaceholder('Buscar parametrizações...')

    const dataTypeOptions = [
      { value: 'Número', label: 'Número' },
      { value: 'Texto', label: 'Texto' },
      { value: 'Data', label: 'Data' },
      { value: 'Booleano', label: 'Booleano' },
    ]

    const scopeTypeOptions = [
      { value: 'GLOBAL', label: 'Global' },
      { value: 'USER', label: 'Usuário' },
    ]

    const userOptionsForFilter = users.map((user) => ({
      value: user.id,
      label: `${user.fullName} (${user.login})`,
    }))

    const filters = [
      { id: 'friendlyName', label: 'Nome do Parâmetro', field: 'friendlyName', type: 'text' as const, page: 'parametrizacoes' },
      { id: 'technicalKey', label: 'Chave Técnica', field: 'technicalKey', type: 'text' as const, page: 'parametrizacoes' },
      { id: 'dataType', label: 'Tipo de Dado', field: 'dataType', type: 'select' as const, options: dataTypeOptions, page: 'parametrizacoes' },
      { id: 'value', label: 'Valor Atual', field: 'value', type: 'text' as const, page: 'parametrizacoes' },
      { id: 'scopeType', label: 'Tipo de Escopo', field: 'scopeType', type: 'select' as const, options: scopeTypeOptions, page: 'parametrizacoes' },
      { id: 'scopeTargetId', label: 'Usuários', field: 'scopeTargetId', type: 'select' as const, options: userOptionsForFilter, page: 'parametrizacoes' },
      { id: 'editable', label: 'Editável', field: 'editable', type: 'boolean' as const, page: 'parametrizacoes' },
    ]

    setFilters(filters, 'friendlyName')
    return () => {
      setFilters([])
      setPlaceholder('')
      setQuery('')
    }
  }, [setFilters, setPlaceholder, setQuery, users])

  const handleAddParameterization = async (data: Partial<ParameterizationRow>) => {
    const payload = {
      friendlyName: (data.friendlyName as string) ?? '',
      technicalKey: (data.technicalKey as string) ?? '',
      dataType: (data.dataType as string) ?? '',
      value: (data.value as string) ?? '',
      scopeType: (data.scopeType as string) ?? '',
      scopeTargetId: data.scopeType === 'GLOBAL' ? undefined : (data.scopeTargetId as string[] ?? []),
      editable: data.editable ?? true,
      createdBy: currentUser?.login ?? DEFAULT_USER,
    }

    createMutation.mutate(payload, {
      onSuccess: () => setToast({ open: true, message: 'Parametrização criada com sucesso', severity: 'success' }),
      onError: (err) => setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao criar parametrização', severity: 'error' })
    })
  }

  const handleEditParameterization = async (id: ParameterizationRow['id'], data: Partial<ParameterizationRow>) => {
    const payload = {
      friendlyName: data.friendlyName as string | undefined,
      technicalKey: data.technicalKey as string | undefined,
      dataType: data.dataType as string | undefined,
      value: data.value as string | undefined,
      scopeType: data.scopeType as string | undefined,
      scopeTargetId: data.scopeType === 'GLOBAL' ? undefined : (data.scopeTargetId as string[] | undefined),
      editable: data.editable as boolean | undefined,
      updatedBy: currentUser?.login ?? DEFAULT_USER,
    }

    updateMutation.mutate({ id: id as string, data: payload }, {
      onSuccess: () => setToast({ open: true, message: 'Parametrização atualizada com sucesso', severity: 'success' }),
      onError: (err) => setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao atualizar parametrização', severity: 'error' })
    })
  }

  const handleDeleteParameterization = async (id: ParameterizationRow['id']) => {
    deleteMutation.mutate(id as string, {
      onSuccess: () => setToast({ open: true, message: 'Parametrização removida', severity: 'success' }),
      onError: (err) => setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao remover parametrização', severity: 'error' })
    })
  }

  const handleBulkDelete = async (ids: ParameterizationRow['id'][]) => {
    try {
      await Promise.all(ids.map(id => deleteMutation.mutateAsync(id as string)))
      setToast({ open: true, message: 'Parametrizações removidas', severity: 'success' })
    } catch (err) {
      setToast({ open: true, message: 'Erro ao remover parametrizações', severity: 'error' })
    }
  }

  const dataTypeOptions: SelectOption[] = useMemo(
    () => [
      { value: 'Número', label: 'Número' },
      { value: 'Texto', label: 'Texto' },
      { value: 'Data', label: 'Data' },
      { value: 'Booleano', label: 'Booleano' },
    ],
    [],
  )

  const scopeTypeOptions: SelectOption[] = useMemo(
    () => [
      { value: 'GLOBAL', label: 'Global' },
      { value: 'USER', label: 'Usuário' },
    ],
    [],
  )

  const userOptions: MultiSelectOption[] = useMemo(
    () =>
      users.map((user) => ({
        value: user.id,
        label: `${user.fullName} (${user.login})`,
      })),
    [users],
  )

  const renderValueByDataType = (value: string, dataType: string) => {
    if (!value) return '--'

    switch (dataType) {
      case 'Número':
        return value
      case 'Data': {
        try {
          // Para evitar problemas de timezone, parsear a data localmente
          if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const [year, month, day] = value.split('-').map(Number)
            const date = new Date(year, month - 1, day)
            return date.toLocaleDateString('pt-BR')
          }
          return new Date(value).toLocaleDateString('pt-BR')
        } catch {
          return value
        }
      }
      case 'Booleano':
        return value === 'true' || value === '1' ? 'Sim' : 'Não'
      case 'Texto':
      default:
        return value
    }
  }

  const parameterizationFormFields: TableCardFormField<ParameterizationRow>[] = useMemo(
    () => [
      {
        key: 'friendlyName',
        label: 'Nome do Parâmetro',
        required: true,
        renderInput: ({ value, onChange, field, disabled, formValues }) => {
          const isDisabled = disabled || isFieldDisabled('friendlyName', formValues)
          return (
            <TextPicker
              label={field.label}
              value={typeof value === 'string' ? value : ''}
              onChange={(text) => onChange(text)}
              fullWidth
              placeholder="Ex: Limite Diário de Perda"
              required={field.required}
              disabled={isDisabled}
            />
          )
        },
      },
      {
        key: 'technicalKey',
        label: 'Chave Técnica',
        required: true,
        renderInput: ({ value, onChange, field, disabled, formValues }) => {
          const isDisabled = disabled || isFieldDisabled('technicalKey', formValues)
          return (
            <TextPicker
              label={field.label}
              value={typeof value === 'string' ? value : ''}
              onChange={(text) => onChange(text.toUpperCase().replace(/\s/g, '_'))}
              fullWidth
              placeholder="Ex: STOP_LOSS_DAILY"
              required={field.required}
              disabled={isDisabled}
            />
          )
        },
      },
      {
        key: 'dataType',
        label: 'Tipo de Dado',
        required: true,
        inputType: 'select',
        options: dataTypeOptions,
        renderInput: ({ value, onChange, field, formValues, setFieldValue, disabled }) => {
          const isDisabled = disabled || isFieldDisabled('dataType', formValues)
          // Quando o dataType muda, resetar o value se necessário
          const handleDataTypeChange = (newDataType: string | number | (string | number)[] | null) => {
            const singleValue = Array.isArray(newDataType) ? newDataType[0] : newDataType
            onChange(singleValue)
            if (formValues.value) {
              setFieldValue('value', '')
            }
          }

          return (
            <SelectPicker
              label={field.label}
              value={value ?? null}
              onChange={handleDataTypeChange}
              options={dataTypeOptions}
              fullWidth
              required={field.required}
              disabled={isDisabled}
            />
          )
        },
      },
      {
        key: 'value',
        label: 'Valor',
        required: true,
        renderInput: ({ value, onChange, field, formValues, disabled }) => {
          const dataType = formValues.dataType as string
          const isDisabled = disabled || isFieldDisabled('value', formValues)

          if (dataType === 'Número') {
            return (
              <NumberPicker
                label={field.label}
                value={typeof value === 'string' ? parseFloat(value) : value}
                onChange={(num) => onChange(num !== undefined ? String(num) : '')}
                fullWidth
                required={field.required}
                disabled={isDisabled}
              />
            )
          }

          if (dataType === 'Data') {
            return (
              <DatePicker
                label={field.label}
                value={typeof value === 'string' ? value : ''}
                onChange={(date) => onChange(date)}
                fullWidth
                required={field.required}
                disabled={isDisabled}
              />
            )
          }

          if (dataType === 'Booleano') {
            return (
              <SelectPicker
                label={field.label}
                value={value ?? null}
                onChange={(val) => onChange(val === 'true' ? 'true' : 'false')}
                options={[
                  { value: 'true', label: 'Sim' },
                  { value: 'false', label: 'Não' },
                ]}
                fullWidth
                required={field.required}
                disabled={isDisabled}
              />
            )
          }

          // Texto (padrão)
          return (
            <TextPicker
              label={field.label}
              value={typeof value === 'string' ? value : ''}
              onChange={(text) => onChange(text)}
              fullWidth
              required={field.required}
              disabled={isDisabled}
            />
          )
        },
      },
      {
        key: 'scopeType',
        label: 'Tipo de Escopo',
        required: true,
        inputType: 'select',
        options: scopeTypeOptions,
        renderInput: ({ value, onChange, field, formValues, setFieldValue, disabled }) => {
          const isDisabled = disabled || isFieldDisabled('scopeType', formValues)
          // Quando o scopeType muda para GLOBAL, limpar scopeTargetId
          const handleScopeTypeChange = (newScopeType: string | number | (string | number)[] | null) => {
            const singleValue = Array.isArray(newScopeType) ? newScopeType[0] : newScopeType
            onChange(singleValue)
            if (singleValue === 'GLOBAL') {
              setFieldValue('scopeTargetId', [])
            }
          }

          return (
            <SelectPicker
              label={field.label}
              value={value ?? null}
              onChange={handleScopeTypeChange}
              options={scopeTypeOptions}
              fullWidth
              required={field.required}
              disabled={isDisabled}
            />
          )
        },
      },
      {
        key: 'scopeTargetId',
        label: 'Usuários',
        required: false,
        inputType: 'multiselect',
        options: userOptions,
        renderInput: ({ value, onChange, field, formValues, disabled }) => {
          const scopeType = formValues.scopeType as string
          const isDisabled = disabled || isFieldDisabled('scopeTargetId', formValues)

          if (scopeType === 'GLOBAL') {
            return null // Não mostrar se for GLOBAL
          }

          const multiValue = Array.isArray(value) ? value : []

          return (
            <MultiSelectPicker
              label={field.label}
              value={multiValue}
              onChange={(vals) => onChange(vals)}
              options={userOptions}
              fullWidth
              required={scopeType === 'USER' ? field.required : false}
              disabled={isDisabled}
              placeholder="Selecione os usuários"
            />
          )
        },
      },
      {
        key: 'editable',
        label: 'Editável',
        inputType: 'select',
        options: [
          { value: 'true', label: 'Sim' },
          { value: 'false', label: 'Não' },
        ],
        renderInput: ({ value, onChange, field, disabled, formValues }) => {
          const isDisabled = disabled || isFieldDisabled('editable', formValues)
          const boolValue = value === true || value === 'true' ? 'true' : 'false'
          return (
            <SelectPicker
              label={field.label}
              value={boolValue}
              onChange={(val) => onChange(val === 'true')}
              options={[
                { value: 'true', label: 'Sim' },
                { value: 'false', label: 'Não' },
              ]}
              fullWidth
              disabled={isDisabled}
            />
          )
        },
      },
    ],
    [dataTypeOptions, scopeTypeOptions, userOptions, isFieldDisabled],
  )

  const tableColumns = useMemo<TableCardColumn<ParameterizationRow>[]>(
    () => [
      {
        key: 'friendlyName',
        label: 'Nome do Parâmetro',
      },
      {
        key: 'technicalKey',
        label: 'Chave Técnica',
        render: (value) => (
          <Chip
            label={String(value)}
            size="small"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
            }}
          />
        ),
      },
      {
        key: 'dataType',
        label: 'Tipo de Dado',
      },
      {
        key: 'value',
        label: 'Valor Atual',
        render: (value, row) => renderValueByDataType(String(value), row.dataType),
      },
      {
        key: 'scopeType',
        label: 'Tipo de Escopo',
        render: (value) => {
          const scopeType = String(value)
          return scopeType === 'GLOBAL' ? 'Global' : 'Usuário'
        },
      },
      {
        key: 'scopeTargetId',
        label: 'Usuários',
        render: (value, row) => {
          if (row.scopeType === 'GLOBAL') {
            return '--'
          }
          const userIds = Array.isArray(value) ? value : []
          if (userIds.length === 0) return 'Nenhum usuário selecionado'

          const userNames = userIds
            .map((id) => {
              const user = users.find((u) => u.id === id)
              return user ? `${user.fullName} (${user.login})` : id
            })
            .slice(0, 3)

          const remaining = userIds.length - userNames.length
          return (
            <Box>
              {userNames.map((name, idx) => (
                <Chip key={idx} label={name} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
              ))}
              {remaining > 0 && (
                <Chip label={`+${remaining} mais`} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
              )}
            </Box>
          )
        },
      },
      {
        key: 'editable',
        label: 'Editável',
        render: (value) => {
          const isEditable = value === true || value === 'true'
          return (
            <Chip
              label={isEditable ? 'Sim' : 'Não'}
              size="small"
              color={isEditable ? 'success' : 'default'}
            />
          )
        },
      },
    ],
    [users],
  )

  if (!loading && !hasPermission('erp:parametros:listar')) {
    return (
      <Box className="parametrizacoes-page">
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>
          Você não tem permissão para listar parametrizações
        </Typography>
      </Box>
    )
  }

  return (
    <Box className="parametrizacoes-page">
      <TableCard
        loading={loading}
        title="Parametrizações"
        columns={tableColumns}
        rows={parameterizations}
        onAdd={hasPermission('erp:parametros:criar') ? handleAddParameterization : undefined}
        onEdit={canEdit ? handleEditParameterization : undefined}
        onDelete={handleDeleteParameterization}
        onBulkDelete={hasPermission('erp:parametros:excluir') ? handleBulkDelete : undefined}
        formFields={parameterizationFormFields}
        disableDelete={!hasPermission('erp:parametros:excluir')}
        disableEdit={!canEdit}
      />

      <Toast
        open={toast.open || Boolean(paramError)}
        onClose={() => {
          setToast((prev) => ({ ...prev, open: false }))
        }}
        message={toast.open ? toast.message : (paramError ? 'Erro ao carregar parametrizações' : '')}
        severity={toast.open ? toast.severity : 'error'}
      />
    </Box>
  )
}

export default ParametrizacoesPage
