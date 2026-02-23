import { Box, TextField, MenuItem, Checkbox } from '@mui/material'
import type { SelectChangeEvent } from '@mui/material/Select'
import type { TableCardRow, TableCardFormField, TableCardColumn, AccessMode } from '../index'
import { getContextualAccessMode, isReadOnly as checkIsReadOnly } from '../../../utils/accessControl'

interface FormRendererProps<T extends TableCardRow> {
    field: TableCardFormField<T> | TableCardColumn<T>
    formValues: Partial<T>
    handleFieldChange: (key: keyof T, value: any) => void
    accessMode: AccessMode
    mode: 'add' | 'edit' | 'view'
    disableEdit?: boolean
    fieldErrors?: Record<string, string>
}

const CheckedIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="table-card__icon--middle">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" />
        <path d="M8 12.5L10.5 15L16 9.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const IndeterminateIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="table-card__icon--middle">
        <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" />
        <path d="M8 12H16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
)

const UncheckedIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="table-card__icon--middle">
        <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="2" />
    </svg>
)

export const FormRenderer = <T extends TableCardRow>({
    field,
    formValues,
    handleFieldChange,
    accessMode,
    mode,
    disableEdit,
    fieldErrors,
}: FormRendererProps<T>) => {
    const value = formValues[field.key] ?? ''
    const inputType =
        'inputType' in field && field.inputType ? field.inputType : (field as TableCardColumn<T>).dataType ?? 'text'

    const contextualAccessMode = getContextualAccessMode(accessMode, mode === 'edit')
    const fieldIsReadOnly = checkIsReadOnly(contextualAccessMode)
    const isEditDisabled = mode === 'edit' && !!disableEdit
    const finalDisabled = !!(('disabled' in field ? field.disabled : false) || fieldIsReadOnly || isEditDisabled)

    if ('renderInput' in field && field.renderInput) {
        return (
            <Box key={String(field.key)}>
                {field.renderInput({
                    value,
                    onChange: (newValue) => handleFieldChange(field.key, newValue),
                    field: field as TableCardFormField<T>,
                    formValues,
                    setFieldValue: (key, newValue) => handleFieldChange(key, newValue),
                    disabled: finalDisabled,
                    accessMode: contextualAccessMode,
                    fieldErrors,
                })}
            </Box>
        )
    }

    if (inputType === 'select') {
        const options = 'options' in field && field.options ? field.options : []

        return (
            <TextField
                key={String(field.key)}
                select
                label={field.label}
                value={value}
                onChange={(event) => handleFieldChange(field.key, event.target.value)}
                fullWidth
                helperText={'helperText' in field ? (field.helperText as string) : undefined}
                required={'required' in field ? !!field.required : false}
                placeholder={'placeholder' in field ? (field.placeholder as string) : undefined}
                disabled={finalDisabled}
                size="small"
            >
                {options.map((option) => (
                    <MenuItem key={String(option.value)} value={option.value}>{option.label}</MenuItem>
                ))}
            </TextField>
        )
    }

    if (inputType === 'multiselect') {
        const options = 'options' in field && field.options ? field.options : []
        const multiValue = Array.isArray(value) ? value : []

        const handleMultiSelectChange = (event: SelectChangeEvent<string[]>) => {
            const selected = event.target.value
            handleFieldChange(field.key, typeof selected === 'string' ? selected.split(',') : selected)
        }

        return (
            <TextField
                key={String(field.key)}
                select
                label={field.label}
                value={multiValue}
                onChange={(e) => handleMultiSelectChange(e as any)}
                fullWidth
                SelectProps={{
                    multiple: true,
                    renderValue: (selected) => (selected as (string | number)[]).map(String).join(', '),
                }}
                helperText={'helperText' in field ? (field.helperText as string) : undefined}
                required={'required' in field ? !!field.required : false}
                placeholder={'placeholder' in field ? (field.placeholder as string) : undefined}
                disabled={finalDisabled}
                size="small"
            >
                {options.map((option) => (
                    <MenuItem key={String(option.value)} value={option.value}>
                        <Checkbox
                            checked={(multiValue as any[]).includes(option.value)}
                            icon={<UncheckedIcon />}
                            checkedIcon={<CheckedIcon />}
                            indeterminateIcon={<IndeterminateIcon />}
                        />
                        <span>{option.label}</span>
                    </MenuItem>
                ))}
            </TextField>
        )
    }

    const textFieldType = ['password', 'email', 'number', 'date'].includes(inputType) ? inputType : 'text'

    return (
        <TextField
            key={String(field.key)}
            label={field.label}
            type={textFieldType}
            value={value}
            onChange={(event) => handleFieldChange(field.key, event.target.value)}
            fullWidth
            helperText={'helperText' in field ? (field.helperText as string) : undefined}
            required={'required' in field ? !!field.required : false}
            placeholder={'placeholder' in field ? (field.placeholder as string) : undefined}
            disabled={finalDisabled}
            InputLabelProps={inputType === 'date' ? { shrink: true } : undefined}
            size="small"
        />
    )
}
