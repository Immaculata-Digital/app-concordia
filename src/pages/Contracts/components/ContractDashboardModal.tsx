import { useState, lazy, Suspense } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import {
    Box,
    Button,
    Typography,
    Chip,
} from '@mui/material'
import { Edit } from '@mui/icons-material'

import Toast from '../../../components/Toast'
import { DashboardTopCard } from '../../../components/Dashboard/DashboardTopCard'
import { DashboardDnDGrid } from '../../../components/Dashboard/DashboardDnDGrid'
import { DashboardStack } from '../../../components/Dashboard/DashboardStack'
import { DashboardModal } from '../../../components/Modals'
import { getAccessMode, canEdit, isHidden } from '../../../utils/accessControl'
import { getContractStatusConfig } from '../../../utils/contractUtils'

const ContractValuesDialog = lazy(() => import('./ContractValuesDialog'))
const ClientDialog = lazy(() => import('./ClientDialog'))
const ComercialDialog = lazy(() => import('./ComercialDialog'))
const ContentDialog = lazy(() => import('./ContentDialog'))
const SignerDialog = lazy(() => import('./SignerDialog'))
const AttachmentDialog = lazy(() => import('./AttachmentDialog'))
const VigenciaDialog = lazy(() => import('./VigenciaDialog'))
import StatusHistoryDialog from './StatusHistoryDialog'

import { useContractDashboard } from '../hooks/useContractDashboard'
import { DashboardClienteCard } from './DashboardClienteCard'
import { DashboardValoresCard } from './DashboardValoresCard'
import { DashboardComercialCard } from './DashboardComercialCard'
import { DashboardContentCard } from './DashboardContentCard'
import { DashboardAttachmentsCard } from './DashboardAttachmentsCard'
import { DashboardSignersCard } from './DashboardSignersCard'
import { DashboardStatusHistoryCard } from './DashboardStatusHistoryCard'
import { DashboardActionsCard } from './DashboardActionsCard'
import { DashboardSystemInfoCard } from './DashboardSystemInfoCard'
import { DashboardVigenciaCard } from './DashboardVigenciaCard'

import '../style.css'

type ContractDashboardProps = {
    contractId: string | null
    open: boolean
    onClose: () => void
    onUpdate?: () => void
}

export const ContractDashboardModal = ({ contractId, open, onClose, onUpdate }: ContractDashboardProps) => {
    const { permissions } = useAuth()

    const {
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
        handleStartEditVigencia,
        handleSaveEdit,
        handleSaveEditCliente,
        handleSaveEditComercial,
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
    } = useContractDashboard({ contractId, open, onUpdate })

    if (!open) return null

    const isCardVisible = (permission: string) => !isHidden(getAccessMode(permissions, permission))

    const cardComponents = {
        actions: isCardVisible('contratos:contratos:acoes') ? (
            <DashboardActionsCard
                className="animate-entrance delay-1"
                permissions={permissions}
                contractContent={contractContent}
                onPreview={handlePreviewContent}
                onPrint={handlePrintContent}
                loading={loadingDashboard}
            />
        ) : null,
        cliente: isCardVisible('contratos:contratos:cliente') ? (
            <DashboardClienteCard
                className="animate-entrance delay-2"
                permissions={permissions}
                clienteName={clienteName}
                clienteEndereco={clienteEndereco}
                onEdit={handleStartEditCliente}
                loading={loadingDashboard}
            />
        ) : null,
        attachments: isCardVisible('contratos:contratos:anexos') ? (
            <DashboardAttachmentsCard
                className="animate-entrance delay-3"
                permissions={permissions}
                attachments={attachments}
                categoryMapping={categoryMapping}
                onAdd={handleAddAttachment}
                onEdit={handleEditAttachment}
                onDelete={handleDeleteAttachment}
                loading={loadingDashboard}
            />
        ) : null,
        valores: isCardVisible('contratos:contratos:valores') ? (
            <DashboardValoresCard
                className="animate-entrance delay-4"
                permissions={permissions}
                modalidadeName={modalidadeName}
                cicloName={cicloName}
                valorContrato={contract?.valorContrato}
                onEdit={handleStartEdit}
                loading={loadingDashboard}
            />
        ) : null,
        content: isCardVisible('contratos:contratos:conteudo') ? (
            <DashboardContentCard
                className="animate-entrance delay-5"
                permissions={permissions}
                contractContent={contractContent}
                onEdit={handleEditContent}
                loading={loadingDashboard}
            />
        ) : null,
        comercial: isCardVisible('contratos:contratos:comercial') ? (
            <DashboardComercialCard
                className="animate-entrance delay-6"
                permissions={permissions}
                promotorName={promotorName}
                onEdit={handleStartEditComercial}
                loading={loadingDashboard}
            />
        ) : null,
        vigencia: isCardVisible('contratos:contratos:vigencia') ? (
            <DashboardVigenciaCard
                className="animate-entrance delay-10"
                permissions={permissions}
                vigenciaDataInicio={contract?.vigenciaDataInicio}
                vigenciaDataFim={contract?.vigenciaDataFim}
                onEdit={handleStartEditVigencia}
                loading={loadingDashboard}
            />
        ) : null,
        statusHistory: isCardVisible('contratos:contratos:historico') ? (
            <DashboardStatusHistoryCard
                className="animate-entrance delay-7"
                permissions={permissions}
                statusHistory={statusHistory}
                statusMapping={statusMapping}
                onAdd={handleStartChangeStatus}
                loading={loadingDashboard}
            />
        ) : null,
        signers: isCardVisible('contratos:contratos:assinantes') ? (
            <DashboardSignersCard
                className="animate-entrance delay-8"
                permissions={permissions}
                signers={signers}
                onAdd={handleAddSigner}
                onEdit={handleEditSigner}
                onDelete={handleDeleteSigner}
                loading={loadingDashboard}
            />
        ) : null,
        systemInfo: (contract && isCardVisible('contratos:contratos')) ? (
            <DashboardSystemInfoCard
                className="animate-entrance delay-9"
                permissions={permissions}
                contract={contract}
                loading={loadingDashboard}
            />
        ) : null
    }

    return (
        <>
            <DashboardModal
                open={open}
                onClose={onClose}
                title="Contrato"
                hasData={!!contract}
                loading={loadingDashboard}
                useSkeleton={true}
                layoutKey="contracts-dashboard-layout"
            >
                {contract && (
                    <>
                        <DashboardTopCard
                            className="animate-entrance"
                            title={`Contrato #${contract.seqId || contract.id.slice(0, 8)}`}
                            accessMode={getAccessMode(permissions, 'contratos:contratos')}
                            layoutKey="contracts-dashboard-layout"
                            action={canEdit(getAccessMode(permissions, 'contratos:contratos')) && (
                                <Button
                                    variant="outlined"
                                    onClick={handleStartEdit}
                                >
                                    <Edit fontSize="small" />
                                </Button>
                            )}
                        >
                            <Box className="contract-dashboard-modal__top-info">
                                <Box className="contract-dashboard-modal__status-box">
                                    <Typography variant="subtitle1" className="dashboard-subtitle">
                                        Status:
                                    </Typography>
                                    <Chip
                                        label={getContractStatusConfig(contract.status, statusMapping).label}
                                        color={getContractStatusConfig(contract.status, statusMapping).color}
                                        size="small"
                                        className="contract-dashboard-modal__status-chip"
                                    />
                                </Box>
                            </Box>
                        </DashboardTopCard>

                        <Box className="contract-dashboard-modal__desktop-grid">
                            <DashboardDnDGrid
                                items={cardComponents}
                                layoutKey="contracts-dashboard-layout"
                                defaultLayout={{
                                    col1: ['actions', 'valores', 'statusHistory'],
                                    col2: ['cliente', 'content', 'signers'],
                                    col3: ['attachments', 'comercial', 'vigencia', 'systemInfo']
                                }}
                            />
                        </Box>

                        <DashboardStack spacing={3} className="contract-dashboard-modal__mobile-stack">
                            {cardComponents.actions}
                            {cardComponents.cliente}
                            {cardComponents.valores}
                            {cardComponents.comercial}
                            {cardComponents.content}
                            {cardComponents.signers}
                            {cardComponents.statusHistory}
                            {cardComponents.attachments}
                            {cardComponents.vigencia}
                            {cardComponents.systemInfo}
                        </DashboardStack>
                    </>
                )}
            </DashboardModal>

            {/* Modal Dialogs */}
            <Suspense fallback={null}>
                <ContractValuesDialog
                    open={editDialogOpen}
                    onClose={() => setEditDialogOpen(false)}
                    onSave={handleSaveEdit}
                    initialData={editForm}
                    cicloOptions={cicloOptions}
                    modalidadeOptions={modalidadeOptions}
                    permissions={permissions}
                    saving={saving}
                />

                <ClientDialog
                    open={clienteDialogOpen}
                    onClose={() => setClienteDialogOpen(false)}
                    onSave={handleSaveEditCliente}
                    initialData={clienteForm}
                    clienteOptions={clienteOptions}
                    permissions={permissions}
                    saving={saving}
                />

                <ComercialDialog
                    open={comercialDialogOpen}
                    onClose={() => setComercialDialogOpen(false)}
                    onSave={handleSaveEditComercial}
                    initialData={comercialForm}
                    promotorOptions={promotorOptions}
                    permissions={permissions}
                    saving={saving}
                />

                <VigenciaDialog
                    open={vigenciaDialogOpen}
                    onClose={() => setVigenciaDialogOpen(false)}
                    onSave={handleSaveEditVigencia}
                    initialData={vigenciaForm}
                    prazoMeses={contract?.modalidade?.prazoMeses || 0}
                    permissions={permissions}
                    saving={saving}
                />

                <ContentDialog
                    open={contentDialogOpen}
                    onClose={() => setContentDialogOpen(false)}
                    onSave={handleSaveContent}
                    initialContent={contractContent}
                    templateOptions={templateOptions}
                    variables={variables}
                    permissions={permissions}
                    saving={savingContent}
                    onToast={(msg, sev) => setToast({ open: true, message: msg, severity: sev })}
                />

                <SignerDialog
                    open={signerDialogOpen}
                    onClose={() => setSignerDialogOpen(false)}
                    onSave={handleSaveSigner}
                    initialData={signerForm}
                    isEditing={!!editingSigner}
                    clienteOptions={clienteOptions}
                    permissions={permissions}
                    saving={savingSigner}
                />

                <AttachmentDialog
                    open={attachmentDialogOpen}
                    onClose={handleCloseAttachmentDialog}
                    onSave={handleSaveAttachment}
                    initialData={attachmentForm}
                    isEditing={!!editingAttachment}
                    permissions={permissions}
                    saving={savingAttachment}
                />

                <StatusHistoryDialog
                    open={historyDialogOpen}
                    onClose={() => setHistoryDialogOpen(false)}
                    onSave={handleSaveHistory}
                    initialData={historyForm}
                    statusOptions={Object.entries(statusMapping).map(([value, label]) => ({ value, label }))}
                    permissions={permissions}
                    saving={savingHistory}
                    onToast={(msg, sev) => setToast({ open: true, message: msg, severity: sev })}
                />
            </Suspense>

            <Toast
                open={toast.open}
                message={toast.message}
                onClose={() => setToast({ ...toast, open: false })}
                severity={toast.severity}
            />
        </>
    )
}

// Wrapper component for routing
const ContractDashboardPage = () => {
    const { id } = useParams<{ id: string }>()
    const [open, setOpen] = useState(true)
    const navigate = useNavigate()

    const handleClose = () => {
        setOpen(false)
        navigate('/contratos')
    }

    return (
        <ContractDashboardModal
            contractId={id || null}
            open={open}
            onClose={handleClose}
        />
    )
}

export default ContractDashboardPage
