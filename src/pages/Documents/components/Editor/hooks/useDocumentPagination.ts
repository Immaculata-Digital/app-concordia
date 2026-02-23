import { useState, useEffect } from 'react'
import type { Block } from '../components/DocumentBlockEditor'

export interface Page {
    id: string
    blocks: Block[]
}

export const useDocumentPagination = (
    blocks: Block[],
    maxHeight: number,
    blockRefs: React.MutableRefObject<{ [key: string]: HTMLDivElement | null }>
) => {
    const [pages, setPages] = useState<Page[]>([{ id: 'page-1', blocks: [] }])

    useEffect(() => {
        if (!maxHeight || !blocks.length) {
            setPages([{ id: 'page-1', blocks: [...blocks] }])
            return
        }

        const timeoutId = setTimeout(() => {
            const SAFETY_MARGIN = 100
            const threshold = maxHeight - SAFETY_MARGIN
            const BLOCK_GAP = 8 

            const newPages: Page[] = []
            let currentPageBlocks: Block[] = []
            let currentHeight = 0

            blocks.forEach((block) => {
                const el = blockRefs.current[block.id]
                const blockHeight = el ? el.offsetHeight : 40 

                // PROACTIVE JUMP: If the current block alone is tall 
                // and it would cross the threshold, move it to next page early.
                // Or if we are already deep in the page (>70%) and a block is moderately tall
                const wouldExceed = currentHeight + blockHeight + BLOCK_GAP > threshold
                const isTallPartiallyFilling = blockHeight > 60 && currentHeight > threshold * 0.7

                if ((wouldExceed || isTallPartiallyFilling) && currentPageBlocks.length > 0) {
                    newPages.push({
                        id: `page-${newPages.length + 1}`,
                        blocks: currentPageBlocks
                    })
                    currentPageBlocks = [block]
                    currentHeight = blockHeight
                } else {
                    currentPageBlocks.push(block)
                    currentHeight += blockHeight + BLOCK_GAP
                }
            })

            if (currentPageBlocks.length > 0) {
                newPages.push({
                    id: `page-${newPages.length + 1}`,
                    blocks: currentPageBlocks
                })
            }

            setPages(newPages.length > 0 ? newPages : [{ id: 'page-1', blocks: [] }])
        }, 20) // Reduced for almost instant reaction

        return () => clearTimeout(timeoutId)
    }, [blocks, maxHeight, blockRefs])

    return pages
}
