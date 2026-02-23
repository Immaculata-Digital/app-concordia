import { useRef, useEffect } from 'react'
import { Box, IconButton, Stack, TextField, InputAdornment } from '@mui/material'
import { Search, Close } from '@mui/icons-material'
import './style.css'

type PickerSearchBarProps = {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    onClear?: () => void
    onKeyDown?: (e: React.KeyboardEvent) => void
    autoFocus?: boolean
    className?: string
    fullWidth?: boolean
}

const PickerSearchBar = ({
    value,
    onChange,
    placeholder = 'Buscar...',
    onClear,
    onKeyDown,
    autoFocus = false,
    className = '',
    fullWidth = true,
}: PickerSearchBarProps) => {
    const searchInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (autoFocus && searchInputRef.current) {
            setTimeout(() => {
                searchInputRef.current?.focus()
            }, 100)
        }
    }, [autoFocus])

    const handleClear = () => {
        if (onClear) {
            onClear()
        } else {
            onChange('')
        }
        searchInputRef.current?.focus()
    }

    return (
        <Box
            className={`picker-search-bar ${value ? 'picker-search-bar--has-value' : ''} ${className}`}
            sx={{ width: fullWidth ? '100%' : 'auto' }}
        >
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flex: 1 }}>
                <TextField
                    inputRef={searchInputRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={placeholder}
                    fullWidth
                    size="small"
                    autoComplete="off"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search fontSize="small" className="picker-search-bar__icon" />
                            </InputAdornment>
                        ),
                        endAdornment: value ? (
                            <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={handleClear}
                                    className="picker-search-bar__clear"
                                    edge="end"
                                >
                                    <Close fontSize="small" />
                                </IconButton>
                            </InputAdornment>
                        ) : null,
                    }}
                />
            </Stack>
        </Box>
    )
}

export default PickerSearchBar
