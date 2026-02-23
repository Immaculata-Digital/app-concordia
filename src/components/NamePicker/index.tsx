
import {
    TextField,
    InputAdornment,
    IconButton,
} from '@mui/material'
import { Close } from '@mui/icons-material'

type NamePickerProps = {
    label?: string
    value: string
    onChange: (value: string) => void
    fullWidth?: boolean
    required?: boolean
    disabled?: boolean
    error?: boolean
    helperText?: string
    placeholder?: string
}

const NamePicker = ({
    label,
    value,
    onChange,
    fullWidth = false,
    required = false,
    disabled = false,
    error = false,
    helperText,
    placeholder,
}: NamePickerProps) => {


    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange(event.target.value)
    }

    const handleBlur = () => {
        // Validação extra no blur se necessário
    }

    const handleClear = () => {
        onChange('')
    }

    const displayError = error
    const displayHelperText = helperText

    return (
        <TextField
            label={label}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            fullWidth={fullWidth}
            required={required}
            disabled={disabled}
            error={displayError}
            helperText={displayHelperText}
            placeholder={placeholder}
            InputProps={{
                endAdornment: value ? (
                    <InputAdornment position="end">
                        <IconButton
                            aria-label="limpar texto"
                            onClick={handleClear}
                            edge="end"
                            size="small"
                            disabled={disabled}
                        >
                            <Close fontSize="small" />
                        </IconButton>
                    </InputAdornment>
                ) : undefined,
            }}
        />
    )
}

export default NamePicker
