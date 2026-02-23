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
import { getAccessMode, canEdit } from '../../utils/accessControl'
import { useSearch } from '../../context/SearchContext'
import { useAuth } from '../../context/AuthContext'
import TextPicker from '../../components/TextPicker'
import BlockEditorPicker from '../../components/BlockEditorPicker'
import { type ContractTemplateDTO } from '../../services/contractTemplates'
import { flattenContractVariables } from '../../utils/contractUtils'
import {
    useContractTemplateScreenData,
    useCreateContractTemplate,
    useUpdateContractTemplate,
    useRemoveContractTemplate
} from '../../hooks/queries/contractTemplates'
import './style.css'

type ContractTemplateRow = TableCardRow & ContractTemplateDTO

const DEFAULT_USER = 'admin'

const ContractsTemplatesPage = () => {
    const [toast, setToast] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'success' })
    const [error, setError] = useState<string | null>(null)

    // React Query Hooks
    const { data: screenData, isLoading: loading } = useContractTemplateScreenData()
    const createMutation = useCreateContractTemplate()
    const updateMutation = useUpdateContractTemplate()
    const removeMutation = useRemoveContractTemplate()

    const templates = useMemo(() => (screenData?.templates || []) as ContractTemplateRow[], [screenData])
    const variables = useMemo(() => flattenContractVariables(screenData?.variables || []), [screenData])

    // Modal state
    const [modalOpen, setModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add')
    const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplateRow | null>(null)
    const [formValues, setFormValues] = useState<Partial<ContractTemplateRow>>({})
    const [initialFormValues, setInitialFormValues] = useState<Partial<ContractTemplateRow>>({})
    const [savingForm, setSavingForm] = useState(false)

    const { setFilters, setPlaceholder, setQuery } = useSearch()
    const { permissions } = useAuth()

    const hasPermission = useCallback(
        (permission: string) => {
            return permissions.includes(permission)
        },
        [permissions],
    )

    useEffect(() => {
        setPlaceholder('Pesquisar templates...')
        const filters = [
            { id: 'name', label: 'Nome', field: 'name', type: 'text' as const, page: 'contract_templates' },
            { id: 'description', label: 'Descrição', field: 'description', type: 'text' as const, page: 'contract_templates' },
        ]
        setFilters(filters, 'name')
        return () => {
            setFilters([])
            setPlaceholder('')
            setQuery('')
        }
    }, [setFilters, setPlaceholder, setQuery])

    const handleAddTemplate = async (data: Partial<ContractTemplateRow>) => {
        try {
            const payload = {
                name: (data.name as string) ?? '',
                description: (data.description as string) ?? '',
                content: data.content ?? '',
                createdBy: DEFAULT_USER,
            }
            await createMutation.mutateAsync(payload)
            setToast({ open: true, message: 'Template criado com sucesso', severity: 'success' })
        } catch (err) {
            console.error(err)
            setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao criar template', severity: 'error' })
            throw err
        }
    }

    const handleEditTemplate = async (id: ContractTemplateRow['id'], data: Partial<ContractTemplateRow>) => {
        try {
            const payload = {
                name: data.name as string,
                description: data.description as string,
                content: data.content,
                updatedBy: DEFAULT_USER,
            }
            await updateMutation.mutateAsync({ id: id as string, payload })
            setToast({ open: true, message: 'Template atualizado com sucesso', severity: 'success' })
        } catch (err) {
            console.error(err)
            setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao atualizar template', severity: 'error' })
            throw err
        }
    }

    const handleDeleteTemplate = async (id: ContractTemplateRow['id']) => {
        try {
            await removeMutation.mutateAsync(id as string)
            setToast({ open: true, message: 'Template removido com sucesso', severity: 'success' })
        } catch (err) {
            console.error(err)
            setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao remover template', severity: 'error' })
        }
    }

    const handleBulkDelete = async (ids: ContractTemplateRow['id'][]) => {
        try {
            await Promise.all(ids.map((id) => removeMutation.mutateAsync(id as string)))
            setToast({ open: true, message: 'Templates removidos com sucesso', severity: 'success' })
        } catch (err) {
            console.error(err)
            setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao remover templates', severity: 'error' })
        }
    }

    const openAddModal = () => {
        setModalMode('add')
        setSelectedTemplate(null)
        const initial = { name: '', description: '', content: '' }
        setFormValues(initial)
        setInitialFormValues(initial)
        setModalOpen(true)
    }

    const openEditModal = (template: ContractTemplateRow) => {
        const mode = canEdit(getAccessMode(permissions, 'contratos:templates')) ? 'edit' : 'view'
        setModalMode(mode)
        setSelectedTemplate(template)
        const initial = {
            name: template.name,
            description: template.description,
            content: template.content
        }
        setFormValues(initial)
        setInitialFormValues(initial)
        setModalOpen(true)
    }

    const validateForm = () => {
        const missingFields: string[] = []
        if (!formValues.name?.trim()) missingFields.push('Nome')
        if (!formValues.description?.trim()) missingFields.push('Descrição')

        // Validação de conteúdo: verifica se há algum texto real nos blocos
        let hasContent = false
        if (formValues.content) {
            try {
                const blocks = JSON.parse(formValues.content)
                if (Array.isArray(blocks)) {
                    hasContent = blocks.some((b: any) => {
                        if (typeof b.content === 'string') return b.content.trim().length > 0
                        if (Array.isArray(b.content)) return b.content.some((s: any) => s.text?.trim().length > 0)
                        return false
                    })
                } else {
                    hasContent = String(formValues.content).trim().length > 0
                }
            } catch (e) {
                hasContent = String(formValues.content).trim().length > 0
            }
        }

        if (!hasContent) missingFields.push('Conteúdo')

        if (missingFields.length > 0) {
            setToast({
                open: true,
                message: `Campos obrigatórios pendentes: ${missingFields.join(', ')}`,
                severity: 'error'
            })
            return false
        }
        return true
    }

    const handleSave = async () => {
        if (!validateForm()) return
        setSavingForm(true)
        try {
            if (modalMode === 'add') {
                await handleAddTemplate(formValues)
            } else if (modalMode === 'edit' && selectedTemplate) {
                await handleEditTemplate(selectedTemplate.id, formValues)
            }
            setModalOpen(false)
        } catch (err) {
            // Erro gerenciado pelos handlers
        } finally {
            setSavingForm(false)
        }
    }

    const isDirty = useMemo(() => {
        return JSON.stringify(formValues) !== JSON.stringify(initialFormValues)
    }, [formValues, initialFormValues])

    const tableColumns = useMemo<TableCardColumn<ContractTemplateRow>[]>(() => [
        { key: 'name', label: 'Nome' },
        { key: 'description', label: 'Descrição' },
        {
            key: 'createdAt',
            label: 'Criado em',
            render: (value) => value ? new Date(value).toLocaleDateString() : '-'
        },
    ], [])

    if (!loading && !hasPermission('contratos:templates:listar')) {
        return (
            <Box className="contracts-templates-page">
                <Typography variant="h6" align="center" className="contracts-templates-page__no-access-message">
                    Você não tem permissão para listar estes dados
                </Typography>
            </Box>
        )
    }

    return (
        <Box className="contracts-templates-page">
            <TableCard
                title="Templates de Contrato"
                columns={tableColumns}
                rows={templates}
                loading={loading}
                onAddClick={hasPermission('contratos:templates:criar') ? openAddModal : undefined}
                onRowClick={openEditModal}
                onDelete={handleDeleteTemplate}
                onBulkDelete={hasPermission('contratos:templates:excluir') ? handleBulkDelete : undefined}
                disableDelete={!hasPermission('contratos:templates:excluir')}
                disableEdit={!hasPermission('contratos:templates:editar')}
                disableView={!hasPermission('contratos:templates:visualizar')}
            />

            <TableCardModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSave}
                title="Template"
                mode={modalMode}
                saving={savingForm}
                isDirty={isDirty}
                maxWidth="md"
            >
                <TextPicker
                    label="Nome do Template"
                    value={formValues.name || ''}
                    onChange={(text) => setFormValues((prev: Partial<ContractTemplateRow>) => ({ ...prev, name: text }))}
                    fullWidth
                    placeholder="Informe o nome do template"
                    required
                    disabled={modalMode === 'view'}
                />
                <TextPicker
                    label="Descrição"
                    value={formValues.description || ''}
                    onChange={(text) => setFormValues((prev: Partial<ContractTemplateRow>) => ({ ...prev, description: text }))}
                    fullWidth
                    placeholder="Breve descrição da finalidade"
                    required
                    disabled={modalMode === 'view'}
                />
                <BlockEditorPicker
                    label="Conteúdo do Contrato"
                    value={formValues.content || ''}
                    onChange={(text: string) => setFormValues((prev: Partial<ContractTemplateRow>) => ({ ...prev, content: text }))}
                    placeholder="Insira o conteúdo do template aqui..."
                    required
                    disabled={modalMode === 'view'}
                    mentions={variables}
                />
            </TableCardModal>

            <Toast
                open={toast.open || Boolean(error)}
                onClose={() => {
                    setToast(prev => ({ ...prev, open: false }))
                    setError(null)
                }}
                message={toast.open ? toast.message : error}
                severity={error ? "error" : (toast.severity || "success")}
            />
        </Box>
    )
}

export default ContractsTemplatesPage
