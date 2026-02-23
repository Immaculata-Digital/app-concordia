import { useState, useEffect, useMemo } from 'react'
import { Grid } from '@mui/material'
import { TableCardModal } from '../../../components/Modals'
import SelectPicker from '../../../components/SelectPicker'
import TextPicker from '../../../components/TextPicker'
import BankCodePicker from '../../../components/BankCodePicker'
import SwitchPicker from '../../../components/SwitchPicker'
import { getContextualAccessMode, canEdit, canCreate, getAccessMode } from '../../../utils/accessControl'
import { useAuth } from '../../../context/AuthContext'
import { type PeopleBankAccount } from '../../../services/people'

interface PeopleBankAccountDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: any) => void
    editingAccount: PeopleBankAccount | null
    saving: boolean
}

const PeopleBankAccountDialog = ({ open, onClose, onSave, editingAccount, saving }: PeopleBankAccountDialogProps) => {
    const { permissions } = useAuth()
    const [bankForm, setBankForm] = useState({
        bankCode: '',
        branchCode: '',
        accountNumber: '',
        accountType: 'Pagamento',
        pixKey: '',
        isDefaultReceipt: false
    })

    const initialBankForm = useMemo(() => ({
        bankCode: editingAccount?.bankCode || '',
        branchCode: editingAccount?.branchCode || '',
        accountNumber: editingAccount?.accountNumber || '',
        accountType: editingAccount?.accountType || 'Pagamento',
        pixKey: editingAccount?.pixKey || '',
        isDefaultReceipt: editingAccount?.isDefaultReceipt || false
    }), [editingAccount])

    useEffect(() => {
        if (open) {
            setBankForm(initialBankForm)
        }
    }, [open, initialBankForm])

    const isBankDirty = useMemo(() => JSON.stringify(bankForm) !== JSON.stringify(initialBankForm), [bankForm, initialBankForm])

    const handleSave = () => {
        onSave(bankForm)
    }

    const accessMode = getAccessMode(permissions, 'erp:pessoas')

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            mode={editingAccount ? 'edit' : 'add'}
            saving={saving}
            isDirty={isBankDirty}
            title="Dados Bancários"
            maxWidth="sm"
            canSave={(editingAccount ? canEdit : canCreate)(accessMode)}
        >
            <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                    <SelectPicker
                        label="Tipo de Conta"
                        value={bankForm.accountType}
                        onChange={(val: any) => setBankForm(prev => ({ ...prev, accountType: val as string }))}
                        options={[
                            { value: 'Pagamento', label: 'Pagamento' },
                            { value: 'Poupança', label: 'Poupança' }
                        ]}
                        fullWidth
                        required
                        accessMode={getContextualAccessMode(accessMode, !!editingAccount)}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                    <BankCodePicker
                        label="Código do Banco"
                        value={bankForm.bankCode}
                        onChange={(val: any) => setBankForm(prev => ({ ...prev, bankCode: val }))}
                        fullWidth
                        required
                        accessMode={getContextualAccessMode(accessMode, !!editingAccount)}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextPicker
                        label="Agência"
                        value={bankForm.branchCode}
                        onChange={(val: any) => setBankForm(prev => ({ ...prev, branchCode: val.replace(/\D/g, '') }))}
                        fullWidth
                        required
                        accessMode={getContextualAccessMode(accessMode, !!editingAccount)}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 8 }}>
                    <TextPicker
                        label="Conta"
                        value={bankForm.accountNumber}
                        onChange={(val: any) => setBankForm(prev => ({ ...prev, accountNumber: val.replace(/\D/g, '') }))}
                        fullWidth
                        required
                        accessMode={getContextualAccessMode(accessMode, !!editingAccount)}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextPicker
                        label="Chave PIX"
                        value={bankForm.pixKey}
                        onChange={(val: any) => setBankForm(prev => ({ ...prev, pixKey: val }))}
                        fullWidth
                        placeholder="CPF, Email, Telefone, Chave Aleatória"
                        accessMode={getContextualAccessMode(accessMode, !!editingAccount)}
                    />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <SwitchPicker
                        label="Marcar como Conta Principal para Recebimento"
                        checked={bankForm.isDefaultReceipt}
                        onChange={(val: any) => setBankForm(prev => ({ ...prev, isDefaultReceipt: val }))}
                        accessMode={getContextualAccessMode(accessMode, !!editingAccount)}
                    />
                </Grid>
            </Grid>
        </TableCardModal>
    )
}

export default PeopleBankAccountDialog
