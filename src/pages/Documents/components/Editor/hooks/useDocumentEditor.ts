import { useState, useCallback, useEffect } from 'react'
import type { Block } from '../components/DocumentBlockEditor'
import { useDocumentPagination } from './useDocumentPagination'

const DEFAULT_BLOCKS: Block[] = [{ id: '1', type: 'text', content: [{ text: '' }] }]

export const useDocumentEditor = (
    initialData: Block[],
    maxHeight: number,
    blockRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>,
    initialTitle?: string
) => {
    const [allBlocks, setAllBlocks] = useState<Block[]>(() => 
        initialData && initialData.length > 0 ? initialData : DEFAULT_BLOCKS
    )
    const [title, setTitle] = useState(initialTitle || '')
    const [isDirty, setIsDirty] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [history, setHistory] = useState<{ past: Block[][], future: Block[][] }>({
        past: [],
        future: []
    })

    const pages = useDocumentPagination(allBlocks, maxHeight, blockRefs)

    useEffect(() => {
        // If we have initial data and we haven't touched the document (or we are just initializing),
        // update the blocks. This covers the case where data loads asynchronously.
        if (initialData && initialData.length > 0 && !isDirty) {
            // Check if we are really different to avoid loops/unnecessary updates
            const currentStr = JSON.stringify(allBlocks)
            const initialStr = JSON.stringify(initialData)
            
            if (currentStr !== initialStr) {
                // If current blocks are just the default empty block, we can safely overwrite
                // Or if !isDirty, we assume the incoming data is the source of truth
                setAllBlocks(initialData)
            }
        }
    }, [initialData, isDirty]) // Removed allBlocks length dependency to allow overwriting default state

    useEffect(() => {
        if (initialTitle && title === '') {
            setTitle(initialTitle)
        }
    }, [initialTitle, title])

    const updateBlocks = useCallback((newBlocks: Block[]) => {
        setAllBlocks(prev => {
            setHistory(curr => ({
                past: [...curr.past, prev].slice(-50),
                future: []
            }))
            return newBlocks
        })
        setIsDirty(true)
    }, [])

    const undo = useCallback(() => {
        setAllBlocks(prev => {
            if (history.past.length === 0) return prev
            const previous = history.past[history.past.length - 1]
            const newPast = history.past.slice(0, -1)
            
            setHistory({
                past: newPast,
                future: [prev, ...history.future]
            })
            return previous
        })
    }, [history])

    const redo = useCallback(() => {
        setAllBlocks(prev => {
            if (history.future.length === 0) return prev
            const next = history.future[0]
            const newFuture = history.future.slice(1)
            
            setHistory({
                past: [...history.past, prev],
                future: newFuture
            })
            return next
        })
    }, [history])

    const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([])
    const [pendingFocusId, setPendingFocusId] = useState<string | null>(null)
    const [pendingFocusOffset, setPendingFocusOffset] = useState<number | null>(null)

    return {
        title,
        setTitle,
        pages,
        allBlocks,
        setBlocks: updateBlocks,
        isDirty,
        isSaving,
        setIsSaving,
        setIsDirty,
        undo,
        redo,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        selectedBlockIds,
        setSelectedBlockIds,
        pendingFocusId,
        setPendingFocusId,
        pendingFocusOffset,
        setPendingFocusOffset
    }
}
