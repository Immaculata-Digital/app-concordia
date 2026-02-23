import { useRef, useEffect, useState } from 'react'
import {
    Box,
    IconButton,
    Stack,
    TextField,
    InputAdornment,
} from '@mui/material'
import { FilterList, ImportExport, Search, Close } from '@mui/icons-material'
import { useSearch } from '../../context/SearchContext'
import { SearchBarPopOver } from './SearchBarPopOver'
import { useSearchBarHotkeys, getOS } from './useSearchBarHotkeys'
import { FilterRulesManager } from './FilterRulesManager'
import { SortRulesManager } from './SortRulesManager'
import './style.css'

type SearchBarProps = {
    autoFocus?: boolean
    className?: string
    fullWidth?: boolean
}

const SearchBar = ({
    autoFocus,
    className = '',
    fullWidth = true,
}: SearchBarProps) => {
    const {
        query,
        setQuery,
        placeholder,
        filters,
        activeFilters,
        addFilterRule,
        removeFilterRule,
        updateFilterRule,
        setConjunction,
        clearFilters,
        activeSorts,
        addSortRule,
        removeSortRule,
        updateSortRule,
        clearSort
    } = useSearch()

    const searchInputRef = useRef<HTMLInputElement>(null)
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
    const [sortAnchorEl, setSortAnchorEl] = useState<HTMLButtonElement | null>(null)

    // Using the new custom hook for hotkeys
    useSearchBarHotkeys(searchInputRef)

    useEffect(() => {
        if (autoFocus && searchInputRef.current) {
            searchInputRef.current.focus()
        }
    }, [autoFocus])

    const os = getOS()
    const displayPlaceholder = placeholder ? `${placeholder} (${os === 'Mac' ? '⌘F' : 'Ctrl+F'})` : placeholder

    const handleClear = () => {
        clearFilters()
        clearSort()
        searchInputRef.current?.focus()
    }

    const handleOpenFilters = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget)
    }

    const handleCloseFilters = () => {
        setAnchorEl(null)
    }

    const handleOpenSort = (event: React.MouseEvent<HTMLButtonElement>) => {
        setSortAnchorEl(event.currentTarget)
    }

    const handleCloseSort = () => {
        setSortAnchorEl(null)
    }

    const containerClasses = [
        'search-bar__container',
        (query || activeFilters.rules.length > 0 || activeSorts.length > 0) ? 'search-bar__container--has-query' : '',
        className
    ].filter(Boolean).join(' ')

    const filtersOpen = Boolean(anchorEl)
    const sortOpen = Boolean(sortAnchorEl)

    return (
        <Box className={containerClasses} sx={{ width: fullWidth ? '100%' : 'auto' }}>
            <Stack direction="row" alignItems="center" sx={{ flex: 1 }}>
                <TextField
                    inputRef={searchInputRef}
                    value={query || ''}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={displayPlaceholder}
                    fullWidth
                    size="small"
                    className="search-bar__input"
                    autoComplete="off"
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search fontSize="small" className="search-bar__icon" />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                <Stack direction="row" spacing={0.5}>
                                    {(query || activeFilters.rules.length > 0 || activeSorts.length > 0) && (
                                        <IconButton
                                            size="small"
                                            onClick={handleClear}
                                            className="search-bar__close"
                                            aria-label="Limpar pesquisa"
                                        >
                                            <Close fontSize="small" />
                                        </IconButton>
                                    )}
                                    <IconButton
                                        size="small"
                                        onClick={handleOpenFilters}
                                        className={`search-bar__tune ${filtersOpen ? 'search-bar__tune--open' : ''} ${activeFilters.rules.length > 0 ? 'search-bar__tune--active' : ''}`}
                                        aria-label="Filtros avançados"
                                    >
                                        <FilterList fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={handleOpenSort}
                                        className={`search-bar__tune ${sortOpen ? 'search-bar__tune--open' : ''} ${activeSorts.length > 0 ? 'search-bar__tune--active' : ''}`}
                                        aria-label="Ordenação"
                                    >
                                        <ImportExport fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </InputAdornment>
                        ),
                    }}
                />
            </Stack>

            <SearchBarPopOver
                open={filtersOpen}
                anchorEl={anchorEl}
                onClose={handleCloseFilters}
                title="Filtros de Pesquisa"
                onClear={clearFilters}
                onSearch={handleCloseFilters}
            >
                <FilterRulesManager
                    filters={filters}
                    activeFilters={activeFilters}
                    addFilterRule={addFilterRule}
                    removeFilterRule={removeFilterRule}
                    updateFilterRule={updateFilterRule}
                    setConjunction={setConjunction}
                />
            </SearchBarPopOver>

            <SearchBarPopOver
                open={sortOpen}
                anchorEl={sortAnchorEl}
                onClose={handleCloseSort}
                title="Ordenação"
                onClear={clearSort}
                onSearch={handleCloseSort}
                clearLabel="Limpar Ordenação"
                searchLabel="Ordenar"
            >
                <SortRulesManager
                    filters={filters}
                    activeSorts={activeSorts}
                    addSortRule={addSortRule}
                    removeSortRule={removeSortRule}
                    updateSortRule={updateSortRule}
                />
            </SearchBarPopOver>
        </Box>
    )
}

export default SearchBar
