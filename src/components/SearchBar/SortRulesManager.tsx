import { Box, Stack, Typography, Button, IconButton, useMediaQuery, useTheme } from '@mui/material'
import { Add, DeleteOutline, ArrowUpward, ArrowDownward } from '@mui/icons-material'
import { type SearchFilter, type SortRule } from '../../context/SearchContext'
import SelectPicker from '../SelectPicker'

interface SortRulesManagerProps {
    filters: SearchFilter[]
    activeSorts: SortRule[]
    addSortRule: (rule: Omit<SortRule, 'id'>) => void
    removeSortRule: (id: string) => void
    updateSortRule: (id: string, updates: Partial<SortRule>) => void
}

export const SortRulesManager = ({
    filters,
    activeSorts,
    addSortRule,
    removeSortRule,
    updateSortRule,
}: SortRulesManagerProps) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

    const handleAddNewSort = () => {
        if (filters.length > 0) {
            const firstFilter = filters[0]
            addSortRule({
                field: firstFilter.field,
                order: 'asc'
            })
        }
    }

    return (
        <Box className="notion-filter">
            <Box className="notion-filter__header">
                <Typography
                    className="notion-filter__header-title"
                    sx={{
                        color: 'var(--color-on-secondary)',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        letterSpacing: '0.8px',
                        opacity: 0.8,
                        textTransform: 'uppercase',
                    }}
                >
                    Regras de Ordenação
                </Typography>
            </Box>

            <Box className="notion-filter__body">
                {activeSorts.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <Typography
                            className="notion-filter__empty-text"
                            sx={{
                                color: 'var(--color-on-secondary)',
                                fontSize: '0.875rem',
                                fontWeight: 400,
                                lineHeight: 1.5,
                                opacity: 0.6,
                            }}
                        >
                            Nenhuma ordenação aplicada.
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={1} sx={{ p: 1 }}>
                        {activeSorts.map((sort, index) => (
                            <Stack
                                key={sort.id}
                                direction={{ xs: 'column', md: 'row' }}
                                spacing={1}
                                alignItems={{ xs: 'stretch', md: 'center' }}
                                className="notion-filter__row"
                                sx={{
                                    py: { xs: 2, md: 0.5 },
                                    borderBottom: { xs: '1px solid var(--color-border-lighter)', md: 'none' },
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 1, md: 0 }, minWidth: { md: 60 } }}>
                                    <Typography
                                        className="notion-filter__row-label"
                                        sx={{
                                            color: 'var(--color-on-secondary)',
                                            fontSize: '0.825rem',
                                            fontWeight: 500,
                                            minWidth: '44px',
                                            opacity: 0.7,
                                        }}
                                    >
                                        {index === 0 ? 'Por' : 'Depois'}
                                    </Typography>
                                    {isMobile && (
                                        <IconButton
                                            size="small"
                                            onClick={() => removeSortRule(sort.id)}
                                            sx={{ color: 'var(--color-on-secondary)' }}
                                        >
                                            <DeleteOutline fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>

                                <Box sx={{ width: { xs: '100%', md: 240 } }}>
                                    <SelectPicker
                                        value={sort.field}
                                        onChange={(val) => updateSortRule(sort.id, { field: val as string })}
                                        options={filters.map(f => ({ label: f.label, value: f.field }))}
                                        searchable={true}
                                        clearable={false}
                                        fullWidth
                                    />
                                </Box>

                                <Box className="notion-filter__conjunction" sx={{ display: 'flex', width: { xs: '100%', md: 'fit-content' } }}>
                                    <Button
                                        size="small"
                                        variant={sort.order === 'asc' ? 'contained' : 'text'}
                                        onClick={() => updateSortRule(sort.id, { order: 'asc' })}
                                        className="notion-filter__conj-btn"
                                        startIcon={<ArrowUpward />}
                                        sx={{
                                            flex: { xs: 1, md: 'none' }
                                        }}
                                    >
                                        Crescente
                                    </Button>
                                    <Button
                                        size="small"
                                        variant={sort.order === 'desc' ? 'contained' : 'text'}
                                        onClick={() => updateSortRule(sort.id, { order: 'desc' })}
                                        className="notion-filter__conj-btn"
                                        startIcon={<ArrowDownward />}
                                        sx={{
                                            flex: { xs: 1, md: 'none' }
                                        }}
                                    >
                                        Decrescente
                                    </Button>
                                </Box>

                                {!isMobile && (
                                    <IconButton size="small" onClick={() => removeSortRule(sort.id)} className="notion-filter__remove">
                                        <DeleteOutline fontSize="small" />
                                    </IconButton>
                                )}
                            </Stack>
                        ))}
                    </Stack>
                )}
                <Box sx={{ p: '16px 24px 24px 24px' }}>
                    <Button
                        fullWidth
                        startIcon={<Add />}
                        onClick={handleAddNewSort}
                        className="notion-filter__add-btn"
                    >
                        Adicionar ordenação
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}
