import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
    Box,
    Typography,
    Chip,
} from '@mui/material'
import { VisibilityOutlined, History } from '@mui/icons-material'
import TableCard, {
    type TableCardColumn,
    type TableCardRow,
    type TableCardRowAction,
    type TableCardBulkAction,
} from '../../components/TableCard'

import { useSearch } from '../../context/SearchContext'

import { useAuth } from '../../context/AuthContext'
import { contractsService, type ContractDTO } from '../../services/contracts'
import { ContractDashboardModal } from './components/ContractDashboardModal'
import { useCiclos } from '../../hooks/queries/ciclos'
import { useModalidades } from '../../hooks/queries/modalidades'
import { usePeople } from '../../hooks/queries/people'
import { useUsers } from '../../hooks/queries/users'
import { useContractStatus, useContractList } from '../../hooks/queries/contracts'
import ContractFormDialog from './components/ContractFormDialog'
import StatusHistoryDialog from './components/StatusHistoryDialog'
import { canVisualizeItem, getAccessMode, canCreate } from '../../utils/accessControl'
import { createContractSnapshotPayload, getContractStatusConfig } from '../../utils/contractUtils'
import Toast from '../../components/Toast'
import './style.css'
// Simple debounced value hook
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

type ContractRow = TableCardRow & ContractDTO

const DEFAULT_USER = 'admin'

const ContractsPage = () => {
    const [searchParams, setSearchParams] = useSearchParams()

    // Pagination from URL
    const page = parseInt(searchParams.get('p') || '1', 10)
    const limit = parseInt(searchParams.get('size') || '10', 10)

    const [dashboardOpen, setDashboardOpen] = useState(false)
    const [dashboardContractId, setDashboardContractId] = useState<string | null>(null)
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [creating, setCreating] = useState(false)
    const [toast, setToast] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '', severity: 'success' })
    const [error, setError] = useState<string | null>(null)
    const [statusDialogOpen, setStatusDialogOpen] = useState(false)
    const [selectedContractIds, setSelectedContractIds] = useState<string[]>([])
    const [changingStatus, setChangingStatus] = useState(false)

    // React Query Hooks
    const { data: ciclosList = [] } = useCiclos()
    const { data: modalidadesList = [] } = useModalidades()
    const { data: peopleList = [] } = usePeople()
    const { data: userList = [] } = useUsers()
    const { data: statusList = [] } = useContractStatus()

    // Derived Options
    const cicloOptions = useMemo(() => ciclosList.map((c: any) => ({ label: c.descricao, value: c.id })), [ciclosList])

    const modalidadeOptions = useMemo(() => modalidadesList.map((m: any) => ({
        label: `${m.rentabilidadePercentual}% - ${m.prazoMeses} (meses)`,
        value: m.id,
        cicloPagamentoId: m.cicloPagamentoId
    })), [modalidadesList])

    const clienteOptions = useMemo(() => peopleList.map((p: any) => ({
        label: `${p.name} - ${p.cpfCnpj}`,
        value: p.id,
        name: p.name,
        cpfCnpj: p.cpfCnpj,
        addresses: p.addresses,
        details: p.details
    })), [peopleList])

    const promotorOptions = useMemo(() => userList.map((u: any) => ({ label: u.fullName, value: u.id })), [userList])

    const { statusMapping, statusFilterOptions } = useMemo(() => {
        const mapping: Record<string, string> = {}
        const options: Array<{ label: string; value: string }> = []

        statusList.forEach((s: any) => {
            if (s.enabled) {
                mapping[s.code] = s.status
                options.push({ label: s.status, value: s.code })
            }
        })
        return { statusMapping: mapping, statusFilterOptions: options }
    }, [statusList])

    // Lookup Maps for Performance
    const clienteMap = useMemo(() => new Map(clienteOptions.map((c: any) => [c.value, c.label])), [clienteOptions])
    const cicloMap = useMemo(() => new Map(cicloOptions.map((c: any) => [c.value, c.label])), [cicloOptions])
    const modalidadeMap = useMemo(() => new Map(modalidadeOptions.map((m: any) => [m.value, m.label])), [modalidadeOptions])

    const { setFilters, setPlaceholder, setQuery } = useSearch()
    const { query, activeFilters, activeSorts } = useSearch()
    const debouncedQuery = useDebounce(query, 500)

    const { permissions, user: currentUser } = useAuth()

    const contractsAccessMode = useMemo(() => getAccessMode(permissions, 'contratos:contratos'), [permissions])
    const statusAccessMode = useMemo(() => getAccessMode(permissions, 'contratos:contratos:historico'), [permissions])

    const hasPermission = useCallback(
        (permission: string) => {
            return permissions.includes(permission)
        },
        [permissions],
    )

    useEffect(() => {
        setPlaceholder('Pesquisar contratos...')
        const filters = [
            { id: 'seqId', label: 'Seq_id', field: 'seqId', type: 'number' as const, page: 'contratos' },
            { id: 'status', label: 'Status', field: 'status', type: 'select' as const, page: 'contratos', options: statusFilterOptions },
            { id: 'clienteId', label: 'Cliente', field: 'clienteId', type: 'text' as const, page: 'contratos' },
            { id: 'promotorId', label: 'Promotor', field: 'promotorId', type: 'text' as const, page: 'contratos' },
            { id: 'cicloId', label: 'Ciclo', field: 'cicloId', type: 'text' as const, page: 'contratos' },
            { id: 'modalidadeId', label: 'Modalidade', field: 'modalidadeId', type: 'text' as const, page: 'contratos' },
            { id: 'valorContrato', label: 'Valor', field: 'valorContrato', type: 'number' as const, page: 'contratos' },
        ]
        setFilters(filters, 'seqId')
        return () => {
            setFilters([])
            setPlaceholder('')
            setQuery('')
        }
    }, [setFilters, setPlaceholder, setQuery, clienteOptions, promotorOptions, cicloOptions, modalidadeOptions, statusFilterOptions])

    const fetchParams = useMemo(() => ({
        page,
        limit,
        query: debouncedQuery,
        filters: activeFilters,
        sorts: activeSorts
    }), [page, limit, debouncedQuery, activeFilters, activeSorts])

    const { data: contractsData, isLoading: loadingContracts, refetch } = useContractList(fetchParams)

    const contracts = useMemo(() => (contractsData?.data || []) as ContractRow[], [contractsData])
    const totalRows = contractsData?.total || 0

    const handleFetchDataMock = useCallback(() => {
        // No-op: Data fetching is handled by React Query + URL state
    }, [])

    const loadContracts = async () => {
        await refetch()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps

    // Sync Dashboard state with URL Query Params
    useEffect(() => {
        const contractIdParam = searchParams.get('contractId')
        const canView = canVisualizeItem(contractsAccessMode)

        if (contractIdParam && canView) {
            if (dashboardContractId !== contractIdParam || !dashboardOpen) {
                setDashboardContractId(contractIdParam)
                setDashboardOpen(true)
            }
        } else {
            if (dashboardOpen) {
                setDashboardOpen(false)
                setDashboardContractId(null)
            }
        }
    }, [searchParams, contractsAccessMode, dashboardContractId, dashboardOpen])

    const handleAddContract = async (data: { clienteId: string; cicloId: string; modalidadeId: string; valorContrato: number }) => {
        try {
            setCreating(true)
            const snapshotData = await createContractSnapshotPayload({
                clienteId: data.clienteId,
                clienteEnderecoId: undefined,
                signerPersonIds: []
            })

            const payload = {
                clienteId: data.clienteId,
                clienteEnderecoId: undefined,
                cicloId: data.cicloId,
                modalidadeId: data.modalidadeId,
                valorContrato: data.valorContrato,
                status: 'draft',
                snapshotData,
                changeOrigin: 'ERP - Adição Manual',
                createdBy: currentUser?.login ?? DEFAULT_USER,
            }
            const created = await contractsService.create(payload)
            await loadContracts()
            setToast({ open: true, message: 'Contrato criado com sucesso', severity: 'success' })
            setCreateModalOpen(false)
            // Abrir dashboard do contrato
            setSearchParams((prev) => {
                const newParams = new URLSearchParams(prev)
                newParams.set('contractId', created.id)
                return newParams
            })
        } catch (err) {
            console.error(err)
            setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao criar contrato', severity: 'error' })
        } finally {
            setCreating(false)
        }
    }

    const handleDeleteContract = async (id: ContractRow['id']) => {
        try {
            await contractsService.remove(id as string)
            await loadContracts()
            setToast({ open: true, message: 'Contrato removido', severity: 'success' })
        } catch (err) {
            console.error(err)
            setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao remover', severity: 'error' })
        }
    }

    const handleBulkDelete = async (ids: ContractRow['id'][]) => {
        try {
            await Promise.all(ids.map((id) => contractsService.remove(id as string)))
            await loadContracts()
            setToast({ open: true, message: 'Contratos removidos', severity: 'success' })
        } catch (err) {
            console.error(err)
            setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao remover', severity: 'error' })
        }
    }

    const handleOpenDashboard = (contract: ContractRow) => {
        setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev)
            newParams.set('contractId', contract.id as string)
            return newParams
        })
    }

    const handleCloseDashboard = () => {
        setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev)
            newParams.delete('contractId')
            return newParams
        })
    }

    const handleSaveStatus = async (data: { newStatus: string; changeReason: string }) => {
        try {
            setChangingStatus(true)
            await Promise.all(selectedContractIds.map(id =>
                contractsService.status.change(id, {
                    newStatus: data.newStatus,
                    changeReason: data.changeReason,
                    changeOrigin: 'Tela de Contratos - Manual',
                    updatedBy: currentUser?.login ?? DEFAULT_USER
                })
            ))
            await loadContracts()
            setToast({ open: true, message: 'Status alterado com sucesso', severity: 'success' })
            setStatusDialogOpen(false)
        } catch (err) {
            console.error(err)
            setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao alterar status', severity: 'error' })
        } finally {
            setChangingStatus(false)
        }
    }

    const rowActions: TableCardRowAction<ContractRow>[] = useMemo(() => [
        {
            label: 'Ver',
            icon: <VisibilityOutlined fontSize="small" />,
            onClick: handleOpenDashboard,
        },
        {
            label: 'Alterar Status',
            icon: <History fontSize="small" />,
            onClick: (contract) => {
                setSelectedContractIds([contract.id as string])
                setStatusDialogOpen(true)
            },
            hidden: !canCreate(statusAccessMode)
        },
    ], [statusAccessMode])

    const bulkActions: TableCardBulkAction<ContractRow>[] = useMemo(() => [
        {
            label: 'Ver',
            icon: <VisibilityOutlined />,
            onClick: (ids) => {
                const contract = contracts.find((c) => c.id === ids[0])
                if (contract) handleOpenDashboard(contract)
            },
            disabled: (ids) => ids.length !== 1,
        },
        {
            label: 'Alterar Status',
            icon: <History />,
            onClick: (ids) => {
                setSelectedContractIds(ids as string[])
                setStatusDialogOpen(true)
            },
            hidden: !canCreate(statusAccessMode)
        },
    ], [contracts, statusAccessMode])

    const tableColumns = useMemo<TableCardColumn<ContractRow>[]>(() => [
        {
            key: 'seqId',
            label: 'Seq_id',
            dataType: 'number',
            render: (value) => value ?? '-',
        },
        {
            key: 'clienteId',
            label: 'Cliente',
            render: (_value, row) => clienteMap.get(row.clienteId) || '-'
        },
        {
            key: 'cicloId',
            label: 'Ciclo',
            render: (_value, row) => (cicloMap.get(row.cicloId) || '-') as React.ReactNode
        },
        {
            key: 'modalidadeId',
            label: 'Modalidade',
            render: (_value, row) => (modalidadeMap.get(row.modalidadeId) || '-') as React.ReactNode
        },
        {
            key: 'status',
            label: 'Status',
            dataType: 'status',
            render: (value) => {
                const config = getContractStatusConfig(value, statusMapping)
                return (
                    <Chip
                        label={config.label}
                        size="small"
                        color={config.color}
                    />
                )
            },
        },
        {
            key: 'valorContrato',
            label: 'Valor',
            render: (value) => {
                return value !== undefined && value !== null
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
                    : '-'
            },
        },
    ], [clienteMap, cicloMap, modalidadeMap, statusMapping])

    if (!hasPermission('contratos:contratos:listar')) {
        return (
            <Box className="contracts-page">
                <Typography variant="h6" align="center" className="contracts-page__no-access-message">
                    Você não tem permissão para listar contratos
                </Typography>
            </Box>
        )
    }

    return (
        <Box className="contracts-page">
            <TableCard
                title="Contratos"
                columns={tableColumns}
                rows={contracts}
                totalRows={totalRows}
                onFetchData={handleFetchDataMock}
                loading={loadingContracts}

                onDelete={handleDeleteContract}
                onBulkDelete={hasPermission('contratos:contratos:excluir') ? handleBulkDelete : undefined}
                rowActions={rowActions}
                bulkActions={bulkActions}
                onAddClick={hasPermission('contratos:contratos:criar') ? () => setCreateModalOpen(true) : undefined}
                disableDelete={!hasPermission('contratos:contratos:excluir')}
                disableEdit={true}
                disableView={!hasPermission('contratos:contratos:visualizar')}
                onRowClick={handleOpenDashboard}
                accessMode={contractsAccessMode}
            />

            {/* Add Contract Modal */}
            <ContractFormDialog
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSave={handleAddContract}
                title="Contrato"
                saving={creating}
                clienteOptions={clienteOptions}
                cicloOptions={cicloOptions}
                modalidadeOptions={modalidadeOptions}
            />

            <ContractDashboardModal
                contractId={dashboardContractId}
                open={dashboardOpen}
                onClose={handleCloseDashboard}
                onUpdate={refetch}
            />

            <StatusHistoryDialog
                open={statusDialogOpen}
                onClose={() => setStatusDialogOpen(false)}
                onSave={handleSaveStatus}
                statusOptions={statusFilterOptions}
                saving={changingStatus}
                permissions={permissions}
                onToast={(msg, sev) => setToast({ open: true, message: msg, severity: sev })}
            />

            <Toast
                open={toast.open || Boolean(error)}
                onClose={() => {
                    setToast({ ...toast, open: false })
                    setError(null)
                }}
                message={toast.open ? toast.message : error || ''}
                severity={error ? "error" : toast.severity || "success"}
            />
        </Box>
    )
}
export default ContractsPage
