import { useState, useEffect, useRef } from 'react'
import {
    TextField,
    IconButton,
    InputAdornment,
    CircularProgress
} from '@mui/material'
import { Close, LocationOn, CheckCircle, Error } from '@mui/icons-material'

import { type AccessMode } from '../Dashboard/DashboardBodyCard'
import { isHidden as checkIsHidden, isReadOnly as checkIsReadOnly } from '../../utils/accessControl'
import './style.css'

type CEPPickerProps = {
    label?: string
    value: string
    onChange: (value: string) => void
    onAddressFetched?: (address: {
        street: string
        neighborhood: string
        city: string
        state: string
        complement: string
    }) => void
    fullWidth?: boolean
    required?: boolean
    disabled?: boolean
    error?: boolean
    helperText?: string
    accessMode?: AccessMode
}

const cleanCEP = (str: string) => str.replace(/\D/g, '')

const formatCEP = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{3})\d+?$/, '$1')
}

const CEPPicker = ({
    label = 'CEP',
    value,
    onChange,
    onAddressFetched,
    fullWidth = false,
    required = false,
    disabled = false,
    error: errorProp = false,
    helperText: helperTextProp,
    accessMode = 'full'
}: CEPPickerProps) => {
    const isHidden = checkIsHidden(accessMode)
    const isReadOnly = checkIsReadOnly(accessMode)
    const finalDisabled = disabled || isReadOnly

    if (isHidden) return null
    const [loading, setLoading] = useState(false)
    const [fetchError, setFetchError] = useState(false)
    const [lastFetchedCEP, setLastFetchedCEP] = useState(cleanCEP(value))
    const inputRef = useRef<HTMLInputElement>(null)

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value
        const formatted = formatCEP(newValue)
        onChange(formatted)
    }

    const handleClear = () => {
        onChange('')
        setFetchError(false)
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }

    useEffect(() => {
        const clean = cleanCEP(value)

        // Reset error if user clears input or changes it
        if (clean.length < 8) {
            setFetchError(false)
            return
        }

        // Only fetch if 8 digits and different from last fetched to avoid loops/duplicates
        if (clean.length === 8 && clean !== lastFetchedCEP && !loading) {
            fetchAddress(clean)
        }
    }, [value])

    const fetchAddress = async (cep: string) => {
        setLoading(true)
        setFetchError(false)
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
            const data = await response.json()

            if (data.erro) {
                setFetchError(true)
            } else {
                setLastFetchedCEP(cep)
                if (onAddressFetched) {
                    onAddressFetched({
                        street: data.logradouro,
                        neighborhood: data.bairro,
                        city: data.localidade,
                        state: data.uf,
                        complement: data.complemento || ''
                    })
                }
            }
        } catch (error) {
            console.error('Error fetching CEP:', error)
            setFetchError(true)
        } finally {
            setLoading(false)
        }
    }

    const showClearButton = !finalDisabled && value && value.length > 0
    const displayError = errorProp || fetchError
    const displayHelperText = helperTextProp || (fetchError ? 'CEP não encontrado' : '')

    return (
        <TextField
            inputRef={inputRef}
            label={label}
            value={value}
            onChange={handleChange}
            fullWidth={fullWidth}
            required={required}
            disabled={finalDisabled || loading}
            error={displayError}
            helperText={displayHelperText}
            placeholder="00000-000"
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <LocationOn className="cep-picker-icon" />
                    </InputAdornment>
                ),
                endAdornment: (
                    <InputAdornment position="end">
                        {loading && <CircularProgress size={20} className="cep-picker__loading" />}
                        {!loading && !fetchError && value.length >= 9 && !displayError && (
                            <CheckCircle className="cep-picker__valid-icon" fontSize="small" />
                        )}
                        {!loading && fetchError && (
                            <Error className="cep-picker__error-icon" fontSize="small" />
                        )}
                        {showClearButton && (
                            <IconButton
                                aria-label="limpar cep"
                                onClick={handleClear}
                                edge="end"
                                size="small"
                                disabled={finalDisabled || loading}
                                className="cep-picker__clear-btn"
                            >
                                <Close fontSize="small" />
                            </IconButton>
                        )}
                    </InputAdornment>
                )
            }}
        />
    )
}

export default CEPPicker
