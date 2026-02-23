import { useState } from 'react'
import { TextField, IconButton } from '@mui/material'
import { Email, CheckCircle } from '@mui/icons-material'
import { type AccessMode } from '../Dashboard/DashboardBodyCard'
import { isHidden as checkIsHidden, isReadOnly as checkIsReadOnly } from '../../utils/accessControl'
import './style.css'

type MailPickerProps = {
  label?: string
  value: string
  onChange: (value: string) => void
  fullWidth?: boolean
  placeholder?: string
  disabled?: boolean
  error?: boolean
  helperText?: string
  required?: boolean
  accessMode?: AccessMode
}

const isValidEmail = (email: string): boolean => {
  if (!email) return false
  // More strict regex for email validation
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
  return emailRegex.test(email)
}

const MailPicker = ({
  label,
  value = '',
  onChange,
  fullWidth = false,
  placeholder = 'digite@email.com',
  disabled = false,
  error = false,
  helperText,
  required = false,
  accessMode = 'full',
}: MailPickerProps) => {
  const isHidden = checkIsHidden(accessMode)
  const isReadOnly = checkIsReadOnly(accessMode)
  const finalDisabled = disabled || isReadOnly

  if (isHidden) return null
  const [touched, setTouched] = useState(false)

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (finalDisabled) return
    onChange(event.target.value)
  }

  const handleBlur = () => {
    setTouched(true)
  }

  const emailError = error || (touched && value ? !isValidEmail(value) : false)

  return (
    <TextField
      label={label}
      value={value}
      onChange={handleInputChange}
      onBlur={handleBlur}
      fullWidth={fullWidth}
      placeholder={placeholder}
      disabled={finalDisabled}
      error={emailError}
      helperText={helperText || (touched && value && !isValidEmail(value) ? 'Email inválido' : '')}
      type="email"
      required={required}
      InputProps={{
        endAdornment: (
          <IconButton
            edge="end"
            size="small"
            disabled={finalDisabled}
            className="mail-picker__icon-btn"
          >
            {value && isValidEmail(value) ? (
              <CheckCircle className="mail-picker__valid-icon" fontSize="small" />
            ) : (
              <Email className="mail-picker__email-icon" fontSize="small" />
            )}
          </IconButton>
        ),
      }}
      className="mail-picker"
    />
  )
}

export default MailPicker

