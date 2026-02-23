import { useState, useCallback } from 'react'

export const useTableSelection = <T extends { id: string | number }>(rows: T[]) => {
    const [selectedIds, setSelectedIds] = useState<Array<T['id']>>([])

    const allSelected =
        rows.length > 0 &&
        rows.every((row) => selectedIds.includes(row.id))

    const handleToggleSelectAll = useCallback(() => {
        if (allSelected) {
            setSelectedIds([])
        } else {
            setSelectedIds(rows.map((row) => row.id))
        }
    }, [allSelected, rows])

    const handleToggleSelectRow = useCallback((id: T['id']) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
        )
    }, [])

    const clearSelection = useCallback(() => {
        setSelectedIds([])
    }, [])

    return {
        selectedIds,
        setSelectedIds,
        allSelected,
        handleToggleSelectAll,
        handleToggleSelectRow,
        clearSelection,
    }
}
