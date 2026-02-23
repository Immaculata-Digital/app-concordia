import React, { useEffect } from 'react'
import { DocumentEditor } from './DocumentEditor'
import type { Page } from '../hooks/useDocumentPagination'
import type { DocumentLayoutDTO } from '../../../../../services/documents'
import type { DocumentBlockEditorRef } from './DocumentBlockEditor'
import '../styles.css'

interface A4CanvasProps {
    pages: Page[]
    layout: DocumentLayoutDTO | null
    showWatermark: boolean
    onPageChange: (pageId: string, blocks: any[]) => void
    readOnly?: boolean
    title?: string
    code?: string
    maxHeight?: number
    blockRefs?: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>
    selectedBlockIds?: string[]
    onSelectedBlockIdsChange?: (ids: string[]) => void
    onSelectAll?: () => void
    pendingFocusId?: string | null
    onPendingFocusIdChange?: (id: string | null) => void
    pendingFocusOffset?: number | null
    onPendingFocusOffsetChange?: (offset: number | null) => void
    onRequestMergeToPrevious?: (blockId: string) => void
    onRequestMergeFromNext?: (blockId: string) => void
}

export const MarshallLogo = ({ color = "#D4AF37", width = '100%', opacity = 1 }: { color?: string, width?: string, opacity?: number }) => (
    <svg viewBox="0 0 1024 1024" fill={color} style={{ width, opacity }}>
        <path d="M737.49,963.54h153.74V215.32s-284.94,204.99-498.13,494.03l88.15,110.7,254.19-284.94,2.05,428.43Z" />
        <path d="M17.97,963.54h159.89S323.41,408.01,932.23,123.07c0,0,14.35,22.55,14.35,73.8,0,0,43.05-59.45,59.45-137.34l-159.89,14.35s57.4,10.25,61.5,24.6c0,0-709.27,279.81-889.66,865.07Z" />
        <polygon points="58.97 700.13 210.66 497.19 58.97 310.64 58.97 700.13" />
        <polygon points="263.96 433.64 378.76 345.49 241.41 187.65 58.97 187.65 263.96 433.64" />
    </svg>
)

export const A4Canvas = React.forwardRef<DocumentBlockEditorRef, A4CanvasProps>(({
    pages,
    layout,
    showWatermark,
    onPageChange,
    readOnly = false,
    title = '',
    code = '',
    maxHeight,
    blockRefs,
    selectedBlockIds,
    onSelectedBlockIdsChange,
    onSelectAll,
    pendingFocusId,
    onPendingFocusIdChange,
    pendingFocusOffset,
    onPendingFocusOffsetChange,
    onRequestMergeToPrevious,
    onRequestMergeFromNext
}, ref) => {
    const editorRefs = React.useRef<{ [key: string]: DocumentBlockEditorRef | null }>({})

    // Expose applyFormatting to callers
    React.useImperativeHandle(ref, () => ({
        applyFormatting: (type: string, value?: any) => {
            // Forward formatting to all editors. 
            // document.execCommand will only affect the focused one.
            // Alignment/State changes will affect any editor that has selected blocks.
            Object.values(editorRefs.current).forEach(editor => {
                editor?.applyFormatting(type, value)
            })
        }
    }))
    
    // Inject CSS for the chosen layout
    useEffect(() => {
        if (layout?.css) {
            const styleId = 'layout-custom-styles'
            let styleEl = document.getElementById(styleId)
            if (!styleEl) {
                styleEl = document.createElement('style')
                styleEl.id = styleId
                document.head.appendChild(styleEl)
            }
            styleEl.textContent = layout.css
        }
    }, [layout])

    const replacePlaceholders = (html: string) => {
        if (!html) return ''
        return html
            .replace(/{{TITLE}}/g, title || '')
            .replace(/{{CODE}}/g, code || '')
    }


    return (
        <div className="document-canvas">
            {pages.map((page, pageIndex) => (
                <div 
                    key={page.id}
                    className="a4-page"
                    data-has-layout={!!layout}
                    data-page-number={pageIndex + 1}
                    id={`page-${pageIndex + 1}`}
                >
                    {/* Header */}
                    {layout?.header_html && (
                        <div 
                            className="a4-header"
                            dangerouslySetInnerHTML={{ 
                                __html: replacePlaceholders(layout.header_html) 
                            }}
                        />
                    )}

                    {/* Watermark */}
                    {showWatermark && (
                        <div className="watermark-overlay">
                            <MarshallLogo color="#000" opacity={0.2} />
                        </div>
                    )}

                    <div className="a4-content-area">
                        <DocumentEditor
                            value={page.blocks}
                            onChange={(val) => {
                                try {
                                    const parsed = JSON.parse(val)
                                    onPageChange(page.id, parsed)
                                } catch (e) {
                                    console.error(e)
                                }
                            }}
                            disabled={readOnly}
                            placeholder={pageIndex === 0 ? "Escreva seu documento..." : ""}
                            forceWhite={true}
                            ref={(el) => {
                                editorRefs.current[page.id] = el
                            }}
                            maxHeight={maxHeight} 
                            blockRefs={blockRefs}
                            selectedBlockIds={selectedBlockIds}
                            onSelectedBlockIdsChange={onSelectedBlockIdsChange}
                            onSelectAll={onSelectAll}
                            pendingFocusId={pendingFocusId}
                            onPendingFocusIdChange={onPendingFocusIdChange}
                            pendingFocusOffset={pendingFocusOffset}
                            onPendingFocusOffsetChange={onPendingFocusOffsetChange}
                            allowDeletionOfLastBlock={pageIndex > 0} 
                            onRequestMergeToPrevious={pageIndex > 0 ? onRequestMergeToPrevious : undefined} 
                            onRequestMergeFromNext={pageIndex < pages.length - 1 ? onRequestMergeFromNext : undefined}
                        />
                    </div>

                    {/* Footer */}
                    {layout?.footer_html && (
                        <div 
                            className="a4-footer"
                            dangerouslySetInnerHTML={{ 
                                __html: replacePlaceholders(layout.footer_html) 
                            }}
                        />
                    )}

                    {/* Page Indicator (Editor Only) */}
                    <div className="page-number-indicator print-hidden">
                        Página {pageIndex + 1} de {pages.length}
                    </div>
                </div>
            ))}
        </div>
    )
})
