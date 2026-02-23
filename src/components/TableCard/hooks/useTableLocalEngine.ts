import { useMemo } from 'react'
import type { TableCardRow, TableCardColumn, FetchDataParams } from '../index'

interface UseTableLocalEngineProps<T extends TableCardRow> {
    rows: T[]
    columns: TableCardColumn<T>[]
    query: string
    activeFilters: any
    activeSorts: any[]
    onFetchData?: (params: FetchDataParams) => void
}

export const useTableLocalEngine = <T extends TableCardRow>({
    rows,
    columns,
    query,
    activeFilters,
    activeSorts,
    onFetchData,
}: UseTableLocalEngineProps<T>) => {
    const filteredRows = useMemo(() => {
        if (onFetchData) return rows

        let result = [...rows]

        // 1. Text Search (query)
        if (query) {
            const lower = query.toLowerCase()
            result = result.filter((row) => {
                return columns.some((column) => {
                    const value = row[column.key]
                    if (value === undefined || value === null) return false
                    return String(value).toLowerCase().includes(lower)
                })
            })
        }

        // 2. Specific Filters (activeFilters - Notion style)
        if (activeFilters?.rules?.length > 0) {
            result = result.filter((row) => {
                const matches = activeFilters.rules.map((rule: any) => {
                    const rowValue = row[rule.field as keyof T]
                    const filterValue = rule.value

                    switch (rule.operator) {
                        case 'equals':
                            return String(rowValue) === String(filterValue)
                        case 'not_equals':
                            return String(rowValue) !== String(filterValue)
                        case 'contains':
                            if (Array.isArray(filterValue)) {
                                if (Array.isArray(rowValue)) {
                                    return filterValue.some((v: any) => rowValue.includes(v))
                                }
                                return filterValue.some((v: any) => String(rowValue).toLowerCase().includes(String(v).toLowerCase()))
                            }
                            return String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase())
                        case 'not_contains':
                            if (Array.isArray(filterValue)) {
                                if (Array.isArray(rowValue)) {
                                    return !filterValue.some((v: any) => rowValue.includes(v))
                                }
                                return !filterValue.some((v: any) => String(rowValue).toLowerCase().includes(String(v).toLowerCase()))
                            }
                            return !String(rowValue).toLowerCase().includes(String(filterValue).toLowerCase())
                        case 'starts_with':
                            return String(rowValue).toLowerCase().startsWith(String(filterValue).toLowerCase())
                        case 'ends_with':
                            return String(rowValue).toLowerCase().endsWith(String(filterValue).toLowerCase())
                        case 'greater_than':
                            return Number(rowValue) > Number(filterValue)
                        case 'less_than':
                            return Number(rowValue) < Number(filterValue)
                        case 'is_empty':
                            return rowValue === null || rowValue === undefined || rowValue === '' || (Array.isArray(rowValue) && rowValue.length === 0)
                        case 'is_not_empty':
                            return rowValue !== null && rowValue !== undefined && rowValue !== '' && (!Array.isArray(rowValue) || rowValue.length > 0)
                        case 'before': {
                            if (!rowValue || !filterValue) return false
                            return new Date(rowValue).getTime() < new Date(filterValue).getTime()
                        }
                        case 'after': {
                            if (!rowValue || !filterValue) return false
                            return new Date(rowValue).getTime() > new Date(filterValue).getTime()
                        }
                        case 'from': {
                            if (!rowValue || !filterValue) return false
                            return new Date(rowValue).getTime() >= new Date(filterValue).getTime()
                        }
                        case 'until': {
                            if (!rowValue || !filterValue) return false
                            return new Date(rowValue).getTime() <= new Date(filterValue).getTime()
                        }
                        case 'is':
                            if (Array.isArray(filterValue)) {
                                if (Array.isArray(rowValue)) {
                                    return rowValue.length === filterValue.length && filterValue.every((v: any) => rowValue.includes(v))
                                }
                                return false
                            }
                            if (Array.isArray(rowValue)) return rowValue.includes(filterValue)
                            return rowValue == filterValue
                        case 'is_not':
                            if (Array.isArray(filterValue)) {
                                if (Array.isArray(rowValue)) {
                                    return rowValue.length !== filterValue.length || !filterValue.every((v: any) => rowValue.includes(v))
                                }
                                return true
                            }
                            if (Array.isArray(rowValue)) return !rowValue.includes(filterValue)
                            return rowValue != filterValue
                        default:
                            return true
                    }
                })

                if (activeFilters.conjunction === 'AND') {
                    return matches.every((m: boolean) => m)
                } else {
                    return matches.some((m: boolean) => m)
                }
            })
        }

        // 3. Sorting (Sort - Notion style Multi-column)
        if (activeSorts?.length > 0) {
            result.sort((a, b) => {
                for (const sort of activeSorts) {
                    const field = sort.field as keyof T
                    const aVal = a[field]
                    const bVal = b[field]

                    if (aVal === bVal) continue

                    if (aVal === null || aVal === undefined) return 1
                    if (bVal === null || bVal === undefined) return -1

                    let comparison = 0
                    const isDate = (val: any) => val instanceof Date || (Object.prototype.toString.call(val) === '[object Date]' && !isNaN(val.getTime()))

                    if (typeof aVal === 'number' && typeof bVal === 'number') {
                        comparison = aVal - bVal
                    } else if (isDate(aVal) && isDate(bVal)) {
                        comparison = (aVal as Date).getTime() - (bVal as Date).getTime()
                    } else {
                        comparison = String(aVal).localeCompare(String(bVal))
                    }

                    if (comparison !== 0) {
                        return sort.order === 'asc' ? comparison : -comparison
                    }
                }
                return 0
            })
        }

        return result
    }, [rows, columns, query, activeFilters, activeSorts, onFetchData])

    return { filteredRows }
}
