import { useEffect, useMemo, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
} from '@mui/material'
import Toast from '../../components/Toast'

import { VisibilityOutlined } from '@mui/icons-material'
import TableCard, {
  type TableCardColumn,
  type TableCardRow,
  type TableCardRowAction,
  type TableCardBulkAction,
} from '../../components/TableCard'
import { useSearch } from '../../context/SearchContext'
import { useAuth } from '../../context/AuthContext'
import { getAccessMode, canVisualizeItem } from '../../utils/accessControl'
import { peopleService, type CreateDetailPayload } from '../../services/people'

import PeopleDashboard from './components/PeopleDashboard'
import PeopleFormDialog from './components/PeopleFormDialog'
import './style.css'
import { usePeopleList, useCreatePerson, useDeletePerson } from '../../hooks/queries/people'
import { useDebounce } from '../../hooks/useDebounce'
import { useQueryClient } from '@tanstack/react-query'

type PeopleRow = TableCardRow & {
  id: string
  name: string
  cpfCnpj: string
  birthDate?: string | null
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

const DEFAULT_USER = 'admin'

const PeoplePage = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const { query, activeFilters, activeSorts, setFilters, setPlaceholder, setQuery } = useSearch()

  const debouncedQuery = useDebounce(query, 500)

  // Parse params from URL + Context
  const page = parseInt(searchParams.get('p') || '1', 10)
  const limit = parseInt(searchParams.get('size') || '10', 10)

  const peopleIdParam = searchParams.get('peopleId')
  const { permissions, user: currentUser } = useAuth()
  const peopleAccessMode = useMemo(() => getAccessMode(permissions, 'erp:pessoas'), [permissions])

  const dashboardOpen = !!peopleIdParam && canVisualizeItem(peopleAccessMode)
  const dashboardPeopleId = peopleIdParam

  const fetchParams = useMemo(() => ({
    page,
    limit,
    query: debouncedQuery,
    filters: activeFilters,
    sorts: activeSorts,
  }), [page, limit, debouncedQuery, activeFilters, activeSorts])

  const { data: peopleData, isLoading, isPlaceholderData } = usePeopleList(fetchParams)

  const createPersonMutation = useCreatePerson()
  const deletePersonMutation = useDeletePerson()

  const queryClient = useQueryClient()

  const [toast, setToast] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '' })


  useEffect(() => {
    setPlaceholder('')
    const filters = [
      { id: 'name', label: 'Nome', field: 'name', type: 'text' as const, page: 'people' },
      { id: 'cpfCnpj', label: 'CPF/CNPJ', field: 'cpfCnpj', type: 'text' as const, page: 'people' },
      { id: 'createdAt', label: 'Data de Cadastro', field: 'createdAt', type: 'date' as const, page: 'people' },
      { id: 'createdBy', label: 'Criado Por', field: 'createdBy', type: 'text' as const, page: 'people' },
    ]
    setFilters(filters, 'name')
    return () => {
      setFilters([])
      setPlaceholder('')
      setQuery('')
    }
  }, [setFilters, setPlaceholder, setQuery])

  const handleCreatePerson = async (data: { name: string; cpfCnpj: string; tenantId?: string; usuarioId?: string | null }) => {
    try {
      const payload = {
        name: data.name,
        cpfCnpj: data.cpfCnpj,
        birthDate: null,
        tenantId: data.tenantId,
        usuarioId: data.usuarioId,
        createdBy: currentUser?.login ?? DEFAULT_USER,
      }

      const newPerson = await createPersonMutation.mutateAsync(payload)

      // Infer details based on doc type
      const cleanDoc = data.cpfCnpj.replace(/[^a-zA-Z0-9]/g, '')
      const isPF = cleanDoc.length === 11
      const isPJ = cleanDoc.length === 14

      if (isPF || isPJ) {
        const detailPayload: CreateDetailPayload = {}
        if (isPF) {
          const parts = data.name.trim().split(' ')
          detailPayload.firstName = parts[0]
          detailPayload.surname = parts.slice(1).join(' ') || null
        } else {
          detailPayload.legalName = data.name
        }

        if (Object.keys(detailPayload).length > 0) {
          await peopleService.createDetail(newPerson.id, detailPayload)
          queryClient.invalidateQueries({ queryKey: ['people'] })
        }
      }

      setToast({ open: true, message: 'Pessoa criada com sucesso', severity: 'success' })
      setCreateModalOpen(false)
    } catch (err) {
      console.error(err)
      setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao criar pessoa', severity: 'error' })
    }
  }

  const handleDeletePeople = async (id: TableCardRow['id']) => {
    try {
      await deletePersonMutation.mutateAsync(id as string)
      setToast({ open: true, message: 'Pessoa removida com sucesso', severity: 'success' })
    } catch (err) {
      console.error(err)
      setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao remover pessoa', severity: 'error' })
    }
  }

  const handleBulkDelete = async (ids: TableCardRow['id'][]) => {
    try {
      await Promise.all(ids.map((id) => deletePersonMutation.mutateAsync(id as string)))
      setToast({ open: true, message: 'Pessoas removidas com sucesso', severity: 'success' })
    } catch (err) {
      console.error(err)
      setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao remover pessoas', severity: 'error' })
    }
  }

  const handleOpenDashboard = useCallback((people: TableCardRow) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev)
      newParams.set('peopleId', people.id as string)
      return newParams
    })
  }, [setSearchParams])

  const handleCloseDashboard = useCallback(() => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev)
      newParams.delete('peopleId')
      return newParams
    })
  }, [setSearchParams])

  const rowActions: TableCardRowAction<PeopleRow>[] = useMemo(() => [
    {
      label: 'Ver',
      icon: <VisibilityOutlined fontSize="small" />,
      onClick: handleOpenDashboard,
    },
  ], [handleOpenDashboard])

  const bulkActions: TableCardBulkAction<PeopleRow>[] = useMemo(() => [
    {
      label: 'Ver',
      icon: <VisibilityOutlined />,
      onClick: (ids) => {
        const person = peopleData?.data.find((c) => c.id === ids[0])
        if (person) handleOpenDashboard(person as unknown as PeopleRow)
      },
      disabled: (ids) => ids.length !== 1,
    },
  ], [peopleData, handleOpenDashboard])

  const tableColumns = useMemo<TableCardColumn<PeopleRow>[]>(() => [
    { key: 'name', label: 'Nome' },
    { key: 'cpfCnpj', label: 'CPF/CNPJ' },
    { key: 'tenantName', label: 'Tenant' },
    { key: 'createdAt', label: 'Cadastro', dataType: 'date' },
  ], [])


  return (
    <Box className="people-page">
      <TableCard
        title="Pessoas"
        columns={tableColumns}
        rows={(peopleData?.data || []) as PeopleRow[]}
        totalRows={peopleData?.total || 0}
        onFetchData={() => { }} // Signals server-side pagination
        loading={isLoading || isPlaceholderData}
        onAddClick={() => setCreateModalOpen(true)}
        onDelete={handleDeletePeople}
        onBulkDelete={handleBulkDelete}
        rowActions={rowActions}
        bulkActions={bulkActions}
        onRowClick={handleOpenDashboard}
        accessMode={peopleAccessMode}
      />

      {/* Add People Modal */}
      <PeopleFormDialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleCreatePerson}
        title="Pessoa"
        saving={createPersonMutation.isPending}
      />

      <PeopleDashboard
        peopleId={dashboardPeopleId}
        open={dashboardOpen}
        onClose={handleCloseDashboard}
        onUpdate={() => queryClient.invalidateQueries({ queryKey: ['people'] })}
      />

      <Toast
        open={toast.open}
        message={toast.message}
        onClose={() => setToast({ open: false, message: '' })}
        severity={toast.severity}
      />
    </Box>
  )
}

export default PeoplePage
