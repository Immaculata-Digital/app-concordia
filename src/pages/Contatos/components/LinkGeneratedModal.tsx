import { useState } from 'react'
import { TableCardModal } from '../../../components/Modals'
import { Stack, TextField, Button, IconButton, InputAdornment, Alert } from '@mui/material'
import { ContentCopy, WhatsApp, CheckCircle } from '@mui/icons-material'
import Toast from '../../../components/Toast'
import './style.css'

type LinkGeneratedModalProps = {
    open: boolean
    onClose: () => void
    link: string
    contactPhone?: string
    contactName?: string
}

const LinkGeneratedModal = ({ open, onClose, link, contactPhone, contactName }: LinkGeneratedModalProps) => {
    const [toast, setToast] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'warning' | 'info' }>({
        open: false,
        message: '',
    })

    const handleCopyLink = () => {
        navigator.clipboard.writeText(link)
        setToast({
            open: true,
            message: 'Link copiado para a área de transferência!',
            severity: 'success',
        })
    }

    const handleWhatsApp = () => {
        if (!contactPhone) {
            setToast({
                open: true,
                message: 'Telefone do contato não disponível',
                severity: 'warning',
            })
            return
        }

        // Remove caracteres não numéricos do telefone
        const phoneNumber = contactPhone.replace(/\D/g, '')
        const message = `Olá${contactName ? ` ${contactName}` : ''}! Segue o link para preenchimento do contrato:\n\n${link}`
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, '_blank')
    }

    return (
        <>
            <TableCardModal
                open={open}
                onClose={onClose}
                title="Link Gerado"
                mode="view"
                hideActions={false}
                maxWidth="sm"
                cancelLabel="Fechar"
            >
                <Stack spacing={3}>
                    <Alert 
                        severity="success" 
                        icon={<CheckCircle />}
                        className="link-modal__alert"
                    >
                        O link foi gerado com sucesso!
                    </Alert>

                    <Stack direction="row" spacing={2} alignItems="stretch">
                        <TextField
                            label="Link do Contrato"
                            value={link}
                            className="link-modal__input"
                            InputProps={{
                                readOnly: true,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="copiar link"
                                            onClick={handleCopyLink}
                                            edge="end"
                                        >
                                            <ContentCopy fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        {contactPhone && (
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<WhatsApp />}
                                onClick={handleWhatsApp}
                                className="link-modal__whatsapp-btn"
                            >
                                Enviar
                            </Button>
                        )}
                    </Stack>
                </Stack>
            </TableCardModal>

            <Toast
                open={toast.open}
                onClose={() => setToast({ open: false, message: '' })}
                message={toast.message}
                severity={toast.severity}
            />
        </>
    )
}

export default LinkGeneratedModal

