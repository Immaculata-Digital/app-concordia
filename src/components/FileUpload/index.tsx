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
    onMultipleChange?: (files: Array<{ base64: string, name: string, size: number }>) => void
    onFileNameChange?: (name: string) => void
    multiple?: boolean
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
    onMultipleChange,
    onFileNameChange,
    multiple = false,
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
    const [isDragging, setIsDragging] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<Array<{ base64: string, name: string, size: number }>>([])
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string }>({ open: false, message: '' })

    const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

    // Initialize tempName from props when not editing
    useEffect(() => {
        if (!isRenaming && fileName) {
            setTempName(fileName)
        }
    }, [fileName, isRenaming])

    const readFileAsBase64 = (file: File): Promise<{ base64: string, name: string, size: number }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve({
                base64: reader.result as string,
                name: file.name,
                size: file.size
            })
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
    }

    const FILE_GROUPS = {
        image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'],
        video: ['.mp4', '.webm', '.ogg', '.mov'],
        document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv']
    }

    const getFileGroup = (fileName: string): keyof typeof FILE_GROUPS | null => {
        const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
        if (FILE_GROUPS.image.includes(ext)) return 'image'
        if (FILE_GROUPS.video.includes(ext)) return 'video'
        if (FILE_GROUPS.document.includes(ext)) return 'document'
        return null
    }

    const processFiles = async (filesList: FileList | File[]) => {
        const files = Array.from(filesList)
        if (files.length === 0) return

        // 1. Check size for all files
        const oversizedFiles = files.filter(f => f.size > MAX_FILE_SIZE)
        if (oversizedFiles.length > 0) {
            setSnackbar({
                open: true,
                message: `Pelo menos um arquivo excede o limite de ${formatSize(MAX_FILE_SIZE)}.`
            })
            if (inputRef.current) inputRef.current.value = ''
            return
        }

        // 2. Validate grouping (Same category for all files)
        if (multiple && files.length > 1) {
            const firstGroup = getFileGroup(files[0].name)
            
            if (!firstGroup) {
                setSnackbar({ open: true, message: 'Extensão do primeiro arquivo não reconhecida.' })
                if (inputRef.current) inputRef.current.value = ''
                return
            }

            const inconsistentFiles = files.filter(f => getFileGroup(f.name) !== firstGroup)
            if (inconsistentFiles.length > 0) {
                const groupLabels: Record<string, string> = { image: 'Imagens', video: 'Vídeos', document: 'Documentos' }
                setSnackbar({ 
                    open: true, 
                    message: `Mistura de tipos detectada. Selecione apenas ${groupLabels[firstGroup] || firstGroup}.` 
                })
                if (inputRef.current) inputRef.current.value = ''
                return
            }
        }

        setLoading(true)

        try {
            if (multiple && onMultipleChange) {
                const results = await Promise.all(files.map(readFileAsBase64))
                setSelectedFiles(results) // Local preview
                onMultipleChange(results)
            } else {
                // Single file mode (legacy)
                const file = files[0]
                const result = await readFileAsBase64(file)
                onChange(result.base64, { name: result.name, size: result.size })
            }
        } catch (error) {
            console.error('Error reading files:', error)
            setSnackbar({ open: true, message: 'Erro ao processar arquivo(s).' })
        } finally {
            setLoading(false)
            if (inputRef.current) inputRef.current.value = ''
        }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) processFiles(event.target.files)
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true)
        } else if (e.type === "dragleave") {
            setIsDragging(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(false)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files)
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
                multiple={multiple}
                style={{ display: 'none' }}
                ref={inputRef}
                onChange={handleFileChange}
            />

            {!hasFile ? (
                <Stack direction="column" spacing={2}>
                    <Stack 
                        direction="column" 
                        spacing={1} 
                        alignItems="center"
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        sx={{
                            border: '2px dashed',
                            borderColor: isDragging ? 'primary.main' : 'var(--color-border)',
                            borderRadius: 1,
                            p: 3,
                            bgcolor: isDragging ? 'action.hover' : 'transparent',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer',
                            '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: 'action.hover'
                            }
                        }}
                        onClick={() => inputRef.current?.click()}
                    >
                        <CloudUpload sx={{ fontSize: 40, color: isDragging ? 'primary.main' : 'text.secondary', mb: 1 }} />
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {loading ? 'Processando...' : label}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {multiple ? 'Arraste vários arquivos ou clique para selecionar' : 'Arraste um arquivo ou clique para selecionar'}
                        </Typography>
                        
                        {loading && <CircularProgress size={24} sx={{ mt: 1 }} />}
                    </Stack>

                    {/* Multi-file preview list */}
                    {multiple && selectedFiles.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                                Arquivos Selecionados ({selectedFiles.length}):
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {selectedFiles.map((file, index) => (
                                    <Box
                                        key={index}
                                        sx={{
                                            p: 0.5,
                                            border: '1px solid var(--color-border)',
                                            borderRadius: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            bgcolor: 'background.paper',
                                            maxWidth: 200
                                        }}
                                    >
                                        {file.base64.startsWith('data:image') && (
                                            <img 
                                                src={file.base64} 
                                                alt="preview" 
                                                style={{ width: 30, height: 30, borderRadius: 4, objectFit: 'cover' }} 
                                            />
                                        )}
                                        <Typography variant="caption" noWrap sx={{ flex: 1 }}>
                                            {file.name}
                                        </Typography>
                                        <IconButton 
                                            size="small" 
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                const newFiles = selectedFiles.filter((_, i) => i !== index)
                                                setSelectedFiles(newFiles)
                                                if (onMultipleChange) onMultipleChange(newFiles)
                                            }}
                                        >
                                            <Close fontSize="small" />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Stack>
                        </Box>
                    )}

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
