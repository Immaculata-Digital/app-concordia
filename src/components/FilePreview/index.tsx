
import { useState } from 'react'
import { Box, IconButton, Toolbar, Typography, AppBar } from '@mui/material'
import { Close, Download, ZoomIn, ZoomOut } from '@mui/icons-material'
import { useSearchParams } from 'react-router-dom'

const FilePreview = () => {
    const [searchParams] = useSearchParams()
    const fileUrl = searchParams.get('url')
    const fileName = searchParams.get('name') || 'Arquivo'
    const fileType = searchParams.get('type') // 'image/...' or 'application/pdf'

    // Validar se é PDF ou Imagem baseada no tipo ou extensão
    const isPdf = fileType?.includes('pdf') || fileName.toLowerCase().endsWith('.pdf')
    const isHtml = fileType?.includes('html') || fileName.toLowerCase().endsWith('.html')

    const [scale, setScale] = useState(1)

    // Close window
    const handleClose = () => {
        window.close()
    }

    // Handle zoom for images
    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3))
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5))

    const handleDownload = async () => {
        if (!fileUrl) return

        try {
            // Fetch blob to ensure we have valid data in current context
            const response = await fetch(fileUrl)
            const blob = await response.blob()
            const blobUrl = window.URL.createObjectURL(blob)

            // Determine extension if missing
            let downloadName = fileName
            if (fileType && !downloadName.includes('.')) {
                const extension = fileType.split('/')[1]
                if (extension) {
                    // Fix common types
                    const extMap: Record<string, string> = {
                        'plain': 'txt',
                        'jpeg': 'jpg',
                        'svg+xml': 'svg'
                    }
                    downloadName = `${downloadName}.${extMap[extension] || extension}`
                }
            }

            const link = document.createElement('a')
            link.href = blobUrl
            link.download = downloadName
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(blobUrl)
        } catch (error) {
            console.error('Download failed:', error)
            // Fallback
            const link = document.createElement('a')
            link.href = fileUrl
            link.download = fileName
            link.click()
        }
    }

    if (!fileUrl) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', bgcolor: '#000', color: '#fff' }}>
                <Typography>Nenhum arquivo para visualizar.</Typography>
            </Box>
        )
    }

    return (
        <Box sx={{
            width: '100vw',
            height: '100vh',
            bgcolor: '#202124', // Google Drive-like dark background
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* AppBar / Toolbar */}
            {!isPdf && (
                <AppBar position="static" elevation={0} sx={{ bgcolor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                    <Toolbar variant="dense">
                        <Typography variant="subtitle1" sx={{ flexGrow: 1, color: '#fff' }}>
                            {fileName}
                        </Typography>

                        {!isHtml && (
                            <>
                                <IconButton onClick={handleZoomOut} sx={{ color: '#fff' }} title="Diminuir Zoom">
                                    <ZoomOut />
                                </IconButton>
                                <IconButton onClick={handleZoomIn} sx={{ color: '#fff' }} title="Aumentar Zoom">
                                    <ZoomIn />
                                </IconButton>
                            </>
                        )}

                        <IconButton
                            onClick={handleDownload}
                            sx={{ color: '#fff' }}
                            title="Download"
                        >
                            <Download />
                        </IconButton>
                        <IconButton onClick={handleClose} sx={{ color: '#fff', ml: 1 }} title="Fechar">
                            <Close />
                        </IconButton>
                    </Toolbar>
                </AppBar>
            )}

            {/* Content Preview */}
            <Box sx={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
                p: 0,
                position: 'relative'
            }}>
                {(isPdf || isHtml) ? (
                    <iframe
                        src={fileUrl}
                        style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#ffffff' }}
                        title={isPdf ? "PDF Preview" : "HTML Preview"}
                    />
                ) : (
                    <Box sx={{
                        transform: `scale(${scale})`,
                        transition: 'transform 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <img
                            src={fileUrl}
                            alt={fileName}
                            style={{
                                maxWidth: '100vw',
                                maxHeight: 'calc(100vh - 64px)',
                                objectFit: 'contain',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                            }}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    )
}

export default FilePreview
