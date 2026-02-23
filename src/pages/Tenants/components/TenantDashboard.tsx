
import { useState, useMemo } from 'react'
import {
    Box,
    Typography,
    Stack,
    Divider,
    LinearProgress,
    IconButton,
    Button,
} from '@mui/material'
import {
    LocationOnOutlined,
    InfoOutlined,
    EditOutlined,
    AddOutlined,
    DeleteOutline,
} from '@mui/icons-material'
import { DashboardBodyCard } from '../../../components/Dashboard/DashboardBodyCard'
import { DashboardDnDGrid } from '../../../components/Dashboard/DashboardDnDGrid'
import { DashboardModal } from '../../../components/Modals'
import { useTenant, useSaveTenantAddress, useTenantContactMutations } from '../../../hooks/queries/tenants'
import type { AccessMode } from '../../../components/Dashboard/DashboardBodyCard'
import TenantAddressDialog from './TenantAddressDialog'
import TenantContactDialog from './TenantContactDialog'
import { type TenantContactDTO } from '../../../services/tenants'

interface Props {
    tenantId: string | null
    open: boolean
    onClose: () => void
    accessMode?: AccessMode
}

export default function TenantDashboard({ tenantId, open, onClose, accessMode = 'full' }: Props) {
    const { data: tenant, isLoading } = useTenant(tenantId)
    const saveAddressMutation = useSaveTenantAddress()
    const { create: createContact, update: updateContact, remove: removeContact } = useTenantContactMutations(tenantId || '')

    const [addressDialogOpen, setAddressDialogOpen] = useState(false)
    const [contactDialogOpen, setContactDialogOpen] = useState(false)
    const [editingContact, setEditingContact] = useState<TenantContactDTO | null>(null)

    const defaultLayout = useMemo(() => ({
        col1: ['address', 'system'],
        col2: ['contacts'],
        col3: []
    }), [])

    const handleSaveAddress = async (data: any) => {
        if (!tenantId) return
        await saveAddressMutation.mutateAsync({ tenantId, data })
        setAddressDialogOpen(false)
    }

    const handleSaveContact = async (data: any) => {
        if (!tenantId) return
        if (editingContact) {
            await updateContact.mutateAsync({ contactId: editingContact.id, data })
        } else {
            await createContact.mutateAsync(data)
        }
        setContactDialogOpen(false)
        setEditingContact(null)
    }

    const handleDeleteContact = async (contactId: string) => {
        if (!window.confirm('Tem certeza que deseja remover este contato?')) return
        await removeContact.mutateAsync(contactId)
    }

    const items = useMemo(() => {
        if (!tenant) return {}

        return {
            address: (
                <DashboardBodyCard
                    id="address"
                    title="Endereço"
                    accessMode={accessMode}
                    action={
                        <IconButton size="small" onClick={() => setAddressDialogOpen(true)}>
                            <EditOutlined fontSize="small" />
                        </IconButton>
                    }
                >
                    {tenant.address ? (
                        <Stack spacing={1}>
                            <Typography variant="body2">
                                {tenant.address.street}, {tenant.address.number}
                            </Typography>
                            {tenant.address.complement && (
                                <Typography variant="caption" color="text.secondary">
                                    {tenant.address.complement}
                                </Typography>
                            )}
                            <Typography variant="body2">
                                {tenant.address.neighborhood} - {tenant.address.city}/{tenant.address.state}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LocationOnOutlined sx={{ fontSize: 14 }} /> CEP: {tenant.address.postalCode}
                            </Typography>
                        </Stack>
                    ) : (
                        <Box py={2} textAlign="center">
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Nenhum endereço cadastrado.
                            </Typography>
                            <Button variant="outlined" size="small" onClick={() => setAddressDialogOpen(true)} startIcon={<AddOutlined />}>
                                Adicionar
                            </Button>
                        </Box>
                    )}
                </DashboardBodyCard>
            ),
            contacts: (
                <DashboardBodyCard
                    id="contacts"
                    title="Contatos"
                    accessMode={accessMode}
                    action={
                        <IconButton size="small" onClick={() => { setEditingContact(null); setContactDialogOpen(true); }}>
                            <AddOutlined fontSize="small" />
                        </IconButton>
                    }
                >
                    {tenant.contacts && tenant.contacts.length > 0 ? (
                        <Stack spacing={2} divider={<Divider />}>
                            {tenant.contacts.map((contact) => (
                                <Box key={contact.id} display="flex" justifyContent="space-between" alignItems="flex-start">
                                    <Box>
                                        <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                                            {contact.label || contact.contactType}
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                            {contact.contactValue}
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={0.5}>
                                        <IconButton size="small" onClick={() => { setEditingContact(contact); setContactDialogOpen(true); }}>
                                            <EditOutlined fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" color="error" onClick={() => handleDeleteContact(contact.id)}>
                                            <DeleteOutline fontSize="small" />
                                        </IconButton>
                                    </Stack>
                                </Box>
                            ))}
                        </Stack>
                    ) : (
                        <Box py={2} textAlign="center">
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Nenhum contato cadastrado.
                            </Typography>
                            <Button variant="outlined" size="small" onClick={() => { setEditingContact(null); setContactDialogOpen(true); }} startIcon={<AddOutlined />}>
                                Adicionar
                            </Button>
                        </Box>
                    )}
                </DashboardBodyCard>
            ),
            system: (
                <DashboardBodyCard
                    id="system"
                    title="Informações do Sistema"
                    accessMode={accessMode}
                    action={<InfoOutlined color="action" />}
                >
                    <Stack spacing={1}>
                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">ID Externo (UUID):</Typography>
                            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{tenant.id}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Identificador Sequencial:</Typography>
                            <Typography variant="caption">{tenant.seqId}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Criado em:</Typography>
                            <Typography variant="caption">{tenant.createdAt ? new Date(tenant.createdAt).toLocaleString('pt-BR') : '-'}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">Última atualização:</Typography>
                            <Typography variant="caption">{tenant.updatedAt ? new Date(tenant.updatedAt).toLocaleString('pt-BR') : '-'}</Typography>
                        </Box>
                    </Stack>
                </DashboardBodyCard>
            )
        }
    }, [tenant, accessMode])

    return (
        <DashboardModal
            title={tenant?.name || 'Dashboard do Tenant'}
            open={open}
            onClose={onClose}
        >
            {isLoading ? (
                <Box p={4}>
                    <LinearProgress />
                </Box>
            ) : (
                <Box p={2}>
                    <DashboardDnDGrid
                        layoutKey={`tenant-dashboard-${tenantId}`}
                        defaultLayout={defaultLayout}
                        items={items}
                    />

                    <TenantAddressDialog
                        open={addressDialogOpen}
                        onClose={() => setAddressDialogOpen(false)}
                        onSave={handleSaveAddress}
                        initialData={tenant?.address}
                        saving={saveAddressMutation.isPending}
                        accessMode={accessMode}
                    />

                    <TenantContactDialog
                        open={contactDialogOpen}
                        onClose={() => { setContactDialogOpen(false); setEditingContact(null); }}
                        onSave={handleSaveContact}
                        editingContact={editingContact}
                        saving={createContact.isPending || updateContact.isPending}
                        accessMode={accessMode}
                    />
                </Box>
            )}
        </DashboardModal>
    )
}
