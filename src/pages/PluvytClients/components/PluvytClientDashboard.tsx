
import { useState } from 'react'
import Toast from '../../../components/Toast'
import {
    Edit,
    LocationOn,
    Email,
    Phone,
    Storage,
    AccountBalance,
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
} from '../../../services/people'
import { useAuth } from '../../../context/AuthContext'
import {
    getAccessMode,
    canEdit,
} from '../../../utils/accessControl'
import { DashboardTopCard } from '../../../components/Dashboard/DashboardTopCard'
import { DashboardBodyCard } from '../../../components/Dashboard/DashboardBodyCard'
import { DashboardBodyCardList } from '../../../components/Dashboard/DashboardBodyCardList'
import { formatDateDisplay } from '../../../utils/date'
import { parsePhoneNumber, formatPhoneNumber } from '../../../components/PhonePicker/utils'
import { DashboardModal } from '../../../components/Modals'
import { DashboardDnDGrid } from '../../../components/Dashboard/DashboardDnDGrid'
import { DashboardStack } from '../../../components/Dashboard/DashboardStack'

import { usePerson } from '../../../hooks/queries/people'
import { usePluvytClient } from '../../../hooks/queries/pluvytClients'
import { PluvytClientFormDialog } from './PluvytClientFormDialog'

const MARITAL_STATUS_MAP: Record<string, string> = {
    'Single': 'Solteiro(a)',
    'Married': 'Casado(a)',
    'Divorced': 'Divorciado(a)',
    'Widowed': 'Viúvo(a)',
    'Separated': 'Separado(a)',
}

interface PluvytClientDashboardProps {
    open: boolean
    onClose: () => void
    clientId: string | null
    onUpdate?: () => void
}

const PluvytClientDashboard = ({ open, onClose, clientId, onUpdate }: PluvytClientDashboardProps) => {
    const { permissions } = useAuth()

    // Data Queries
    const { data: client, isLoading: loadingClient } = usePluvytClient(clientId)
    const { data: people, isLoading: loadingPeople } = usePerson(client?.personId || null)

    const loading = loadingClient || loadingPeople

    const [editOpen, setEditOpen] = useState(false)
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' | 'warning' | 'info' }>({
        open: false,
        message: '',
        severity: 'error'
    })

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false })
    }


    const detailsCard = (
        <DashboardBodyCard
            title="Detalhes"
            accessMode={getAccessMode(permissions, 'erp:pessoas')}
            loading={loading}
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
                </Stack>
            )}
        </DashboardBodyCard >
    )

    const systemInfoCard = (
        <DashboardBodyCard
            title="Informações do Sistema"
            accessMode={getAccessMode(permissions, 'erp:pluvyt-clients')}
            loading={loading}
        >
            {client && (
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" className="dashboard-label">ID do Sistema</Typography>
                        <Typography variant="body2" className="dashboard-value" sx={{ fontFamily: 'monospace' }}>{client.id}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" className="dashboard-label">Criado por</Typography>
                        <Typography variant="body2" className="dashboard-value">{client.createdBy} em {new Date(client.createdAt).toLocaleString()}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" className="dashboard-label">Atualizado por</Typography>
                        <Typography variant="body2" className="dashboard-value">{client.updatedBy} em {new Date(client.updatedAt).toLocaleString()}</Typography>
                    </Grid>
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
            emptyText="Nenhum endereço registrado."
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
            emptyText="Nenhum contato registrado."
        />
    )

    const tenantCard = (
        <DashboardBodyCard
            title="Institucional / Tenant"
            accessMode={getAccessMode(permissions, 'erp:pluvyt-clients')}
            loading={loading}
        >
            {client && (
                <Stack spacing={2}>
                    <Box>
                        <Typography variant="caption" className="dashboard-label" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Storage sx={{ fontSize: '0.75rem' }} /> Tenant do Cliente
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" sx={{ mt: 0.5 }}>
                            {client.tenantId}
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
        tenant: tenantCard,
        systemInfo: systemInfoCard,
    }

    const defaultLayout = {
        col1: ['details', 'contacts', 'addresses'],
        col2: ['tenant', 'systemInfo'],
    }

    return (
        <>
            <DashboardModal
                open={open}
                onClose={onClose}
                title={client && !loading ? (client.personName || 'Cliente') : 'Carregando...'}
                hasData={!!client}
                loading={loading}
                useSkeleton={true}
                layoutKey="pluvyt-clients-dashboard-layout"
            >
                {client && (
                    <DashboardStack>
                        <DashboardTopCard
                            title={client.personName || 'Cliente'}
                            accessMode={getAccessMode(permissions, 'erp:pluvyt-clients')}
                            layoutKey="pluvyt-clients-dashboard-layout"
                            action={canEdit(getAccessMode(permissions, 'erp:pluvyt-clients')) && (
                                <Button
                                    variant="outlined"
                                    onClick={() => setEditOpen(true)}
                                >
                                    <Edit fontSize="small" />
                                </Button>
                            )}
                        >
                            <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
                                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    {client.personCpfCnpj}
                                </Typography>
                                <Divider orientation="vertical" flexItem sx={{ height: 16, alignSelf: 'center' }} />
                                <Chip
                                    label={`Saldo: ${client.saldo}`}
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                    icon={<AccountBalance sx={{ fontSize: '0.9rem !important' }} />}
                                    sx={{ fontWeight: 600, px: 0.5 }}
                                />
                            </Box>
                        </DashboardTopCard>

                        <DashboardDnDGrid
                            items={items}
                            defaultLayout={defaultLayout}
                            layoutKey="pluvyt-clients-dashboard-layout"
                        />
                    </DashboardStack>
                )}
            </DashboardModal>

            {client && (
                <PluvytClientFormDialog
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    clientToEdit={client}
                    onSuccess={(msg) => {
                        setSnackbar({ open: true, message: msg, severity: 'success' })
                        if (onUpdate) onUpdate()
                    }}
                    onError={(msg) => setSnackbar({ open: true, message: msg, severity: 'error' })}
                    accessMode={getAccessMode(permissions, 'erp:pluvyt-clients')}
                />
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

export default PluvytClientDashboard
