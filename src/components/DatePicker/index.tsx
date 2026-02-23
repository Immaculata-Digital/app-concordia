import { useState, useEffect, useRef } from 'react'
import {
  TextField,
  Popover,
  Box,
  IconButton,
  Typography,
  Button,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material'
import { CalendarToday, Close } from '@mui/icons-material'
import { type AccessMode } from '../Dashboard/DashboardBodyCard'
import { isHidden as checkIsHidden, isReadOnly as checkIsReadOnly } from '../../utils/accessControl'
import './style.css'

type DatePickerProps = {
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
  /** Quando true, o popover do calendário é exibido sempre em tema escuro */
  forceDarkCalendar?: boolean
}

// Normalizar o valor da data para formato YYYY-MM-DD (sem problemas de fuso horário)
const normalizeDate = (dateValue: string): string => {
  if (!dateValue) return ''
  // Se já está no formato YYYY-MM-DD, retorna como está
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue
  }
  // Tenta converter de outros formatos
  try {
    // Se for uma string de data no formato YYYY-MM-DD, criar data local
    if (/^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
      const dateStr = dateValue.substring(0, 10)
      const [year, month, day] = dateStr.split('-').map(Number)
      const date = new Date(year, month - 1, day)
      // Formatar de volta para YYYY-MM-DD
      const yearStr = date.getFullYear().toString()
      const monthStr = (date.getMonth() + 1).toString().padStart(2, '0')
      const dayStr = date.getDate().toString().padStart(2, '0')
      return `${yearStr}-${monthStr}-${dayStr}`
    }
    // Para outros formatos, usar o Date normal
    const date = new Date(dateValue)
    if (!isNaN(date.getTime())) {
      // Usar métodos locais para evitar problemas de fuso horário
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  } catch {
    // Se falhar, retorna vazio
  }
  return ''
}

const DatePicker = ({
  label,
  value,
  onChange,
  fullWidth = false,
  placeholder = 'Selecione uma data',
  disabled = false,
  error = false,
  helperText,
  required = false,
  accessMode = 'full',
  forceDarkCalendar = false,
}: DatePickerProps) => {
  const isHidden = checkIsHidden(accessMode)
  const isReadOnly = checkIsReadOnly(accessMode)
  const finalDisabled = disabled || isReadOnly

  if (isHidden) return null
  const containerRef = useRef<HTMLDivElement>(null)
  const iconButtonRef = useRef<HTMLButtonElement>(null)
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | HTMLButtonElement | null>(null)
  const [anchorFromIcon, setAnchorFromIcon] = useState(false)

  const normalizedValue = normalizeDate(value || '')
  const [tempDate, setTempDate] = useState(normalizedValue)

  const getViewFromDateStr = (dateStr: string | undefined): { month: number; year: number } => {
    if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [y, m] = dateStr.split('-').map(Number)
      return { month: m - 1, year: y }
    }
    const now = new Date()
    return { month: now.getMonth(), year: now.getFullYear() }
  }

  const initialView = getViewFromDateStr(normalizedValue)
  const [viewMonth, setViewMonth] = useState(initialView.month)
  const [viewYear, setViewYear] = useState(initialView.year)

  // Atualizar tempDate quando o valor externo mudar
  useEffect(() => {
    const newNormalized = normalizeDate(value || '')
    setTempDate((currentTempDate) => {
      if (newNormalized !== currentTempDate) {
        return newNormalized
      }
      return currentTempDate
    })
  }, [value])

  const open = Boolean(anchorEl)

  const openCalendar = (fromIcon: boolean) => {
    if (finalDisabled) return
    if (fromIcon && iconButtonRef.current) {
      setAnchorEl(iconButtonRef.current)
      setAnchorFromIcon(true)
    } else {
      setAnchorEl(containerRef.current)
      setAnchorFromIcon(false)
    }
    const currentValue = tempDate || normalizedValue || ''
    setTempDate(currentValue)
    const { month, year } = getViewFromDateStr(currentValue)
    setViewMonth(month)
    setViewYear(year)
  }

  const handleClose = () => {
    setAnchorEl(null)
    setAnchorFromIcon(false)
  }

  const handleDateSelect = (date: Date) => {
    // Formatar data local sem problemas de fuso horário
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const formattedDate = `${year}-${month}-${day}`
    setTempDate(formattedDate)
    onChange(formattedDate)
    handleClose()
  }

  const handleTodayClick = () => {
    const today = new Date()
    handleDateSelect(today)
  }

  const [localError, setLocalError] = useState(false)
  const [localHelperText, setLocalHelperText] = useState('')

  // ... (existing code)

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (finalDisabled) return
    const newValue = event.target.value

    // Validar se o ano tem mais de 4 dígitos
    const year = newValue.split('-')[0]
    if (year && year.length > 4) {
      return
    }

    setLocalError(false)
    setLocalHelperText('')

    // Atualizar o estado local imediatamente
    setTempDate(newValue)

    // Passar o valor diretamente para o onChange
    onChange(newValue)
  }

  // Handler para quando o campo perder o foco
  const handleBlur = () => {
    if (finalDisabled) return

    if (tempDate) {
      // Validação estrita de data (ex: 31/02)
      const parts = tempDate.split('-')
      if (parts.length === 3) {
        const year = parseInt(parts[0])
        const month = parseInt(parts[1])
        const day = parseInt(parts[2])
        const date = new Date(year, month - 1, day)

        if (
          date.getFullYear() !== year ||
          date.getMonth() !== month - 1 ||
          date.getDate() !== day
        ) {
          setLocalError(true)
          setLocalHelperText('Data inválida')
          return
        }

        // Validação de ano mínimo razoável (opcional, mas evita 0001 se desejado,
        // mas o pedido foi sobre "inválida". Vamos manter validação lógica de calendário)
      }

      // Normalizar a data quando o campo perde o foco
      const normalized = normalizeDate(tempDate)
      if (normalized && normalized !== tempDate) {
        setTempDate(normalized)
        onChange(normalized)
      }
    }
  }

  // Gerar dias do calendário (usa viewMonth/viewYear)
  const getCalendarDays = () => {
    const year = viewYear
    const month = viewMonth

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []

    // Dias vazios do início do mês
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const calendarDays = getCalendarDays()

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ]

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Função para comparar datas sem considerar hora
  const isSameDate = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  const handleViewMonthChange = (newMonth: number) => {
    setViewMonth(newMonth)
  }

  const handleViewYearChange = (newYear: number) => {
    setViewYear(newYear)
  }

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 101 }, (_, i) => currentYear - 50 + i)

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation()
    setTempDate('')
    onChange('')
  }

  return (
    <>
      <Box ref={containerRef} sx={{ position: 'relative' }}>
        <TextField
          label={label}
          value={tempDate || normalizedValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onClick={() => openCalendar(false)}
          fullWidth={fullWidth}
          type="date"
          disabled={finalDisabled}
          error={error || localError}
          helperText={localError ? localHelperText : helperText}
          required={required}
          placeholder={placeholder}
          InputLabelProps={{
            shrink: true,
          }}
          inputProps={{
            max: '9999-12-31',
            readOnly: false,
          }}
          InputProps={{
            endAdornment: (
              <>
                {(tempDate || normalizedValue) && !finalDisabled && (
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClear(e)
                    }}
                    edge="end"
                    size="small"
                    aria-label="Limpar data"
                    disabled={finalDisabled}
                    className="date-picker__clear-btn"
                  >
                    <Close fontSize="small" />
                  </IconButton>
                )}
                <IconButton
                  ref={iconButtonRef}
                  onClick={(e) => {
                    e.stopPropagation()
                    openCalendar(true)
                  }}
                  edge="end"
                  size="small"
                  aria-label="Abrir calendário"
                  disabled={finalDisabled}
                  className="date-picker__toggle-btn"
                >
                  <CalendarToday fontSize="small" />
                </IconButton>
              </>
            ),
          }}
          className="date-picker"
        />
      </Box>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={
          anchorFromIcon
            ? { vertical: 'top', horizontal: 'right' }
            : { vertical: 'bottom', horizontal: 'left' }
        }
        transformOrigin={
          anchorFromIcon
            ? { vertical: 'top', horizontal: 'left' }
            : { vertical: 'top', horizontal: 'left' }
        }
        className="date-picker__popover"
        slotProps={{
          root: forceDarkCalendar ? { className: 'theme-dark' } : undefined,
        }}
      >
        <Box className="date-picker__calendar">
          {/* Cabeçalho: seleção de mês e ano */}
          <Box className="date-picker__header">
            <FormControl size="small" className="date-picker__select" sx={{ minWidth: 120 }}>
              <Select
                value={viewMonth}
                onChange={(e) => handleViewMonthChange(Number(e.target.value))}
                displayEmpty
                variant="outlined"
                MenuProps={{ disableScrollLock: true }}
                aria-label="Mês"
              >
                {monthNames.map((name, index) => (
                  <MenuItem key={name} value={index}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" className="date-picker__select" sx={{ minWidth: 90 }}>
              <Select
                value={viewYear}
                onChange={(e) => handleViewYearChange(Number(e.target.value))}
                displayEmpty
                variant="outlined"
                MenuProps={{ disableScrollLock: true }}
                aria-label="Ano"
              >
                {yearOptions.map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Dias da semana */}
          <Box className="date-picker__weekdays">
            {weekDays.map((day) => (
              <Typography
                key={day}
                variant="caption"
                className="date-picker__weekday"
              >
                {day}
              </Typography>
            ))}
          </Box>

          {/* Grid de dias */}
          <Box className="date-picker__days">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <Box key={index} className="date-picker__day--empty" />
              }

              const dayDate = new Date(day)
              dayDate.setHours(0, 0, 0, 0)
              const isToday = isSameDate(dayDate, today)

              // Verificar se está selecionado comparando datas locais
              let isSelected = false
              if (tempDate && /^\d{4}-\d{2}-\d{2}$/.test(tempDate)) {
                const [year, month, dayValue] = tempDate.split('-').map(Number)
                const selectedDate = new Date(year, month - 1, dayValue)
                isSelected = isSameDate(dayDate, selectedDate)
              }

              return (
                <Button
                  key={index}
                  className={`date-picker__day ${isToday ? 'date-picker__day--today' : ''
                    } ${isSelected ? 'date-picker__day--selected' : ''}`}
                  onClick={() => handleDateSelect(day)}
                >
                  {day.getDate()}
                </Button>
              )
            })}
          </Box>

          {/* Botão Hoje */}
          <Box className="date-picker__footer">
            <Button
              variant="text"
              size="small"
              onClick={handleTodayClick}
              className="date-picker__today-btn"
            >
              Hoje
            </Button>
          </Box>
        </Box>
      </Popover>
    </>
  )
}

export default DatePicker

