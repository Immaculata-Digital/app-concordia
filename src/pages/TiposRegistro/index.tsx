import { useEffect, useMemo, useState } from 'react'
import { Box } from '@mui/material'
import { EditOutlined } from '@mui/icons-material'
import TableCard, {
  type TableCardColumn,
  type TableCardRow,
  type TableCardRowAction,
} from '../../components/TableCard'
import { TableCardModal } from '../../components/Modals'
import { useSearch } from '../../context/SearchContext'
import { useAuth } from '../../context/AuthContext'
import TextPicker from '../../components/TextPicker'
import NumberPicker from '../../components/NumberPicker'
import {
  documentRegistryTypeService,
  type DocumentRegistryTypeDTO,
} from '../../services/documentRegistryTypes'
import { getAccessMode, canEdit, canVisualizeItem, isHidden } from '../../utils/accessControl'
import Toast from '../../components/Toast'
import './style.css'

type TiposRegistroRow = TableCardRow & DocumentRegistryTypeDTO

const DEFAULT_USER = 'admin'

const TiposRegistroPage = () => {
  const [rows, setRows] = useState<TiposRegistroRow[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{
    open: boolean
    message: string
    severity?: 'success' | 'error' | 'warning' | 'info'
  }>({ open: false, message: '' })
  const [error, setError] = useState<string | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add')
  const [selectedRow, setSelectedRow] = useState<TiposRegistroRow | null>(null)
  const [formValues, setFormValues] = useState<Partial<TiposRegistroRow>>({})
  const [initialFormValues, setInitialFormValues] = useState<Partial<TiposRegistroRow>>({})
  const [savingForm, setSavingForm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const { setFilters, setPlaceholder, setQuery } = useSearch()
  const { permissions, user: currentUser } = useAuth()

  const accessMode = useMemo(
    () => getAccessMode(permissions, 'documentos:tipos-registro'),
    [permissions]
  )

  useEffect(() => {
    setPlaceholder('Pesquisar por nome ou prefixo...')
    const filters = [
      { id: 'name', label: 'Nome', field: 'name', type: 'text' as const, page: 'tipos-registro' },
      { id: 'prefix', label: 'Prefixo', field: 'prefix', type: 'text' as const, page: 'tipos-registro' },
      { id: 'sequence', label: 'Sequência', field: 'sequence', type: 'number' as const, page: 'tipos-registro' },
      { id: 'year', label: 'Ano', field: 'year', type: 'number' as const, page: 'tipos-registro' },
    ]
    setFilters(filters, 'name')
    return () => {
      setFilters([])
      setPlaceholder('')
      setQuery('')
    }
  }, [setFilters, setPlaceholder, setQuery])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await documentRegistryTypeService.list()
      setRows(data.map((item) => ({ ...item })))
    } catch (err) {
      console.error(err)
      setError('Não foi possível carregar tipos de registro')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isHidden(accessMode)) {
      loadData()
    } else {
      setLoading(false)
    }
  }, [permissions, accessMode])

  const handleAdd = async (data: Partial<TiposRegistroRow>) => {
    await documentRegistryTypeService.create({
      name: (data.name as string) ?? '',
      prefix: (data.prefix as string) ?? '',
      sequence: data.sequence != null && !isNaN(Number(data.sequence)) ? Number(data.sequence) : 0,
      year: new Date().getFullYear(),
      createdBy: currentUser?.login ?? DEFAULT_USER,
    })
    await loadData()
    setToast({ open: true, message: 'Tipo de registro criado com sucesso', severity: 'success' })
  }

  const handleEdit = async (id: string, data: Partial<TiposRegistroRow>) => {
    await documentRegistryTypeService.update(id, {
      name: data.name as string | undefined,
      prefix: data.prefix as string | undefined,
      sequence: data.sequence != null ? Number(data.sequence) : undefined,
      year: data.year != null ? Number(data.year) : undefined,
      updatedBy: currentUser?.login ?? DEFAULT_USER,
    })
    await loadData()
    setToast({ open: true, message: 'Tipo de registro atualizado com sucesso', severity: 'success' })
  }

  const handleDelete = async (id: TableCardRow['id']) => {
    try {
      await documentRegistryTypeService.remove(id as string)
      await loadData()
      setToast({ open: true, message: 'Tipo de registro removido com sucesso', severity: 'success' })
    } catch (err) {
      console.error(err)
      setToast({
        open: true,
        message: err instanceof Error ? err.message : 'Erro ao remover',
        severity: 'error',
      })
    }
  }

  const handleBulkDelete = async (ids: TableCardRow['id'][]) => {
    try {
      await Promise.all(ids.map((id) => documentRegistryTypeService.remove(id as string)))
      await loadData()
      setToast({ open: true, message: 'Tipos de registro removidos com sucesso', severity: 'success' })
    } catch (err) {
      console.error(err)
      setToast({
        open: true,
        message: err instanceof Error ? err.message : 'Erro ao remover',
        severity: 'error',
      })
    }
  }

  const openAddModal = () => {
    setModalMode('add')
    setSelectedRow(null)
    setFieldErrors({})
    const initial = {
      name: '',
      prefix: '',
      sequence: 0,
      year: new Date().getFullYear(),
    }
    setFormValues(initial)
    setInitialFormValues(initial)
    setModalOpen(true)
  }

  const openEditModal = (row: TiposRegistroRow) => {
    const mode = canEdit(accessMode) ? 'edit' : 'view'
    setModalMode(mode)
    setSelectedRow(row)
    setFieldErrors({})
    const initial = {
      name: row.name,
      prefix: row.prefix,
      sequence: row.sequence ?? 0,
      year: row.year ?? new Date().getFullYear(),
    }
    setFormValues(initial)
    setInitialFormValues(initial)
    setModalOpen(true)
  }

  const handleSave = async () => {
    const name = String(formValues.name ?? '').trim()
    const prefix = String(formValues.prefix ?? '').trim()
    const sequence = formValues.sequence
    const year = formValues.year

    const requiredMessage = 'Nome, Prefixo, Sequência e Ano são obrigatórios.'
    const errors: Record<string, string> = {}
    if (!name) errors.name = 'Obrigatório'
    if (!prefix) errors.prefix = 'Obrigatório'
    if (sequence == null || isNaN(Number(sequence))) errors.sequence = 'Obrigatório'
    if (year == null || isNaN(Number(year))) errors.year = 'Obrigatório'

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setToast({ open: true, message: requiredMessage, severity: 'error' })
      return
    }

    setFieldErrors({})
    setSavingForm(true)
    try {
      if (modalMode === 'add') {
        await handleAdd(formValues)
      } else if (modalMode === 'edit' && selectedRow) {
        await handleEdit(selectedRow.id, formValues)
      }
      setModalOpen(false)
    } catch (err) {
      console.error(err)
      setToast({
        open: true,
        message: err instanceof Error ? err.message : 'Erro ao salvar',
        severity: 'error',
      })
    } finally {
      setSavingForm(false)
    }
  }

  const isDirty = useMemo(() => {
    return JSON.stringify(formValues) !== JSON.stringify(initialFormValues)
  }, [formValues, initialFormValues])

  const rowActions: TableCardRowAction<TiposRegistroRow>[] = useMemo(
    () => [
      {
        label: canEdit(accessMode) ? 'Editar' : 'Visualizar',
        icon: <EditOutlined fontSize="small" />,
        onClick: openEditModal,
        hidden: !canVisualizeItem(accessMode),
      },
    ],
    [accessMode]
  )

  const tableColumns = useMemo<TableCardColumn<TiposRegistroRow>[]>(
    () => [
      { key: 'name', label: 'Nome' },
      {
        key: 'formula',
        label: 'Fórmula',
        render: (_value, row) =>
          `${row.prefix ?? ''} - ${row.sequence ?? ''} - ${row.year ?? ''}`,
      },
    ],
    []
  )

  return (
    <Box className="tipos-registro-page">
      <TableCard
        title="Tipos de Registro"
        columns={tableColumns}
        rows={rows}
        loading={loading}
        onAddClick={canEdit(accessMode) ? openAddModal : undefined}
        onRowClick={openEditModal}
        onDelete={canEdit(accessMode) ? handleDelete : undefined}
        onBulkDelete={canEdit(accessMode) ? handleBulkDelete : undefined}
        rowActions={rowActions}
        disableDelete={!canEdit(accessMode)}
        disableEdit={!canEdit(accessMode)}
        disableView={!canVisualizeItem(accessMode)}
        accessMode={accessMode}
      />

      <TableCardModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setFieldErrors({})
        }}
        onSave={handleSave}
        title="Tipo de Registro"
        mode={modalMode}
        saving={savingForm}
        isDirty={isDirty}
        maxWidth="sm"
      >
        <TextPicker
          label="Nome"
          value={formValues.name || ''}
          onChange={(text) => {
            setFormValues((prev) => ({ ...prev, name: text }))
            if (fieldErrors.name) setFieldErrors((prev) => { const next = { ...prev }; delete next.name; return next })
          }}
          fullWidth
          placeholder="Ex: Contrato de Investimento"
          required
          disabled={modalMode === 'view'}
          error={!!fieldErrors.name}
          helperText={fieldErrors.name || ''}
        />
        <TextPicker
          label="Prefixo"
          value={formValues.prefix || ''}
          onChange={(text) => {
            setFormValues((prev) => ({ ...prev, prefix: text }))
            if (fieldErrors.prefix) setFieldErrors((prev) => { const next = { ...prev }; delete next.prefix; return next })
          }}
          fullWidth
          placeholder="Ex: CINV"
          required
          disabled={modalMode === 'view'}
          error={!!fieldErrors.prefix}
          helperText={fieldErrors.prefix || ''}
        />
        <NumberPicker
          label="Sequência"
          value={formValues.sequence}
          onChange={(val) => {
            setFormValues((prev) => ({ ...prev, sequence: val }))
            if (fieldErrors.sequence) setFieldErrors((prev) => { const next = { ...prev }; delete next.sequence; return next })
          }}
          format="integer"
          min={0}
          fullWidth
          required
          disabled={modalMode === 'view'}
          placeholder="Ex: 1"
          error={!!fieldErrors.sequence}
          helperText={fieldErrors.sequence || ''}
        />
        <NumberPicker
          label="Ano"
          value={modalMode === 'add' ? new Date().getFullYear() : formValues.year}
          onChange={(val) => {
            setFormValues((prev) => ({ ...prev, year: val }))
            if (fieldErrors.year) setFieldErrors((prev) => { const next = { ...prev }; delete next.year; return next })
          }}
          format="integer"
          min={2000}
          max={2100}
          fullWidth
          required
          disabled={modalMode === 'view' || modalMode === 'add'}
          placeholder="Ex: 2025"
          error={!!fieldErrors.year}
          helperText={fieldErrors.year || ''}
        />
      </TableCardModal>

      <Toast
        open={toast.open || Boolean(error)}
        onClose={() => {
          setToast((prev) => ({ ...prev, open: false }))
          setError(null)
        }}
        message={toast.open ? toast.message : error ?? ''}
        severity={toast.open ? toast.severity : error ? 'error' : toast.severity}
      />
    </Box>
  )
}

export default TiposRegistroPage
