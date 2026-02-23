import { useState, useEffect } from 'react'
import axios from 'axios'
import SelectPicker, { type SelectOption } from '../SelectPicker'
import { type AccessMode } from '../Dashboard/DashboardBodyCard'

const API_BRASIL_BANKS_URL = 'https://brasilapi.com.br/api/banks/v1'

type Bank = {
    ispb: string
    name: string
    code: number | null
    fullName: string
}

type BankCodePickerProps = {
    label?: string
    value: string
    onChange: (value: string) => void
    fullWidth?: boolean
    required?: boolean
    placeholder?: string
    disabled?: boolean
    error?: boolean
    helperText?: string
    accessMode?: AccessMode
}

const BankCodePicker = ({
    label = "Código do Banco",
    value,
    onChange,
    fullWidth = false,
    required = false,
    placeholder = "Selecione o banco",
    disabled = false,
    error = false,
    helperText,
    accessMode = 'full'
}: BankCodePickerProps) => {
    const [options, setOptions] = useState<SelectOption[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const fetchBanks = async () => {
            setLoading(true)
            try {
                const response = await axios.get<Bank[]>(API_BRASIL_BANKS_URL)

                // Filter banks that have a code and map to SelectOption
                const bankOptions = response.data
                    .filter((bank: Bank) => bank.code !== null)
                    .map((bank: Bank) => ({
                        value: bank.code!.toString().padStart(3, '0'), // Format as 3-digit code
                        label: `${bank.code?.toString().padStart(3, '0')} - ${bank.name} `
                    }))
                    .sort((a, b) => parseInt(a.value as string) - parseInt(b.value as string))

                setOptions(bankOptions)
            } catch (error) {
                console.error("Erro ao carregar bancos:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchBanks()
    }, [])

    const handleChange = (val: string | number | (string | number)[] | null) => {
        if (typeof val === 'string') {
            onChange(val)
        } else if (val === null) {
            onChange('')
        }
    }

    return (
        <SelectPicker
            label={label}
            value={value}
            onChange={handleChange}
            options={options}
            fullWidth={fullWidth}
            required={required}
            placeholder={loading ? "Carregando bancos..." : placeholder}
            searchPlaceholder="Buscar banco por código ou nome"
            disabled={disabled || loading}
            error={error}
            helperText={helperText}
            searchable={true}
            clearable={true}
            emptyText={loading ? "Carregando..." : "Nenhum banco encontrado"}
            accessMode={accessMode}
        />
    )
}

export default BankCodePicker
