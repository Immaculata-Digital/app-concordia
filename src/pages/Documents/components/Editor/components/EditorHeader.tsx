import React, { useState } from 'react'
import { 
    AppBar, 
    Toolbar, 
    Typography, 
    IconButton, 
    Stack, 
    Box, 
    Tooltip, 
    Divider, 
    Button, 
    Popover,
    useMediaQuery,
    CircularProgress,
    Collapse
} from '@mui/material'
import { 
    Undo, 
    Redo, 
    FormatBold, 
    FormatItalic, 
    FormatUnderlined, 
    FormatAlignLeft, 
    FormatAlignCenter, 
    FormatAlignRight, 
    Print, 
    Save, 
    Description, 
    KeyboardArrowDown,
    Fullscreen,
    FullscreenExit,
    FormatSize,
    ArrowBack,
    Check,
    Edit
} from '@mui/icons-material'
import { MarshallLogo } from './A4Canvas'
import type { DocumentLayoutDTO } from '../../../../../services/documents'
import { useNavigate } from 'react-router-dom'

interface EditorHeaderProps {
    title: string
    onChangeTitle: (title: string) => void
    onSave: () => void
    onPrint: () => void
    onUndo: () => void
    onRedo: () => void
    canUndo: boolean
    canRedo: boolean
    isSaving: boolean
    showWatermark: boolean
    onToggleWatermark: () => void
    isFullscreen: boolean
    onToggleFullscreen: () => void
    onFormatting: (type: string, value?: any) => void
    layouts: DocumentLayoutDTO[]
    selectedLayoutId: string | null
    onLayoutChange: (layoutId: string) => void
}

import "./EditorHeader.css"

export const EditorHeader = ({
    title,
    onChangeTitle,
    onSave,
    onPrint,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    isSaving,
    showWatermark,
    onToggleWatermark,
    isFullscreen,
    onToggleFullscreen,
    onFormatting,
    layouts,
    selectedLayoutId,
    onLayoutChange
}: EditorHeaderProps) => {
    const isMobile = useMediaQuery('(max-width:900px)')
    const navigate = useNavigate()
    const [anchorElLayout, setAnchorElLayout] = useState<null | HTMLElement>(null)
    const [showAlignToggle, setShowAlignToggle] = useState(false)
    const [showFormatToggle, setShowFormatToggle] = useState(false)

    const handleLayoutClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElLayout(event.currentTarget)
    }

    const handleLayoutClose = () => {
        setAnchorElLayout(null)
    }

    const handleLayoutSelect = (id: string) => {
        onLayoutChange(id)
        handleLayoutClose()
    }

    const CMD_KEY = navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'
    const activeLayout = layouts.find(l => l.id === selectedLayoutId)

    return (
        <AppBar 
            position={isFullscreen ? "fixed" : "static"} 
            elevation={0}
            className={`editor-header ${isFullscreen ? 'editor-header--fullscreen' : ''}`}
        >
            <Toolbar className="editor-header__toolbar">
                {/* Left: Branding & Title */}
                <Stack direction="row" alignItems="center" spacing={1.5} className="editor-header__left">
                    <IconButton 
                        onClick={() => navigate('/documentos')}
                        className="editor-header__back-btn"
                    >
                        <ArrowBack fontSize="small" />
                    </IconButton>

                    
                    <Box className="editor-header__title">
                        <input
                            placeholder="Documento sem título"
                            value={title}
                            onChange={(e) => onChangeTitle(e.target.value)}
                            className="editor-header__title-input"
                            maxLength={100}
                        />
                        <Edit 
                            sx={{ 
                                fontSize: 13, 
                                opacity: 0.3, 
                                position: 'absolute', 
                                right: 8,
                                pointerEvents: 'none'
                            }} 
                        />
                    </Box>
                </Stack>

                {/* Center: Premium Floating Toolbar (Island) */}
                <Stack 
                    direction="row" 
                    alignItems="center" 
                    spacing={0.5} 
                    className={`editor-header__island ${isMobile ? 'editor-header__island--is-mobile' : ''}`}
                >
                    {!isMobile && (
                        <>
                            <Stack direction="row" spacing={0}>
                                <Tooltip title={`Desfazer (${CMD_KEY}+Z)`}>
                                    <span>
                                        <IconButton 
                                            size="small" 
                                            onClick={onUndo} 
                                            onMouseDown={(e) => e.preventDefault()}
                                            disabled={!canUndo} 
                                            className={`editor-header__btn ${!canUndo ? 'editor-header__btn--is-disabled' : ''}`}
                                        >
                                            <Undo fontSize="small" style={{ fontSize: 18 }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                                <Tooltip title={`Refazer (${CMD_KEY}+Shift+Z)`}>
                                    <span>
                                        <IconButton 
                                            size="small" 
                                            onClick={onRedo} 
                                            onMouseDown={(e) => e.preventDefault()}
                                            disabled={!canRedo} 
                                            className={`editor-header__btn ${!canRedo ? 'editor-header__btn--is-disabled' : ''}`}
                                        >
                                            <Redo fontSize="small" style={{ fontSize: 18 }} />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Stack>
                            <Divider orientation="vertical" flexItem className="editor-header__island-divider" />
                        </>
                    )}
                    
                    <Stack direction="row" spacing={0} className="editor-header__group">
                        {isMobile && (
                            <IconButton 
                                size="small" 
                                onClick={() => setShowFormatToggle(!showFormatToggle)}
                                onMouseDown={(e) => e.preventDefault()}
                                className={`editor-header__btn ${showFormatToggle ? 'editor-header__btn--is-active' : ''}`}
                                style={{
                                    transition: 'all 0.2s',
                                    transform: showFormatToggle ? 'rotate(180deg)' : 'none'
                                }}
                            >
                                <FormatSize fontSize="small" style={{ fontSize: 18 }} />
                            </IconButton>
                        )}
                        
                        {(showFormatToggle || !isMobile) && (
                            <Box className="editor-header__group">
                                <Tooltip title={`Negrito (${CMD_KEY}+B)`}>
                                    <IconButton 
                                        size="small" 
                                        onClick={() => onFormatting('bold')} 
                                        onMouseDown={(e) => e.preventDefault()}
                                        className="editor-header__btn"
                                    >
                                        <FormatBold fontSize="small" style={{ fontSize: 18 }} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={`Itálico (${CMD_KEY}+I)`}>
                                    <IconButton 
                                        size="small" 
                                        onClick={() => onFormatting('italic')} 
                                        onMouseDown={(e) => e.preventDefault()}
                                        className="editor-header__btn"
                                    >
                                        <FormatItalic fontSize="small" style={{ fontSize: 18 }} />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title={`Sublinhado (${CMD_KEY}+U)`}>
                                    <IconButton 
                                        size="small" 
                                        onClick={() => onFormatting('underline')} 
                                        onMouseDown={(e) => e.preventDefault()}
                                        className="editor-header__btn"
                                    >
                                        <FormatUnderlined fontSize="small" style={{ fontSize: 18 }} />
                                    </IconButton>
                                </Tooltip>
                                
                                <Divider orientation="vertical" flexItem className="editor-header__island-divider" />

                                <Tooltip title={showWatermark ? "Remover Marca d'água" : "Adicionar Marca d'água"}>
                                    <IconButton 
                                        size="small" 
                                        onClick={onToggleWatermark} 
                                        onMouseDown={(e) => e.preventDefault()}
                                        className={`editor-header__btn ${showWatermark ? 'editor-header__btn--is-active' : ''}`}
                                    >
                                        <MarshallLogo 
                                            color={showWatermark ? 'var(--color-primary)' : 'var(--color-text)'} 
                                            width="18px"
                                        />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        )}
                    </Stack>

                    <Divider orientation="vertical" flexItem className="editor-header__island-divider" />

                    {/* Alignment Expanded Toggle with Animation */}
                    <Stack direction="row" spacing={0} className="editor-header__group">
                        <IconButton 
                            size="small" 
                            onClick={() => setShowAlignToggle(!showAlignToggle)}
                            onMouseDown={(e) => e.preventDefault()}
                            className={`editor-header__btn ${showAlignToggle ? 'editor-header__btn--is-active' : ''}`}
                            style={{ transition: 'all 0.2s' }}
                        >
                            <FormatAlignLeft fontSize="small" style={{ fontSize: 18 }} />
                        </IconButton>

                        <Collapse in={showAlignToggle} orientation="horizontal">
                            <Box className="editor-header__align-box">
                                <IconButton 
                                    size="small" 
                                    onClick={() => onFormatting('align', 'left')} 
                                    onMouseDown={(e) => e.preventDefault()}
                                    className="editor-header__btn"
                                >
                                    <FormatAlignLeft fontSize="small" style={{ fontSize: 16 }} />
                                </IconButton>
                                <IconButton 
                                    size="small" 
                                    onClick={() => onFormatting('align', 'center')} 
                                    onMouseDown={(e) => e.preventDefault()}
                                    className="editor-header__btn"
                                >
                                    <FormatAlignCenter fontSize="small" style={{ fontSize: 16 }} />
                                </IconButton>
                                <IconButton 
                                    size="small" 
                                    onClick={() => onFormatting('align', 'right')} 
                                    onMouseDown={(e) => e.preventDefault()}
                                    className="editor-header__btn"
                                >
                                    <FormatAlignRight fontSize="small" style={{ fontSize: 16 }} />
                                </IconButton>
                            </Box>
                        </Collapse>
                    </Stack>
                </Stack>

                {/* Right: Actions */}
                <Stack direction="row" alignItems="center" spacing={1} className="editor-header__actions">
                    <Button
                        size="small"
                        onClick={handleLayoutClick}
                        startIcon={<Description fontSize="small" />}
                        endIcon={<KeyboardArrowDown fontSize="small" />}
                        className={`editor-header__layout-btn ${activeLayout ? 'editor-header__layout-btn--active' : ''}`}
                        style={{ display: isMobile ? 'none' : 'flex' }}
                    >
                        {activeLayout ? activeLayout.name : 'Layout'}
                    </Button>

                    <Tooltip title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}>
                        <IconButton size="small" onClick={onToggleFullscreen} className="editor-header__icon-btn">
                            {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
                        </IconButton>
                    </Tooltip>

                    <IconButton size="small" onClick={onPrint} className="editor-header__icon-btn">
                        <Print fontSize="small" />
                    </IconButton>

                    <Button
                        variant="contained"
                        size="small"
                        onClick={onSave}
                        disabled={isSaving}
                        startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <Save fontSize="small" />}
                        className="editor-header__save-btn"
                    >
                        {isSaving ? 'Salvando...' : 'Salvar'}
                    </Button>
                </Stack>
            </Toolbar>

            {/* Layout Popover */}
            <Popover
                open={Boolean(anchorElLayout)}
                anchorEl={anchorElLayout}
                onClose={handleLayoutClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                slotProps={{
                    paper: {
                        className: "layout-popover"
                    }
                }}
            >
                <Stack spacing={0.5}>
                    <Typography variant="caption" className="layout-popover__title">
                        ESCOLHER LAYOUT
                    </Typography>
                    
                    <Button
                        fullWidth
                        onClick={() => handleLayoutSelect('')}
                        className={`layout-popover__btn ${!selectedLayoutId ? 'layout-popover__btn--selected' : ''}`}
                    >
                        <span>Sem Layout</span>
                        {!selectedLayoutId && <Check fontSize="small" />}
                    </Button>

                    <Divider className="editor-header__divider--horizontal" />

                    {layouts.map((layout) => (
                        <Button
                            key={layout.id}
                            fullWidth
                            onClick={() => handleLayoutSelect(layout.id)}
                            className={`layout-popover__btn ${selectedLayoutId === layout.id ? 'layout-popover__btn--selected' : ''}`}
                        >
                            <span>{layout.name}</span>
                            {selectedLayoutId === layout.id && <Check fontSize="small" />}
                        </Button>
                    ))}
                </Stack>
            </Popover>
        </AppBar>
    )
}
