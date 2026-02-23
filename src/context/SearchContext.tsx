import { createContext, useContext, useMemo, useState, useCallback, type ReactNode } from 'react'

export type FilterOperator =
  | 'equals' | 'not_equals' | 'contains' | 'not_contains'
  | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than'
  | 'is_empty' | 'is_not_empty' | 'before' | 'after' | 'is' | 'is_not'
  | 'from' | 'until'

export type FilterRule = {
  id: string
  field: string
  operator: FilterOperator
  value: any
}

export type FilterGroup = {
  conjunction: 'AND' | 'OR'
  rules: FilterRule[]
}

export type SortRule = {
  id: string
  field: string
  order: 'asc' | 'desc'
}

export type SearchFilter = {
  id: string
  label: string
  field: string
  type?: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'multiselect'
  options?: { label: string; value: any }[]
  page?: string
}

type SearchContextValue = {
  query: string
  setQuery: (value: string) => void
  filters: SearchFilter[]
  setFilters: (filters: SearchFilter[], defaultFilterId?: string) => void
  selectedFilter?: SearchFilter
  selectFilter: (filterId: string) => void
  // Notion-style filters
  activeFilters: FilterGroup
  addFilterRule: (rule: Omit<FilterRule, 'id'>) => void
  removeFilterRule: (id: string) => void
  updateFilterRule: (id: string, updates: Partial<FilterRule>) => void
  setConjunction: (conjunction: 'AND' | 'OR') => void
  clearFilters: () => void
  placeholder: string
  setPlaceholder: (value: string) => void
  searchOpen: boolean
  setSearchOpen: (value: boolean) => void
  // Sort functionality (Notion-style)
  activeSorts: SortRule[]
  addSortRule: (rule: Omit<SortRule, 'id'>) => void
  removeSortRule: (id: string) => void
  updateSortRule: (id: string, updates: Partial<SortRule>) => void
  clearSort: () => void
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined)

const INITIAL_FILTER_GROUP: FilterGroup = {
  conjunction: 'AND',
  rules: []
}

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [query, setQuery] = useState('')
  const [filters, setFilterState] = useState<SearchFilter[]>([])
  const [selectedFilterId, setSelectedFilterId] = useState<string | undefined>()
  const [activeFilters, setActiveFilters] = useState<FilterGroup>(INITIAL_FILTER_GROUP)
  const [placeholder, setPlaceholder] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [activeSorts, setActiveSorts] = useState<SortRule[]>([])

  const setFilters = useCallback((nextFilters: SearchFilter[], defaultFilterId?: string) => {
    setFilterState(nextFilters)
    setActiveFilters(INITIAL_FILTER_GROUP)
    setActiveSorts([])
    if (nextFilters.length === 0) {
      setSelectedFilterId(undefined)
      return
    }
    setSelectedFilterId(defaultFilterId ?? nextFilters[0].id)
  }, [])

  const addFilterRule = useCallback((rule: Omit<FilterRule, 'id'>) => {
    setActiveFilters(prev => ({
      ...prev,
      rules: [...prev.rules, { ...rule, id: Math.random().toString(36).substr(2, 9) }]
    }))
  }, [])

  const removeFilterRule = useCallback((id: string) => {
    setActiveFilters(prev => ({
      ...prev,
      rules: prev.rules.filter(r => r.id !== id)
    }))
  }, [])

  const updateFilterRule = useCallback((id: string, updates: Partial<FilterRule>) => {
    setActiveFilters(prev => ({
      ...prev,
      rules: prev.rules.map(r => r.id === id ? { ...r, ...updates } : r)
    }))
  }, [])

  const setConjunction = useCallback((conjunction: 'AND' | 'OR') => {
    setActiveFilters(prev => ({ ...prev, conjunction }))
  }, [])

  const clearFilters = useCallback(() => {
    setActiveFilters(INITIAL_FILTER_GROUP)
    setQuery('')
  }, [])

  const addSortRule = useCallback((rule: Omit<SortRule, 'id'>) => {
    setActiveSorts(prev => [...prev, { ...rule, id: Math.random().toString(36).substr(2, 9) }])
  }, [])

  const removeSortRule = useCallback((id: string) => {
    setActiveSorts(prev => prev.filter(r => r.id !== id))
  }, [])

  const updateSortRule = useCallback((id: string, updates: Partial<SortRule>) => {
    setActiveSorts(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }, [])

  const clearSort = useCallback(() => {
    setActiveSorts([])
  }, [])

  const selectedFilter = useMemo(() => {
    return filters.find((filter) => filter.id === selectedFilterId)
  }, [filters, selectedFilterId])

  const value = useMemo<SearchContextValue>(() => ({
    query,
    setQuery,
    filters,
    setFilters,
    selectedFilter,
    selectFilter: setSelectedFilterId,
    activeFilters,
    addFilterRule,
    removeFilterRule,
    updateFilterRule,
    setConjunction,
    clearFilters,
    placeholder,
    setPlaceholder,
    searchOpen,
    setSearchOpen,
    activeSorts,
    addSortRule,
    removeSortRule,
    updateSortRule,
    clearSort,
  }), [
    query,
    filters,
    setFilters,
    selectedFilter,
    activeFilters,
    addFilterRule,
    removeFilterRule,
    updateFilterRule,
    setConjunction,
    clearFilters,
    placeholder,
    searchOpen,
    activeSorts,
    addSortRule,
    removeSortRule,
    updateSortRule,
    clearSort,
  ])

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}

export const useSearch = () => {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error('useSearch deve ser usado dentro de SearchProvider')
  return ctx
}
