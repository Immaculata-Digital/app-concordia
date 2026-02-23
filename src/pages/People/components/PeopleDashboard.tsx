
import React, { useState } from 'react'
import Toast from '../../../components/Toast'

import {
    Edit,
    AccountBalance,
    LocationOn,
    Description,
    Email,
    Phone,
    Group,
    Error,
    Warning,
    CheckCircle,
    Storage
} from '@mui/icons-material'
import {
    Divider,
    Grid,
    Typography,
    Box,
    Button,
    Stack,
    Chip,
} from '@mui/material'
import {
    type PeopleContact,
    type PeopleAddress,
    type PeopleBankAccount,
    type PeopleDocument,
    type PeopleRelationship,
} from '../../../services/people'
import { getBankName } from '../../../services/bankService'
import { useAuth } from '../../../context/AuthContext'
import {
    getAccessMode,
    canEdit,
} from '../../../utils/accessControl'
import { DashboardTopCard } from '../../../components/Dashboard/DashboardTopCard'
import { DashboardBodyCard } from '../../../components/Dashboard/DashboardBodyCard'
import { DashboardBodyCardList } from '../../../components/Dashboard/DashboardBodyCardList'
import { formatDateDisplay, toUTCDate } from '../../../utils/date'
import { parsePhoneNumber, formatPhoneNumber } from '../../../components/PhonePicker/utils'
import { DashboardModal } from '../../../components/Modals'
import PeopleFormDialog from './PeopleFormDialog'
import PeopleContactDialog from './PeopleContactDialog'
import PeopleAddressDialog from './PeopleAddressDialog'
import PeopleBankAccountDialog from './PeopleBankAccountDialog'
import PeopleDocumentDialog from './PeopleDocumentDialog'
import PeopleDetailsDialog from './PeopleDetailsDialog'
import PeopleRelationshipDialog from './PeopleRelationshipDialog'
import { DashboardDnDGrid } from '../../../components/Dashboard/DashboardDnDGrid'
import { DashboardStack } from '../../../components/Dashboard/DashboardStack'

import {
    usePerson,
    useUpdatePerson,
    useAddContact,
    useUpdateContact,
    useRemoveContact,
    useAddAddress,
    useUpdateAddress,
    useRemoveAddress,
    useAddBankAccount,
    useUpdateBankAccount,
    useRemoveBankAccount,
    useAddDocument,
    useUpdateDocument,
    useRemoveDocument,
    useUpdateDetail,
    useCreateDetail,
    useAddRelationship,
    useUpdateRelationship,
    useRemoveRelationship,
    useRelationshipTypes,
    usePeople
} from '../../../hooks/queries/people'

const MARITAL_STATUS_MAP: Record<string, string> = {
    'Single': 'Solteiro(a)',
    'Married': 'Casado(a)',
    'Divorced': 'Divorciado(a)',
    'Widowed': 'Viúvo(a)',
    'Separated': 'Separado(a)',
}

interface PeopleDashboardProps {
    open: boolean
    onClose: () => void
    peopleId: string | null
    onUpdate?: () => void
}

const PeopleDashboard = ({ open, onClose, peopleId, onUpdate }: PeopleDashboardProps) => {
    const { user, permissions } = useAuth()
    const now = new Date()

    // Data Query
    const { data: people, isLoading: loading } = usePerson(peopleId)

    // Relationship Types Query (cached)
    const { data: relationshipTypes = [] } = useRelationshipTypes()

    // All People Query (for relationships select)
    const [relationshipDialogOpen, setRelationshipDialogOpen] = useState(false)
    const { data: allPeoples = [] } = usePeople()

    // Mutations
    const updatePerson = useUpdatePerson()
    const addContact = useAddContact()
    const updateContact = useUpdateContact()
    const removeContact = useRemoveContact()

    const addAddress = useAddAddress()
    const updateAddress = useUpdateAddress()
    const removeAddress = useRemoveAddress()

    const addBankAccount = useAddBankAccount()
    const updateBankAccount = useUpdateBankAccount()
    const removeBankAccount = useRemoveBankAccount()

    const addDocument = useAddDocument()
    const updateDocument = useUpdateDocument()
    const removeDocument = useRemoveDocument()

    const updateDetailMutation = useUpdateDetail()
    const createDetailMutation = useCreateDetail()

    const addRelationship = useAddRelationship()
    const updateRelationship = useUpdateRelationship()
    const removeRelationship = useRemoveRelationship()


    // Edit Core State
    const [editOpen, setEditOpen] = useState(false)
    const [editForm, setEditForm] = useState({
        name: '',
        cpfCnpj: '',
        tenantId: '',
        usuarioId: '' as string | null
    })

    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'warning' | 'info' }>({
        open: false,
        message: '',
        severity: 'error'
    })

    // Sub-modal state
    const [contactDialogOpen, setContactDialogOpen] = useState(false)
    const [editingContact, setEditingContact] = useState<PeopleContact | null>(null)

    const [addressDialogOpen, setAddressDialogOpen] = useState(false)
    const [editingAddress, setEditingAddress] = useState<PeopleAddress | null>(null)

    const [bankDialogOpen, setBankDialogOpen] = useState(false)
    const [editingAccount, setEditingAccount] = useState<PeopleBankAccount | null>(null)

    const [documentDialogOpen, setDocumentDialogOpen] = useState(false)
    const [editingDocument, setEditingDocument] = useState<PeopleDocument | null>(null)

    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)

    const [editingRelationship, setEditingRelationship] = useState<PeopleRelationship | null>(null)


    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false })
    }

    const formatSize = (input: number | string) => {
        if (typeof input === 'string') return input
        const bytes = input
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const handleStartEdit = () => {
        if (!people) return
        setEditForm({
            name: people.name,
            cpfCnpj: people.cpfCnpj,
            tenantId: people.tenantId || '',
            usuarioId: people.usuarioId || null
        })
        setEditOpen(true)
    }

    const handleSaveEdit = async (data?: { name: string; cpfCnpj: string; tenantId?: string; usuarioId?: string | null }) => {
        if (!people) return
        const formData = data || editForm
        try {
            await updatePerson.mutateAsync({
                id: people.id,
                payload: {
                    name: formData.name,
                    cpfCnpj: formData.cpfCnpj,
                    tenantId: formData.tenantId,
                    usuarioId: formData.usuarioId,
                    updatedBy: user?.login || 'system'
                }
            })
            if (onUpdate) onUpdate()
            setEditOpen(false)
            setSnackbar({ open: true, message: 'Pessoa atualizada com sucesso!', severity: 'success' })
        } catch (error) {
            console.error('Erro ao salvar edição:', error)
            setSnackbar({ open: true, message: 'Erro ao atualizar pessoa', severity: 'error' })
        }
    }

    // Handlers for Contacts
    const handleAddContactFn = () => { setEditingContact(null); setContactDialogOpen(true) }
    const handleEditContactFn = (contact: PeopleContact) => { setEditingContact(contact); setContactDialogOpen(true) }

    const handleDeleteContactFn = async (contact: PeopleContact) => {
        if (!people) return
        try {
            await removeContact.mutateAsync({ peopleId: people.id, contactId: contact.id })
        } catch (error) {
            console.error('Erro ao excluir contato:', error)
        }
    }

    const handleSaveContactFn = async (data: any) => {
        if (!people) return
        if (!data.contactValue) {
            setSnackbar({ open: true, message: 'Preencha o valor do contato', severity: 'error' }); return
        }
        try {
            if (editingContact) {
                await updateContact.mutateAsync({ peopleId: people.id, contactId: editingContact.id, payload: data })
            } else {
                await addContact.mutateAsync({ peopleId: people.id, payload: data })
            }
            setContactDialogOpen(false)
            setEditingContact(null)
        } catch (error) {
            console.error('Erro ao salvar contato:', error)
            setSnackbar({ open: true, message: 'Erro ao salvar contato', severity: 'error' })
        }
    }

    // Handlers for Addresses
    const handleAddAddressFn = () => { setEditingAddress(null); setAddressDialogOpen(true) }
    const handleEditAddressFn = (address: PeopleAddress) => { setEditingAddress(address); setAddressDialogOpen(true) }

    const handleDeleteAddressFn = async (address: PeopleAddress) => {
        if (!people) return
        try {
            await removeAddress.mutateAsync({ peopleId: people.id, addressId: address.id })
        } catch (error) {
            console.error('Erro ao excluir endereço:', error)
        }
    }

    const handleSaveAddressFn = async (data: any) => {
        if (!people) return
        const requiredFields: Record<string, string> = {
            postalCode: 'CEP', street: 'Rua', number: 'Número', neighborhood: 'Bairro', city: 'Cidade', state: 'Estado'
        }
        const missing = Object.entries(requiredFields).filter(([key]) => !data[key as keyof typeof data]).map(([, label]) => label)
        if (missing.length > 0) {
            setSnackbar({ open: true, message: `Preencha os campos: ${missing.join(', ')}`, severity: 'error' }); return
        }

        try {
            if (editingAddress) {
                await updateAddress.mutateAsync({ peopleId: people.id, addressId: editingAddress.id, payload: data })
            } else {
                await addAddress.mutateAsync({ peopleId: people.id, payload: data })
            }
            setAddressDialogOpen(false)
            setEditingAddress(null)
        } catch (error) {
            console.error('Erro ao salvar:', error)
            setSnackbar({ open: true, message: 'Erro ao salvar endereço', severity: 'error' })
        }
    }

    // Handlers for Bank Accounts
    const handleAddAccountFn = () => { setEditingAccount(null); setBankDialogOpen(true) }
    const handleEditAccountFn = (acc: PeopleBankAccount) => { setEditingAccount(acc); setBankDialogOpen(true) }

    const handleDeleteAccountFn = async (acc: PeopleBankAccount) => {
        if (!people) return
        try {
            await removeBankAccount.mutateAsync({ peopleId: people.id, accountId: acc.id })
        } catch (error) { console.error(error) }
    }

    const handleSaveAccountFn = async (data: any) => {
        if (!people) return
        const requiredFields: Record<string, string> = {
            bankCode: 'Código do Banco', branchCode: 'Agência', accountNumber: 'Conta', accountType: 'Tipo de Conta'
        }
        const missing = Object.entries(requiredFields).filter(([key]) => !data[key as keyof typeof data]).map(([, label]) => label)
        if (missing.length > 0) {
            setSnackbar({ open: true, message: `Preencha: ${missing.join(', ')}`, severity: 'error' }); return
        }
        try {
            if (editingAccount) {
                await updateBankAccount.mutateAsync({ peopleId: people.id, accountId: editingAccount.id, payload: data })
            } else {
                await addBankAccount.mutateAsync({ peopleId: people.id, payload: data })
            }
            setBankDialogOpen(false)
            setEditingAccount(null)
        } catch (error) {
            console.error(error)
            setSnackbar({ open: true, message: 'Erro ao salvar conta bancária', severity: 'error' })
        }
    }

    // Handlers for Documents
    const handleAddDocumentFn = () => { setEditingDocument(null); setDocumentDialogOpen(true) }
    const handleEditDocumentFn = (doc: PeopleDocument) => { setEditingDocument(doc); setDocumentDialogOpen(true) }

    const handleDeleteDocumentFn = async (doc: PeopleDocument) => {
        if (!people) return
        try {
            await removeDocument.mutateAsync({ peopleId: people.id, documentId: doc.id })
        } catch (error) { console.error(error) }
    }

    const handleSaveDocumentFn = async (data: any) => {
        if (!people) return
        if (!data.categoryCode) {
            setSnackbar({ open: true, message: 'Preencha o tipo de documento', severity: 'error' }); return
        }
        if (!data.file && !editingDocument) {
            setSnackbar({ open: true, message: 'Selecione um arquivo', severity: 'error' }); return
        }
        try {
            const payload: any = {
                categoryCode: data.categoryCode,
                file: data.file,
                expirationDate: toUTCDate(data.expirationDate) || undefined,
                fileName: data.fileName,
                fileSize: formatSize(data.fileSize)
            }
            if (editingDocument) {
                await updateDocument.mutateAsync({ peopleId: people.id, documentId: editingDocument.id, payload })
            } else {
                await addDocument.mutateAsync({ peopleId: people.id, payload })
            }
            setDocumentDialogOpen(false)
            setEditingDocument(null)
        } catch (error) {
            console.error(error)
            setSnackbar({ open: true, message: 'Erro ao salvar documento', severity: 'error' })
        }
    }

    // Handlers for Details
    const handleSaveDetailsFn = async (data: any) => {
        if (!people) return
        const isPF = people.cpfCnpj?.replace(/[^a-zA-Z0-9]/g, '').length === 11
        if (isPF) {
            if (!data.firstName || !data.surname) {
                setSnackbar({ open: true, message: 'Preencha o nome e sobrenome', severity: 'error' }); return
            }
        } else {
            if (!data.legalName) {
                setSnackbar({ open: true, message: 'Preencha a razão social', severity: 'error' }); return
            }
        }

        try {
            const payload = {
                ...data,
                birthDate: toUTCDate(data.birthDate),
                sex: data.sex || null,
                maritalStatus: data.maritalStatus || null,
                firstName: data.firstName || null,
                surname: data.surname || null,
                legalName: data.legalName || null,
                tradeName: data.tradeName || null,
            }

            if (people.details?.id) {
                await updateDetailMutation.mutateAsync({ peopleId: people.id, detailId: people.details.id, payload })
            } else {
                await createDetailMutation.mutateAsync({ peopleId: people.id, payload })
            }
            setDetailsDialogOpen(false)
            setSnackbar({ open: true, message: 'Detalhes atualizados com sucesso!', severity: 'success' })
        } catch (error) {
            console.error(error)
            setSnackbar({ open: true, message: 'Erro ao salvar detalhes', severity: 'error' })
        }
    }

    // Handlers for Relationships
    const handleAddRelationshipFn = () => { setEditingRelationship(null); setRelationshipDialogOpen(true) }
    const handleEditRelationshipFn = (rel: PeopleRelationship) => { setEditingRelationship(rel); setRelationshipDialogOpen(true) }

    const handleDeleteRelationshipFn = async (rel: PeopleRelationship) => {
        if (!people) return
        try {
            await removeRelationship.mutateAsync({ peopleId: people.id, relationshipId: rel.id })
        } catch (error) { console.error(error) }
    }

    const handleSaveRelationshipFn = async (data: any) => {
        if (!people) return
        if (!data.peopleRelationshipTypesId || !data.peopleIdTarget) {
            setSnackbar({ open: true, message: 'Preencha todos os campos', severity: 'error' }); return
        }

        try {
            const payload = { ...data, peopleIdSource: people.id }
            if (editingRelationship) {
                await updateRelationship.mutateAsync({ peopleId: people.id, relationshipId: editingRelationship.id, payload })
            } else {
                await addRelationship.mutateAsync({ peopleId: people.id, payload })
            }
            setRelationshipDialogOpen(false)
            setEditingRelationship(null)
        } catch (error) {
            console.error(error)
            setSnackbar({ open: true, message: 'Erro ao salvar relacionamento', severity: 'error' })
        }
    }


    const detailsCard = (
        <DashboardBodyCard
            title="Detalhes"
            accessMode={getAccessMode(permissions, 'erp:pessoas')}
            loading={loading}
            action={people && canEdit(getAccessMode(permissions, 'erp:pessoas')) && (
                <Stack direction="row" spacing={1}>
                    <Button variant="outlined" size="small" onClick={() => setDetailsDialogOpen(true)} title="Editar Detalhes">
                        <Edit fontSize="small" />
                    </Button>
                    <Button variant="outlined" size="small" onClick={handleStartEdit} title="Editar Pessoa/Vínculo">
                        <Storage fontSize="small" />
                    </Button>
                </Stack>
            )}
        >
            {people && (
                <Stack spacing={2}>
                    {people.cpfCnpj?.replace(/\D/g, '').length === 11 ? (
                        <>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" className="dashboard-label">Nome</Typography>
                                    <Typography variant="body1">{people.details?.firstName || '-'}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" className="dashboard-label">Sobrenome</Typography>
                                    <Typography variant="body1">{people.details?.surname || '-'}</Typography>
                                </Grid>
                            </Grid>
                            <Box>
                                <Typography variant="caption" className="dashboard-label">Data de Nascimento</Typography>
                                <Typography variant="body1">{formatDateDisplay(people.details?.birthDate)}</Typography>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" className="dashboard-label">Sexo</Typography>
                                    <Typography variant="body2">{people.details?.sex || '-'}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" className="dashboard-label">Estado Civil</Typography>
                                    <Typography variant="body2">
                                        {people.details?.maritalStatus ? (MARITAL_STATUS_MAP[people.details.maritalStatus] || people.details.maritalStatus) : '-'}
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" className="dashboard-label">Nacionalidade</Typography>
                                    <Typography variant="body2">{people.details?.nationality || '-'}</Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <Typography variant="caption" className="dashboard-label">Profissão</Typography>
                                    <Typography variant="body2">{people.details?.occupation || '-'}</Typography>
                                </Grid>
                            </Grid>
                        </>
                    ) : (
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="caption" className="dashboard-label">Razão Social</Typography>
                                <Typography variant="body1">{people.details?.legalName || '-'}</Typography>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="caption" className="dashboard-label">Nome Fantasia</Typography>
                                <Typography variant="body1">{people.details?.tradeName || '-'}</Typography>
                            </Grid>
                        </Grid>
                    )}

                    <Divider sx={{ my: 1 }} />
                    <Box>
                        <Typography variant="caption" className="dashboard-label" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Group sx={{ fontSize: '0.75rem' }} /> Usuário Vinculado
                        </Typography>
                        {people.usuarioId ? (
                            <Box sx={{ mt: 0.5, p: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                                <Typography variant="body2" fontWeight="bold">
                                    {people.usuarioLogin}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {people.usuarioNome}
                                </Typography>
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary">Nenhum usuário vinculado</Typography>
                        )}
                    </Box>
                </Stack>
            )}
        </DashboardBodyCard >
    )

    const bankAccountCard = (
        <DashboardBodyCardList<PeopleBankAccount>
            title="Dados Bancários"
            accessMode={getAccessMode(permissions, 'erp:pessoas')}
            items={people?.bankAccounts || []}
            loading={loading}
            keyExtractor={(item) => item.id}
            renderIcon={() => <Box className="dashboard-icon-badge"><AccountBalance /></Box>}
            renderText={(item) => (
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="subtitle2" fontWeight="bold">{item.bankCode}</Typography>
                    <BankNameDisplay code={item.bankCode} />
                    {item.isDefaultReceipt && <Chip label="Principal" size="small" color="success" sx={{ height: 20, fontSize: '0.625rem' }} />}
                </Stack>
            )}
            renderSecondaryText={(item) => (
                <Box>
                    <Typography variant="body2" className="dashboard-text-primary">
                        {item.accountType} • Ag: {item.branchCode} • CC: {item.accountNumber}
                    </Typography>
                    {item.pixKey && <Typography variant="caption" className="dashboard-text-secondary" display="block">PIX: {item.pixKey}</Typography>}
                </Box>
            )}
            listItemClassName="dashboard-list-item"
            onAdd={handleAddAccountFn}
            onEdit={handleEditAccountFn}
            onDelete={handleDeleteAccountFn}
            emptyText="Nenhuma conta bancária registrada."
        />
    )

    const systemInfoCard = (
        <DashboardBodyCard
            title="Informações do Sistema"
            accessMode={getAccessMode(permissions, 'erp:pessoas')}
            loading={loading}
        >
            {people && (
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" className="dashboard-label">ID do Sistema</Typography>
                        <Typography variant="body2" className="dashboard-value" sx={{ fontFamily: 'monospace' }}>{people.id}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" className="dashboard-label">Criado por</Typography>
                        <Typography variant="body2" className="dashboard-value">{people.createdBy} em {new Date(people.createdAt).toLocaleString()}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" className="dashboard-label">Atualizado por</Typography>
                        <Typography variant="body2" className="dashboard-value">{people.updatedBy} em {new Date(people.updatedAt).toLocaleString()}</Typography>
                    </Grid>
                    {people.usuarioId && (
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle2" className="dashboard-label">Usuário Vinculado</Typography>
                            <Typography variant="body2" className="dashboard-value" color="primary.main">
                                ID: {people.usuarioId}
                            </Typography>
                        </Grid>
                    )}
                </Grid>
            )}
        </DashboardBodyCard>
    )

    const addressesCard = (
        <DashboardBodyCardList<PeopleAddress>
            title="Endereços"
            accessMode={getAccessMode(permissions, 'erp:pessoas')}
            items={people?.addresses || []}
            loading={loading}
            keyExtractor={(item) => item.id}
            renderIcon={() => <Box className="dashboard-icon-badge"><LocationOn /></Box>}
            renderText={(item) => <>{item.street}, {item.number} {item.complement ? `- ${item.complement}` : ''}</>}
            renderSecondaryText={(item) => (
                <Box component="span" sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body2" component="span" color="inherit">{item.neighborhood}, {item.city} - {item.state}</Typography>
                    <Typography variant="caption" component="span" color="inherit">{item.postalCode} • {item.addressType}</Typography>
                </Box>
            )}
            listItemClassName="dashboard-list-item"
            onAdd={handleAddAddressFn}
            onEdit={handleEditAddressFn}
            onDelete={handleDeleteAddressFn}
            emptyText="Nenhum endereço registrado."
        />
    )

    const documentsCard = (
        <DashboardBodyCardList<PeopleDocument>
            title="Documentos"
            accessMode={getAccessMode(permissions, 'erp:pessoas')}
            items={people?.documents || []}
            loading={loading}
            keyExtractor={(item) => item.id}
            renderIcon={() => <Box className="dashboard-icon-badge"><Description /></Box>}
            renderText={(item) => item.categoryName || item.categoryCode || 'Documento'}
            renderSecondaryText={(item) => (
                <React.Fragment>
                    <Typography component="span" variant="caption" display="block" className="dashboard-text-secondary">{item.fileName} ({item.fileSize})</Typography>
                    {item.expirationDate && (
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                            {new Date(item.expirationDate) < now ?
                                <Error fontSize="inherit" color="error" /> :
                                new Date(item.expirationDate) < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) ?
                                    <Warning fontSize="inherit" color="warning" /> :
                                    <CheckCircle fontSize="inherit" color="success" />}
                            <Typography component="span" variant="caption" color={new Date(item.expirationDate) < now ? 'error' : 'textSecondary'}>
                                Vence em: {formatDateDisplay(item.expirationDate)}
                            </Typography>
                        </Stack>
                    )}
                </React.Fragment>
            )}
            listItemClassName="dashboard-list-item"
            onAdd={handleAddDocumentFn}
            onEdit={handleEditDocumentFn}
            onDelete={handleDeleteDocumentFn}
            emptyText="Nenhum documento registrado."
        />
    )

    const relationshipsCard = (
        <DashboardBodyCardList<PeopleRelationship>
            title="Relacionamentos"
            accessMode={getAccessMode(permissions, 'erp:pessoas')}
            items={people?.relationships || []}
            loading={loading}
            keyExtractor={(item) => item.id}
            renderIcon={() => <Box className="dashboard-icon-badge"><Group /></Box>}
            renderText={(item) => (
                <Typography variant="subtitle2">
                    {item.relationshipSource} {item.connectorSuffix} <strong>{item.targetName}</strong>
                </Typography>
            )}
            renderSecondaryText={(item) => (
                <Typography variant="caption" display="block">
                    {item.targetCpfCnpj} • {item.relationshipTarget}
                </Typography>
            )}
            listItemClassName="dashboard-list-item"
            onAdd={handleAddRelationshipFn}
            onEdit={handleEditRelationshipFn}
            onDelete={handleDeleteRelationshipFn}
            emptyText="Nenhum relacionamento registrado."
        />
    )

    const contactsCard = (
        <DashboardBodyCardList<PeopleContact>
            title="Contatos"
            accessMode={getAccessMode(permissions, 'erp:pessoas')}
            items={people?.contacts || []}
            loading={loading}
            keyExtractor={(item) => item.id}
            renderIcon={(item) => <Box className="dashboard-icon-badge">{item.contactType === 'email' ? <Email /> : <Phone />}</Box>}
            renderText={(item) => {
                if (item.contactType === 'phone' || item.contactType === 'whatsapp') {
                    const { country, number } = parsePhoneNumber(item.contactValue)
                    return formatPhoneNumber(number, country)
                }
                return item.contactValue
            }}
            renderSecondaryText={(item) => (
                <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption">{item.label || item.contactType}</Typography>
                    {item.isDefault && <Chip label="Principal" size="small" color="primary" sx={{ height: 16, fontSize: '0.6rem' }} />}
                </Stack>
            )}
            listItemClassName="dashboard-list-item"
            onAdd={handleAddContactFn}
            onEdit={handleEditContactFn}
            onDelete={handleDeleteContactFn}
            emptyText="Nenhum contato registrado."
        />
    )

    const tenantCard = (
        <DashboardBodyCard
            title="Institucional / Tenant"
            accessMode={getAccessMode(permissions, 'erp:tenants')}
            loading={loading}
        >
            {people && (
                <Stack spacing={2}>
                    <Box>
                        <Typography variant="caption" className="dashboard-label" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Storage sx={{ fontSize: '0.75rem' }} /> Tenant Vinculado
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
                            {people.tenantName || 'Tenant Padrão'}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="caption" className="dashboard-label">Identificador (UUID)</Typography>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'text.secondary', mt: 0.5 }}>
                            {people.tenantId}
                        </Typography>
                    </Box>
                </Stack>
            )}
        </DashboardBodyCard>
    )

    const items = {
        details: detailsCard,
        contacts: contactsCard,
        addresses: addressesCard,
        documents: documentsCard,
        bankAccounts: bankAccountCard,
        relationships: relationshipsCard,
        tenant: tenantCard,
        systemInfo: systemInfoCard,
    }

    const defaultLayout = {
        col1: ['details', 'contacts', 'addresses', 'tenant'],
        col2: ['documents', 'bankAccounts', 'relationships', 'systemInfo'],
    }

    return (
        <>
            <DashboardModal
                open={open}
                onClose={onClose}
                title={people && !loading ? people.name : 'Carregando...'}
                hasData={!!people}
                loading={loading}
                useSkeleton={true}
                layoutKey="people-dashboard-layout"
            >
                {people && (
                    <DashboardStack>
                        <DashboardTopCard
                            title={people.name}
                            accessMode={getAccessMode(permissions, 'erp:pessoas')}
                            layoutKey="people-dashboard-layout"
                            action={canEdit(getAccessMode(permissions, 'erp:pessoas')) && (
                                <Button
                                    variant="outlined"
                                    onClick={handleStartEdit}
                                >
                                    <Edit fontSize="small" />
                                </Button>
                            )}
                        >
                            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    {people.cpfCnpj}
                                </Typography>
                                <Divider orientation="vertical" flexItem sx={{ height: 16, alignSelf: 'center' }} />
                                <Chip
                                    label={people.tenantName || 'Tenant Padrão'}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    icon={<Storage sx={{ fontSize: '0.9rem !important' }} />}
                                    sx={{ fontWeight: 600, px: 0.5 }}
                                />
                                <Chip
                                    label={people.details?.occupation || 'Pessoa'}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontWeight: 500 }}
                                />
                            </Box>
                        </DashboardTopCard>

                        <DashboardDnDGrid
                            items={items}
                            defaultLayout={defaultLayout}
                            layoutKey="people-dashboard-layout"
                        />
                    </DashboardStack>
                )}
            </DashboardModal>

            {people && (
                <>
                    <PeopleFormDialog
                        open={editOpen}
                        onClose={() => setEditOpen(false)}
                        onSave={handleSaveEdit}
                        title="Editar Pessoa"
                        initialValues={{
                            name: editForm.name,
                            cpfCnpj: editForm.cpfCnpj,
                            tenantId: editForm.tenantId,
                            usuarioId: editForm.usuarioId
                        }}
                        saving={updatePerson.isPending}
                    />

                    <PeopleContactDialog
                        open={contactDialogOpen}
                        onClose={() => setContactDialogOpen(false)}
                        onSave={handleSaveContactFn}
                        editingContact={editingContact}
                        saving={addContact.isPending || updateContact.isPending}
                    />

                    <PeopleAddressDialog
                        open={addressDialogOpen}
                        onClose={() => setAddressDialogOpen(false)}
                        onSave={handleSaveAddressFn}
                        editingAddress={editingAddress}
                        saving={addAddress.isPending || updateAddress.isPending}
                    />

                    <PeopleBankAccountDialog
                        open={bankDialogOpen}
                        onClose={() => setBankDialogOpen(false)}
                        onSave={handleSaveAccountFn}
                        editingAccount={editingAccount}
                        saving={addBankAccount.isPending || updateBankAccount.isPending}
                    />

                    <PeopleDocumentDialog
                        open={documentDialogOpen}
                        onClose={() => setDocumentDialogOpen(false)}
                        onSave={handleSaveDocumentFn}
                        editingDocument={editingDocument}
                        saving={addDocument.isPending || updateDocument.isPending}
                    />

                    <PeopleDetailsDialog
                        open={detailsDialogOpen}
                        onClose={() => setDetailsDialogOpen(false)}
                        onSave={handleSaveDetailsFn}
                        people={people}
                        saving={updateDetailMutation.isPending || createDetailMutation.isPending}
                    />

                    <PeopleRelationshipDialog
                        open={relationshipDialogOpen}
                        onClose={() => setRelationshipDialogOpen(false)}
                        onSave={handleSaveRelationshipFn}
                        editingRelationship={editingRelationship}
                        saving={addRelationship.isPending || updateRelationship.isPending}
                        relationshipTypes={relationshipTypes}
                        allPeoples={allPeoples.filter(p => p.id !== people.id)}
                    />
                </>
            )}

            <Toast
                open={snackbar.open}
                message={snackbar.message}
                onClose={handleCloseSnackbar}
                severity={snackbar.severity}
            />
        </>
    )
}

const BankNameDisplay = ({ code }: { code: string }) => {
    const [name, setName] = useState('')

    React.useEffect(() => {
        getBankName(code).then(setName)
    }, [code])

    if (!name) return null

    return (
        <Typography variant="subtitle2" sx={{ fontWeight: 'normal' }}>
            - {name}
        </Typography>
    )
}

export default PeopleDashboard
