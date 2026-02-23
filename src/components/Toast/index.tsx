import React from 'react'
import { createPortal } from 'react-dom'
import { Snackbar, Alert, type AlertColor } from '@mui/material'
import './style.css'

interface ToastProps {
    open: boolean
    message: string | null | undefined
    severity?: AlertColor
    onClose: () => void
    duration?: number
}

const Toast: React.FC<ToastProps> = ({
    open,
    message,
    severity = 'error',
    onClose,
    duration = 6000
}) => {
    if (typeof document === 'undefined') return null

    return createPortal(
        <Snackbar
            open={open && !!message}
            autoHideDuration={duration}
            onClose={onClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            className="toast"
        >
            <Alert
                onClose={onClose}
                severity={severity}
                variant="filled"
                className="toast__alert"
            >
                {message}
            </Alert>
        </Snackbar>,
        document.body
    )
}

export default Toast
