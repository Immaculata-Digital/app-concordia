import { useState, useEffect } from 'react'

export type TableDensity = 'ultra-thin' | 'thin' | 'medium' | 'high' | 'ultra-high'

export interface ColumnSetting {
    key: string
    visible: boolean
    widthLevel: number
}

interface UseTableSettingsProps {
    title?: string
    columns: { key: any; defaultHidden?: boolean }[]
}

export const useTableSettings = ({ title, columns }: UseTableSettingsProps) => {
    const [density, setDensity] = useState<TableDensity>(
        (localStorage.getItem('table-density') as TableDensity) || 'medium'
    )

    const [columnSettings, setColumnSettings] = useState<ColumnSetting[]>(() => {
        const storageKey = `table-columns-${title || 'default'}`
        const saved = localStorage.getItem(storageKey)
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                const currentKeys = columns.map(c => String(c.key))
                const filtered = parsed.filter((s: any) => currentKeys.includes(s.key))
                const missing = columns.filter(c => !parsed.find((s: any) => s.key === String(c.key)))
                    .map(c => ({ key: String(c.key), visible: !c.defaultHidden, widthLevel: 2 }))

                return [...filtered, ...missing].map((s: any) => ({
                    ...s,
                    widthLevel: s.widthLevel || 2
                }))
            } catch (e) {
                console.error('Failed to parse column settings', e)
            }
        }
        return columns.map(col => ({ key: String(col.key), visible: !col.defaultHidden, widthLevel: 2 }))
    })

    useEffect(() => {
        const storageKey = `table-columns-${title || 'default'}`
        localStorage.setItem(storageKey, JSON.stringify(columnSettings))
    }, [columnSettings, title])

    const handleDensityChange = (newDensity: TableDensity) => {
        setDensity(newDensity)
        localStorage.setItem('table-density', newDensity)
    }

    const toggleColumnVisibility = (key: string) => {
        setColumnSettings(prev => prev.map(s =>
            s.key === key ? { ...s, visible: !s.visible } : s
        ))
    }

    const changeColumnWidth = (key: string, widthLevel: number) => {
        setColumnSettings(prev => prev.map(s =>
            s.key === key ? { ...s, widthLevel } : s
        ))
    }

    const reorderColumns = (newSettings: ColumnSetting[]) => {
        setColumnSettings(newSettings)
    }

    return {
        density,
        setDensity: handleDensityChange,
        columnSettings,
        setColumnSettings: reorderColumns,
        toggleColumnVisibility,
        changeColumnWidth
    }
}
