import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLoading } from '../../../context/LoadingContext'
import { contractsService } from '../../../services/contracts'
import { peopleService, type PeopleDTO } from '../../../services/people'
import { type CicloPagamentoDTO } from '../../../services/ciclosPagamento'
import { type ModalidadeRentabilidadeDTO } from '../../../services/modalidadesRentabilidade'
import { type UserDTO } from '../../../services/users'
import { contractTemplateService, type ContractTemplateDTO } from '../../../services/contractTemplates'
import {
    previewContractContent,
    printContractContent,
    flattenContractVariables,
    type ContractVariable,
    formatAddress,
    createContractSnapshotPayload,
    getSnapshotClienteNome
} from '../../../utils/contractUtils'

import { useContractDashboardDetails, contractKeys } from '../../../hooks/queries/contracts'
import { usePeople } from '../../../hooks/queries/people'
import { useUsers } from '../../../hooks/queries/users'
import { useCiclos } from '../../../hooks/queries/ciclos'
import { useModalidades } from '../../../hooks/queries/modalidades'
import { useQueryClient } from '@tanstack/react-query'

export type ContractAttachment = {
    id: string
    name: string
    url?: string
    categoryCode: string
    fileSize?: number
    createdAt?: string
}

export type ContractSigner = {
    id: string
    name: string
    document?: string
    signature?: string
    pessoaId?: string
}

export type UseContractDashboardProps = {
    contractId: string | null
    open: boolean
    onUpdate?: () => void
}

export const useContractDashboard = ({ contractId, open, onUpdate }: UseContractDashboardProps) => {
    const { user } = useAuth()
    const { startLoading, stopLoading } = useLoading()
    const queryClient = useQueryClient()

    // Queries
    const { data: dashboardData, isLoading: loadingDashboard } = useContractDashboardDetails(contractId, {
        enabled: !!contractId && open,
    })

    const { data: peopleList = [] } = usePeople()
    const { data: userList = [] } = useUsers()
    const { data: ciclosList = [] } = useCiclos()
    const { data: modalidadesList = [] } = useModalidades()

    // Derived State
    const contract = dashboardData?.contract || null

    // Derived Related Names
    const clienteName = useMemo(() => {
        if (!contract?.clienteId) return ''
        const p = peopleList.find(p => p.id === contract.clienteId)
        return p ? getSnapshotClienteNome(p) : ''
    }, [contract?.clienteId, peopleList])

    const promotorName = useMemo(() => {
        if (!contract?.promotorId) return ''
        const u = userList.find(u => u.id === contract.promotorId)
        return u ? u.fullName : ''
    }, [contract?.promotorId, userList])

    const cicloName = useMemo(() => {
        if (contract?.ciclo) return contract.ciclo.descricao
        if (!contract?.cicloId) return ''
        const c = ciclosList.find((c: CicloPagamentoDTO) => c.id === contract.cicloId)
        return c ? c.descricao : ''
    }, [contract, ciclosList])

    const modalidadeName = useMemo(() => {
        if (contract?.modalidade) return `${contract.modalidade.rentabilidadePercentual}% - ${contract.modalidade.prazoMeses} (meses)`
        if (!contract?.modalidadeId) return ''
        const m = modalidadesList.find((m: ModalidadeRentabilidadeDTO) => m.id === contract.modalidadeId)
        return m ? `${m.rentabilidadePercentual}% - ${m.prazoMeses} (meses)` : ''
    }, [contract, modalidadesList])

    const clienteEndereco = useMemo(() => {
        if (contract?.snapshotData?.enderecoFormatado) return contract.snapshotData.enderecoFormatado
        if (!contract?.clienteId) return ''
        const p = peopleList.find(p => p.id === contract.clienteId)
        if (!p) return ''

        const enderecoId = contract.clienteEnderecoId
        const targetAddr = enderecoId
            ? (p.addresses || []).find(a => a.id === enderecoId)
            : (p.addresses || [])[0]

        return targetAddr ? formatAddress(targetAddr) : ''
    }, [contract, peopleList])

    // Attachments & Signers (aggregated from dashboard)
    const attachments: ContractAttachment[] = useMemo(() => {
        if (!dashboardData?.attachments) return []
        return dashboardData.attachments.map(a => ({
            id: a.id,
            name: a.fileName,
            url: a.file,
            categoryCode: a.categoryCode,
            fileSize: typeof a.fileSize === 'string' ? parseInt(a.fileSize, 10) : (a.fileSize || 0),
            createdAt: a.createdAt as unknown as string, // API returns string
        }))
    }, [dashboardData])

    const signers: ContractSigner[] = useMemo(() => {
        if (!dashboardData?.signers) return []
        return dashboardData.signers.map(s => {
            const p = s.pessoaId ? peopleList.find(p => p.id === s.pessoaId) : undefined
            return {
                id: s.id,
                name: p ? getSnapshotClienteNome(p) : 'Assinante', // Backfill name if missing in DTO/snapshot?
                // Wait, SignerDTO from backend has NO name. Just pessoaId.
                // We must lookup name from peopleList.
                document: p?.cpfCnpj,
                signature: s.vinculo,
                pessoaId: s.pessoaId,
            }
        })
    }, [dashboardData, peopleList])

    const statusHistory = dashboardData?.statusHistory || []

    // Local State (UI Control & Editing)
    const [contractContent, setContractContent] = useState<string>('')
    const [contentDialogOpen, setContentDialogOpen] = useState(false)
    const [savingContent, setSavingContent] = useState(false)
    const [templateOptions, setTemplateOptions] = useState<Array<{ label: string; value: string }>>([])

    // Dialogs
    const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false)
    const [editingAttachment, setEditingAttachment] = useState<ContractAttachment | null>(null)
    const [attachmentForm, setAttachmentForm] = useState({ attachmentType: '', file: '', fileName: '', categoryCode: '', fileSize: 0 })
    const [savingAttachment, setSavingAttachment] = useState(false)

    const [signerDialogOpen, setSignerDialogOpen] = useState(false)
    const [editingSigner, setEditingSigner] = useState<ContractSigner | null>(null)
    const [signerForm, setSignerForm] = useState({ pessoaId: '' })
    const [savingSigner, setSavingSigner] = useState(false)

    const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
    const [historyForm, setHistoryForm] = useState({ newStatus: '', changeReason: '' })
    const [savingHistory, setSavingHistory] = useState(false)

    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editForm, setEditForm] = useState<{ cicloId: string, modalidadeId: string, valorContrato: number | undefined }>({
        cicloId: '',
        modalidadeId: '',
        valorContrato: undefined,
    })
    const [clienteDialogOpen, setClienteDialogOpen] = useState(false)
    const [clienteForm, setClienteForm] = useState({
        clienteId: '',
        enderecoId: '',
    })
    const [comercialDialogOpen, setComercialDialogOpen] = useState(false)
    const [comercialForm, setComercialForm] = useState({
        promotorId: '',
    })
    const [vigenciaDialogOpen, setVigenciaDialogOpen] = useState(false)
    const [vigenciaForm, setVigenciaForm] = useState({
        vigenciaDataInicio: '',
        vigenciaDataFim: '',
    })
    const [saving, setSaving] = useState(false)

    // Memoized Options
    const clienteOptions = useMemo(() => peopleList.map((p: PeopleDTO) => ({
        label: `${p.name} - ${p.cpfCnpj}`,
        value: p.id,
        name: p.name,
        cpfCnpj: p.cpfCnpj,
        details: p.details
    })), [peopleList])

    const cicloOptions = useMemo(() => ciclosList.map((c: CicloPagamentoDTO) => ({ label: c.descricao, value: c.id })), [ciclosList])

    const modalidadeOptions = useMemo(() => modalidadesList.map((m: ModalidadeRentabilidadeDTO) => ({
        label: `${m.rentabilidadePercentual}% - ${m.prazoMeses} (meses)`,
        value: m.id,
        cicloPagamentoId: m.cicloPagamentoId
    })), [modalidadesList])

    const promotorOptions = useMemo(() => userList.map((u: UserDTO) => ({ label: u.fullName, value: u.id })), [userList])

    const [variables, setVariables] = useState<ContractVariable[]>([])
    const [statusMapping, setStatusMapping] = useState<Record<string, string>>({})
    const [categoryMapping, setCategoryMapping] = useState<Record<string, string>>({})

    const [toast, setToast] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'warning' | 'info' }>({
        open: false,
        message: '',
        severity: 'error'
    })

    // Initialize options that are not yet migrated to React Query hooks completely
    useEffect(() => {
        if (!open) return

        const loadOtherOptions = async () => {
            try {
                const [templates, varsData, statusEnum, categoriesData] = await Promise.all([
                    contractTemplateService.list().catch(() => []),
                    contractTemplateService.getVariables().catch(() => []),
                    contractsService.status.list().catch(() => []),
                    contractsService.attachments.listCategories().catch(() => []),
                ])

                const mapping: Record<string, string> = {}
                statusEnum.forEach(s => {
                    if (s.enabled) {
                        mapping[s.code] = s.status
                    }
                })
                setStatusMapping(mapping)

                const catMapping: Record<string, string> = {}
                categoriesData.forEach(c => {
                    if (c.enabled) {
                        catMapping[c.code] = c.name
                    }
                })
                setCategoryMapping(catMapping)

                setTemplateOptions(templates.map((t: ContractTemplateDTO) => ({ label: t.name, value: t.id })))

                const baseVariables = flattenContractVariables(varsData as any[])
                setVariables([
                    ...baseVariables,
                    { id: 'contrato.vigencia_inicio', name: 'Contrato > Vigência Início', icon: 'Event' },
                    { id: 'contrato.vigencia_fim', name: 'Contrato > Vigência Fim', icon: 'Event' }
                ])
            } catch (err) {
                console.error('Erro ao carregar opções:', err)
            }
        }
        loadOtherOptions()
    }, [open])


    // ... inside component ...

    // Initial content set (for editing purposes)
    useEffect(() => {
        if (contract?.conteudo) {
            const contentStr = typeof contract.conteudo === 'string'
                ? contract.conteudo
                : JSON.stringify(contract.conteudo)
            setContractContent(contentStr)
        }
    }, [contract?.conteudo])

    const handleStartEdit = () => {
        if (!contract) return
        setEditForm({
            cicloId: contract.cicloId || '',
            modalidadeId: contract.modalidadeId || '',
            valorContrato: contract.valorContrato ?? undefined,
        })
        setEditDialogOpen(true)
    }

    const handleStartEditCliente = async () => {
        if (!contract) return
        setClienteForm({
            clienteId: contract.clienteId || '',
            enderecoId: contract.clienteEnderecoId || contract.snapshotData?.enderecoId || '',
        })
        setClienteDialogOpen(true)
    }

    const handleStartEditComercial = () => {
        if (!contract) return
        setComercialForm({
            promotorId: contract.promotorId || '',
        })
        setComercialDialogOpen(true)
    }

    const handleStartEditVigencia = () => {
        if (!contract) return
        setVigenciaForm({
            vigenciaDataInicio: contract.vigenciaDataInicio || '',
            vigenciaDataFim: contract.vigenciaDataFim || '',
        })
        setVigenciaDialogOpen(true)
    }

    const handleSaveEdit = async (data: { cicloId: string, modalidadeId: string, valorContrato: number | undefined }) => {
        if (!contract) return

        const requiredFields = []
        if (!data.cicloId) requiredFields.push('Ciclo')
        if (!data.modalidadeId) requiredFields.push('Modalidade')
        if (data.valorContrato === undefined || data.valorContrato === null) requiredFields.push('Valor do Contrato')

        if (requiredFields.length > 0) {
            setToast({
                open: true,
                message: `Preencha os campos obrigatórios: ${requiredFields.join(', ')}`,
                severity: 'error'
            })
            return
        }

        if (data.valorContrato !== undefined && data.valorContrato <= 0) {
            setToast({
                open: true,
                message: 'O valor do contrato deve ser maior que zero',
                severity: 'error'
            })
            return
        }

        try {
            setSaving(true)
            await contractsService.update(contract.id, {
                cicloId: data.cicloId || undefined,
                modalidadeId: data.modalidadeId || undefined,
                valorContrato: data.valorContrato,
                updatedBy: user?.login || 'admin',
            })
            await queryClient.invalidateQueries({ queryKey: contractKeys.dashboard(contract.id) })
            if (onUpdate) onUpdate()
            setEditDialogOpen(false)
            setToast({
                open: true,
                message: 'Valores do contrato atualizados!',
                severity: 'success'
            })
        } catch (error) {
            console.error('Erro ao salvar edição:', error)
            setToast({
                open: true,
                message: 'Erro ao atualizar valores do contrato',
                severity: 'error'
            })
        } finally {
            setSaving(false)
        }
    }

    const handleSaveEditCliente = async (data: { clienteId: string, enderecoId: string }) => {
        if (!contract) return

        const requiredFields = []
        if (!data.clienteId) requiredFields.push('Cliente')
        if (!data.enderecoId) requiredFields.push('Endereço')

        if (requiredFields.length > 0) {
            setToast({
                open: true,
                message: `Preencha os campos obrigatórios: ${requiredFields.join(', ')}`,
                severity: 'error'
            })
            return
        }

        try {
            setSaving(true)

            const snapshotData = await createContractSnapshotPayload({
                clienteId: data.clienteId,
                clienteEnderecoId: data.enderecoId,
                signerPersonIds: signers.filter(s => s.pessoaId).map(s => s.pessoaId!)
            })

            await contractsService.update(contract.id, {
                clienteId: data.clienteId || undefined,
                clienteEnderecoId: data.enderecoId || undefined,
                snapshotData,
                updatedBy: user?.login || 'admin',
            })
            await queryClient.invalidateQueries({ queryKey: contractKeys.dashboard(contract.id) })
            if (onUpdate) onUpdate()
            setClienteDialogOpen(false)
            setToast({
                open: true,
                message: 'Cliente atualizado com sucesso!',
                severity: 'success'
            })
        } catch (error) {
            console.error('Erro ao salvar cliente:', error)
            setToast({
                open: true,
                message: 'Erro ao atualizar cliente',
                severity: 'error'
            })
        } finally {
            setSaving(false)
        }
    }

    const handleSaveEditComercial = async (data: { promotorId: string }) => {
        if (!contract) return

        const requiredFields = []
        if (!data.promotorId) requiredFields.push('Promotor')

        if (requiredFields.length > 0) {
            setToast({
                open: true,
                message: `Preencha os campos obrigatórios: ${requiredFields.join(', ')}`,
                severity: 'error'
            })
            return
        }

        try {
            setSaving(true)
            await contractsService.update(contract.id, {
                promotorId: data.promotorId || undefined,
                updatedBy: user?.login || 'admin',
            })
            await queryClient.invalidateQueries({ queryKey: contractKeys.dashboard(contract.id) })
            if (onUpdate) onUpdate()
            setComercialDialogOpen(false)
            setToast({
                open: true,
                message: 'Informações comerciais atualizadas!',
                severity: 'success'
            })
        } catch (error) {
            console.error('Erro ao salvar comercial:', error)
            setToast({
                open: true,
                message: 'Erro ao atualizar informações comerciais',
                severity: 'error'
            })
        } finally {
            setSaving(false)
        }
    }

    const handleEditContent = () => {
        setContentDialogOpen(true)
    }

    const handleSaveContent = async (content: string) => {
        if (!contract) return

        try {
            setSavingContent(true)
            let conteudo: any
            try {
                conteudo = typeof content === 'string' ? JSON.parse(content) : content
            } catch {
                conteudo = content
            }

            await contractsService.update(contract.id, {
                conteudo,
                updatedBy: user?.login || 'admin',
            })
            // Update local state directly
            setContractContent(content)
            await queryClient.invalidateQueries({ queryKey: contractKeys.dashboard(contract.id) })
            setContentDialogOpen(false)
            if (onUpdate) onUpdate()
            setToast({
                open: true,
                message: 'Conteúdo salvo com sucesso!',
                severity: 'success'
            })
        } catch (error) {
            console.error('Erro ao salvar conteúdo:', error)
            setToast({
                open: true,
                message: 'Erro ao salvar conteúdo',
                severity: 'error'
            })
        } finally {
            setSavingContent(false)
        }
    }

    const handlePreviewContent = async () => {
        if (!contractContent || !contract) return

        try {
            startLoading()
            let clienteData = null
            if (contract.clienteId) {
                try {
                    // Use peopleList if available to avoid request
                    clienteData = peopleList.find(p => p.id === contract.clienteId)
                    if (!clienteData) {
                        clienteData = await peopleService.getById(contract.clienteId)
                    }
                } catch (err) {
                    console.error('Erro ao carregar dados do cliente:', err)
                }
            }

            await previewContractContent(
                contractContent,
                clienteData || null,
                contract.seqId || contract.id,
                (message: string) => {
                    setToast({
                        open: true,
                        message,
                        severity: 'error'
                    })
                },
                signers.map(s => ({ name: s.name, document: s.document || '' })),
                contract
            )
        } finally {
            stopLoading()
        }
    }

    const handlePrintContent = async () => {
        if (!contractContent || !contract) return

        try {
            startLoading()
            let clienteData = null
            if (contract.clienteId) {
                try {
                    clienteData = peopleList.find(p => p.id === contract.clienteId)
                    if (!clienteData) {
                        clienteData = await peopleService.getById(contract.clienteId)
                    }
                } catch (err) {
                    console.error('Erro ao carregar dados do cliente:', err)
                }
            }

            await printContractContent(
                contractContent,
                clienteData || null,
                contract.seqId || contract.id,
                (message: string) => {
                    setToast({
                        open: true,
                        message,
                        severity: 'error'
                    })
                },
                signers.map(s => ({ name: s.name, document: s.document || '' })),
                contract
            )
        } finally {
            stopLoading()
        }
    }

    const handleCloseAttachmentDialog = () => {
        setAttachmentDialogOpen(false)
        setEditingAttachment(null)
        setAttachmentForm({ attachmentType: '', file: '', fileName: '', categoryCode: '', fileSize: 0 })
    }

    const handleAddAttachment = () => {
        setEditingAttachment(null)
        setAttachmentForm({ attachmentType: '', file: '', fileName: '', categoryCode: '', fileSize: 0 })
        setAttachmentDialogOpen(true)
    }

    const handleEditAttachment = async (attachment: ContractAttachment) => {
        if (!contract) return

        try {
            const attachmentData = await contractsService.attachments.getById(attachment.id)
            setEditingAttachment(attachment)
            setAttachmentForm({
                attachmentType: '',
                file: attachmentData.file || '',
                fileName: attachmentData.fileName || attachment.name,
                categoryCode: attachmentData.categoryCode || '',
                fileSize: typeof attachmentData.fileSize === 'string' ? parseInt(attachmentData.fileSize, 10) : (attachmentData.fileSize || attachment.fileSize || 0),
            })
            setAttachmentDialogOpen(true)
        } catch (error) {
            console.error('Erro ao carregar anexo:', error)
            setEditingAttachment(attachment)
            setAttachmentForm({
                attachmentType: '',
                file: attachment.url || '',
                fileName: attachment.name,
                categoryCode: attachment.categoryCode || '',
                fileSize: attachment.fileSize || 0,
            })
            setAttachmentDialogOpen(true)
        }
    }

    const handleSaveAttachment = async (data: { file: string; fileName: string; fileSize: number; categoryCode: string }) => {
        if (!contract || !data.file || !data.fileName) {
            setToast({
                open: true,
                message: 'Preencha todos os campos obrigatórios',
                severity: 'warning'
            })
            return
        }

        try {
            setSavingAttachment(true)

            if (editingAttachment) {
                await contractsService.attachments.update(editingAttachment.id, {
                    file: data.file,
                    fileName: data.fileName,
                    categoryCode: data.categoryCode,
                    fileSize: data.fileSize ? String(data.fileSize) : undefined,
                    updatedBy: user?.login || 'admin',
                })
            } else {
                await contractsService.attachments.create({
                    contractId: contract.id,
                    file: data.file,
                    fileName: data.fileName,
                    categoryCode: data.categoryCode,
                    fileSize: data.fileSize ? String(data.fileSize) : undefined,
                    createdBy: user?.login || 'admin',
                })
            }

            await queryClient.invalidateQueries({ queryKey: contractKeys.dashboard(contract.id) })

            handleCloseAttachmentDialog()
            setToast({
                open: true,
                message: 'Anexo salvo com sucesso!',
                severity: 'success'
            })
        } catch (error) {
            console.error('Erro ao salvar anexo:', error)
            setToast({
                open: true,
                message: 'Erro ao salvar anexo',
                severity: 'error'
            })
        } finally {
            setSavingAttachment(false)
        }
    }

    const handleDeleteAttachment = async (attachment: ContractAttachment) => {
        if (!contract) return
        try {
            await contractsService.attachments.remove(attachment.id)
            await queryClient.invalidateQueries({ queryKey: contractKeys.dashboard(contract.id) })
            setToast({
                open: true,
                message: 'Anexo removido',
                severity: 'success'
            })
        } catch (error) {
            console.error('Erro ao remover anexo:', error)
            setToast({
                open: true,
                message: 'Erro ao remover anexo',
                severity: 'error'
            })
        }
    }


    const handleAddSigner = () => {
        setEditingSigner(null)
        setSignerForm({ pessoaId: '' })
        setSignerDialogOpen(true)
    }

    const handleEditSigner = async (signer: ContractSigner) => {
        if (!contract) return

        try {
            // Check if we have data in memory or fetch list?
            // "signers" array is from details.
            // But we need "real signer object"? UseCase returns just what we have in "signers" variable basically.
            // The original code called contractsService.signers.list again?
            // "signersData.find(s => s.id === signer.id)"
            // Use derived state `signers`?
            // `signer` passed here is from the UI list.

            // Just use local find.
            // But original code: "realSigner".
            // Since we have `signers` array derived from dashboard data, we have `pessoaId`.

            setEditingSigner(signer)
            const pessoa = peopleList.find(p => p.cpfCnpj === signer.document || p.id === signer.pessoaId)
            setSignerForm({ pessoaId: pessoa?.id || signer.pessoaId || '' })
            setSignerDialogOpen(true)
        } catch (error) {
            console.error('Erro ao carregar assinante:', error)
            setEditingSigner(signer)
            setSignerDialogOpen(true)
        }
    }

    // ... handleSaveSigner missing in original file snippet?
    // It was probably truncated.
    // I need to implement handleDeleteSigner and see if handleSaveSigner is there.

    // I'll replace handleDeleteSigner and Assume the rest follows or search for closing brace.

    const handleDeleteSigner = async (signer: ContractSigner) => {
        if (!contract) return
        try {
            await contractsService.signers.remove(signer.id)

            // Remove from local calculation just for snapshot update?
            // We need to invalidate query first BUT we also need to update snapshot.
            // The snapshot update logic requires the NEW list of signers.
            // If I invalidate query, I get new signers.
            // Then I update snapshot?

            // Original logic: calculate remaining signers -> update snapshot.
            // I can simulate remaining signers.
            const remainingSigners = signers.filter(s => s.id !== signer.id)

            try {
                const snapshotData = await createContractSnapshotPayload({
                    clienteId: contract.clienteId || '',
                    clienteEnderecoId: contract.clienteEnderecoId,
                    signerPersonIds: remainingSigners.filter(s => s.pessoaId).map(s => s.pessoaId!)
                })
                await contractsService.update(contract.id, {
                    snapshotData,
                    updatedBy: user?.login || 'admin'
                })
            } catch (e) {
                console.error('Erro ao atualizar snapshot após remoção de assinante:', e)
            }

            await queryClient.invalidateQueries({ queryKey: contractKeys.dashboard(contract.id) })

            setToast({
                open: true,
                message: 'Assinante removido',
                severity: 'success'
            })
        } catch (error) {
            console.error('Erro ao remover assinante:', error)
            setToast({
                open: true,
                message: 'Erro ao remover assinante',
                severity: 'error'
            })
        }
    }

    const handleSaveSigner = async (data: { pessoaId: string }) => {
        if (!contract || !data.pessoaId) {
            setToast({
                open: true,
                message: 'Selecione uma pessoa',
                severity: 'warning'
            })
            return
        }

        try {
            setSavingSigner(true)
            const pessoa = await peopleService.getById(data.pessoaId)
            if (!pessoa) throw new Error('Pessoa não encontrada')

            if (editingSigner) {
                await contractsService.signers.update(editingSigner.id, {
                    vinculo: pessoa.name,
                    updatedBy: user?.login || 'admin',
                })
            } else {
                await contractsService.signers.create({
                    contractId: contract.id,
                    pessoaId: data.pessoaId,
                    vinculo: pessoa.name,
                    createdBy: user?.login || 'admin',
                })
            }

            // We need updated list for snapshot. Fetch specifically for snapshot calculation.
            const signersData = await contractsService.signers.list(contract.id)
            // Need person ids

            try {
                const snapshotData = await createContractSnapshotPayload({
                    clienteId: contract.clienteId || '',
                    clienteEnderecoId: contract.clienteEnderecoId,
                    signerPersonIds: signersData.map((s: any) => s.pessoaId)
                })
                await contractsService.update(contract.id, {
                    snapshotData,
                    updatedBy: user?.login || 'admin'
                })
            } catch (e) {
                console.error('Erro ao atualizar snapshot após salvar assinante:', e)
            }

            await queryClient.invalidateQueries({ queryKey: contractKeys.dashboard(contract.id) })

            setSignerDialogOpen(false)
            setToast({
                open: true,
                message: 'Assinante salvo com sucesso!',
                severity: 'success'
            })
        } catch (error) {
            console.error('Erro ao salvar assinante:', error)
            setToast({
                open: true,
                message: 'Erro ao salvar assinante',
                severity: 'error'
            })
        } finally {
            setSavingSigner(false)
        }
    }

    const handleStartChangeStatus = () => {
        setHistoryForm({ newStatus: '', changeReason: '' })
        setHistoryDialogOpen(true)
    }

    const handleSaveHistory = async (data: { newStatus?: string; changeReason: string }) => {
        if (!contract || !data.newStatus) return

        try {
            setSavingHistory(true)
            await contractsService.status.change(contract.id, {
                newStatus: data.newStatus,
                changeReason: data.changeReason,
                updatedBy: user?.login || 'admin',
                changeOrigin: 'Dashboard de Contratos'
            })

            await queryClient.invalidateQueries({ queryKey: contractKeys.dashboard(contract.id) })
            if (onUpdate) onUpdate()

            setHistoryDialogOpen(false)
            setToast({ open: true, message: 'Status alterado com sucesso!', severity: 'success' })
        } catch (error) {
            console.error('Erro ao salvar histórico:', error)
            setToast({ open: true, message: 'Erro ao alterar status', severity: 'error' })
        } finally {
            setSavingHistory(false)
        }
    }

    const handleSaveEditVigencia = async (data: { vigenciaDataInicio: string, vigenciaDataFim: string }) => {
        if (!contract) return

        try {
            setSaving(true)

            const payload: any = {
                updatedBy: user?.login || 'admin'
            }

            if (data.vigenciaDataInicio) {
                payload.vigenciaDataInicio = data.vigenciaDataInicio
            }

            if (data.vigenciaDataFim) {
                payload.vigenciaDataFim = data.vigenciaDataFim
            }

            await contractsService.update(contract.id, payload)
            await queryClient.invalidateQueries({ queryKey: contractKeys.dashboard(contract.id) })
            if (onUpdate) onUpdate()
            setVigenciaDialogOpen(false)
            setToast({
                open: true,
                message: 'Vigência do contrato atualizada!',
                severity: 'success'
            })
        } catch (error) {
            console.error('Erro ao salvar vigência:', error)
            setToast({
                open: true,
                message: 'Erro ao atualizar vigência do contrato',
                severity: 'error'
            })
        } finally {
            setSaving(false)
        }
    }

    return {
        contract,
        clienteName,
        clienteEndereco,
        cicloName,
        modalidadeName,
        promotorName,
        contractContent,
        contentDialogOpen,
        setContentDialogOpen,
        savingContent,
        templateOptions,
        attachments,
        attachmentDialogOpen,
        setAttachmentDialogOpen,
        editingAttachment,
        attachmentForm,
        savingAttachment,
        signers,
        statusHistory,
        signerDialogOpen,
        setSignerDialogOpen,
        editingSigner,
        signerForm,
        savingSigner,
        historyDialogOpen,
        setHistoryDialogOpen,
        historyForm,
        savingHistory,
        editDialogOpen,
        setEditDialogOpen,
        editForm,
        clienteDialogOpen,
        setClienteDialogOpen,
        clienteForm,
        comercialDialogOpen,
        setComercialDialogOpen,
        comercialForm,
        vigenciaDialogOpen,
        setVigenciaDialogOpen,
        vigenciaForm,
        saving,
        clienteOptions,
        cicloOptions,
        modalidadeOptions,
        promotorOptions,
        variables,
        statusMapping,
        categoryMapping,
        toast,
        setToast,
        handleStartEdit,
        handleStartEditCliente,
        handleStartEditComercial,
        handleSaveEdit,
        handleSaveEditCliente,
        handleSaveEditComercial,
        handleStartEditVigencia,
        handleSaveEditVigencia,
        handleEditContent,
        handleSaveContent,
        handlePreviewContent,
        handlePrintContent,
        handleCloseAttachmentDialog,
        handleAddAttachment,
        handleEditAttachment,
        handleSaveAttachment,
        handleDeleteAttachment,
        handleAddSigner,
        handleEditSigner,
        handleDeleteSigner,
        handleSaveSigner,
        handleStartChangeStatus,
        handleSaveHistory,
        loadingDashboard
    }
}
