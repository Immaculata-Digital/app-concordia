import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    IconButton
} from '@mui/material';
import { Close, WarningAmber } from '@mui/icons-material';

interface DiscardChangesDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const DiscardChangesDialog = ({ open, onClose, onConfirm }: DiscardChangesDialogProps) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    borderRadius: '24px',
                    padding: '8px',
                    maxWidth: '400px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
                }
            }}
            BackdropProps={{
                sx: {
                    backdropFilter: 'blur(8px)',
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                }
            }}
        >
            <Box sx={{ position: 'absolute', right: 16, top: 16 }}>
                <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
                    <Close fontSize="small" />
                </IconButton>
            </Box>

            <DialogContent sx={{ pt: 4, pb: 2, textAlign: 'center' }}>
                <Box
                    className="discard-dialog-icon-container"
                    sx={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                    }}
                >
                    <WarningAmber sx={{ fontSize: '32px' }} />
                </Box>

                <Typography
                    variant="h6"
                    className="discard-dialog-title"
                    sx={{
                        fontWeight: 700,
                        mb: 1,
                        letterSpacing: '-0.02em',
                    }}
                >
                    Alterações não salvas
                </Typography>

                <Typography
                    variant="body1"
                    className="discard-dialog-description"
                    sx={{
                        mb: 2,
                    }}
                >
                    Você tem alterações que serão perdidas se fechar agora. Deseja realmente cancelar?
                </Typography>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
                <Button
                    fullWidth
                    variant="outlined"
                    onClick={onClose}
                    sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.2,
                        borderColor: 'divider',
                        color: 'text.primary',
                        '&:hover': {
                            backgroundColor: 'action.hover',
                            borderColor: 'text.primary',
                        }
                    }}
                >
                    Continuar editando
                </Button>
                <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                    sx={{
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.2,
                        boxShadow: 'none',
                        '&:hover': {
                            boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
                        }
                    }}
                >
                    Descartar alterações
                </Button>
            </DialogActions>
        </Dialog>
    );
};
