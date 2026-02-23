
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Box, Chip, Typography } from '@mui/material'
import Toast from '../../components/Toast'

import TableCard, {
  type TableCardColumn,
  type TableCardFormField,
  type TableCardRow,
} from '../../components/TableCard'
import TextPicker from '../../components/TextPicker'
import MultiSelectPicker from '../../components/MultiSelectPicker'
import { useSearch } from '../../context/SearchContext'
import { useAuth } from '../../context/AuthContext'
import {
  type AccessGroupDTO,
  type FeatureDefinition,
} from '../../services/accessGroups'
import {
  useAccessGroupList,
  useFeatureList,
  useCreateAccessGroup,
  useUpdateAccessGroup,
  useDeleteAccessGroup,
} from '../../hooks/queries/accessGroups'
import './style.css'

type AccessGroupRow = TableCardRow &
  Pick<AccessGroupDTO, 'name' | 'code' | 'features' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>

const DEFAULT_USER = 'admin'

const normalizeCode = (value: string) => {
  if (!value) return ''
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase()
}

const mapGroupToRow = (group: AccessGroupDTO): AccessGroupRow => ({
  ...group,
})

const AccessGroupsPage = () => {
  const { setFilters, setPlaceholder, setQuery } = useSearch()
  const { permissions, refreshPermissions } = useAuth()

  // Queries
  const { data: groupsData, isLoading: loadingGroups, error: groupsError } = useAccessGroupList()
  const { data: featuresData } = useFeatureList()

  const [toast, setToast] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '' })

  const groups = useMemo(() => groupsData?.map(mapGroupToRow) || [], [groupsData])

  const featureOptions = useMemo(() => featuresData?.map((feature) => ({ label: feature.name, value: feature.key })) || [], [featuresData])

  const featureDictionary = useMemo(() => {
    return featuresData?.reduce<Record<string, FeatureDefinition>>((acc, feature) => {
      acc[feature.key] = feature
      return acc
    }, {}) || {}
  }, [featuresData])

  // Mutations
  const createMutation = useCreateAccessGroup()
  const updateMutation = useUpdateAccessGroup()
  const deleteMutation = useDeleteAccessGroup()

  const canDelete = permissions.includes('erp:grupos-acesso:excluir')
  const canEdit = permissions.includes('erp:grupos-acesso:editar')
  const canCreate = permissions.includes('erp:grupos-acesso:criar')
  const canView = permissions.includes('erp:grupos-acesso:visualizar')
  const canList = permissions.includes('erp:grupos-acesso:listar')

  useEffect(() => {
    setPlaceholder('')
    const filters = [
      { id: 'name', label: 'Nome', field: 'name', type: 'text' as const, page: 'access-groups' },
      { id: 'code', label: 'Código', field: 'code', type: 'text' as const, page: 'access-groups' },
      { id: 'features', label: 'Funcionalidades', field: 'features', type: 'multiselect' as const, options: featureOptions, page: 'access-groups' },
    ]
    setFilters(filters, 'name')
    return () => {
      setFilters([])
      setPlaceholder('')
      setQuery('')
    }
  }, [setFilters, setPlaceholder, setQuery, featureOptions])

  const handleAddGroup = async (data: Partial<AccessGroupRow>) => {
    const payload = {
      name: (data.name as string) ?? '',
      code: normalizeCode((data.code as string) ?? ''),
      features: Array.isArray(data.features) ? (data.features as string[]) : [],
      createdBy: DEFAULT_USER,
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        setToast({ open: true, message: 'Grupo criado com sucesso', severity: 'success' })
      },
      onError: (err) => {
        setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao criar grupo', severity: 'error' })
      }
    })
  }

  const handleEditGroup = async (id: AccessGroupRow['id'], data: Partial<AccessGroupRow>) => {
    const existing = groups.find((group) => group.id === id)
    if (!existing) return

    const payload = {
      name: (data.name as string) ?? existing.name,
      code: normalizeCode((data.code as string) ?? existing.code),
      features: Array.isArray(data.features) ? (data.features as string[]) : existing.features,
      updatedBy: DEFAULT_USER,
    }

    updateMutation.mutate({ id: id as string, data: payload }, {
      onSuccess: async () => {
        setToast({ open: true, message: 'Grupo atualizado', severity: 'success' })
        await refreshPermissions()
      },
      onError: (err) => {
        setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao atualizar grupo', severity: 'error' })
      }
    })
  }

  const handleDeleteGroup = async (id: AccessGroupRow['id']) => {
    deleteMutation.mutate(id as string, {
      onSuccess: () => {
        setToast({ open: true, message: 'Grupo removido', severity: 'success' })
      },
      onError: (err) => {
        setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao remover grupo', severity: 'error' })
      }
    })
  }

  const handleBulkDelete = async (ids: AccessGroupRow['id'][]) => {
    // Bulk delete via parallel requests
    try {
      await Promise.all(ids.map(id => deleteMutation.mutateAsync(id as string)))
      setToast({ open: true, message: 'Grupos removidos', severity: 'success' })
    } catch (err) {
      setToast({ open: true, message: 'Erro ao remover alguns grupos', severity: 'error' })
    }
  }

  const renderFeaturesCell = useCallback(
    (keys: string[]) => {
      if (!Array.isArray(keys) || keys.length === 0) {
        return <Typography color="text.secondary">Sem funcionalidades</Typography>
      }
      return (
        <Box display="flex" flexWrap="wrap" gap={0.5}>
          {keys.map((key) => (
            <Chip key={key} label={featureDictionary[key]?.name ?? key} size="small" />
          ))}
        </Box>
      )
    },
    [featureDictionary],
  )

  const tableColumns = useMemo<TableCardColumn<AccessGroupRow>[]>(() => {
    return [
      { key: 'name', label: 'Nome' },
      { key: 'code', label: 'Código' },
      {
        key: 'features',
        label: 'Funcionalidades',
        render: (value: AccessGroupRow['features']) => renderFeaturesCell(value),
      },
    ]
  }, [renderFeaturesCell])

  const formFields = useMemo<TableCardFormField<AccessGroupRow>[]>(() => {
    return [
      {
        key: 'name',
        label: 'Nome do grupo',
        required: true,
        renderInput: ({ value, onChange, field, disabled }) => (
          <TextPicker
            label={field.label}
            value={typeof value === 'string' ? value : ''}
            onChange={(text) => onChange(text)}
            placeholder="Ex: Operações Norte"
            fullWidth
            required
            disabled={disabled}
          />
        ),
      },
      {
        key: 'code',
        label: 'Código',
        required: true,
        helperText: 'Use letras maiúsculas e hífens (ex: OPERACOES-NORTE)',
        renderInput: ({ value, onChange, field, disabled }) => (
          <TextPicker
            label={field.label}
            value={typeof value === 'string' ? value : ''}
            onChange={(text) => onChange(normalizeCode(text))}
            placeholder="OPERACOES-NORTE"
            fullWidth
            required
            disabled={disabled}
          />
        ),
      },
      {
        key: 'features',
        label: 'Funcionalidades padrão',
        renderInput: ({ value, onChange, field, disabled }) => (
          <MultiSelectPicker
            label={field.label}
            value={Array.isArray(value) ? value : []}
            onChange={(selected) => onChange(selected)}
            options={featureOptions}
            placeholder="Selecione as funcionalidades"
            fullWidth
            showSelectAll
            chipDisplay="block"
            disabled={disabled}
          />
        ),
      },
    ]
  }, [featureOptions])

  return (
    <Box className="access-groups-page">
      <TableCard
        title="Grupos de Acesso"
        columns={tableColumns}
        rows={groups}
        loading={loadingGroups}
        onAdd={canCreate ? handleAddGroup : undefined}
        onEdit={handleEditGroup}
        onDelete={handleDeleteGroup}
        disableDelete={!canDelete}
        disableEdit={!canEdit}
        disableView={!canView}
        onBulkDelete={canDelete ? handleBulkDelete : undefined}
        formFields={formFields}
        accessMode={!canList ? 'hidden' : 'full'}
      />

      <Toast
        open={toast.open || Boolean(groupsError)}
        onClose={() => {
          setToast((prev) => ({ ...prev, open: false }))
        }}
        message={toast.open ? toast.message : (groupsError ? 'Erro ao carregar grupos' : '')}
        severity={toast.open ? toast.severity : 'error'}
      />
    </Box>
  )
}

export default AccessGroupsPage
