import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useReactToPrint } from 'react-to-print'
import { Box, CircularProgress, Backdrop, Snackbar, Alert } from '@mui/material'
import { useSearchParams } from 'react-router-dom'
import { useDocumentEditor } from './hooks/useDocumentEditor'
import { EditorHeader } from './components/EditorHeader'
import { A4Canvas } from './components/A4Canvas'
import type { DocumentBlockEditorRef } from './components/DocumentBlockEditor'
import { useAuth } from '../../../../context/AuthContext'
import { useDocument, useDocumentMutation } from '../../../../hooks/queries/documents'
import { useLayoutList } from '../../../../hooks/queries/documentLayouts'

const MAX_A4_HEIGHT_PX = 1122 // ~297mm at 96dpi

const DocumentEditorPage = () => {
    const [searchParams] = useSearchParams()
    const documentId = searchParams.get('documentId') || searchParams.get('id')
    const readOnly = searchParams.get('readonly') === 'true'

    const { data: layouts = [], isLoading: loadingLayouts } = useLayoutList()
    const { data: doc, isLoading: loadingDoc } = useDocument(documentId)
    const saveMutation = useDocumentMutation()

    // Focus Persistence Refs
    const lastBlockCountRef = useRef(0)
    const latestCreatedBlockIdRef = useRef<string | null>(null)
    const [selectedLayoutId, setSelectedLayoutId] = useState<string | null>(null)
    const [showWatermark, setShowWatermark] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const { user } = useAuth()
    const [docCode, setDocCode] = useState<string | undefined>(undefined)
    const editorRef = useRef<DocumentBlockEditorRef>(null)
    const blockRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
    const [snackbar, setSnackbar] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success'
    })

    const componentRef = useRef<HTMLDivElement>(null)

    // Sync state with doc data when loaded
    useEffect(() => {
        if (doc) {
            setDocCode(doc.code)
            if (doc.document_layout_id) setSelectedLayoutId(doc.document_layout_id)
            if (doc.has_watermark) setShowWatermark(doc.has_watermark)
        }
    }, [doc])

    const initialContent = useMemo(() => doc?.content || [], [doc])
    const initialTitle = useMemo(() => doc?.title || '', [doc])

    // Initialize Hook
    const {
        title,
        setTitle,
        pages,
        allBlocks,
        setBlocks,
        isSaving,
        setIsSaving,
        undo,
        redo,
        canUndo,
        canRedo,
        selectedBlockIds,
        setSelectedBlockIds,
        pendingFocusId,
        setPendingFocusId,
        pendingFocusOffset,
        setPendingFocusOffset
    } = useDocumentEditor(
        initialContent,
        MAX_A4_HEIGHT_PX,
        blockRefs,
        initialTitle
    )

    // Focus Persistence to handle New Page Creation (Enter -> New Page)
    useEffect(() => {
        if (allBlocks.length > lastBlockCountRef.current) {
            // Block Added: Capture the pending focus ID (which points to the new block)
            if (pendingFocusId) {
                latestCreatedBlockIdRef.current = pendingFocusId
            }
        }
        lastBlockCountRef.current = allBlocks.length
    }, [allBlocks, pendingFocusId])

    useEffect(() => {
        if (latestCreatedBlockIdRef.current && pages.length > 0) {
            // If the layout changed (pages updated) and we have a recently created block tracking
            const targetBlockId = latestCreatedBlockIdRef.current
            const exists = pages.some(p => p.blocks.some(b => b.id === targetBlockId))
            if (exists) {
                // Force re-assertion of focus directly to the ID.
                // This ensures that even if the component remounted on a new page, it gets the signal.
                setPendingFocusId(targetBlockId)
                latestCreatedBlockIdRef.current = null
            }
        }
    }, [pages, setPendingFocusId])

    const pagesRef = useRef(pages)
    useEffect(() => {
        pagesRef.current = pages
    }, [pages])

    const handlePrintFn = useReactToPrint({
        contentRef: componentRef,
        documentTitle: title || 'Documento'
    })

    const handleSave = async () => {
        try {
            setIsSaving(true)
            await saveMutation.mutateAsync({
                id: documentId || undefined,
                code: docCode,
                title,
                content: allBlocks, // Saving the raw blocks
                document_layout_id: selectedLayoutId || undefined,
                has_watermark: showWatermark,
                status: 'draft', // Default to draft
                created_by: user?.fullName || 'SYSTEM',
                updated_by: user?.fullName || 'SYSTEM'
            })
            setSnackbar({
                open: true,
                message: 'Documento salvo com sucesso!',
                severity: 'success'
            })
        } catch (error: any) {
            console.error(error)
            setSnackbar({
                open: true,
                message: `Erro ao salvar: ${error.message || 'Erro interno'}`,
                severity: 'error'
            })
        } finally {
            setIsSaving(false)
        }
    }

    const handlePrint = () => {
        handlePrintFn()
    }

    const handlePageChange = useCallback((pageId: string, newPageBlocks: any[]) => {
        const currentPages = pagesRef.current
        const pageIndex = currentPages.findIndex(p => p.id === pageId)
        if (pageIndex === -1) return

        const beforePagesBlocks = currentPages.slice(0, pageIndex).flatMap(p => p.blocks)
        const afterPagesBlocks = currentPages.slice(pageIndex + 1).flatMap(p => p.blocks)

        // Identity-safe merge: ensure each block ID only appears once.
        // We prioritize the blocks reported by the current page editor.
        const newPageIds = new Set(newPageBlocks.map(b => b.id))
        const filteredBefore = beforePagesBlocks.filter(b => !newPageIds.has(b.id))
        const filteredAfter = afterPagesBlocks.filter(b => !newPageIds.has(b.id))

        const newAllBlocks = [...filteredBefore, ...newPageBlocks, ...filteredAfter]
        setBlocks(newAllBlocks)
    }, [setBlocks])

    const handleSelectAll = useCallback(() => {
        setSelectedBlockIds(allBlocks.map(b => b.id))
    }, [allBlocks, setSelectedBlockIds])

    const handleRequestMergeToPrevious = useCallback((blockId: string) => {
        const index = allBlocks.findIndex(b => b.id === blockId)
        if (index <= 0) return

        const currentBlock = allBlocks[index]
        const prevBlock = allBlocks[index - 1]

        // Simple merge: append current content segments to previous
        const currentContent = Array.isArray(currentBlock.content) ? currentBlock.content : [{ text: String(currentBlock.content || '') }]
        const prevContent = Array.isArray(prevBlock.content) ? prevBlock.content : [{ text: String(prevBlock.content || '') }]

        // Calculate offset for focus (end of previous block)
        const prevLength = prevContent.reduce((acc: number, seg: any) => acc + (seg.text || '').length, 0)

        // Helper to normalize segments (merge adjacent text nodes)
        const normalizeSegments = (segments: any[]) => {
            if (segments.length === 0) return [{ text: '' }]
            const merged: any[] = []
            let current = { ...segments[0] }

            for (let i = 1; i < segments.length; i++) {
                const next = segments[i]
                // If same styling, merge text
                if (current.bold === next.bold && current.underline === next.underline) {
                    current.text += next.text
                } else {
                    merged.push(current)
                    current = { ...next }
                }
            }
            merged.push(current)
            return merged
        }

        const newPrevContent = normalizeSegments([...prevContent, ...currentContent])

        const newBlocks = allBlocks.filter(b => b.id !== blockId).map(b => {
            if (b.id === prevBlock.id) {
                return { ...b, content: newPrevContent }
            }
            return b
        })

        setBlocks(newBlocks)

        // Ensure pending focus is set after state update
        requestAnimationFrame(() => {
            setPendingFocusId(prevBlock.id)
            setPendingFocusOffset(prevLength)
        })
    }, [allBlocks, setBlocks, setPendingFocusId, setPendingFocusOffset])

    const handleRequestMergeFromNext = useCallback((blockId: string) => {
        const index = allBlocks.findIndex(b => b.id === blockId)
        if (index === -1 || index >= allBlocks.length - 1) return

        const currentBlock = allBlocks[index]
        const nextBlock = allBlocks[index + 1]

        // Reuse or copy normalizeSegments logic
        const normalizeSegments = (segments: any[]) => {
            if (segments.length === 0) return [{ text: '' }]
            const merged: any[] = []
            let current = { ...segments[0] }

            for (let i = 1; i < segments.length; i++) {
                const next = segments[i]
                // If same styling, merge text
                if (current.bold === next.bold && current.underline === next.underline) {
                    current.text += next.text
                } else {
                    merged.push(current)
                    current = { ...next }
                }
            }
            merged.push(current)
            return merged
        }

        const currentContent = Array.isArray(currentBlock.content) ? currentBlock.content : [{ text: String(currentBlock.content || '') }]
        const nextContent = Array.isArray(nextBlock.content) ? nextBlock.content : [{ text: String(nextBlock.content || '') }]

        // Focus stays at the end of current content (before merge)
        const currentLength = currentContent.reduce((acc: number, seg: any) => acc + (seg.text || '').length, 0)

        const newContent = normalizeSegments([...currentContent, ...nextContent])
        const newBlocks = allBlocks.filter(b => b.id !== nextBlock.id).map(b => {
            if (b.id === blockId) {
                return { ...b, content: newContent }
            }
            return b
        })

        setBlocks(newBlocks)
        // Ensure pending focus is set after state update
        requestAnimationFrame(() => {
            setPendingFocusId(blockId)
            setPendingFocusOffset(currentLength)
        })
    }, [allBlocks, setBlocks, setPendingFocusId, setPendingFocusOffset])

    // Keyboard Shortcuts (Cmd+S)
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault()
                handleSave()
            }
        }
        window.addEventListener('keydown', handleKeys)
        return () => window.removeEventListener('keydown', handleKeys)
    }, [title, allBlocks, selectedLayoutId, showWatermark, user])

    // Handle ESC key for fullscreen
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullscreen) {
                setIsFullscreen(false)
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isFullscreen])

    // Determine active layout
    const activeLayout = useMemo(() =>
        layouts.find(l => l.id === selectedLayoutId) || null
        , [layouts, selectedLayoutId])

    const isLoading = loadingLayouts || (!!documentId && loadingDoc)

    if (isLoading) {
        return (
            <Backdrop open={true} sx={{ color: '#fff', zIndex: 9999 }}>
                <CircularProgress color="inherit" />
            </Backdrop>
        )
    }

    return (
        <Box sx={{ p: 0 }} className={isFullscreen ? 'editor-fullscreen' : ''}>
            <EditorHeader
                title={title}
                onChangeTitle={setTitle}
                onSave={handleSave}
                onPrint={handlePrint}
                onUndo={undo}
                onRedo={redo}
                canUndo={canUndo}
                canRedo={canRedo}
                isSaving={isSaving || saveMutation.isPending}
                showWatermark={showWatermark}
                onToggleWatermark={() => setShowWatermark(!showWatermark)}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                onFormatting={(type, value) => {
                    editorRef.current?.applyFormatting(type, value)
                }}
                layouts={layouts}
                selectedLayoutId={selectedLayoutId}
                onLayoutChange={setSelectedLayoutId}
            />

            <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden', height: isFullscreen ? 'calc(100vh - 64px)' : 'auto' }}>
                <Box sx={{ flex: 1, overflow: 'auto', position: 'relative' }}>
                    <div ref={componentRef}>
                        <A4Canvas
                            pages={pages}
                            layout={activeLayout}
                            showWatermark={showWatermark}
                            readOnly={readOnly}
                            title={title}
                            selectedBlockIds={selectedBlockIds}
                            onSelectedBlockIdsChange={setSelectedBlockIds}
                            onSelectAll={handleSelectAll}
                            pendingFocusId={pendingFocusId}
                            onPendingFocusIdChange={setPendingFocusId}
                            pendingFocusOffset={pendingFocusOffset}
                            onPendingFocusOffsetChange={setPendingFocusOffset}
                            onPageChange={handlePageChange}
                            ref={editorRef}
                            maxHeight={MAX_A4_HEIGHT_PX}
                            code={docCode}
                            onRequestMergeToPrevious={handleRequestMergeToPrevious}
                            onRequestMergeFromNext={handleRequestMergeFromNext}
                        />
                    </div>
                </Box>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    )
}

export default DocumentEditorPage
