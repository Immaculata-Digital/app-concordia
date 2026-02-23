import { TextField, Box, Typography } from '@mui/material'
import './style.css'

type HtmlEditorProps = {
  label?: string
  value: string
  onChange: (value: string) => void
  fullWidth?: boolean
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: boolean
  helperText?: string
}

const HtmlEditor = ({
  label,
  value,
  onChange,
  fullWidth = false,
  placeholder = 'Digite o HTML aqui...',
  required = false,
  disabled = false,
  error = false,
  helperText,
}: HtmlEditorProps) => {
  // Formatar HTML básico (indentação simples)
  const formatHtml = (html: string): string => {
    if (!html) return ''
    
    // Remover espaços extras
    let formatted = html.trim()
    
    // Adicionar quebras de linha básicas
    formatted = formatted.replace(/></g, '>\n<')
    
    // Indentação básica
    const lines = formatted.split('\n')
    let indent = 0
    const indentSize = 2
    
    return lines
      .map((line) => {
        const trimmed = line.trim()
        if (!trimmed) return ''
        
        // Diminuir indentação para tags de fechamento
        if (trimmed.startsWith('</')) {
          indent = Math.max(0, indent - indentSize)
        }
        
        const indented = ' '.repeat(indent) + trimmed
        
        // Aumentar indentação para tags de abertura (exceto self-closing)
        if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
          indent += indentSize
        }
        
        return indented
      })
      .filter(Boolean)
      .join('\n')
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }

  const handleFormat = () => {
    const formatted = formatHtml(value)
    onChange(formatted)
  }

  return (
    <Box className="html-editor" sx={{ width: fullWidth ? '100%' : 'auto' }}>
      <Box className="html-editor__header">
        <Typography variant="body2" component="label" className="html-editor__label">
          {label}
          {required && <span className="html-editor__required"> *</span>}
        </Typography>
        <Typography
          variant="caption"
          className="html-editor__format-btn"
          onClick={handleFormat}
          sx={{ cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
        >
          Formatar HTML
        </Typography>
      </Box>
      <Box className="html-editor__container">
        <TextField
          multiline
          rows={12}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          error={error}
          helperText={helperText}
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              padding: 0,
            },
            '& textarea': {
              padding: '12px',
              fontFamily: 'monospace',
              fontSize: '14px',
              lineHeight: '1.5',
              tabSize: 2,
            },
          }}
        />
      </Box>
    </Box>
  )
}

export default HtmlEditor

