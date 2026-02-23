import { useState, useCallback } from 'react'
import type { TableCardRow, TableCardFormField, TableCardColumn, AccessMode } from '../index'

interface UseTableFormProps<T extends TableCardRow> {
    formFields?: TableCardFormField<T>[]
    columns: TableCardColumn<T>[]
    onAdd?: (data: Partial<T>) => void | Promise<void | boolean> | boolean
    onEdit?: (id: T['id'], data: Partial<T>) => void | Promise<void | boolean> | boolean
    onDialogOpen?: () => void
    accessMode?: AccessMode
}

export type DialogState<T extends TableCardRow> =
    | { mode: 'add'; open: true; row?: undefined }
    | { mode: 'edit'; open: true; row: T }
    | { mode: null; open: false; row?: undefined }

export const useTableForm = <T extends TableCardRow>({
    formFields,
    columns,
    onAdd,
    onEdit,
    onDialogOpen,
}: UseTableFormProps<T>) => {
    const [dialog, setDialog] = useState<DialogState<T>>({
        mode: null,
        open: false,
    })
    const [formValues, setFormValues] = useState<Partial<T>>({})
    const [initialFormValues, setInitialFormValues] = useState<Partial<T>>({})
    const [validationError, setValidationError] = useState<string | null>(null)

    const formSchema = formFields ?? columns

    const buildFormValues = useCallback((row?: T) => {
        if (!formFields) {
            if (row) return row
            return {} as Partial<T>
        }

        const values = formSchema.reduce((acc, field) => {
            const formField = field as TableCardFormField<T>
            const isMultiSelect = formField.inputType === 'multiselect'

            if (row) {
                const existingValue = row[field.key]
                if (isMultiSelect) {
                    acc[field.key] = (Array.isArray(existingValue)
                        ? existingValue
                        : existingValue !== undefined && existingValue !== null
                            ? [existingValue]
                            : []) as any
                } else {
                    acc[field.key] =
                        existingValue !== undefined && existingValue !== null
                            ? existingValue
                            : formField.defaultValue ?? ''
                }
            } else {
                acc[field.key] = (isMultiSelect
                    ? Array.isArray(formField.defaultValue)
                        ? formField.defaultValue
                        : []
                    : formField.defaultValue ?? '') as any
            }
            return acc
        }, {} as Partial<T>)

        if (row) {
            if (row.id !== undefined) {
                values.id = row.id
            }
            // Copy other special keys
            Object.keys(row).forEach((key) => {
                if (!(key in values) && key !== 'id') {
                    if (['editable', 'scopeType', 'scopeTargetId'].includes(key)) {
                        values[key as keyof T] = row[key as keyof T]
                    }
                }
            })
        }

        return values
    }, [formFields, formSchema])

    const openDialog = useCallback((mode: 'add' | 'edit', row?: T) => {
        const initialValues = buildFormValues(row)
        if (mode === 'add') {
            setDialog({ mode: 'add', open: true })
        } else if (row) {
            setDialog({ mode: 'edit', open: true, row })
        }
        setFormValues(initialValues)
        setInitialFormValues(initialValues)
        onDialogOpen?.()
    }, [buildFormValues, onDialogOpen])

    const closeDialog = useCallback(() => {
        setDialog({ mode: null, open: false })
        setFormValues({})
        setInitialFormValues({})
        setValidationError(null)
    }, [])

    const handleFieldChange = useCallback((key: keyof T, value: any) => {
        setFormValues((prev) => ({
            ...prev,
            [key]: value,
        }))
    }, [])

    const handleSubmit = useCallback(async () => {
        // Limpar erro de validação anterior
        setValidationError(null)

        // Sempre chamar onAdd/onEdit para permitir validação customizada
        // A validação customizada pode definir fieldErrors e retornar false para manter o dialog aberto
        let shouldClose = true

        if (dialog.mode === 'add') {
            const result = onAdd?.(formValues)
            if (result instanceof Promise) {
                const resolved = await result
                shouldClose = resolved !== false
            } else if (result === false) {
                shouldClose = false
            }
        } else if (dialog.mode === 'edit' && dialog.row) {
            const result = onEdit?.(dialog.row.id, formValues)
            if (result instanceof Promise) {
                const resolved = await result
                shouldClose = resolved !== false
            } else if (result === false) {
                shouldClose = false
            }
        }

        if (shouldClose) {
            closeDialog()
        }
    }, [dialog, formSchema, formValues, onAdd, onEdit, closeDialog])

    return {
        dialog,
        formValues,
        initialFormValues,
        validationError,
        setValidationError,
        openDialog,
        closeDialog,
        handleFieldChange,
        handleSubmit,
        formSchema,
    }
}
