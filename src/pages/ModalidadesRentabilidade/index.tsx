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
import NumberPicker from '../../components/NumberPicker'
import SelectPicker from '../../components/SelectPicker'
import { getAccessMode, canEdit } from '../../utils/accessControl'
import { useModalidades, useCreateModalidade, useUpdateModalidade, useDeleteModalidade } from '../../hooks/queries/modalidades'
import { useCiclos } from '../../hooks/queries/ciclos'
import { useDebounce } from '../../hooks/useDebounce'
import './style.css'

type ModalidadeRentabilidadeRow = TableCardRow & {
  id: string
  seqId?: number | null
  rentabilidadePercentual: number
  prazoMeses: number
  cicloPagamentoId: string
  cicloDescricao?: string
  frequenciaPagamento: number
  createdAt: string
  createdBy: string
  updatedAt?: string | null
  updatedBy?: string | null
}

const DEFAULT_USER = 'admin'

const ModalidadesRentabilidadePage = () => {
  const [toast, setToast] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '' })

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add')
  const [selectedModalidade, setSelectedModalidade] = useState<ModalidadeRentabilidadeRow | null>(null)
  const [formValues, setFormValues] = useState<Partial<ModalidadeRentabilidadeRow>>({})
  const [initialFormValues, setInitialFormValues] = useState<Partial<ModalidadeRentabilidadeRow>>({})

  const { query, setFilters, setPlaceholder, setQuery } = useSearch()
  const { permissions, user: currentUser } = useAuth()

  const debouncedQuery = useDebounce(query, 500)

  // Queries
  const { data: modalidades = [], isLoading: loadingModalidades, error: modalidadeError } = useModalidades(debouncedQuery)
  const { data: ciclos = [] } = useCiclos()

  // Mutations
  const createMutation = useCreateModalidade()
  const updateMutation = useUpdateModalidade()
  const deleteMutation = useDeleteModalidade()

  const accessMode = useMemo(() => getAccessMode(permissions, 'contratos:modalidades-rentabilidade'), [permissions])

  const hasPermission = useCallback(
    (permission: string) => {
      return permissions.includes(permission)
    },
    [permissions],
  )

  useEffect(() => {
    setPlaceholder('Pesquise por rentabilidade, prazo ou ciclo...')
    const filters = [
      { id: 'rentabilidadePercentual', label: 'Rentabilidade %', field: 'rentabilidadePercentual', type: 'number' as const, page: 'modalidades-rentabilidade' },
      { id: 'prazoMeses', label: 'Prazo (meses)', field: 'prazoMeses', type: 'number' as const, page: 'modalidades-rentabilidade' },
      { id: 'frequenciaPagamento', label: 'Frequência', field: 'frequenciaPagamento', type: 'number' as const, page: 'modalidades-rentabilidade' },
      {
        id: 'cicloPagamentoId',
        label: 'Ciclo de Pagamento',
        field: 'cicloPagamentoId',
        type: 'select' as const,
        options: ciclos.map((c: any) => ({ label: c.descricao, value: c.id })),
        page: 'modalidades-rentabilidade'
      },
    ]
    setFilters(filters, 'rentabilidadePercentual')
    return () => {
      setFilters([])
      setPlaceholder('')
      setQuery('')
    }
  }, [setFilters, setPlaceholder, setQuery, ciclos])

  const handleSave = async () => {
    try {
      if (modalMode === 'add') {
        const payload = {
          rentabilidadePercentual: (formValues.rentabilidadePercentual as number) ?? 0,
          prazoMeses: (formValues.prazoMeses as number) ?? 1,
          cicloPagamentoId: (formValues.cicloPagamentoId as string) ?? '',
          frequenciaPagamento: (formValues.frequenciaPagamento as number) ?? 1,
          createdBy: currentUser?.login ?? DEFAULT_USER,
        }
        await createMutation.mutateAsync(payload)
        setToast({ open: true, message: 'Modalidade criada com sucesso', severity: 'success' })
      } else if (modalMode === 'edit' && selectedModalidade) {
        const payload = {
          rentabilidadePercentual: formValues.rentabilidadePercentual as number | undefined,
          prazoMeses: formValues.prazoMeses as number | undefined,
          cicloPagamentoId: formValues.cicloPagamentoId as string | undefined,
          frequenciaPagamento: formValues.frequenciaPagamento as number | undefined,
          updatedBy: currentUser?.login ?? DEFAULT_USER,
        }
        await updateMutation.mutateAsync({ id: selectedModalidade.id, payload })
        setToast({ open: true, message: 'Modalidade atualizada com sucesso', severity: 'success' })
      }
      setModalOpen(false)
    } catch (err) {
      console.error(err)
      setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao salvar modalidade', severity: 'error' })
    }
  }

  const handleDeleteModalidade = async (id: ModalidadeRentabilidadeRow['id']) => {
    try {
      await deleteMutation.mutateAsync(id as string)
      setToast({ open: true, message: 'Modalidade removida com sucesso', severity: 'success' })
    } catch (err) {
      console.error(err)
      setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao remover modalidade', severity: 'error' })
    }
  }

  const handleBulkDelete = async (ids: ModalidadeRentabilidadeRow['id'][]) => {
    try {
      await Promise.all(ids.map((id) => deleteMutation.mutateAsync(id as string)))
      setToast({ open: true, message: 'Modalidades removidas com sucesso', severity: 'success' })
    } catch (err) {
      console.error(err)
      setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao remover modalidades', severity: 'error' })
    }
  }

  const openAddModal = () => {
    setModalMode('add')
    setSelectedModalidade(null)
    const initial = { rentabilidadePercentual: 0, prazoMeses: 1, cicloPagamentoId: '', frequenciaPagamento: 1 }
    setFormValues(initial)
    setInitialFormValues(initial)
    setModalOpen(true)
  }

  const openEditModal = (modalidade: ModalidadeRentabilidadeRow) => {
    const mode = canEdit(accessMode) ? 'edit' : 'view'
    setModalMode(mode)
    setSelectedModalidade(modalidade)
    const initial = {
      rentabilidadePercentual: modalidade.rentabilidadePercentual,
      prazoMeses: modalidade.prazoMeses,
      cicloPagamentoId: modalidade.cicloPagamentoId,
      frequenciaPagamento: modalidade.frequenciaPagamento
    }
    setFormValues(initial)
    setInitialFormValues(initial)
    setModalOpen(true)
  }

  const isDirty = useMemo(() => {
    return JSON.stringify(formValues) !== JSON.stringify(initialFormValues)
  }, [formValues, initialFormValues])

  const tableColumns = useMemo<TableCardColumn<ModalidadeRentabilidadeRow>[]>(() => [
    { key: 'rentabilidadePercentual', label: 'Rentabilidade %', dataType: 'number', render: (value) => `${value}%` },
    { key: 'prazoMeses', label: 'Prazo (meses)', dataType: 'number' },
    {
      key: 'cicloPagamentoId',
      label: 'Ciclo de Pagamento',
      render: (_, row) => row.cicloDescricao || row.cicloPagamentoId
    },
    {
      key: 'frequenciaPagamento',
      label: 'Frequência',
      dataType: 'number',
      render: (value) => {
        const num = typeof value === 'number' ? value : 0
        return `${num} ${num === 1 ? 'mês' : 'meses'}`
      }
    },
    { key: 'createdAt', label: 'Cadastro', dataType: 'date' },
  ], [])

  const savingForm = createMutation.isPending || updateMutation.isPending

  if (!loadingModalidades && !hasPermission('contratos:modalidades-rentabilidade:listar')) {
    return (
      <Box className="modalidades-rentabilidade-page">
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>
          Você não tem permissão para listar modalidades de rentabilidade
        </Typography>
      </Box>
    )
  }

  return (
    <Box className="modalidades-rentabilidade-page">
      <TableCard
        loading={loadingModalidades}
        title="Modalidades de Rentabilidade"
        columns={tableColumns}
        rows={modalidades as ModalidadeRentabilidadeRow[]}
        onAddClick={hasPermission('contratos:modalidades-rentabilidade:criar') ? openAddModal : undefined}
        onRowClick={openEditModal}
        onDelete={handleDeleteModalidade}
        onBulkDelete={hasPermission('contratos:modalidades-rentabilidade:excluir') ? handleBulkDelete : undefined}
        disableDelete={!hasPermission('contratos:modalidades-rentabilidade:excluir')}
        disableEdit={!hasPermission('contratos:modalidades-rentabilidade:editar')}
        disableView={!hasPermission('contratos:modalidades-rentabilidade:visualizar')}
        accessMode={accessMode}
      />

      <TableCardModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        title="Modalidade"
        mode={modalMode}
        saving={savingForm}
        isDirty={isDirty}
        maxWidth="sm"
      >
        <NumberPicker
          label="Rentabilidade Percentual"
          value={formValues.rentabilidadePercentual}
          onChange={(num) => setFormValues(prev => ({ ...prev, rentabilidadePercentual: num ?? 0 }))}
          format="percent"
          decimalScale={1}
          fullWidth
          placeholder="Rentabilidade percentual"
          required
          disabled={modalMode === 'view'}
          min={0}
          max={10}
        />
        <NumberPicker
          label="Prazo (meses)"
          value={formValues.prazoMeses}
          onChange={(num) => setFormValues(prev => ({ ...prev, prazoMeses: num ?? 1 }))}
          format="integer"
          fullWidth
          placeholder="Prazo em meses"
          required
          disabled={modalMode === 'view'}
          min={1}
          max={60}
        />
        <NumberPicker
          label="Frequência de pagamento em meses"
          value={formValues.frequenciaPagamento}
          onChange={(num) => setFormValues(prev => ({ ...prev, frequenciaPagamento: num ?? 1 }))}
          format="integer"
          fullWidth
          placeholder="Frequência de pagamento em meses"
          required
          disabled={modalMode === 'view'}
          min={0}
          max={60}
          showClearButton={false}
        />
        <SelectPicker
          label="Ciclo de Pagamento"
          value={formValues.cicloPagamentoId || ''}
          onChange={(val) => setFormValues(prev => ({ ...prev, cicloPagamentoId: val as string }))}
          fullWidth
          placeholder="Selecione o ciclo de pagamento"
          required
          disabled={modalMode === 'view'}
          options={ciclos.map((c: any) => ({ label: c.descricao, value: c.id }))}
        />
      </TableCardModal>

      <Toast
        open={toast.open || Boolean(modalidadeError)}
        onClose={() => {
          setToast({ open: false, message: '' })
        }}
        message={toast.open ? toast.message : (modalidadeError instanceof Error ? modalidadeError.message : 'Erro ao carregar dados')}
        severity={toast.open ? toast.severity : 'error'}
      />
    </Box>
  )
}

export default ModalidadesRentabilidadePage
