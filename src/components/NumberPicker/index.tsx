import { useState, useEffect, useRef } from 'react'
import {
    TextField,
    Box,
    IconButton,
    InputAdornment,
} from '@mui/material'
import { Close } from '@mui/icons-material'
import './style.css'

export type NumberPickerFormat = 'integer' | 'decimal' | 'currency' | 'percent'

export type NumberPickerProps = {
    label?: string
    value?: number | string
    onChange: (value: number | undefined) => void
    format?: NumberPickerFormat
    decimalScale?: number
    min?: number
    max?: number
    fullWidth?: boolean
    placeholder?: string
    disabled?: boolean
    error?: boolean
    helperText?: string
    required?: boolean
    showClearButton?: boolean
    startIcon?: React.ReactNode
    autoFocus?: boolean
    name?: string
    onBlur?: () => void
}

const NumberPicker = ({
    label,
    value,
    onChange,
    format = 'decimal',
    decimalScale = 2,
    min,
    max,
    fullWidth = false,
    placeholder,
    disabled = false,
    error = false,
    helperText,
    required = false,
    showClearButton = true,
    startIcon,
    autoFocus = false,
    name,
    onBlur,
}: NumberPickerProps) => {
    const [focused, setFocused] = useState(false)
    const [displayValue, setDisplayValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    // Helper to parse number from diverse formats string
    const parseNumber = (val: string): number | undefined => {
        if (!val) return undefined
        // Replace comma with dot for parsing, remove non-numeric chars except . -
        // However, for pt-BR, thousands are dot, decimal is comma.
        // If we assume user types simplified numbers or pasted formatted ones.
        // Let's assume standard input: digits, one comma or dot as decimal separator.

        // Check if it looks like a formatted currency/number (e.g. 1.234,56)
        // Remove "R$", "%", spaces
        let clean = val.replace(/[R$%\s]/g, '')

        // Handle thousands separators if present? 
        // Simplest strategy: Remove all dots, replace comma with dot. 
        // BUT if the user types standard US "1.234", this logic breaks.
        // Let's enforce a convention: Typed input treats Comma as decimal separator (standard BR).
        // Or if there are dots and commas, assume last one is decimal.

        // For editing state (simple):
        // We expect user to type "1234,56". 
        clean = clean.replace(/\./g, '').replace(',', '.')

        const num = parseFloat(clean)
        return isNaN(num) ? undefined : num
    }

    // Format number to string for display (Blur state)
    const formatDisplay = (val: number | undefined | string): string => {
        if (val === undefined || val === '' || val === null) return ''
        const num = typeof val === 'string' ? parseFloat(val) : val
        if (isNaN(num)) return ''

        const locale = 'pt-BR'
        const options: Intl.NumberFormatOptions = {
            minimumFractionDigits: format === 'integer' ? 0 : decimalScale,
            maximumFractionDigits: format === 'integer' ? 0 : decimalScale,
        }

        if (format === 'currency') {
            return num.toLocaleString(locale, { ...options, style: 'currency', currency: 'BRL' })
        }
        if (format === 'percent') {
            // Note: Intl % expects 0.1 for 10%. We usually want user to type 10 for 10%.
            // We will handle this by appending % manually instead of using style:'percent' which multiplies by 100.
            return num.toLocaleString(locale, options) + '%'
        }

        return num.toLocaleString(locale, options)
    }

    // Format number for editing (Focus state) - e.g. "1234,56"
    const formatEdit = (val: number | undefined | string): string => {
        if (val === undefined || val === '' || val === null) return ''
        const num = typeof val === 'string' ? parseFloat(val) : val
        if (isNaN(num)) return ''

        // For currency format, format with locale pt-BR (same as display format)
        if (format === 'currency') {
            return num.toLocaleString('pt-BR', {
                minimumFractionDigits: decimalScale,
                maximumFractionDigits: decimalScale,
            })
        }

        // Just convert to string with comma as decimal
        // using toLocaleString without grouping (thousands separators) sometimes helps editing,
        // but users might like grouping. Let's keep it simple: no grouping, comma decimal.
        return num.toLocaleString('pt-BR', { useGrouping: false, maximumFractionDigits: 10 })
    }

    // Update display value when value prop changes (and not focused, to avoid cursor jumps)
    useEffect(() => {
        if (!focused) {
            setDisplayValue(formatDisplay(value))
        }
    }, [value, format, decimalScale, focused])

    // Initial autoFocus
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus()
        }
    }, [autoFocus])

    const handleFocus = () => {
        setFocused(true)
        // When focusing, switch to editable format
        const num = typeof value === 'string' ? parseFloat(value) : value
        
        // For currency format, if empty, leave empty so user can start typing
        // The auto-formatting in handleChange will handle the formatting
        if (format === 'currency' && (num === undefined || num === null || num === 0)) {
            setDisplayValue('')
        } else {
            setDisplayValue(formatEdit(num))
        }
    }

    const handleBlur = () => {
        setFocused(false)

        // Validate bounds on blur
        let num = parseNumber(displayValue)
        if (num !== undefined) {
            if (min !== undefined && num < min) num = min
            if (max !== undefined && num > max) num = max

            // Update parent if changed due to clamping
            if (num !== value) {
                onChange(num)
            }
        }

        // Reformat to display format
        setDisplayValue(formatDisplay(num !== undefined ? num : value))
        if (onBlur) onBlur()
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = e.target.value

        // Filter input: allow digits, comma, dot, minus (if min < 0 or not specified)
        // Also allow R$ % space if they are just not deleted yet? 
        // Actually simpler to just strip invalid chars immediately.


        // Checking every char is tricky with copy-paste.
        // Let's just sanitise.
        // But we need to allow intermediate states like "-" or "12,".

        // Basic validation to prevent typing invalid chars
        // We allow one comma.

        // If format is integer, disallow comma/dot
        if (format === 'integer' && errorCheck(newVal, /[^0-9-]/)) return

        // Special handling for currency format (matching app-admin-v2 behavior)
        if (format === 'currency') {
            // Remove all non-numeric characters
            const numbers = newVal.replace(/\D/g, '')
            
            // If empty, allow it
            if (numbers === '') {
                setDisplayValue('')
                onChange(undefined)
                return
            }
            
            // Treat all digits as cents (divide by 100)
            const amount = parseFloat(numbers) / 100
            
            // Format as currency with locale pt-BR
            const formatted = amount.toLocaleString('pt-BR', {
                minimumFractionDigits: decimalScale,
                maximumFractionDigits: decimalScale,
            })
            
            setDisplayValue(formatted)
            
            // Parse and trigger onChange
            const numericValue = parseFloat(formatted.replace(/\./g, '').replace(',', '.'))
            if (!isNaN(numericValue)) {
                onChange(numericValue)
            } else {
                onChange(undefined)
            }
            return
        }

        // If not integer, allow numbers, minus, and ONE comma
        if (format !== 'integer') {
            // Check for valid chars
            // Replace dot with comma for consistency if user types dot
            const normalized = newVal.replace(/\./g, ',')
            if (normalized.split(',').length > 2) return // More than one comma
            if (errorCheck(normalized, /[^0-9,-]/)) return

            // Handle decimal scale limiting during typing?
            // If "1,234" and scale is 2, prevent typing '4'.
            const parts = normalized.split(',')
            if (parts[1] && parts[1].length > decimalScale) return

            setDisplayValue(normalized)

            // Parse and trigger onChange
            // We only trigger onChange if it's a valid number
            const parsed = parseNumber(normalized)
            if (parsed !== undefined && !isNaN(parsed)) {
                // Check max value while typing? 
                // If we block typing above max, user can't type 100 if limit is 50.
                // Is that desired? "limitar o valor máximo ... permitido no campo".
                // Usually better to allow typing and show error or clamp on blur.
                // Prompt says "As formatações não inteiras, deve permitir limitar a quantidade de casas decimais." -> Handled above.
                // "Permita nas propriedades limitar o valor máximo e mínimo".
                // Let's clamp on blur, but valid number updates immediately.

                onChange(parsed)
            } else if (normalized === '' || normalized === '-') {
                onChange(undefined)
            }
            return
        }

        setDisplayValue(newVal)
        const parsed = parseNumber(newVal)
        if (parsed !== undefined && !isNaN(parsed)) {
            onChange(parsed)
        } else if (newVal === '' || newVal === '-') {
            onChange(undefined)
        }
    }

    const errorCheck = (str: string, regex: RegExp) => {
        return regex.test(str.replace(/-/g, '')) // Allow minus generally, check other chars
            || (str.indexOf('-') > 0) // Minus must be first
    }

    const handleClear = () => {
        onChange(undefined)

        // Only trigger focus if not already focused. 
        // Focus usually triggers handleFocus which might re-read the old 'value' prop.
        if (inputRef.current && document.activeElement !== inputRef.current) {
            inputRef.current.focus()
        }

        // Garante que o valor exibido seja limpo mesmo que o focus() tenha disparado o handleFocus
        setDisplayValue('')
    }

    const shouldShowClearButton = showClearButton && !disabled && (value !== undefined && value !== '')

    return (
        <Box className="number-picker-container">
            <TextField
                inputRef={inputRef}
                label={label}
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                fullWidth={fullWidth}
                placeholder={placeholder}
                disabled={disabled}
                error={error}
                helperText={helperText}
                required={required}
                name={name}
                inputProps={{
                    inputMode: format === 'integer' ? 'numeric' : 'decimal',
                    autoComplete: 'off'
                }}
                InputProps={{
                    startAdornment: format === 'currency' ? (
                        <InputAdornment position="start">
                            <Box className="number-picker__start-icon" sx={{ color: focused ? 'var(--color-primary)' : 'var(--color-on-secondary)' }}>
                                R$
                            </Box>
                        </InputAdornment>
                    ) : startIcon ? (
                        <InputAdornment position="start">
                            <Box className="number-picker__start-icon">{startIcon}</Box>
                        </InputAdornment>
                    ) : undefined,
                    endAdornment: shouldShowClearButton ? (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="limpar valor"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={handleClear}
                                edge="end"
                                size="small"
                                disabled={disabled}
                                className="number-picker__clear-btn"
                            >
                                <Close fontSize="small" />
                            </IconButton>
                        </InputAdornment>
                    ) : undefined,
                }}
                className={`number-picker ${focused ? 'number-picker--focused' : ''} ${error ? 'number-picker--error' : ''
                    }`}
            />
        </Box>
    )
}

export default NumberPicker
