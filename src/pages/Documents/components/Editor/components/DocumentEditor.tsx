import React from 'react'
import { Box } from '@mui/material'
import DocumentBlockEditor, { type DocumentBlockEditorProps, type DocumentBlockEditorRef } from './DocumentBlockEditor'
import './DocumentEditor.css'

interface DocumentEditorProps extends DocumentBlockEditorProps {
    forceWhite?: boolean
    allowDeletionOfLastBlock?: boolean
    onRequestMergeToPrevious?: (blockId: string) => void
    onRequestMergeFromNext?: (blockId: string) => void
}

export const DocumentEditor = React.forwardRef<DocumentBlockEditorRef, DocumentEditorProps>(({ 
    forceWhite, 
    pendingFocusId,
    onPendingFocusIdChange,
    pendingFocusOffset,
    onPendingFocusOffsetChange,
    allowDeletionOfLastBlock,
    onRequestMergeToPrevious,
    onRequestMergeFromNext,
    ...props 
}, ref) => {
    return (
        <Box 
            className={`document-editor-wrapper ${forceWhite ? 'document-editor-wrapper--force-white' : ''}`}
        >
            <DocumentBlockEditor 
                {...props} 
                pendingFocusId={pendingFocusId}
                onPendingFocusIdChange={onPendingFocusIdChange}
                pendingFocusOffset={pendingFocusOffset}
                onPendingFocusOffsetChange={onPendingFocusOffsetChange}
                allowDeletionOfLastBlock={allowDeletionOfLastBlock}
                onRequestMergeToPrevious={onRequestMergeToPrevious}
                onRequestMergeFromNext={onRequestMergeFromNext}
                ref={ref} 
            />
        </Box>
    )
})
