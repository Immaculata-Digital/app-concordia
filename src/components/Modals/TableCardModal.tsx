import React, { useState } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
} from '@mui/material'
import { DiscardChangesDialog } from '../Dashboard/DiscardChangesDialog'
import './style.css'

/**
 * TableCardModal Props
 * @property {boolean} open - Whether the modal is open
 * @property {(event?: any, reason?: string) => void} onClose - Function to call when closing
 * @property {() => void} onSave - Function to call when saving
 * @property {string} title - Base title (e.g., 'Contrato')
 * @property {'add' | 'edit' | 'view'} mode - Current mode of the modal
 * @property {React.ReactNode} children - Form content or other content
 * @property {boolean} saving - Whether a save operation is in progress
 * @property {boolean} isDirty - Whether there are unsaved changes (triggers discard confirmation)
 * @property {string} saveLabel - Custom label for the save button
 * @property {string} cancelLabel - Custom label for the cancel button
 * @property {boolean} hideActions - Whether to hide the default actions (buttons)
 * @property {'xs' | 'sm' | 'md' | 'lg' | 'xl'} maxWidth - Maximum width of the modal
 * @property {boolean} fullWidth - Whether the modal should take full width
 * @property {() => void} onConfirmDiscard - Callback when user confirms discarding changes
 * @property {boolean} canSave - Whether the user has permission to save
 */
interface TableCardModalProps {
    open: boolean
    onClose: (event?: any, reason?: string) => void
    onSave?: () => void
    title: string
    addTitle?: string
    editTitle?: string
    viewTitle?: string
    mode: 'add' | 'edit' | 'view'
    children: React.ReactNode
    saving?: boolean
    isDirty?: boolean
    saveLabel?: string
    cancelLabel?: string
    hideActions?: boolean
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
    fullWidth?: boolean
    onConfirmDiscard?: () => void
    canSave?: boolean
}

/**
 * TableCardModal Component
 * Encapsulates the generic part of system dialogs used for CRUD operations.
 * Standardizes styling (premium design), actions, and "discard changes" logic.
 */
export const TableCardModal = ({
    open,
    onClose,
    onSave,
    title,
    addTitle,
    editTitle,
    viewTitle,
    mode,
    children,
    saving = false,
    isDirty = false,
    saveLabel = 'Salvar',
    cancelLabel,
    hideActions = false,
    maxWidth = 'sm',
    fullWidth = true,
    onConfirmDiscard,
    canSave = true,
}: TableCardModalProps) => {
    const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)

    const handleClose = (event?: any, reason?: string) => {
        // Intercept backdrop and escape key to check for dirty changes
        if (reason && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
            if (isDirty) {
                setDiscardConfirmOpen(true)
                return
            }
        }
        onClose(event, reason)
    }

    const forceClose = () => {
        setDiscardConfirmOpen(false)
        if (onConfirmDiscard) {
            onConfirmDiscard()
        } else {
            onClose()
        }
    }

    // Determine the title based on mode
    const displayTitle = mode === 'add'
        ? (addTitle || `Adicionar ${title}`)
        : mode === 'edit'
            ? (editTitle || `Editar ${title}`)
            : (viewTitle || `Visualizar ${title}`)

    // Determine the cancel button label
    const displayCancelLabel = cancelLabel || (mode === 'view' ? 'Fechar' : 'Cancelar')

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                fullWidth={fullWidth}
                maxWidth={maxWidth}
                PaperProps={{
                    className: 'table-card-modal__paper'
                }}
                BackdropProps={{
                    className: 'table-card-modal__backdrop'
                }}
            >
                <DialogTitle className="table-card-modal__title">
                    {displayTitle}
                </DialogTitle>

                <DialogContent
                    dividers={false}
                    className="table-card-modal__content"
                >
                    <Stack spacing={2} className="table-card-modal__stack">
                        {children}
                    </Stack>
                </DialogContent>

                {!hideActions && (
                    <DialogActions className="table-card-modal__actions">
                        <Button
                            onClick={(e) => onClose(e)}
                            color="inherit"
                            className="table-card-modal__btn-cancel"
                        >
                            {displayCancelLabel}
                        </Button>

                        {mode !== 'view' && canSave && (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={onSave}
                                disabled={saving}
                                className="table-card-modal__btn-save"
                            >
                                {saving ? 'Salvando...' : saveLabel}
                            </Button>
                        )}
                    </DialogActions>
                )}
            </Dialog>

            <DiscardChangesDialog
                open={discardConfirmOpen}
                onClose={() => setDiscardConfirmOpen(false)}
                onConfirm={forceClose}
            />
        </>
    )
}
