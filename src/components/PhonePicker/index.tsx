import { useState, useEffect, useMemo } from 'react'
import {
  TextField,
  Popover,
  Box,
  IconButton,
  Typography,
  MenuItem,
  InputAdornment,
  ListItemText,
} from '@mui/material'
import { Phone, ExpandMore } from '@mui/icons-material'
import { type AccessMode } from '../Dashboard/DashboardBodyCard'
import { isHidden as checkIsHidden, isReadOnly as checkIsReadOnly } from '../../utils/accessControl'
import PickerSearchBar from '../PickerSearchBar'
import './style.css'

import { COUNTRIES, type Country, parsePhoneNumber, formatPhoneNumber } from './utils'

type PhonePickerProps = {
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

const PhonePicker = ({
  label,
  value,
  onChange,
  fullWidth = false,
  placeholder = 'Digite o número',
  disabled = false,
  error = false,
  helperText,
  required = false,
  accessMode = 'full',
}: PhonePickerProps) => {
  const isHidden = checkIsHidden(accessMode)
  const isReadOnly = checkIsReadOnly(accessMode)
  const finalDisabled = disabled || isReadOnly

  if (isHidden) return null
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { country, number } = useMemo(() => parsePhoneNumber(value || ''), [value])
  const [selectedCountry, setSelectedCountry] = useState<Country>(country)
  const [formattedNumber, setFormattedNumber] = useState(number)

  // Atualizar quando o valor externo mudar
  useEffect(() => {
    const parsed = parsePhoneNumber(value || '')
    setSelectedCountry(parsed.country)
    // Formata o número ao carregar ou receber atualização externa
    setFormattedNumber(formatPhoneNumber(parsed.number, parsed.country))
  }, [value])

  const open = Boolean(anchorEl)

  const handleCountryClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (finalDisabled) return
    setAnchorEl(event.currentTarget)
    setSearchQuery('')
  }

  const handleClose = () => {
    setAnchorEl(null)
    setSearchQuery('')
  }

  // Validação de número de telefone (celular ou fixo)
  const isValidPhone = (phoneNumber: string, countryCode: string): boolean => {
    // Remove não numéricos
    const cleanNumber = phoneNumber.replace(/\D/g, '')

    // Validação específica para Brasil
    if (countryCode === 'BR') {
      // Verifica se começa com 55 (Brasil)
      if (!cleanNumber.startsWith('55')) return false

      // Pode ter 12 dígitos (55 + 2 DDD + 8 fixo) ou 13 dígitos (55 + 2 DDD + 9 celular)
      if (cleanNumber.length === 12) {
        // Validação básica de fixo (opcional: verificar se não começa com 0 ou 1 após DDD)
        return true
      }

      if (cleanNumber.length === 13) {
        // Celular: Pega o DDD (posições 2 e 3) e o primeiro dígito do número (posição 4)
        const firstDigit = cleanNumber.substring(4, 5)
        return firstDigit === '9'
      }

      return false
    }

    // Regra genérica para outros países
    return cleanNumber.length >= 10 && cleanNumber.length <= 15
  }

  const [touched, setTouched] = useState(false)

  const handleBlur = () => {
    setTouched(true)
  }

  // Verifica erro
  // O valor 'value' externo já vem completo (ex: 5511999999999)
  const isPhoneValid = value ? isValidPhone(value.replace(/\D/g, ''), selectedCountry.code) : true
  const hasError = error || (touched && !!value && !isPhoneValid)

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country)

    // Atualizar valor mantendo o número digitado mas mudando o DDI
    // Remover DDI antigo do value se existir, ou usar formattedNumber limpo
    let rawNumber = formattedNumber.replace(/\D/g, '')

    // Reformata o número para o novo país
    const formatted = formatPhoneNumber(rawNumber, country)
    setFormattedNumber(formatted)

    // Monta novo valor: DDI (sem +) + número
    const dialCodeClean = country.dialCode.replace(/\D/g, '')
    const newValue = dialCodeClean + rawNumber
    onChange(newValue)
    handleClose()
  }

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (finalDisabled) return
    const inputValue = event.target.value

    // Remove caracteres não numéricos da entrada para processamento
    const inputDigits = inputValue.replace(/\D/g, '')

    // Formatar o número para exibição
    const formatted = formatPhoneNumber(inputDigits, selectedCountry)
    setFormattedNumber(formatted)

    // Para salvar: DDI (sem +) + dígitos do número
    // Precisamos tomar cuidado para não duplicar o DDI se o usuário estiver editando
    // O inputDigits aqui é apenas a parte do número (teoricamente), mas o formatPhoneNumber
    // pode estar tratando de formas diferentes.
    // Vamos assumir que o usuário digita apenas o número local (sem DDI) no input

    const dialCodeClean = selectedCountry.dialCode.replace(/\D/g, '')
    const fullValue = dialCodeClean + inputDigits
    onChange(fullValue)
  }

  // Filtrar países pela busca
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return COUNTRIES
    const query = searchQuery.toLowerCase()
    return COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(query) ||
        country.dialCode.includes(query) ||
        country.code.toLowerCase().includes(query)
    )
  }, [searchQuery])

  return (
    <>
      <TextField
        label={label}
        value={formattedNumber}
        onChange={handleNumberChange}
        onBlur={handleBlur}
        fullWidth={fullWidth}
        placeholder={placeholder}
        disabled={finalDisabled}
        error={hasError}
        helperText={hasError && !error ? 'Telefone inválido' : helperText}
        type="tel"
        required={required}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Box className="phone-picker__country-selector">
                <IconButton
                  onClick={handleCountryClick}
                  edge="start"
                  size="small"
                  disabled={finalDisabled}
                  className="phone-picker__country-btn"
                  aria-label="Selecionar país"
                >
                  <Typography variant="body2" className="phone-picker__flag">
                    {selectedCountry.flag}
                  </Typography>
                  <Typography variant="body2" className="phone-picker__dial-code">
                    {selectedCountry.dialCode}
                  </Typography>
                  <ExpandMore fontSize="small" className="phone-picker__arrow" />
                </IconButton>
              </Box>
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Phone fontSize="small" className="phone-picker__phone-icon" />
            </InputAdornment>
          ),
        }}
        className="phone-picker"
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        className="phone-picker-popover"
      >
        <Box className="phone-picker__country-list">
          {/* Campo de busca */}
          <Box className="phone-picker__search-container">
            <PickerSearchBar
              autoFocus
              placeholder="Buscar país..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </Box>

          {/* Lista de países */}
          <Box className="phone-picker__countries">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <MenuItem
                  key={country.code}
                  onClick={() => handleCountrySelect(country)}
                  selected={selectedCountry.code === country.code}
                  className="phone-picker__country-item"
                >
                  <Typography variant="body2" className="phone-picker__item-flag">
                    {country.flag}
                  </Typography>
                  <ListItemText
                    primary={country.name}
                    secondary={country.dialCode}
                    className="phone-picker__country-text"
                  />
                </MenuItem>
              ))
            ) : (
              <Box className="phone-picker__no-results">
                <Typography variant="body2" color="text.secondary">
                  Nenhum país encontrado
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Popover>
    </>
  )
}

export default PhonePicker

