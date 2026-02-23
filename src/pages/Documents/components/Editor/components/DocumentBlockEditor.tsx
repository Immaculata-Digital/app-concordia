import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useImperativeHandle } from 'react'
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText, Popover, IconButton } from '@mui/material'
import {
    DragIndicator,
    TextFields,
    Title,
    FormatListBulleted,
    FormatListNumbered,
    Add,
    Delete
} from '@mui/icons-material'
import Icon from '@mui/material/Icon'
import PickerSearchBar from '../../../../../components/PickerSearchBar'
import './DocumentBlockEditor.css'

export type BlockType = 'text' | 'h1' | 'h2' | 'h3' | 'bullet' | 'number'

export interface TextSegment {
    text: string
    bold?: boolean
    underline?: boolean
}

export interface Block {
    id: string
    type: BlockType
    content: string | TextSegment[]
    completed?: boolean
    align?: 'left' | 'center' | 'right'
    indent?: number
}

export interface DocumentBlockEditorProps {
    value: string | Block[]
    onChange: (value: string) => void
    disabled?: boolean
    placeholder?: string
    mentions?: { id: string; name: string; icon?: string }[]
    maxHeight?: number
    blockRefs?: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>
    selectedBlockIds?: string[]
    onSelectedBlockIdsChange?: (ids: string[]) => void
    onSelectAll?: () => void
    pendingFocusId?: string | null
    onPendingFocusIdChange?: (id: string | null) => void
    pendingFocusOffset?: number | null
    onPendingFocusOffsetChange?: (offset: number | null) => void
    allowDeletionOfLastBlock?: boolean
    onRequestMergeToPrevious?: (blockId: string) => void
    onRequestMergeFromNext?: (blockId: string) => void
}

export interface DocumentBlockEditorRef {
    applyFormatting: (type: string, value?: any) => void
}

const DEFAULT_BLOCKS: Block[] = [{ id: '1', type: 'text', content: [{ text: '' }] }]

const parseHtmlToSegments = (html: string): TextSegment[] => {
    const temp = document.createElement('div')
    temp.innerHTML = html
    const segments: TextSegment[] = []

    const traverse = (node: Node, bold = false, underline = false) => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent || ''
            if (text) {
                segments.push({
                    text,
                    bold: bold || undefined,
                    underline: underline || undefined
                })
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement
            const tagName = el.tagName.toUpperCase()
            const style = el.getAttribute('style') || ''
            const isBold = bold || ['B', 'STRONG'].includes(tagName) || style.includes('font-weight: bold') || style.includes('font-weight:bold')
            const isUnderline = underline || tagName === 'U' || style.includes('text-decoration: underline') || style.includes('text-decoration:underline')

            el.childNodes.forEach(child => traverse(child, isBold, isUnderline))
        }
    }

    temp.childNodes.forEach(node => traverse(node))

    if (segments.length === 0) return [{ text: '' }]

    // Normalize: combine adjacent segments with same attributes
    const normalized: TextSegment[] = []
    let current = { ...segments[0] }
    for (let i = 1; i < segments.length; i++) {
        const next = segments[i]
        if (current.bold === next.bold && current.underline === next.underline) {
            current.text += next.text
        } else {
            normalized.push(current)
            current = { ...next }
        }
    }
    normalized.push(current)
    return normalized
}

const segmentsToHtml = (segments: string | TextSegment[]): string => {
    if (typeof segments === 'string') return segments
    if (!Array.isArray(segments)) return ''
    return segments.map(s => {
        let res = (s.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        if (s.bold) res = `<b>${res}</b>`
        if (s.underline) res = `<u>${res}</u>`
        return res
    }).join('')
}

interface BlockContentProps {
    blockId: string
    content: string | TextSegment[]
    type: string
    completed?: boolean
    disabled: boolean
    onKeyDown: (e: React.KeyboardEvent) => void
    onInput: (e: React.FormEvent<HTMLDivElement>) => void
    onPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void
    placeholder: string
    blockRef: (el: HTMLDivElement | null) => void
    onFocus?: () => void
    onBlur?: () => void
}

const BlockContent: React.FC<BlockContentProps> = ({
    content,
    type,
    completed,
    disabled,
    onKeyDown,
    onInput,
    onPaste,
    placeholder,
    blockRef,
    onFocus,
    onBlur
}) => {
    const internalRef = useRef<HTMLDivElement>(null)
    const isFirstRender = useRef(true)

    useEffect(() => {
        if (internalRef.current && isFirstRender.current) {
            internalRef.current.innerHTML = segmentsToHtml(content)
            isFirstRender.current = false
        }
    }, [])

    useEffect(() => {
        if (internalRef.current && document.activeElement !== internalRef.current) {
            const html = segmentsToHtml(content)
            if (internalRef.current.innerHTML !== html) {
                internalRef.current.innerHTML = html
            }
        }
    }, [content])

    return (
        <div
            ref={(el) => {
                // @ts-ignore
                internalRef.current = el
                blockRef(el)
            }}
            className={`doc-block-content doc-block-content--${type} ${completed ? 'doc-block-content--completed' : ''}`}
            contentEditable={!disabled}
            suppressContentEditableWarning
            onKeyDown={onKeyDown}
            onInput={onInput}
            onPaste={onPaste}
            onFocus={onFocus}
            onBlur={onBlur}
            data-placeholder={placeholder}
        />
    )
}

const DocumentBlockEditor = React.forwardRef<DocumentBlockEditorRef, DocumentBlockEditorProps>(({
    value,
    onChange,
    disabled = false,
    placeholder = "Digite '/' para comandos...",
    mentions = [],
    maxHeight,
    blockRefs: externalBlockRefs,
    selectedBlockIds: propsSelectedBlockIds,
    onSelectedBlockIdsChange: propsOnSelectedBlockIdsChange,
    onSelectAll,
    pendingFocusId,
    onPendingFocusIdChange,
    pendingFocusOffset,
    onPendingFocusOffsetChange,
    allowDeletionOfLastBlock = false, // Default: don't delete last on page 1
    onRequestMergeToPrevious,
    onRequestMergeFromNext
}, ref) => {
    const [blocks, setBlocks] = useState<Block[]>([])
    const [slashMenu, setSlashMenu] = useState<{ open: boolean; blockId: string; query: string }>({
        open: false,
        blockId: '',
        query: ''
    })
    const [mentionMenu, setMentionMenu] = useState<{ open: boolean; blockId: string; query: string; filter: string }>({
        open: false,
        blockId: '',
        query: '',
        filter: ''
    })
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [isEditorFocused, setIsEditorFocused] = useState(false)
    const [dragOverInfo, setDragOverInfo] = useState<{ index: number; side: 'top' | 'bottom' } | null>(null)
    const [pendingSlashMenu, setPendingSlashMenu] = useState<string | null>(null)

    // STICKY FOCUS: Claim focus if this editor contains the pending focus ID
    useEffect(() => {
        if (!pendingFocusId) return

        const attemptFocus = (retries = 5) => {
            const el = blockRefs.current[pendingFocusId]
            if (el) {
                // We found the element! Claim focus and clear the global state
                el.focus()
                const range = document.createRange()
                const sel = window.getSelection()

                if (pendingFocusOffset !== null && pendingFocusOffset !== undefined) {
                    // Try to find the exact text node and offset
                    let currentOffset = 0
                    let found = false
                    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null)
                    let node
                    while (node = walker.nextNode()) {
                        const textNode = node as Text
                        if (currentOffset + textNode.length >= pendingFocusOffset) {
                            range.setStart(textNode, pendingFocusOffset - currentOffset)
                            found = true
                            break
                        }
                        currentOffset += textNode.length
                    }

                    if (!found) {
                        range.selectNodeContents(el)
                        range.collapse(false)
                    } else {
                        range.collapse(true)
                    }
                } else {
                    range.selectNodeContents(el)
                    range.collapse(false) // Collapse to end by default for new blocks
                }

                sel?.removeAllRanges()
                sel?.addRange(range)
                
                
                el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                
                // Clear the pending focus so it doesn't re-trigger on subsequent renders
                if (onPendingFocusIdChange) onPendingFocusIdChange(null)
                if (onPendingFocusOffsetChange) onPendingFocusOffsetChange(null)
            } else if (retries > 0) {
                requestAnimationFrame(() => attemptFocus(retries - 1))
            }
        }
        attemptFocus()
    }, [blocks, pendingFocusId, pendingFocusOffset, onPendingFocusIdChange, onPendingFocusOffsetChange])
    const [blockMenu, setBlockMenu] = useState<{ open: boolean; blockId: string; anchorEl: HTMLElement | null }>({
        open: false,
        blockId: '',
        anchorEl: null
    })
    const [isTransforming, setIsTransforming] = useState(false)

    // History for Undo/Redo
    const [history, setHistory] = useState<Block[][]>([])
    const [redoStack, setRedoStack] = useState<Block[][]>([])
    const isUndoingRedoing = useRef(false)
    const lastSavedBlocks = useRef<string>('')

    const [internalSelectedBlockIds, setInternalSelectedBlockIds] = useState<string[]>([])
    const selectedBlockIds = propsSelectedBlockIds || internalSelectedBlockIds
    const setSelectedBlockIds = (idsOrFn: string[] | ((prev: string[]) => string[])) => {
        if (propsOnSelectedBlockIdsChange) {
            if (typeof idsOrFn === 'function') {
                propsOnSelectedBlockIdsChange(idsOrFn(selectedBlockIds))
            } else {
                propsOnSelectedBlockIdsChange(idsOrFn)
            }
        } else {
            setInternalSelectedBlockIds(idsOrFn)
        }
    }
    const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null)
    const internalBlockRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
    const blockRefs = externalBlockRefs || internalBlockRefs
    const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
    const [isSelecting, setIsSelecting] = useState(false)
    const selectionStart = useRef<{ x: number; y: number } | null>(null)
    const editorContentRef = useRef<HTMLDivElement>(null)
    const scrollContainerRef = useRef<HTMLDivElement>(null)



    // Initialize blocks from value
    useEffect(() => {
        if (typeof value === 'string') {
            try {
                if (value.startsWith('[') || value.startsWith('{')) {
                    const parsed = JSON.parse(value)
                    const currentStr = JSON.stringify(blocks)
                    if (JSON.stringify(parsed) !== currentStr) {
                        setBlocks(Array.isArray(parsed) && (parsed.length > 0 || allowDeletionOfLastBlock) ? parsed : DEFAULT_BLOCKS)
                    }
                } else if (value.trim() === '') {
                    if (allowDeletionOfLastBlock) {
                        setBlocks([])
                    } else if (blocks.length !== 1 || blocks[0].content !== '') {
                        setBlocks(DEFAULT_BLOCKS)
                    }
                } else {
                    if (blocks.length !== 1 || blocks[0].id !== 'legacy') {
                        setBlocks([{ id: 'legacy', type: 'text', content: [{ text: value }] }])
                    }
                }
            } catch (e) {
                setBlocks([{ id: 'error', type: 'text', content: [{ text: value }] }])
            }
        } else if (Array.isArray(value)) {
            // Prevent feedback loop if value matches current blocks
            const valueStr = JSON.stringify(value)
            const currentStr = JSON.stringify(blocks)
            if (valueStr !== currentStr) {
                setBlocks(value.length > 0 || allowDeletionOfLastBlock ? value : DEFAULT_BLOCKS)
            }
        } else {
            setBlocks(allowDeletionOfLastBlock ? [] : DEFAULT_BLOCKS)
        }
    }, [value])


    // Measurement for pagination - handled by useDocumentPagination hook
    useLayoutEffect(() => {
        // This hook is kept for future measurement triggers if needed,
        // but the actual blocking logic is removed.
    }, [blocks, maxHeight]) // Check when blocks change

    const triggerChange = useCallback((newBlocks: Block[]) => {
        onChange(JSON.stringify(newBlocks))
    }, [onChange])

    const handleUndo = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
        if (e && 'stopPropagation' in e) e.stopPropagation()
        if (history.length <= 1) return

        isUndoingRedoing.current = true
        const newHistory = [...history]
        const current = newHistory.pop()!
        const previous = newHistory[newHistory.length - 1]

        setRedoStack(prev => [current, ...prev])
        setHistory(newHistory)

        setBlocks(previous)
        triggerChange(previous)
        lastSavedBlocks.current = JSON.stringify(previous)

        // Manual sync for contentEditable elements
        setTimeout(() => {
            previous.forEach(b => {
                const el = blockRefs.current[b.id]
                const html = segmentsToHtml(b.content)
                if (el && el.innerHTML !== html) {
                    el.innerHTML = html
                }
            })
        }, 0)
    }, [history, triggerChange])

    const handleRedo = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
        if (e && 'stopPropagation' in e) e.stopPropagation()
        if (redoStack.length === 0) return

        isUndoingRedoing.current = true
        const next = redoStack[0]
        const newRedoStack = redoStack.slice(1)

        setHistory(prev => [...prev, next])
        setRedoStack(newRedoStack)

        setBlocks(next)
        triggerChange(next)
        lastSavedBlocks.current = JSON.stringify(next)

        // Manual sync for contentEditable elements
        setTimeout(() => {
            next.forEach(b => {
                const el = blockRefs.current[b.id]
                const html = segmentsToHtml(b.content)
                if (el && el.innerHTML !== html) {
                    el.innerHTML = html
                }
            })
        }, 0)
    }, [redoStack, triggerChange])

    // History tracking
    useEffect(() => {
        if (isUndoingRedoing.current) {
            isUndoingRedoing.current = false
            return
        }

        if (blocks.length === 0) return

        const timer = setTimeout(() => {
            const currentBlocksStr = JSON.stringify(blocks)
            if (currentBlocksStr !== lastSavedBlocks.current) {
                setHistory(prev => {
                    // If history is empty and lastSavedBlocks is empty, this is initial load
                    if (prev.length === 0 && lastSavedBlocks.current === '') {
                        lastSavedBlocks.current = currentBlocksStr
                        return [blocks]
                    }
                    const newHistory = [...prev, blocks].slice(-50)
                    lastSavedBlocks.current = currentBlocksStr
                    return newHistory
                })
                setRedoStack([])
            }
        }, 1000)

        return () => clearTimeout(timer)
    }, [blocks])

    // Keyboard shortcuts for Undo/Redo
    useEffect(() => {
        const handleKeys = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                if (e.shiftKey) {
                    e.preventDefault()
                    handleRedo(e)
                } else {
                    e.preventDefault()
                    handleUndo(e)
                }
            } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault()
                handleRedo(e)
            }
        }

        window.addEventListener('keydown', handleKeys)
        return () => window.removeEventListener('keydown', handleKeys)
    }, [handleUndo, handleRedo])

    useEffect(() => {
        if (pendingSlashMenu) {
            const el = blockRefs.current[pendingSlashMenu]
            if (el) {
                setSlashMenu({
                    open: true,
                    blockId: pendingSlashMenu,
                    query: ''
                })
                setAnchorEl(el)
                setSelectedIndex(0)
                setPendingSlashMenu(null)
            }
        }
    }, [blocks, pendingSlashMenu])

    const updateBlock = (id: string, updates: Partial<Block>) => {
        const newBlocks = blocks.map(b => b.id === id ? { ...b, ...updates } : b)
        setBlocks(newBlocks)
        triggerChange(newBlocks)
    }

    const removeBlock = (id: string) => {
        const newBlocks = blocks.filter(b => b.id !== id)
        setBlocks(newBlocks)
        triggerChange(newBlocks)
    }

    const applyFormatting = useCallback((type: string, value?: any) => {
        if (type === 'bold' || type === 'italic' || type === 'underline') {
            document.execCommand(type, false)
        } else if (type === 'align') {
            const targetIds = selectedBlockIds.length > 0 ? selectedBlockIds : (focusedBlockId ? [focusedBlockId] : [])
            if (targetIds.length > 0) {
                const newBlocks = blocks.map(b => targetIds.includes(b.id) ? { ...b, align: value } : b)
                setBlocks(newBlocks)
                triggerChange(newBlocks)
            }
        }
    }, [selectedBlockIds, focusedBlockId, blocks, triggerChange])

    useImperativeHandle(ref, () => ({
        applyFormatting
    }))

    const updateBlocks = (ids: string[], updates: Partial<Block>) => {
        const newBlocks = blocks.map(b => ids.includes(b.id) ? { ...b, ...updates } : b)
        setBlocks(newBlocks)
        triggerChange(newBlocks)
    }

    const addBlock = (afterId: string, type: BlockType = 'text', content: string | TextSegment[] = [{ text: '' }]) => {

        const newId = Math.random().toString(36).substr(2, 9)
        const newBlock: Block = { id: newId, type, content: Array.isArray(content) ? content : [{ text: content }] }
        
        const index = blocks.findIndex(b => b.id === afterId)
        const newBlocks = [...blocks]
        newBlocks.splice(index + 1, 0, newBlock)
        
        setBlocks(newBlocks)
        triggerChange(newBlocks)

        if (onPendingFocusIdChange) {
            onPendingFocusIdChange(newId)
        }

        return newId
    }

    const moveBlocks = (targetIndex: number, side: 'top' | 'bottom') => {
        const idsToMove = selectedBlockIds.length > 0
            ? blocks.filter(b => selectedBlockIds.includes(b.id)).map(b => b.id)
            : draggedBlockIndex !== null ? [blocks[draggedBlockIndex].id] : []

        if (idsToMove.length === 0) return

        const targetBlockId = blocks[targetIndex].id
        const movingBlocks = blocks.filter(b => idsToMove.includes(b.id))
        const remainingBlocks = blocks.filter(b => !idsToMove.includes(b.id))

        let insertIndex = remainingBlocks.findIndex(b => b.id === targetBlockId)
        if (side === 'bottom') {
            insertIndex++
        }

        // If target was one of the moving blocks, we need a fallback
        if (insertIndex === -1) {
            // This case shouldn't happen if target is visible, but just in case:
            insertIndex = targetIndex
        }

        const newBlocks = [...remainingBlocks]
        newBlocks.splice(insertIndex, 0, ...movingBlocks)

        setBlocks(newBlocks)
        triggerChange(newBlocks)
        setSelectedBlockIds([])
    }

    const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null)

    const handleDragStart = (e: React.DragEvent, index: number) => {
        const blockId = blocks[index].id
        if (!selectedBlockIds.includes(blockId)) {
            setSelectedBlockIds([blockId])
        }
        setDraggedBlockIndex(index)
        e.dataTransfer.setData('text/plain', index.toString())
        e.dataTransfer.effectAllowed = 'move'

        // Custom drag image could be added here for multiple blocks
    }

    const handleDragEnd = () => {
        setDraggedBlockIndex(null)
        setDragOverInfo(null)
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        if (draggedBlockIndex === null) return

        const rect = e.currentTarget.getBoundingClientRect()
        const midY = rect.top + rect.height / 2
        const side = e.clientY < midY ? 'top' : 'bottom'

        setDragOverInfo({ index, side })
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        if (draggedBlockIndex === null || dragOverInfo === null) return

        moveBlocks(dragOverInfo.index, dragOverInfo.side)
        setDraggedBlockIndex(null)
        setDragOverInfo(null)
    }


    const handleDragHandleClick = (e: React.MouseEvent<HTMLElement>, blockId: string) => {
        setBlockMenu({
            open: true,
            blockId,
            anchorEl: e.currentTarget
        })
    }

    const handleBlockMenuClose = () => {
        setBlockMenu({
            open: false,
            blockId: '',
            anchorEl: null
        })
        setIsTransforming(false)
    }

    const handlePlusClick = (e: React.MouseEvent, block: Block) => {
        e.stopPropagation()
        const newId = addBlock(block.id, 'text', '')
        if (newId) setPendingSlashMenu(newId)
    }

    const handleCopy = useCallback((e: React.ClipboardEvent) => {
        if (selectedBlockIds.length > 0) {
            e.preventDefault()
            const selectedBlocks = blocks.filter(b => selectedBlockIds.includes(b.id))
            const text = selectedBlocks.map(b => b.content).join('\n')
            const json = JSON.stringify(selectedBlocks)

            e.clipboardData.setData('text/plain', text)
            e.clipboardData.setData('application/json', json)

            // For external apps, create some HTML
            const html = selectedBlocks.map(b => {
                if (b.type === 'h1') return `<h1>${b.content}</h1>`
                if (b.type === 'h2') return `<h2>${b.content}</h2>`
                if (b.type === 'h3') return `<h3>${b.content}</h3>`
                if (b.type === 'bullet') return `<li>${b.content}</li>`
                if (b.type === 'number') return `<li>${b.content}</li>`
                return `<p>${b.content}</p>`
            }).join('')
            e.clipboardData.setData('text/html', html)
        }
    }, [selectedBlockIds, blocks])

    const insertBlocks = useCallback((currentBlockId: string, newBlocks: Block[]) => {
        if (newBlocks.length === 0) return

        const index = blocks.findIndex(b => b.id === currentBlockId)
        if (index === -1) return

        let updatedBlocks = [...blocks]
        let insertIndex = index

        const firstBlock = newBlocks[0]
        const remainingBlocks = newBlocks.slice(1).map(b => ({ ...b, id: Math.random().toString(36).substr(2, 9) }))

        if (selectedBlockIds.length > 0 && selectedBlockIds.includes(currentBlockId)) {
            // Replace весь selected range if it contains currentBlockId
            const selectedIndices = blocks.map((b, i) => selectedBlockIds.includes(b.id) ? i : -1).filter(i => i !== -1)
            const minIdx = Math.min(...selectedIndices)
            const maxIdx = Math.max(...selectedIndices)

            const blocksToInsert = [{ ...firstBlock, id: blocks[minIdx].id }, ...remainingBlocks]
            updatedBlocks.splice(minIdx, maxIdx - minIdx + 1, ...blocksToInsert)
            insertIndex = minIdx
        } else {
            // Replace current block content and insert others after
            updatedBlocks[index] = { ...updatedBlocks[index], content: firstBlock.content, type: firstBlock.type }
            updatedBlocks.splice(index + 1, 0, ...remainingBlocks)
        }

        setBlocks(updatedBlocks)
        triggerChange(updatedBlocks)
        setSelectedBlockIds([])

        // Update DOM and focus
        const focusId = updatedBlocks[insertIndex].id
        setTimeout(() => {
            const el = blockRefs.current[focusId]
            if (el) {
                const html = segmentsToHtml(updatedBlocks[insertIndex].content)
                el.innerHTML = html
                el.focus()
                // Set cursor at end
                const selection = window.getSelection()
                const range = document.createRange()
                range.selectNodeContents(el)
                range.collapse(false)
                selection?.removeAllRanges()
                selection?.addRange(range)
            }

            // Also update others if they were inserted
            remainingBlocks.forEach(b => {
                const bEl = blockRefs.current[b.id]
                if (bEl) bEl.innerHTML = segmentsToHtml(b.content)
            })
        }, 0)
    }, [blocks, selectedBlockIds, triggerChange])

    const handlePaste = useCallback((e: React.ClipboardEvent, block: Block) => {
        if (disabled) {
            e.preventDefault()
            return
        }
        const text = e.clipboardData.getData('text/plain')
        const html = e.clipboardData.getData('text/html')
        const jsonData = e.clipboardData.getData('application/json')

        let pastedBlocks: Block[] = []

        try {
            if (jsonData) {
                const parsed = JSON.parse(jsonData)
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && typeof parsed[0].type === 'string') {
                    pastedBlocks = parsed.map(b => ({ ...b, id: Math.random().toString(36).substr(2, 9) }))
                }
            }
        } catch (err) { }

        if (pastedBlocks.length === 0 && html) {
            const parser = new DOMParser()
            const doc = parser.parseFromString(html, 'text/html')

            // Detect if it's multiple elements or just one
            const elements = Array.from(doc.body.querySelectorAll('p, h1, h2, h3, li, div'))
            const containerElements = elements.filter(el => {
                // If it's a LI, its parent might be in the list too (UL/OL which we don't handle directly as blocks)
                // We want to avoid nested duplicates.
                if (el.tagName.toLowerCase() === 'li') return true
                if (['h1', 'h2', 'h3', 'p'].includes(el.tagName.toLowerCase())) return true
                // For divs, only count them if they are direct children of body or don't have block parents
                if (el.tagName.toLowerCase() === 'div' && el.parentElement === doc.body) return true
                return false
            })

            if (containerElements.length > 0) {
                containerElements.forEach(el => {
                    const tagName = el.tagName.toLowerCase()
                    let type: BlockType = 'text'
                    if (tagName === 'h1') type = 'h1'
                    else if (tagName === 'h2') type = 'h2'
                    else if (tagName === 'h3') type = 'h3'
                    else if (tagName === 'li') {
                        type = el.parentElement?.tagName.toLowerCase() === 'ol' ? 'number' : 'bullet'
                    }

                    const html = (el as HTMLElement).innerHTML.trim()
                    if (html) {
                        pastedBlocks.push({
                            id: Math.random().toString(36).substr(2, 9),
                            type,
                            content: parseHtmlToSegments(html)
                        })
                    }
                })
            }
        }

        if (pastedBlocks.length === 0 && text) {
            const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0)
            if (lines.length > 1) {
                pastedBlocks = lines.map(line => ({
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'text',
                    content: line
                }))
            }
        }

        if (pastedBlocks.length > 1) {
            e.preventDefault()
            insertBlocks(block.id, pastedBlocks)
        } else if (pastedBlocks.length === 1) {
            const currentBlock = blocks.find(b => b.id === block.id)
            if (currentBlock && currentBlock.type !== pastedBlocks[0].type && (Array.isArray(currentBlock.content) ? currentBlock.content[0]?.text === '' : currentBlock.content === '')) {
                e.preventDefault()
                updateBlock(block.id, { type: pastedBlocks[0].type, content: pastedBlocks[0].content })
                if (blockRefs.current[block.id]) {
                    blockRefs.current[block.id]!.innerHTML = segmentsToHtml(pastedBlocks[0].content)
                }
            }
        }
    }, [blocks, insertBlocks, updateBlock])

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (disabled) return

        // Only start selection if clicking on the container or background, not on buttons or handles
        if (
            (e.target as HTMLElement).closest('.doc-block-actions') ||
            (e.target as HTMLElement).closest('.doc-slash-menu') ||
            (e.target as HTMLElement).closest('.MuiPopover-root')
        ) {
            return
        }

        const isContentEditable = (e.target as HTMLElement).isContentEditable
        if (isContentEditable && !e.shiftKey) {
            setSelectedBlockIds([])
            return
        }

        const rect = editorContentRef.current?.getBoundingClientRect()
        if (!rect) return

        setIsSelecting(true)
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top + (scrollContainerRef.current?.scrollTop || 0)
        selectionStart.current = { x, y }
        setSelectionRect({ x, y, w: 0, h: 0 })

        if (!e.shiftKey) {
            setSelectedBlockIds([])
        }
    }, [disabled])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isSelecting || !selectionStart.current || !editorContentRef.current) return

        const rect = editorContentRef.current.getBoundingClientRect()
        const currentX = e.clientX - rect.left
        const currentY = e.clientY - rect.top + (scrollContainerRef.current?.scrollTop || 0)

        const x = Math.min(selectionStart.current.x, currentX)
        const y = Math.min(selectionStart.current.y, currentY)
        const w = Math.abs(selectionStart.current.x - currentX)
        const h = Math.abs(selectionStart.current.y - currentY)

        setSelectionRect({ x, y, w, h })

        // Find blocks within the selection rectangle
        const newSelectedIds: string[] = []
        blocks.forEach(block => {
            const el = blockRefs.current[block.id]?.parentElement // Get the .doc-block-item
            if (el) {
                const bRect = el.getBoundingClientRect()
                const relativeTop = bRect.top - rect.top + (scrollContainerRef.current?.scrollTop || 0)
                const relativeBottom = relativeTop + bRect.height

                // Simple vertical overlap check is often enough for Notion-like editor
                // but let's do a full intersection check for better feel
                const isIntersecting = !(
                    x > (0 + rect.width) || // Outside right
                    (x + w) < 0 || // Outside left
                    y > relativeBottom || // Below
                    (y + h) < relativeTop // Above
                )

                if (isIntersecting) {
                    newSelectedIds.push(block.id)
                }
            }
        })

        setSelectedBlockIds(newSelectedIds)
    }, [isSelecting, blocks])

    const handleMouseUp = useCallback(() => {
        setIsSelecting(false)
        setSelectionRect(null)
        selectionStart.current = null
    }, [])

    useEffect(() => {
        if (isSelecting) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        } else {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isSelecting, handleMouseMove, handleMouseUp])


    const menuOptions = [
        { type: 'text', label: 'Texto', desc: 'Comece a escrever com texto simples.', icon: <TextFields /> },
        { type: 'h1', label: 'Título 1', desc: 'Título de seção grande.', icon: <Title fontSize="large" /> },
        { type: 'h2', label: 'Título 2', desc: 'Título de seção médio.', icon: <Title fontSize="medium" /> },
        { type: 'h3', label: 'Título 3', desc: 'Título de seção pequeno.', icon: <Title fontSize="small" /> },
        { type: 'bullet', label: 'Lista com marcadores', desc: 'Crie uma lista simples.', icon: <FormatListBulleted /> },
        { type: 'number', label: 'Lista numerada', desc: 'Crie uma lista com números.', icon: <FormatListNumbered /> },
    ].filter(opt => opt.label.toLowerCase().includes(slashMenu.query.toLowerCase()))

    const mentionOptions = (mentions || []).filter(variable =>
        variable.name.toLowerCase().includes(mentionMenu.filter.toLowerCase())
    )

    const selectMenuOption = (option: any) => {
        const currentBlockId = slashMenu.blockId
        const updatedBlocks = blocks.map(b => b.id === currentBlockId ? { ...b, type: option.type as BlockType } : b)
        setBlocks(updatedBlocks)
        triggerChange(updatedBlocks)
        setSlashMenu({ open: false, blockId: '', query: '' })

        const block = blocks.find(b => b.id === currentBlockId)
        if (block) {
            const el = blockRefs.current[block.id]
            if (el) {
                // Remove the slash command from the HTML safely
                const selection = window.getSelection()
                const range = document.createRange()
                const textContent = el.innerText
                const lastSlashIndex = textContent.lastIndexOf('/' + slashMenu.query)

                if (lastSlashIndex !== -1) {
                    let currentOffset = 0
                    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null)
                    let node
                    while (node = walker.nextNode()) {
                        const textNode = node as Text
                        if (currentOffset + textNode.length >= lastSlashIndex + 1) { // +1 to target the slash
                            const offsetInNode = lastSlashIndex - currentOffset
                            range.setStart(textNode, offsetInNode)
                            range.setEnd(textNode, Math.min(offsetInNode + slashMenu.query.length + 1, textNode.length))
                            break
                        }
                        currentOffset += textNode.length
                    }
                    selection?.removeAllRanges()
                    selection?.addRange(range)
                    document.execCommand('delete')
                }

                const cleanHtml = el.innerHTML
                const segments = parseHtmlToSegments(cleanHtml)
                updateBlock(slashMenu.blockId, { type: option.type as BlockType, content: segments })
            }
        }
        setSlashMenu({ ...slashMenu, open: false })
        setAnchorEl(null)
    }

    const selectMentionOption = (variable: { id: string; name: string }) => {
        const block = blocks.find(b => b.id === mentionMenu.blockId)
        if (block) {
            const el = blockRefs.current[block.id]
            if (el) {
                // Remove the @mention query from the HTML safely
                const selection = window.getSelection()
                const range = document.createRange()
                const textContent = el.innerText
                const lastAtIndex = textContent.lastIndexOf('@' + mentionMenu.query)

                if (lastAtIndex !== -1) {
                    let currentOffset = 0
                    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null)
                    let node
                    while (node = walker.nextNode()) {
                        const textNode = node as Text
                        if (currentOffset + textNode.length >= lastAtIndex + 1) { // +1 to target the @
                            const offsetInNode = lastAtIndex - currentOffset
                            range.setStart(textNode, offsetInNode)
                            range.setEnd(textNode, Math.min(offsetInNode + mentionMenu.query.length + 1, textNode.length))
                            break
                        }
                        currentOffset += textNode.length
                    }
                    selection?.removeAllRanges()
                    selection?.addRange(range)
                    document.execCommand('delete')

                    // Insert the mention placeholder
                    document.execCommand('insertText', false, `{{${variable.id}}}`)
                }

                const newHtml = el.innerHTML
                const segments = parseHtmlToSegments(newHtml)
                updateBlock(mentionMenu.blockId, { content: segments })
            }
        }
        setMentionMenu({ ...mentionMenu, open: false })
        setAnchorEl(null)
    }

    const handleKeyDown = (e: React.KeyboardEvent, block: Block) => {
        if (disabled) return

        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            const selection = window.getSelection()
            if (selection && selection.rangeCount > 0) {
                const el = e.currentTarget as HTMLElement

                // Check if the entire text of the current block is already selected
                // We use a safe comparison of text lengths and content
                const isEntireTextSelected =
                    selection.toString().length === el.innerText.length &&
                    el.innerText.length > 0

                if (isEntireTextSelected || el.innerText.length === 0) {
                    e.preventDefault()
                    if (onSelectAll) {
                        onSelectAll()
                    } else {
                        setSelectedBlockIds(blocks.map(b => b.id))
                    }
                    return
                }
            }
        }

        if (slashMenu.open) {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(prev => (prev + 1) % menuOptions.length)
                return
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(prev => (prev - 1 + menuOptions.length) % menuOptions.length)
                return
            }
            if (e.key === 'Enter') {
                e.preventDefault()
                selectMenuOption(menuOptions[selectedIndex])
                return
            }
            if (e.key === 'Escape') {
                e.stopPropagation()
                setSlashMenu({ ...slashMenu, open: false })
                setAnchorEl(null)
                return
            }
        }

        if (mentionMenu.open) {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(prev => (prev + 1) % mentionOptions.length)
                return
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(prev => (prev - 1 + mentionOptions.length) % mentionOptions.length)
                return
            }
            if (e.key === 'Enter') {
                e.preventDefault()
                if (mentionOptions[selectedIndex]) {
                    selectMentionOption(mentionOptions[selectedIndex])
                }
                return
            }
            if (e.key === 'Escape') {
                e.stopPropagation()
                setMentionMenu({ ...mentionMenu, open: false })
                setAnchorEl(null)
                return
            }
        }

        if (e.key === 'Escape' && selectedBlockIds.length > 0) {
            e.stopPropagation()
            setSelectedBlockIds([])
            return
        }

        // Bulk delete support
        if (selectedBlockIds.length > 0 && (e.key === 'Backspace' || e.key === 'Delete')) {
            e.preventDefault()
            const newBlocks = blocks.filter(b => !selectedBlockIds.includes(b.id))
            if (newBlocks.length === 0) {
                newBlocks.push({ id: Math.random().toString(36).substr(2, 9), type: 'text', content: [{ text: '' }] })
            }
            setBlocks(newBlocks)
            triggerChange(newBlocks)
            setSelectedBlockIds([])

            // Focus the block above the deleted ones if possible
            const firstSelectedIndex = blocks.findIndex(b => selectedBlockIds.includes(b.id))
            const focusIndex = Math.max(0, firstSelectedIndex - 1)
            const focusId = newBlocks[Math.min(focusIndex, newBlocks.length - 1)].id
            setTimeout(() => {
                const el = blockRefs.current[focusId]
                if (el) el.focus()
            }, 0)
            return
        }

        if (e.key === 'ArrowUp') {


            const selection = window.getSelection()
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0)
                const el = e.currentTarget as HTMLElement

                // If at start of block, move to previous block
                const isAtStart = range.startOffset === 0 && (range.startContainer === el || el.firstChild === range.startContainer || el.contains(range.startContainer))

                if (isAtStart) {
                    // Double check with a more robust method: is there any content before the selection?
                    const startRange = document.createRange()
                    startRange.selectNodeContents(el)
                    startRange.setEnd(range.startContainer, range.startOffset)
                    const contentBefore = startRange.toString().length === 0

                    if (contentBefore) {
                        const index = blocks.findIndex(b => b.id === block.id)
                        if (index > 0) {
                            e.preventDefault()
                            const prevBlockId = blocks[index - 1].id
                            if (onPendingFocusIdChange) onPendingFocusIdChange(prevBlockId)
                        }
                    }
                }
            }
        }

        if (e.key === 'ArrowDown') {
            const selection = window.getSelection()
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0)
                const el = e.currentTarget as HTMLElement

                // Check if there is any content after the current internal offset
                const endRange = document.createRange()
                endRange.selectNodeContents(el)
                endRange.setStart(range.endContainer, range.endOffset)
                const contentAfter = endRange.toString().length === 0

                if (contentAfter) {
                    const index = blocks.findIndex(b => b.id === block.id)
                    if (index < blocks.length - 1) {
                        e.preventDefault()
                        const nextBlockId = blocks[index + 1].id
                        if (onPendingFocusIdChange) onPendingFocusIdChange(nextBlockId)
                        if (onPendingFocusOffsetChange) onPendingFocusOffsetChange(0) // Focus start of next block
                    }
                }
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()

            const selection = window.getSelection()
            if (selection && selection.rangeCount > 0 && ['text', 'h1', 'h2', 'h3', 'bullet', 'number'].includes(block.type)) {
                const range = selection.getRangeAt(0)
                const el = e.currentTarget as HTMLElement

                // Check for empty list item to break out of list
                if ((block.type === 'bullet' || block.type === 'number') && el.innerText.trim() === '') {
                    updateBlock(block.id, { type: 'text' })
                    return
                }

                // Create ranges for before and after the cursor using cloneContents for HTML safety
                const preRange = range.cloneRange()
                preRange.selectNodeContents(el)
                preRange.setEnd(range.startContainer, range.startOffset)

                const postRange = range.cloneRange()
                postRange.selectNodeContents(el)
                postRange.setStart(range.endContainer, range.endOffset)

                const beforeContainer = document.createElement('div')
                beforeContainer.appendChild(preRange.cloneContents())
                const beforeHtml = beforeContainer.innerHTML
                const beforeSegments = parseHtmlToSegments(beforeHtml)

                const afterContainer = document.createElement('div')
                afterContainer.appendChild(postRange.cloneContents())
                const afterHtml = afterContainer.innerHTML
                const afterSegments = parseHtmlToSegments(afterHtml)

                // Update current block
                const currentBlockIndex = blocks.findIndex(b => b.id === block.id)
                const updatedCurrentBlock = { ...block, content: beforeSegments }

                const newType = (block.type === 'bullet' || block.type === 'number') ? block.type : 'text'
                const newBlock: Block = { id: Math.random().toString(36).substr(2, 9), type: newType as BlockType, content: afterSegments }

                const splitBlocks = [updatedCurrentBlock, newBlock]

                // Insert the new split blocks
                const finalBlocks = [...blocks]
                finalBlocks.splice(currentBlockIndex, 1, ...splitBlocks)

                setBlocks(finalBlocks)
                triggerChange(finalBlocks)

                // Update the DOM for the current block
                if (blockRefs.current[block.id]) {
                    blockRefs.current[block.id]!.innerHTML = beforeHtml
                }

                // Use sticky focus for the new block
                if (onPendingFocusIdChange) {
                    onPendingFocusIdChange(newBlock.id)
                }
            } else {
                // For other types or if selection logic is skipped, also add as text
                addBlock(block.id, 'text')
            }
        }

        if (e.key === 'Tab') {
            e.preventDefault()
            const currentIndent = block.indent || 0
            if (e.shiftKey) {
                // Outdent
                if (currentIndent > 0) {
                    updateBlock(block.id, { indent: currentIndent - 1 })
                }
            } else {
                // Indent (max 4)
                if (currentIndent < 4) {
                    updateBlock(block.id, { indent: currentIndent + 1 })
                }
            }
        }

        if (e.key === 'Backspace') {
            const selection = window.getSelection()
            if (selection && selection.rangeCount > 0 && selection.isCollapsed) {
                const range = selection.getRangeAt(0)
                const el = e.currentTarget as HTMLElement

                const preRange = range.cloneRange()
                preRange.selectNodeContents(el)
                preRange.setEnd(range.startContainer, range.startOffset)
                // Fix for Firefox/Safari which sometimes reports non-text nodes
                // If the selection is at the very start (offset 0 of first node), it's at start
                // We also check if the text content before the cursor is empty logic
                const isAtStart = (range.startOffset === 0 && range.startContainer === el) || 
                                  (range.startOffset === 0 && range.startContainer === el.firstChild) ||
                                  preRange.toString().length === 0 ||
                                  (preRange.toString().trim() === '' && preRange.toString().length < 2) // Allow for single zero-width char?

                if (isAtStart) {
                    // If indented, backspace at the start should outdent first
                    if ((block.indent || 0) > 0) {
                        e.preventDefault()
                        updateBlock(block.id, { indent: (block.indent || 0) - 1 })
                        return
                    }

                    // If it's a list item, backspace at the start should transform it to a paragraph first
                    if (block.type === 'bullet' || block.type === 'number') {
                        e.preventDefault()
                        updateBlock(block.id, { type: 'text' })
                        return
                    }

                    const index = blocks.findIndex(b => b.id === block.id)
                    if (index > 0) {
                        e.preventDefault()
                        const prevBlock = blocks[index - 1]
                        const currentHtml = segmentsToHtml(block.content)
                        const prevHtml = segmentsToHtml(prevBlock.content)
                        const newHtml = prevHtml + currentHtml
                        const newSegments = parseHtmlToSegments(newHtml)

                        const newBlocks = blocks.filter(b => b.id !== block.id)
                        const finalBlocks = newBlocks.map(b => b.id === prevBlock.id ? { ...b, content: newSegments } : b)

                        setBlocks(finalBlocks)
                        triggerChange(finalBlocks)

                        if (blockRefs.current[prevBlock.id]) {
                            blockRefs.current[prevBlock.id]!.innerHTML = newHtml
                        }

                        const temp = document.createElement('div')
                        temp.innerHTML = prevHtml
                        const prevPlainTextLength = temp.innerText.length

                        if (onPendingFocusIdChange) onPendingFocusIdChange(prevBlock.id)
                        if (onPendingFocusOffsetChange) onPendingFocusOffsetChange(prevPlainTextLength)
                        return
                    } else if (onRequestMergeToPrevious) {
                        // MERGE TO PREVIOUS PAGE REQUEST
                        e.preventDefault()
                        console.log('Requesting merge to previous page for block:', block.id)
                        onRequestMergeToPrevious(block.id)
                        return
                    }
                }
            }
        }

        // Support for DELETE key (forward merge)
        if (e.key === 'Delete') {
            const selection = window.getSelection()
            if (selection && selection.rangeCount > 0 && selection.isCollapsed) {
                const range = selection.getRangeAt(0)
                const el = e.currentTarget as HTMLElement
                
                // Check if at End
                const postRange = range.cloneRange()
                postRange.selectNodeContents(el)
                postRange.setStart(range.endContainer, range.endOffset)
                
                const isAtEnd = postRange.toString().length === 0 || 
                                (postRange.toString().trim() === '' && postRange.toString().length < 2)

                if (isAtEnd) {
                    const index = blocks.findIndex(b => b.id === block.id)
                    if (index < blocks.length - 1) {
                         // Merge with next block on same page
                        e.preventDefault()
                        const nextBlock = blocks[index + 1]
                        
                        // Merge next into current
                        const currentHtml = segmentsToHtml(block.content)
                        const nextHtml = segmentsToHtml(nextBlock.content)
                        const newHtml = currentHtml + nextHtml
                        const newSegments = parseHtmlToSegments(newHtml)

                        const newBlocks = blocks.filter(b => b.id !== nextBlock.id)
                        const finalBlocks = newBlocks.map(b => b.id === block.id ? { ...b, content: newSegments } : b)

                        setBlocks(finalBlocks)
                        triggerChange(finalBlocks)

                        // Update DOM: current block gets new content
                        if (blockRefs.current[block.id]) {
                            blockRefs.current[block.id]!.innerHTML = newHtml
                        }

                        // Focus stays on current block, but we need to calculate offset?
                        // Cursor should be at the end of original content (which it is, since we append)
                        // Actually, cursor stays where it is! 
                        // But React re-render might lose it. Using pendingFocus.
                        
                        const temp = document.createElement('div')
                        temp.innerHTML = currentHtml
                        const currentPlainTextLength = temp.innerText.length
                        
                        if (onPendingFocusIdChange) onPendingFocusIdChange(block.id)
                        if (onPendingFocusOffsetChange) onPendingFocusOffsetChange(currentPlainTextLength)
                        return
                    } else if (onRequestMergeFromNext) {
                        // Request content from next page
                        e.preventDefault()
                        onRequestMergeFromNext(block.id)
                        return
                    }
                }
            }
        }

        if (e.key === '/') {
            setSlashMenu({
                open: true,
                blockId: block.id,
                query: ''
            })
            setAnchorEl(e.currentTarget as HTMLElement)
            setSelectedIndex(0)
        }

        if (e.key === '@') {
            setMentionMenu({
                open: true,
                blockId: block.id,
                query: '',
                filter: ''
            })
            setAnchorEl(e.currentTarget as HTMLElement)
            setSelectedIndex(0)
        }
    }

    const handleInput = (e: React.FormEvent<HTMLDivElement>, block: Block) => {
        const el = e.currentTarget
        const content = el.innerHTML
        const textContent = el.innerText

        // Markdown-style shortcuts
        // Check for # space, ## space, ### space, - space, 1. space at the start
        const shortcuts = [
            { pattern: /^#\s/, type: 'h1' },
            { pattern: /^##\s/, type: 'h2' },
            { pattern: /^###\s/, type: 'h3' },
            { pattern: /^-\s/, type: 'bullet' },
            { pattern: /^\*\s/, type: 'bullet' },
            { pattern: /^1\.\s/, type: 'number' },
            { pattern: /^p\s/, type: 'text' }
        ]

        for (const shortcut of shortcuts) {
            if (shortcut.pattern.test(textContent)) {
                const prefixMatch = textContent.match(shortcut.pattern)
                const prefixLength = prefixMatch ? prefixMatch[0].length : 0
                const remainingText = textContent.substring(prefixLength)
                
                // Clear the element content to avoid visual glitch, then let React re-render
                el.innerText = remainingText
                
                updateBlock(block.id, { 
                    type: shortcut.type as BlockType,
                    content: parseHtmlToSegments(remainingText)
                })
                return
            }
        }

        if (slashMenu.open && slashMenu.blockId === block.id) {
            const lastSlashIndex = textContent.lastIndexOf('/')
            if (lastSlashIndex !== -1) {
                const query = textContent.substring(lastSlashIndex + 1)
                setSlashMenu(prev => ({ ...prev, query }))
            } else {
                setSlashMenu(prev => ({ ...prev, open: false }))
                setAnchorEl(null)
            }
        }

        if (mentionMenu.open && mentionMenu.blockId === block.id) {
            const lastAtIndex = textContent.lastIndexOf('@')
            if (lastAtIndex !== -1) {
                const query = textContent.substring(lastAtIndex + 1)
                setMentionMenu(prev => ({ ...prev, query, filter: query }))
            } else {
                setMentionMenu(prev => ({ ...prev, open: false }))
                setAnchorEl(null)
            }
        }

        // Markdown Shortcuts
        if (block.type === 'text' && !slashMenu.open && !mentionMenu.open) {
            // We strip potential ZWSP or NBSP that browsers might insert
            const cleanText = textContent.replace(/[\u200B\u00A0]/g, ' ')
            
            let newType: BlockType | null = null

            if (cleanText === '# ') { newType = 'h1' }
            else if (cleanText === '## ') { newType = 'h2' }
            else if (cleanText === '### ') { newType = 'h3' }
            else if (cleanText === '- ' || cleanText === '* ') { newType = 'bullet' }
            else if (cleanText === '1. ') { newType = 'number' }

            if (newType) {
                // Remove the markdown symbols
                e.currentTarget.innerHTML = '' // Clear visual content immediately
                updateBlock(block.id, { 
                    type: newType, 
                    content: [{ text: '' }] 
                })
                return
            }
        }

        updateBlock(block.id, { content: parseHtmlToSegments(content) })
    }



    return (
        <Box
            ref={scrollContainerRef}
            className={`doc-block-editor ${isEditorFocused ? 'doc-block-editor--focused' : ''} ${isSelecting ? 'doc-block-editor--selecting' : ''}`}
            onFocus={() => setIsEditorFocused(true)}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setIsEditorFocused(false)
                }
            }}
            onMouseDown={handleMouseDown}
            onCopy={handleCopy}
        >
            <Box
                className="doc-block-editor__content doc-block-editor__selection-area"
                ref={editorContentRef}
            >
                {selectionRect && (
                    <Box
                        className="doc-block-editor__selection-rect print-hidden"
                        style={{
                            left: selectionRect.x,
                            top: selectionRect.y,
                            width: selectionRect.w,
                            height: selectionRect.h
                        }}
                    />
                )}
                {blocks.map((block, index) => {
                    const isDragTarget = dragOverInfo?.index === index
                    const dragSideClass = isDragTarget ? `doc-block-item--drag-over-${dragOverInfo.side}` : ''
                    const isSelected = selectedBlockIds.includes(block.id)

                    return (
                        <Box
                            key={block.id}
                            className={`doc-block-item doc-block-item--${block.type} ${dragSideClass} ${isSelected ? 'doc-block-item--selected' : ''} doc-block-item--align-${block.align || 'left'}`}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e)}
                            onClick={(e) => {
                                if (selectedBlockIds.length > 0 && !isSelected) {
                                    setSelectedBlockIds([])
                                }
                                // Focus the content if clicking empty space
                                if (e.target === e.currentTarget) {
                                    const el = blockRefs.current[block.id]
                                    if (el) el.focus()
                                }
                            }}
                            style={{ 
                                paddingLeft: block.indent ? `${block.indent * 40}px` : undefined,
                                transition: 'padding-left 0.2s ease'
                            }}
                        >
                            {!disabled && (
                                <div className="doc-block-actions print-hidden">
                                    <IconButton
                                        size="small"
                                        className="doc-block-add-btn"
                                        onClick={(e) => handlePlusClick(e, block)}
                                    >
                                        <Add fontSize="small" />
                                    </IconButton>
                                    <div
                                        className="doc-block-drag-handle"
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragEnd={handleDragEnd}
                                        onClick={(e) => handleDragHandleClick(e, block.id)}
                                    >
                                        <DragIndicator fontSize="small" />
                                    </div>
                                </div>
                            )}

                            {block.type === 'number' && (
                                <Typography
                                    variant="body1"
                                    className="doc-block-item__number"
                                >
                                    {(() => {
                                        let count = 0
                                        for (let i = index; i >= 0; i--) {
                                            if (blocks[i].type === 'number') count++
                                            else break
                                        }
                                        return `${count}.`
                                    })()}
                                </Typography>
                            )}

                            <BlockContent
                                blockId={block.id}
                                content={block.content}
                                type={block.type}
                                completed={block.completed}
                                disabled={disabled}
                                onKeyDown={(e) => handleKeyDown(e, block)}
                                onInput={(e) => handleInput(e, block)}
                                onPaste={(e) => handlePaste(e, block)}
                                placeholder={index === 0 ? placeholder : ''}
                                blockRef={(el) => {
                                    blockRefs.current[block.id] = el
                                }}
                                onFocus={() => setFocusedBlockId(block.id)}
                                onBlur={() => setTimeout(() => setFocusedBlockId(prev => prev === block.id ? null : prev), 100)}
                            />
                        </Box>
                    )
                })}
            </Box>

            {/* Selection Rectangle */}
            {selectionRect && (
                <div
                    className="doc-block-editor__selection-rect"
                    style={{
                        left: selectionRect.x,
                        top: selectionRect.y,
                        width: selectionRect.w,
                        height: selectionRect.h
                    }}
                />
            )}

            {/* Slash Menu */}
            <Popover
                open={slashMenu.open}
                anchorEl={anchorEl}
                onClose={() => {
                    setSlashMenu(prev => ({ ...prev, open: false }))
                    setAnchorEl(null)
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                disableAutoFocus
                disableEnforceFocus
                slotProps={{
                    paper: { className: 'slash-menu-paper' }
                }}
            >
                <List dense>
                    <Typography variant="caption" className="slash-menu__section-title">
                        COMANDOS BÁSICOS
                    </Typography>
                    {menuOptions.map((opt, i) => (
                        <ListItem
                            key={opt.type}
                            className={`slash-menu__item ${i === selectedIndex ? 'slash-menu__item--selected' : ''}`}
                            onClick={() => selectMenuOption(opt)}
                            onMouseEnter={() => setSelectedIndex(i)}
                        >
                            <ListItemIcon className="slash-menu__icon">
                                {opt.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Typography variant="body2" className="slash-menu__item-title">
                                        {opt.label}
                                    </Typography>
                                }
                                secondary={
                                    <Typography variant="caption" className="slash-menu__item-desc">
                                        {opt.desc}
                                    </Typography>
                                }
                            />
                        </ListItem>
                    ))}
                    {menuOptions.length === 0 && (
                        <ListItem>
                            <ListItemText primary="Nenhum comando encontrado" />
                        </ListItem>
                    )}
                </List>
            </Popover>

            <Popover
                open={mentionMenu.open}
                anchorEl={anchorEl}
                onClose={() => {
                    setMentionMenu(prev => ({ ...prev, open: false }))
                    setAnchorEl(null)
                }}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                disableAutoFocus
                disableEnforceFocus
                slotProps={{
                    paper: { className: 'slash-menu-paper' }
                }}
            >
                <List dense>
                    <Box className="slash-menu__search-container">
                        <PickerSearchBar
                            placeholder="Pesquisar variável..."
                            value={mentionMenu.filter}
                            onChange={(val) => setMentionMenu(prev => ({ ...prev, filter: val }))}
                            onKeyDown={(e) => e.stopPropagation()}
                        />
                    </Box>
                    <Typography variant="caption" className="slash-menu__section-title">
                        VARIÁVEIS DE CONTRATO
                    </Typography>
                    {mentionOptions.map((variable, i) => (
                        <ListItem
                            key={variable.id}
                            className={`slash-menu__item ${i === selectedIndex ? 'slash-menu__item--selected' : ''}`}
                            onClick={() => selectMentionOption(variable)}
                            onMouseEnter={() => setSelectedIndex(i)}
                        >
                            <ListItemIcon className="slash-menu__icon">
                                {variable.icon ? (
                                    <Icon fontSize="small">{variable.icon}</Icon>
                                ) : (
                                    <Add fontSize="small" />
                                )}
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Typography variant="body2" className="slash-menu__item-title">
                                        {variable.name}
                                    </Typography>
                                }
                            />
                        </ListItem>
                    ))}
                    {mentionOptions.length === 0 && (
                        <ListItem>
                            <ListItemText primary="Nenhuma variável encontrada" />
                        </ListItem>
                    )}
                </List>
            </Popover>

            <Popover
                open={blockMenu.open}
                anchorEl={blockMenu.anchorEl}
                onClose={handleBlockMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                slotProps={{
                    paper: { className: 'block-menu-paper' }
                }}
            >
                <List dense className="slash-menu__list--dense">
                    {!isTransforming ? (
                        <>
                            <ListItem
                                className="slash-menu__item"
                                onClick={() => setIsTransforming(true)}
                            >
                                <ListItemIcon className="slash-menu__item-icon-wrapper">
                                    <TextFields fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Transformar em..."
                                    primaryTypographyProps={{ variant: 'body2', className: 'slash-menu__item-title' }}
                                />
                            </ListItem>
                            <ListItem
                                className="slash-menu__item slash-menu__item--delete"
                                onClick={() => {
                                    if (selectedBlockIds.includes(blockMenu.blockId)) {
                                        const newBlocks = blocks.filter(b => !selectedBlockIds.includes(b.id))
                                        if (newBlocks.length === 0) {
                                            newBlocks.push({ id: Math.random().toString(36).substr(2, 9), type: 'text', content: [{ text: '' }] })
                                        }
                                        setBlocks(newBlocks)
                                        triggerChange(newBlocks)
                                        setSelectedBlockIds([])
                                    } else {
                                        removeBlock(blockMenu.blockId)
                                    }
                                    handleBlockMenuClose()
                                }}

                            >
                                <ListItemIcon className="slash-menu__item-icon-wrapper">
                                    <Delete fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Excluir"
                                    primaryTypographyProps={{ variant: 'body2', className: 'slash-menu__item-title' }}
                                />
                            </ListItem>
                        </>
                    ) : (
                        <>
                            <Typography variant="caption" className="slash-menu__section-title slash-menu__section-title--condensed">
                                Tranformar em
                            </Typography>
                            {[
                                { type: 'text', label: 'Texto', icon: <TextFields fontSize="small" /> },
                                { type: 'h1', label: 'Título 1', icon: <Title fontSize="small" /> },
                                { type: 'h2', label: 'Título 2', icon: <Title fontSize="small" /> },
                                { type: 'h3', label: 'Título 3', icon: <Title fontSize="small" /> },
                                { type: 'bullet', label: 'Lista com marcadores', icon: <FormatListBulleted fontSize="small" /> },
                                { type: 'number', label: 'Lista numerada', icon: <FormatListNumbered fontSize="small" /> },
                            ].map((opt) => (
                                <ListItem
                                    key={opt.type}
                                    className="slash-menu__item"
                                    onClick={() => {
                                        const idsToUpdate = selectedBlockIds.includes(blockMenu.blockId)
                                            ? selectedBlockIds
                                            : [blockMenu.blockId]
                                        updateBlocks(idsToUpdate, { type: opt.type as BlockType })
                                        handleBlockMenuClose()
                                    }}
                                >
                                    <ListItemIcon className="slash-menu__item-icon-wrapper">
                                        {opt.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={opt.label}
                                        primaryTypographyProps={{ variant: 'body2', className: 'slash-menu__item-title' }}
                                    />
                                </ListItem>
                            ))}
                        </>
                    )}
                </List>
            </Popover>
        </Box >
    )
})

export default DocumentBlockEditor
