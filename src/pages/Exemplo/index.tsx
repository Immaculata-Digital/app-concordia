import { useState } from 'react'
import { Box, Paper } from '@mui/material'
import DatePicker from '../../components/DatePicker'
import MailPicker from '../../components/MailPicker'
import PasswordPicker from '../../components/PasswordPicker'
import TextPicker from '../../components/TextPicker'
import SelectPicker from '../../components/SelectPicker'
import MultiSelectPicker from '../../components/MultiSelectPicker'
import PhonePicker from '../../components/PhonePicker'
import type { SelectOption } from '../../components/SelectPicker'
import type { MultiSelectOption } from '../../components/MultiSelectPicker'
import './style.css'

const ExemploPage = () => {
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedEmail, setSelectedEmail] = useState<string>('')
  const [passwordValue, setPasswordValue] = useState<string>('')
  const [textValue, setTextValue] = useState<string>('')
  const [selectValue, setSelectValue] = useState<string | number | null>(null)
  const [multiSelectValue, setMultiSelectValue] = useState<(string | number)[]>([])
  const [phoneValue, setPhoneValue] = useState<string>('')

  // Opções para o SelectPicker
  const selectOptions: SelectOption[] = [
    { value: 'opcao1', label: 'Opção 1' },
    { value: 'opcao2', label: 'Opção 2' },
    { value: 'opcao3', label: 'Opção 3' },
    { value: 'opcao4', label: 'Opção 4' },
    { value: 'opcao5', label: 'Opção 5' },
  ]

  // Opções para o MultiSelectPicker
  const multiSelectOptions: MultiSelectOption[] = [
    { value: 'item1', label: 'Item 1' },
    { value: 'item2', label: 'Item 2' },
    { value: 'item3', label: 'Item 3' },
    { value: 'item4', label: 'Item 4' },
    { value: 'item5', label: 'Item 5' },
  ]

  return (
    <Box className="exemplo-page">
      <Paper elevation={8} className="exemplo-card">

        <Box className="exemplo-datepicker">
          <DatePicker
            label="Selecione uma data"
            value={selectedDate}
            onChange={setSelectedDate}
            fullWidth
            placeholder="Escolha uma data"
          />
        </Box>

        <Box className="exemplo-mailpicker">
          <MailPicker
            label="Digite seu email"
            value={selectedEmail}
            onChange={setSelectedEmail}
            fullWidth
            placeholder="digite@email.com"
          />
        </Box>

        <Box className="exemplo-passwordpicker">
          <PasswordPicker
            label="Digite sua senha"
            value={passwordValue}
            onChange={setPasswordValue}
            fullWidth
            placeholder="Digite sua senha"
            showStrengthIndicator
          />
        </Box>

        <Box className="exemplo-textpicker">
          <TextPicker
            label="Digite um texto"
            value={textValue}
            onChange={setTextValue}
            fullWidth
            placeholder="Digite aqui..."
          />
        </Box>

        <Box className="exemplo-selectpicker">
          <SelectPicker
            label="Selecione uma opção"
            value={selectValue}
            onChange={(value) => {
              if (Array.isArray(value)) {
                setSelectValue(value.length > 0 ? value[0] : null)
              } else {
                setSelectValue(value)
              }
            }}
            options={selectOptions}
            fullWidth
            placeholder="Escolha uma opção"
          />
        </Box>

        <Box className="exemplo-multiselectpicker">
          <MultiSelectPicker
            label="Selecione múltiplas opções"
            value={multiSelectValue}
            onChange={setMultiSelectValue}
            options={multiSelectOptions}
            fullWidth
            placeholder="Escolha as opções"
          />
        </Box>

        <Box className="exemplo-phonepicker">
          <PhonePicker
            label="Digite o telefone"
            value={phoneValue}
            onChange={setPhoneValue}
            fullWidth
            placeholder="Digite o número"
          />
        </Box>
      </Paper>
    </Box>
  )
}

export default ExemploPage

