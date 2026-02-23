import { useState, useMemo } from 'react'
import { TableCardModal } from '../../../components/Modals'
import SelectPicker from '../../../components/SelectPicker'
import NumberPicker from '../../../components/NumberPicker'
import { Stack } from '@mui/material'
import { useCiclos } from '../../../hooks/queries/ciclos'
import { useModalidades } from '../../../hooks/queries/modalidades'

type GenerateLinkModalProps = {
    open: boolean
    onClose: () => void
    onSave: (data: { cicloId: string; modalidadeId: string; valorContrato: number }) => Promise<void>
    saving?: boolean
}

const GenerateLinkModal = ({ open, onClose, onSave, saving = false }: GenerateLinkModalProps) => {
    const [cicloId, setCicloId] = useState<string | null>(null)
    const [modalidadeId, setModalidadeId] = useState<string | null>(null)
    const [valorContrato, setValorContrato] = useState<number | undefined>(undefined)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const { data: ciclosData = [], isLoading: loadingCiclos } = useCiclos()
    const { data: modalidadesData = [], isLoading: loadingModalidades } = useModalidades()

    const ciclos = useMemo(() =>
        ciclosData.map((c: any) => ({
            label: c.descricao,
            value: c.id,
        })), [ciclosData])

    const modalidades = useMemo(() =>
        modalidadesData.map((m: any) => ({
            label: `${m.rentabilidadePercentual}% - ${m.prazoMeses} meses`,
            value: m.id,
        })), [modalidadesData])

    const handleSave = async () => {
        const newErrors: Record<string, string> = {}

        if (!cicloId) {
            newErrors.cicloId = 'Ciclo é obrigatório'
        }
        if (!modalidadeId) {
            newErrors.modalidadeId = 'Modalidade é obrigatória'
        }
        if (!valorContrato || valorContrato <= 0) {
            newErrors.valorContrato = 'Valor do contrato é obrigatório e deve ser maior que zero'
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        setErrors({})
        await onSave({
            cicloId: cicloId!,
            modalidadeId: modalidadeId!,
            valorContrato: valorContrato!,
        })
    }

    const handleClose = () => {
        setCicloId(null)
        setModalidadeId(null)
        setValorContrato(undefined)
        setErrors({})
        onClose()
    }

    return (
        <TableCardModal
            open={open}
            onClose={handleClose}
            onSave={handleSave}
            title="Gerar Link"
            mode="add"
            saving={saving}
            maxWidth="sm"
        >
            <Stack spacing={3}>
                <SelectPicker
                    label="Ciclo"
                    value={cicloId}
                    onChange={(value) => {
                        setCicloId(value as string | null)
                        if (errors.cicloId) {
                            setErrors((prev) => {
                                const newErrors = { ...prev }
                                delete newErrors.cicloId
                                return newErrors
                            })
                        }
                    }}
                    options={ciclos}
                    fullWidth
                    placeholder="Selecione o ciclo"
                    required
                    disabled={loadingCiclos}
                    error={!!errors.cicloId}
                    helperText={errors.cicloId}
                />

                <SelectPicker
                    label="Modalidade"
                    value={modalidadeId}
                    onChange={(value) => {
                        setModalidadeId(value as string | null)
                        if (errors.modalidadeId) {
                            setErrors((prev) => {
                                const newErrors = { ...prev }
                                delete newErrors.modalidadeId
                                return newErrors
                            })
                        }
                    }}
                    options={modalidades}
                    fullWidth
                    placeholder="Selecione a modalidade"
                    required
                    disabled={loadingModalidades}
                    error={!!errors.modalidadeId}
                    helperText={errors.modalidadeId}
                />

                <NumberPicker
                    label="Valor do Contrato"
                    value={valorContrato}
                    onChange={(value) => {
                        setValorContrato(value)
                        if (errors.valorContrato) {
                            setErrors((prev) => {
                                const newErrors = { ...prev }
                                delete newErrors.valorContrato
                                return newErrors
                            })
                        }
                    }}
                    format="currency"
                    decimalScale={2}
                    min={0.01}
                    fullWidth
                    placeholder="Digite o valor do contrato"
                    required
                    error={!!errors.valorContrato}
                    helperText={errors.valorContrato}
                />
            </Stack>
        </TableCardModal>
    )
}

export default GenerateLinkModal


