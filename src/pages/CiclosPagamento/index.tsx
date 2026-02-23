import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Typography,
} from '@mui/material'
import Toast from '../../components/Toast'

import TableCard, {
  type TableCardColumn,
  type TableCardRow,
} from '../../components/TableCard'
import { TableCardModal } from '../../components/Modals'
import { useSearch } from '../../context/SearchContext'
import { useAuth } from '../../context/AuthContext'
import TextPicker from '../../components/TextPicker'
import NumberPicker from '../../components/NumberPicker'
import { getAccessMode, canEdit } from '../../utils/accessControl'
import { useCiclos, useCreateCiclo, useUpdateCiclo, useDeleteCiclo } from '../../hooks/queries/ciclos'
import './style.css'

type CicloPagamentoRow = TableCardRow & {
  id: string
  descricao: string
  diaInicioCiclo: number
  diaFimCiclo: number
  diaPagamentoCiclo: number
  createdAt: string
  createdBy: string
  updatedAt?: string | null
  updatedBy?: string | null
}

const DEFAULT_USER = 'admin'

const CiclosPagamentoPage = () => {
  const [toast, setToast] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '' })

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add')
  const [selectedCiclo, setSelectedCiclo] = useState<CicloPagamentoRow | null>(null)
  const [formValues, setFormValues] = useState<Partial<CicloPagamentoRow>>({})
  const [initialFormValues, setInitialFormValues] = useState<Partial<CicloPagamentoRow>>({})

  const { setFilters, setPlaceholder, setQuery } = useSearch()
  const { permissions, user: currentUser } = useAuth()

  const accessMode = useMemo(() => getAccessMode(permissions, 'contratos:ciclos-pagamento'), [permissions])

  const hasPermission = useCallback(
    (permission: string) => {
      return permissions.includes(permission)
    },
    [permissions],
  )

  const { data: ciclos = [], isLoading: loading, error: queryError } = useCiclos()
  const createMutation = useCreateCiclo()
  const updateMutation = useUpdateCiclo()
  const deleteMutation = useDeleteCiclo()

  useEffect(() => {
    setPlaceholder('')
    const filters = [
      { id: 'descricao', label: 'Descrição', field: 'descricao', type: 'text' as const, page: 'ciclos-pagamento' },
      { id: 'diaInicioCiclo', label: 'Dia Início', field: 'diaInicioCiclo', type: 'number' as const, page: 'ciclos-pagamento' },
      { id: 'diaFimCiclo', label: 'Dia Fim', field: 'diaFimCiclo', type: 'number' as const, page: 'ciclos-pagamento' },
      { id: 'diaPagamentoCiclo', label: 'Dia Pagamento', field: 'diaPagamentoCiclo', type: 'number' as const, page: 'ciclos-pagamento' },
    ]
    setFilters(filters, 'descricao')
    return () => {
      setFilters([])
      setPlaceholder('')
      setQuery('')
    }
  }, [setFilters, setPlaceholder, setQuery])

  const handleSave = async () => {
    try {
      if (modalMode === 'add') {
        const payload = {
          descricao: (formValues.descricao as string) ?? '',
          diaInicioCiclo: (formValues.diaInicioCiclo as number) ?? 1,
          diaFimCiclo: (formValues.diaFimCiclo as number) ?? 1,
          diaPagamentoCiclo: (formValues.diaPagamentoCiclo as number) ?? 1,
          createdBy: currentUser?.login ?? DEFAULT_USER,
        }
        await createMutation.mutateAsync(payload)
        setToast({ open: true, message: 'Ciclo criado com sucesso', severity: 'success' })
      } else if (modalMode === 'edit' && selectedCiclo) {
        const payload = {
          descricao: formValues.descricao as string | undefined,
          diaInicioCiclo: formValues.diaInicioCiclo as number | undefined,
          diaFimCiclo: formValues.diaFimCiclo as number | undefined,
          diaPagamentoCiclo: formValues.diaPagamentoCiclo as number | undefined,
          updatedBy: currentUser?.login ?? DEFAULT_USER,
        }
        await updateMutation.mutateAsync({ id: selectedCiclo.id, payload })
        setToast({ open: true, message: 'Ciclo atualizado com sucesso', severity: 'success' })
      }
      setModalOpen(false)
    } catch (err) {
      console.error(err)
      setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao salvar ciclo', severity: 'error' })
    }
  }

  const handleDeleteCiclo = async (id: CicloPagamentoRow['id']) => {
    try {
      await deleteMutation.mutateAsync(id as string)
      setToast({ open: true, message: 'Ciclo de pagamento removido', severity: 'success' })
    } catch (err) {
      console.error(err)
      setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao remover', severity: 'error' })
    }
  }

  const handleBulkDelete = async (ids: CicloPagamentoRow['id'][]) => {
    try {
      await Promise.all(ids.map((id) => deleteMutation.mutateAsync(id as string)))
      setToast({ open: true, message: 'Ciclos de pagamento removidos', severity: 'success' })
    } catch (err) {
      console.error(err)
      setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao remover', severity: 'error' })
    }
  }

  const openAddModal = () => {
    setModalMode('add')
    setSelectedCiclo(null)
    const initial = { descricao: '', diaInicioCiclo: 1, diaFimCiclo: 1, diaPagamentoCiclo: 1 }
    setFormValues(initial)
    setInitialFormValues(initial)
    setModalOpen(true)
  }

  const openEditModal = (ciclo: CicloPagamentoRow) => {
    const mode = canEdit(accessMode) ? 'edit' : 'view'
    setModalMode(mode)
    setSelectedCiclo(ciclo)
    const initial = {
      descricao: ciclo.descricao,
      diaInicioCiclo: ciclo.diaInicioCiclo,
      diaFimCiclo: ciclo.diaFimCiclo,
      diaPagamentoCiclo: ciclo.diaPagamentoCiclo
    }
    setFormValues(initial)
    setInitialFormValues(initial)
    setModalOpen(true)
  }

  const isDirty = useMemo(() => {
    return JSON.stringify(formValues) !== JSON.stringify(initialFormValues)
  }, [formValues, initialFormValues])

  const tableColumns = useMemo<TableCardColumn<CicloPagamentoRow>[]>(() => [
    { key: 'descricao', label: 'Descrição' },
    { key: 'diaInicioCiclo', label: 'Dia Início', dataType: 'number' },
    { key: 'diaFimCiclo', label: 'Dia Fim', dataType: 'number' },
    { key: 'diaPagamentoCiclo', label: 'Dia Pagamento', dataType: 'number' },
    { key: 'createdAt', label: 'Cadastro', dataType: 'date' },
  ], [])

  const savingForm = createMutation.isPending || updateMutation.isPending

  if (!loading && !hasPermission('contratos:ciclos-pagamento:listar')) {
    return (
      <Box className="ciclos-pagamento-page">
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>
          Você não tem permissão para listar ciclos de pagamento
        </Typography>
      </Box>
    )
  }

  return (
    <Box className="ciclos-pagamento-page">
      <TableCard
        loading={loading}
        title="Ciclos de Pagamento"
        columns={tableColumns}
        rows={ciclos as CicloPagamentoRow[]}
        onAddClick={hasPermission('contratos:ciclos-pagamento:criar') ? openAddModal : undefined}
        onRowClick={openEditModal}
        onDelete={handleDeleteCiclo}
        onBulkDelete={hasPermission('contratos:ciclos-pagamento:excluir') ? handleBulkDelete : undefined}
        disableDelete={!hasPermission('contratos:ciclos-pagamento:excluir')}
        disableEdit={!hasPermission('contratos:ciclos-pagamento:editar')}
        disableView={!hasPermission('contratos:ciclos-pagamento:visualizar')}
        accessMode={accessMode}
      />

      <TableCardModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        title="Ciclo"
        mode={modalMode}
        saving={savingForm}
        isDirty={isDirty}
        maxWidth="sm"
      >
        <TextPicker
          label="Descrição"
          value={formValues.descricao || ''}
          onChange={(text) => setFormValues(prev => ({ ...prev, descricao: text }))}
          fullWidth
          placeholder="Descrição do ciclo"
          required
          disabled={modalMode === 'view'}
        />
        <NumberPicker
          label="Dia Início do Ciclo"
          value={formValues.diaInicioCiclo ?? 1}
          onChange={(num) => setFormValues(prev => ({ ...prev, diaInicioCiclo: num ?? 1 }))}
          format="integer"
          fullWidth
          placeholder="Dia início (1-28)"
          required
          disabled={modalMode === 'view'}
          min={1}
          max={28}
        />
        <NumberPicker
          label="Dia Fim do Ciclo"
          value={formValues.diaFimCiclo ?? 1}
          onChange={(num) => setFormValues(prev => ({ ...prev, diaFimCiclo: num ?? 1 }))}
          format="integer"
          fullWidth
          placeholder="Dia fim (1-28)"
          required
          disabled={modalMode === 'view'}
          min={1}
          max={28}
        />
        <NumberPicker
          label="Dia Pagamento do Ciclo"
          value={formValues.diaPagamentoCiclo ?? 1}
          onChange={(num) => setFormValues(prev => ({ ...prev, diaPagamentoCiclo: num ?? 1 }))}
          format="integer"
          fullWidth
          placeholder="Dia pagamento (1-28)"
          required
          disabled={modalMode === 'view'}
          min={1}
          max={28}
        />
      </TableCardModal>

      <Toast
        open={toast.open || Boolean(queryError)}
        onClose={() => {
          setToast((prev) => ({ ...prev, open: false }))
        }}
        message={toast.open ? toast.message : (queryError instanceof Error ? queryError.message : 'Erro ao carregar dados')}
        severity={toast.open ? toast.severity : 'error'}
      />
    </Box>
  )
}

export default CiclosPagamentoPage
