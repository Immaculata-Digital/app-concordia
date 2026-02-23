import { useEffect, type RefObject } from 'react'

/**
 * useSearchBarHotkeys Hook
 * Handles the keyboard shortcut (Ctrl+F or ⌘F) to focus the search input.
 */
export const useSearchBarHotkeys = (inputRef: RefObject<HTMLInputElement | null>) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.code === 'KeyF') {
                event.preventDefault()
                inputRef.current?.focus()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [inputRef])
}

export const getOS = () => {
    if (typeof window === 'undefined') return 'Other'
    const platform = navigator.platform
    if (/Mac|iPod|iPhone|iPad/.test(platform)) return 'Mac'
    return 'Other'
}
