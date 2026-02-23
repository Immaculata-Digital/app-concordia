import { useState, useEffect, useRef } from 'react'
import {
    TextField,
    Box,
    IconButton,
    InputAdornment,
} from '@mui/material'
import { Close, CheckCircle, Error, AssignmentInd } from '@mui/icons-material'
import { type AccessMode } from '../Dashboard/DashboardBodyCard'
import { isHidden as checkIsHidden, isReadOnly as checkIsReadOnly } from '../../utils/accessControl'
import './style.css'

type CPFCNPJPickerProps = {
    label?: string
    value: string
    onChange: (value: string) => void
    fullWidth?: boolean
    placeholder?: string
    disabled?: boolean
    error?: boolean
    helperText?: string
    required?: boolean
    autoFocus?: boolean
    accessMode?: AccessMode
}

// Utils for validation and formatting
export const cleanString = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '')

const formatCPF = (value: string) => {
    return value
        .replace(/([a-zA-Z0-9]{3})([a-zA-Z0-9])/, '$1.$2')
        .replace(/([a-zA-Z0-9]{3})([a-zA-Z0-9])/, '$1.$2')
        .replace(/([a-zA-Z0-9]{3})([a-zA-Z0-9]{1,2})/, '$1-$2')
        .replace(/(-\d{2})[a-zA-Z0-9]+?$/, '$1')
}

const formatCNPJ = (value: string) => {
    return value
        .replace(/([a-zA-Z0-9]{2})([a-zA-Z0-9])/, '$1.$2')
        .replace(/([a-zA-Z0-9]{3})([a-zA-Z0-9])/, '$1.$2')
        .replace(/([a-zA-Z0-9]{3})([a-zA-Z0-9])/, '$1/$2')
        .replace(/([a-zA-Z0-9]{4})([a-zA-Z0-9])/, '$1-$2')
        .replace(/(-\d{2})[a-zA-Z0-9]+?$/, '$1')
}

export const validateCPF = (cpf: string) => {
    const clean = cleanString(cpf)
    if (clean.length !== 11 || !/^\d{11}$/.test(clean) || /^(\d)\1{10}$/.test(clean)) return false

    let soma = 0
    let resto

    for (let i = 1; i <= 9; i++) {
        soma = soma + parseInt(clean.substring(i - 1, i)) * (11 - i)
    }
    resto = (soma * 10) % 11

    if (resto === 10 || resto === 11) resto = 0
    if (resto !== parseInt(clean.substring(9, 10))) return false

    soma = 0
    for (let i = 1; i <= 10; i++) {
        soma = soma + parseInt(clean.substring(i - 1, i)) * (12 - i)
    }
    resto = (soma * 10) % 11

    if (resto === 10 || resto === 11) resto = 0
    if (resto !== parseInt(clean.substring(10, 11))) return false

    return true
}

export const validateCNPJ = (cnpj: string) => {
    const clean = cleanString(cnpj).toUpperCase()
    if (clean.length !== 14) return false

    // Elimina CNPJs invalidos conhecidos
    if (/^([a-zA-Z0-9])\1{13}$/.test(clean)) return false

    // Check if the last two characters are numeric
    if (!/^\d{2}$/.test(clean.substring(12))) return false

    const calculateDigit = (value: string, weights: number[]) => {
        let soma = 0
        for (let i = 0; i < value.length; i++) {
            const char = value[i]
            let charValue: number
            if (/[0-9]/.test(char)) {
                charValue = parseInt(char)
            } else {
                // ASCI - 48 rule for alphanumeric
                charValue = char.charCodeAt(0) - 48
            }
            soma += charValue * weights[i]
        }
        const resultado = soma % 11
        return resultado < 2 ? 0 : 11 - resultado
    }

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

    const dv1 = calculateDigit(clean.substring(0, 12), weights1)
    const dv2 = calculateDigit(clean.substring(0, 13), weights2)

    return dv1 === parseInt(clean.charAt(12)) && dv2 === parseInt(clean.charAt(13))
}

const CPFCNPJPicker = ({
    label = 'CPF/CNPJ',
    value,
    onChange,
    fullWidth = false,
    placeholder = 'Informe o CPF ou CNPJ',
    disabled = false,
    error: errorProp = false,
    helperText: helperTextProp,
    required = false,
    autoFocus = false,
    accessMode = 'full',
}: CPFCNPJPickerProps) => {
    const [focused, setFocused] = useState(false)
    const [isValid, setIsValid] = useState<boolean | null>(null)
    const [internalError, setInternalError] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Auto focus
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus()
        }
    }, [autoFocus])

    // Validate on value change
    useEffect(() => {
        const clean = cleanString(value || '')
        if (clean.length === 0) {
            setIsValid(null)
            setInternalError(false)
            return
        }

        if (clean.length === 11) {
            const valid = validateCPF(clean)
            setIsValid(valid)
            setInternalError(!valid)
        } else if (clean.length === 14) {
            const valid = validateCNPJ(clean)
            setIsValid(valid)
            setInternalError(!valid)
        } else {
            setIsValid(false)
            setInternalError(false)
            if (clean.length > 0) {
                // If length doesn't match standard, it's not valid yet, but don't error immediately unless blurring
            }
        }
    }, [value])

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value
        const clean = cleanString(inputValue).toUpperCase()

        if (clean.length > 14) return

        let formatted = clean
        if (clean.length <= 11 && /^\d*$/.test(clean)) {
            formatted = formatCPF(clean)
        } else {
            formatted = formatCNPJ(clean)
        }

        onChange(formatted)
    }

    const handleClear = () => {
        onChange('')
        setIsValid(null)
        setInternalError(false)
        if (inputRef.current) {
            inputRef.current.focus()
        }
    }

    const handleFocus = () => setFocused(true)
    const handleBlur = () => {
        setFocused(false)
        const clean = cleanString(value)
        if (clean.length === 11) setInternalError(!validateCPF(clean))
        else if (clean.length === 14) setInternalError(!validateCNPJ(clean))
        else if (clean.length > 0) setInternalError(true)
    }

    const displayStartIcon = <AssignmentInd />
    const shouldShowClearButton = !disabled && value && value.length > 0

    let statusIcon = null
    if (value && cleanString(value).length >= 11) {
        if (isValid) {
            statusIcon = <CheckCircle color="success" fontSize="small" />
        } else if (internalError) {
            statusIcon = <Error color="error" fontSize="small" />
        }
    }

    const showError = errorProp || internalError
    const displayHelperText = helperTextProp || (internalError ? 'CPF/CNPJ inválido' : '')

    const isHidden = checkIsHidden(accessMode)
    const isReadOnly = checkIsReadOnly(accessMode)
    const finalDisabled = disabled || isReadOnly

    if (isHidden) return null

    return (
        <Box className="cpf-cnpj-picker-container">
            <TextField
                inputRef={inputRef}
                label={label}
                value={value}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                fullWidth={fullWidth}
                placeholder={placeholder}
                disabled={finalDisabled}
                error={showError}
                helperText={displayHelperText}
                required={required}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Box className="cpf-cnpj-picker__start-icon">{displayStartIcon}</Box>
                        </InputAdornment>
                    ),
                    endAdornment: (
                        <InputAdornment position="end">
                            {statusIcon}
                            {shouldShowClearButton && (
                                <IconButton
                                    aria-label="limpar texto"
                                    onClick={handleClear}
                                    edge="end"
                                    size="small"
                                    disabled={disabled}
                                    className="cpf-cnpj-picker__clear-btn"
                                    sx={{ ml: 1 }}
                                >
                                    <Close fontSize="small" />
                                </IconButton>
                            )}
                        </InputAdornment>
                    ),
                }}
                className={`cpf-cnpj-picker ${focused ? 'cpf-cnpj-picker--focused' : ''} ${showError ? 'cpf-cnpj-picker--error' : ''
                    }`}
            />
        </Box>
    )
}

export default CPFCNPJPicker
