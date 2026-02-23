import React, { useEffect, useState } from 'react'
import { Box } from '@mui/material'
import { TableCardModal } from '../../../components/Modals'
import SelectPicker from '../../../components/SelectPicker'
import { getAccessMode, canEdit } from '../../../utils/accessControl'
import { peopleService } from '../../../services/people'
import { formatAddress } from '../../../utils/contractUtils'

interface ClientDialogProps {
    open: boolean
    onClose: () => void
    onSave: (data: { clienteId: string; enderecoId: string }) => void
    initialData: { clienteId: string; enderecoId: string }
    clienteOptions: Array<{ label: string; value: string }>
    permissions: string[]
    saving: boolean
}

const ClientDialog: React.FC<ClientDialogProps> = ({
    open,
    onClose,
    onSave,
    initialData,
    clienteOptions,
    permissions,
    saving,
}) => {
    const [form, setForm] = useState(initialData)
    const [addressOptions, setAddressOptions] = useState<Array<{ label: string; value: string }>>([])

    useEffect(() => {
        if (open) {
            setForm(initialData)
        }
    }, [open, initialData])

    useEffect(() => {
        const syncAddresses = async () => {
            if (form.clienteId && open) {
                try {
                    const cliente = await peopleService.getById(form.clienteId)
                    if (cliente.addresses) {
                        const options = cliente.addresses.map(addr => ({
                            label: formatAddress(addr),
                            value: addr.id
                        }))
                        setAddressOptions(options)

                        // Se o endereço atual não pertence ao novo cliente, seleciona se tiver apenas um ou limpa
                        if (!options.find(opt => opt.value === form.enderecoId)) {
                            const newEnderecoId = options.length === 1 ? options[0].value : ''
                            setForm(prev => ({ ...prev, enderecoId: newEnderecoId }))
                        }
                    } else {
                        setAddressOptions([])
                        setForm(prev => ({ ...prev, enderecoId: '' }))
                    }
                } catch (err) {
                    console.error('Erro ao sincronizar endereços:', err)
                    setAddressOptions([])
                }
            }
        }
        syncAddresses()
    }, [form.clienteId, open])

    const accessMode = getAccessMode(permissions, 'contratos:contratos:cliente')
    const editable = canEdit(accessMode)

    const handleSave = () => {
        onSave(form)
    }

    return (
        <TableCardModal
            open={open}
            onClose={onClose}
            onSave={handleSave}
            title="Cliente do Contrato"
            mode={editable ? 'edit' : 'view'}
            saving={saving}
            canSave={editable}
        >
            <SelectPicker
                label="Cliente"
                value={form.clienteId}
                onChange={(val) => setForm((prev) => ({ ...prev, clienteId: val as string }))}
                options={clienteOptions}
                fullWidth
                placeholder="Selecione o cliente"
                required
                disabled={!editable}
            />
            <Box className="client-dialog__address-box">
                <SelectPicker
                    label="Endereço para o Contrato"
                    value={form.enderecoId}
                    onChange={(val) => setForm((prev) => ({ ...prev, enderecoId: val as string }))}
                    options={addressOptions}
                    fullWidth
                    placeholder={form.clienteId ? "Selecione o endereço" : "Selecione primeiro o cliente"}
                    required
                    disabled={!form.clienteId || !editable}
                />
            </Box>
        </TableCardModal>
    )
}

export default ClientDialog
