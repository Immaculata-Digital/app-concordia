import { TextField } from '@mui/material'
import { useState, useEffect, useRef } from 'react'

type KeyPickerProps = {
  label?: string
  value: string
  onChange: (value: string) => void
  fullWidth?: boolean
  placeholder?: string
  disabled?: boolean
  error?: boolean
  helperText?: string
  required?: boolean
}

const KeyPicker = ({
  label,
  value,
  onChange,
  fullWidth = false,
  placeholder = 'Ex: EMAIL-RESET-PASSWORD',
  disabled = false,
  error = false,
  helperText,
  required = false,
}: KeyPickerProps) => {
  // Garante que value seja sempre uma string
  const safeValue = typeof value === 'string' ? value : ''
  const [localValue, setLocalValue] = useState(safeValue)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sincroniza o valor local com o valor externo
  useEffect(() => {
    if (safeValue !== localValue) {
      setLocalValue(safeValue)
    }
  }, [safeValue])

  const normalizeValue = (val: string): string => {
    let normalized = val

    // Remove caracteres inválidos (mantém apenas letras e hífens)
    normalized = normalized.replace(/[^A-Za-z-]/g, '')

    // Converte para maiúsculo
    normalized = normalized.toUpperCase()

    // Remove hífens consecutivos
    normalized = normalized.replace(/-+/g, '-')

    // Remove hífen do início e fim
    normalized = normalized.replace(/^-+|-+$/g, '')

    return normalized
  }

  const updateValue = (newValue: string) => {
    const normalized = normalizeValue(newValue)
    setLocalValue(normalized)
    onChange(normalized)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateValue(event.target.value)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget as HTMLInputElement
    
    // Intercepta o espaço e converte para hífen imediatamente
    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault()
      event.stopPropagation()
      
      const start = input.selectionStart || 0
      const end = input.selectionEnd || 0
      
      // Usa o valor atual do input (pode ser diferente do localValue durante digitação)
      const currentInputValue = input.value || localValue
      
      // Insere o hífen na posição do cursor
      const newValue = currentInputValue.slice(0, start) + '-' + currentInputValue.slice(end)
      updateValue(newValue)
      
      // Reposiciona o cursor após o hífen inserido
      requestAnimationFrame(() => {
        const normalized = normalizeValue(newValue)
        const newPosition = Math.min(start + 1, normalized.length)
        input.setSelectionRange(newPosition, newPosition)
        input.focus()
      })
      
      return false
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Também intercepta no keyPress para garantir que o espaço não seja processado
    if (event.key === ' ') {
      event.preventDefault()
      return false
    }
  }

  return (
    <TextField
      inputRef={inputRef}
      label={label}
      value={localValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onKeyPress={handleKeyPress}
      fullWidth={fullWidth}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
      helperText={helperText || 'Apenas letras maiúsculas e hífens.'}
      required={required}
      inputProps={{
        style: {
          fontFamily: 'monospace',
        },
      }}
    />
  )
}

export default KeyPicker

