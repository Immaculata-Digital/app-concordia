import { Button, Box, Typography, Stack, IconButton, CircularProgress, ClickAwayListener, TextField, Tooltip } from '@mui/material'
import { CloudUpload, AttachFile, Delete, Close, Stop, Download, DriveFileRenameOutline, Visibility } from '@mui/icons-material'
import { useRef, useState, useEffect } from 'react'
import Toast from '../Toast'
import { type AccessMode } from '../Dashboard/DashboardBodyCard'
import { isHidden as checkIsHidden, isReadOnly as checkIsReadOnly, canPreview as checkCanPreview, canDownload as checkCanDownload } from '../../utils/accessControl'

type FileUploadProps = {
    label?: string
    value: string | null | undefined
    fileName?: string
    fileSize?: number | string
    onChange: (base64: string, meta?: { name: string, size: number }) => void
    onFileNameChange?: (name: string) => void
    fullWidth?: boolean
    required?: boolean
    accept?: string
    error?: boolean
    helperText?: string
    showPreview?: boolean
    showDownload?: boolean
    disabled?: boolean
    accessMode?: AccessMode
}

const FileUpload = ({
    label = "Upload Arquivo",
    value,
    fileName,
    fileSize,
    onChange,
    onFileNameChange,
    fullWidth = false,
    required = false,
    accept = "image/*,application/pdf",
    error = false,
    helperText,
    showPreview = true,
    showDownload = true,
    disabled = false,
    accessMode = 'full'
}: FileUploadProps) => {
    const isHidden = checkIsHidden(accessMode)
    const isReadOnly = checkIsReadOnly(accessMode)
    const canPreviewMeta = checkCanPreview(accessMode)
    const canDownloadMeta = checkCanDownload(accessMode)
    const finalDisabled = disabled || isReadOnly

    const finalShowPreview = showPreview && canPreviewMeta
    const finalShowDownload = showDownload && canDownloadMeta

    if (isHidden) return null
    const inputRef = useRef<HTMLInputElement>(null)
    const readerRef = useRef<FileReader | null>(null)
    const [loading, setLoading] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [isRenaming, setIsRenaming] = useState(false)
    const [tempName, setTempName] = useState('')
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string }>({ open: false, message: '' })

    const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25MB

    // Initialize tempName from props when not editing
    useEffect(() => {
        if (!isRenaming && fileName) {
            setTempName(fileName)
        }
    }, [fileName, isRenaming])

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            if (file.size > MAX_FILE_SIZE) {
                setSnackbar({
                    open: true,
                    message: `O arquivo excede o limite de ${formatSize(MAX_FILE_SIZE)}. Tamanho do arquivo: ${formatSize(file.size)}`
                })
                if (inputRef.current) inputRef.current.value = ''
                return
            }

            setLoading(true)
            const reader = new FileReader()
            readerRef.current = reader

            reader.onloadend = () => {
                const base64String = reader.result as string
                // Pass metadata up
                onChange(base64String, { name: file.name, size: file.size })
                setLoading(false)
                readerRef.current = null
            }
            // abort is handled by user action, onerror/onabort usually don't need explicit loading=false if we control the abort trigger
            reader.onabort = () => {
                setLoading(false)
                readerRef.current = null
                if (inputRef.current) inputRef.current.value = ''
            }
            reader.onerror = () => {
                setLoading(false)
                readerRef.current = null
            }
            reader.readAsDataURL(file)
        }
    }

    const cancelUpload = () => {
        if (readerRef.current) {
            readerRef.current.abort()
        }
    }

    const clearFile = () => {
        onChange('', { name: '', size: 0 })
        if (inputRef.current) {
            inputRef.current.value = ''
        }
        setConfirmDelete(false)
    }



    const startRename = () => {
        setTempName(fileName || '')
        setIsRenaming(true)
    }

    const saveRename = () => {
        if (onFileNameChange) {
            onFileNameChange(tempName)
        }
        setIsRenaming(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') saveRename()
        if (e.key === 'Escape') {
            setTempName(fileName || '')
            setIsRenaming(false)
        }
    }

    const formatSize = (bytes?: number | string) => {
        if (bytes === undefined || bytes === null || bytes === '') return ''
        if (typeof bytes === 'string') return bytes
        if (bytes === 0) return ''
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + sizes[i]
    }

    const safeValue = typeof value === 'string' ? value : ''
    const hasFile = !!safeValue
    // Use stored filename if available, otherwise "Arquivo Selecionado"
    const displayTitle = fileName || (hasFile ? (safeValue.startsWith('data:image') ? 'Imagem Selecionada' : 'Arquivo Selecionado') : '')

    const handleView = async () => {
        if (!safeValue) return

        try {
            const res = await fetch(safeValue)
            const blob = await res.blob()
            const blobUrl = URL.createObjectURL(blob)

            const params = new URLSearchParams()
            params.set('url', blobUrl)
            params.set('name', displayTitle)
            params.set('type', blob.type)

            window.open(`/file-preview?${params.toString()}`, '_blank')
        } catch (e) {
            console.error('Error viewing file:', e)
        }
    }

    return (
        <Box width={fullWidth ? '100%' : 'auto'}>
            <input
                type="file"
                accept={accept}
                style={{ display: 'none' }}
                ref={inputRef}
                onChange={handleFileChange}
            />

            {!hasFile ? (
                <Stack direction="column" spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Button
                            variant="outlined"
                            color={error ? "error" : "inherit"}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
                            onClick={() => inputRef.current?.click()}
                            fullWidth={fullWidth}
                            disabled={loading || finalDisabled}
                            sx={{
                                flexGrow: 1,
                                minHeight: '56px',
                                position: 'relative',
                                '& .MuiButton-startIcon': {
                                    position: 'absolute',
                                    left: 16,
                                    marginRight: 0,
                                    marginLeft: 0
                                },
                                '& .MuiButton-label': {
                                    textAlign: 'center',
                                    width: '100%',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                },
                                ...(!error && { borderColor: 'var(--color-border)' })
                            }}
                        >
                            {loading ? 'Carregando...' : label} {required && !loading && '*'}
                        </Button>
                        {loading && (
                            <IconButton color="error" onClick={cancelUpload} title="Cancelar Upload">
                                <Stop />
                            </IconButton>
                        )}
                    </Stack>

                    {helperText && <Typography variant="caption" color={error ? "error" : "textSecondary"}>{helperText}</Typography>}
                </Stack>

            ) : (
                <Stack direction="column" spacing={1}>
                    <Box
                        sx={{
                            border: '1px solid',
                            borderColor: 'var(--color-border)',
                            borderRadius: 1,
                            p: 2,
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'stretch', sm: 'center' },
                            justifyContent: 'space-between',
                            gap: { xs: 1, sm: 0 },
                            bgcolor: 'action.hover'
                        }}
                    >
                        <Stack direction="row" spacing={1} alignItems="center" overflow="hidden" sx={{ flexGrow: 1, mr: { xs: 0, sm: 1 } }}>
                            <AttachFile color="action" />

                            {isRenaming ? (
                                <TextField
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    onBlur={saveRename}
                                    onKeyDown={handleKeyDown}
                                    size="small"
                                    autoFocus
                                    fullWidth
                                    variant="standard"
                                />
                            ) : (
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Stack direction="row" alignItems="center" spacing={0.5}>
                                        <Typography variant="body2" noWrap title={displayTitle} sx={{ fontWeight: 500 }}>
                                            {displayTitle}
                                        </Typography>
                                    </Stack>
                                    {fileSize && (
                                        <Typography variant="caption" color="textPrimary" display="block" className="file-upload-size-text">
                                            {formatSize(fileSize)}
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Stack>

                        <Stack direction="row" spacing={0} sx={{ justifyContent: { xs: 'flex-end', sm: 'flex-start' }, width: { xs: '100%', sm: 'auto' } }}>
                            {!finalDisabled && (
                                <Tooltip title="Renomear">
                                    <IconButton
                                        size="small"
                                        onClick={startRename}
                                        disabled={isRenaming}
                                    >
                                        <DriveFileRenameOutline />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {finalShowPreview && (
                                <Tooltip title="Visualizar">
                                    <IconButton
                                        size="small"
                                        onClick={handleView}
                                    >
                                        <Visibility />
                                    </IconButton>
                                </Tooltip>
                            )}

                            {finalShowDownload && (
                                <Tooltip title="Download">
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            const link = document.createElement('a')
                                            link.href = safeValue
                                            link.download = fileName || 'download'
                                            document.body.appendChild(link)
                                            link.click()
                                            document.body.removeChild(link)
                                        }}
                                    >
                                        <Download />
                                    </IconButton>
                                </Tooltip>
                            )}


                            {!finalDisabled && (
                                <ClickAwayListener onClickAway={() => setConfirmDelete(false)}>
                                    <Box>
                                        {!confirmDelete ? (
                                            <IconButton
                                                size="small"
                                                color="default"
                                                onClick={() => setConfirmDelete(true)}
                                                title="Remover"
                                            >
                                                <Close />
                                            </IconButton>
                                        ) : (
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={clearFile}
                                                title="Confirmar Exclusão"
                                            >
                                                <Delete />
                                            </IconButton>
                                        )}
                                    </Box>
                                </ClickAwayListener>
                            )}
                        </Stack>
                    </Box>
                    {/* Preview if image */}
                    {safeValue.startsWith('data:image') && (
                        <Box sx={{ mt: 1, maxHeight: 200, overflow: 'hidden', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                            <img src={safeValue} alt="Preview" style={{ width: '100%', height: 'auto', display: 'block' }} />
                        </Box>
                    )}
                </Stack>
            )}
            <Toast
                open={snackbar.open}
                message={snackbar.message}
                severity="error"
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            />
        </Box>
    )
}

export default FileUpload
