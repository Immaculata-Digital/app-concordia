import { Box, Stack, Typography, Button, IconButton, useMediaQuery, useTheme } from '@mui/material'
import { Add, DeleteOutline } from '@mui/icons-material'
import { type SearchFilter, type FilterRule, type FilterOperator } from '../../context/SearchContext'
import SelectPicker from '../SelectPicker'
import DatePicker from '../DatePicker'
import TextPicker from '../TextPicker'
import { getOperatorsForType } from './searchBar.utils'

interface FilterRulesManagerProps {
    filters: SearchFilter[]
    activeFilters: { rules: FilterRule[]; conjunction: 'AND' | 'OR' }
    addFilterRule: (rule: Omit<FilterRule, 'id'>) => void
    removeFilterRule: (id: string) => void
    updateFilterRule: (id: string, updates: Partial<FilterRule>) => void
    setConjunction: (conjunction: 'AND' | 'OR') => void
}

export const FilterRulesManager = ({
    filters,
    activeFilters,
    addFilterRule,
    removeFilterRule,
    updateFilterRule,
    setConjunction,
}: FilterRulesManagerProps) => {
    const theme = useTheme()
    const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

    const handleAddNewFilter = () => {
        if (filters.length > 0) {
            const firstFilter = filters[0]
            const ops = getOperatorsForType(firstFilter.type)
            addFilterRule({
                field: firstFilter.field,
                operator: ops[0].value,
                value: ''
            })
        }
    }

    return (
        <Box className="notion-filter">
            <Box className="notion-filter__header">
                <Stack direction="row" alignItems="center" spacing={1}>
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
                        Regras de Filtragem
                    </Typography>
                    {activeFilters.rules.length > 1 && (
                        <Box className="notion-filter__conjunction">
                            <Button
                                size="small"
                                variant={activeFilters.conjunction === 'AND' ? 'contained' : 'text'}
                                onClick={() => setConjunction('AND')}
                                className="notion-filter__conj-btn"
                            >
                                E
                            </Button>
                            <Button
                                size="small"
                                variant={activeFilters.conjunction === 'OR' ? 'contained' : 'text'}
                                onClick={() => setConjunction('OR')}
                                className="notion-filter__conj-btn"
                            >
                                OU
                            </Button>
                        </Box>
                    )}
                </Stack>
            </Box>

            <Box className="notion-filter__body">
                {activeFilters.rules.length === 0 ? (
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
                            Nenhum filtro aplicado. Clique abaixo para adicionar uma regra.
                        </Typography>
                    </Box>
                ) : (
                    <Stack spacing={1}>
                        {activeFilters.rules.map((rule, index) => {
                            const filterDef = filters.find(f => f.field === rule.field)
                            const operators = getOperatorsForType(filterDef?.type)
                            const showValue = !['is_empty', 'is_not_empty'].includes(rule.operator)

                            return (
                                <Stack
                                    key={rule.id}
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
                                            {index === 0 ? 'Onde' : activeFilters.conjunction === 'AND' ? 'E' : 'Ou'}
                                        </Typography>
                                        {isMobile && (
                                            <IconButton
                                                size="small"
                                                onClick={() => removeFilterRule(rule.id)}
                                                sx={{ color: 'var(--color-on-secondary)' }}
                                            >
                                                <DeleteOutline fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>

                                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ width: { xs: '100%', md: 'auto' }, flex: { md: '0 0 auto' } }}>
                                        <Box sx={{ width: { xs: '100%', md: 240 } }}>
                                            <SelectPicker
                                                value={rule.field}
                                                onChange={(val) => {
                                                    const field = val as string
                                                    const newDef = filters.find(f => f.field === field)
                                                    const newOps = getOperatorsForType(newDef?.type)
                                                    updateFilterRule(rule.id, {
                                                        field,
                                                        operator: newOps[0].value,
                                                        value: ''
                                                    })
                                                }}
                                                options={filters.map(f => ({ label: f.label, value: f.field }))}
                                                searchable={true}
                                                clearable={false}
                                                fullWidth
                                            />
                                        </Box>

                                        <Box sx={{ width: { xs: '100%', md: 180 } }}>
                                            <SelectPicker
                                                value={rule.operator}
                                                onChange={(val) => updateFilterRule(rule.id, { operator: val as FilterOperator })}
                                                options={operators}
                                                searchable={false}
                                                clearable={false}
                                                fullWidth
                                            />
                                        </Box>
                                    </Stack>

                                    {showValue && (
                                        <Box sx={{ flex: 1, width: '100%', mt: { xs: 1, md: 0 } }}>
                                            {filterDef?.type === 'select' || filterDef?.type === 'multiselect' ? (
                                                <SelectPicker
                                                    fullWidth
                                                    value={rule.value || (filterDef.type === 'multiselect' ? [] : '')}
                                                    onChange={(val) => updateFilterRule(rule.id, { value: val })}
                                                    options={filterDef.options || []}
                                                    multiple={filterDef.type === 'multiselect'}
                                                    searchable={true}
                                                    clearable={true}
                                                    placeholder="Escolher..."
                                                />
                                            ) : filterDef?.type === 'date' ? (
                                                <DatePicker
                                                    fullWidth
                                                    value={rule.value || ''}
                                                    onChange={(val) => updateFilterRule(rule.id, { value: val })}
                                                    placeholder="Data..."
                                                />
                                            ) : filterDef?.type === 'boolean' ? (
                                                <SelectPicker
                                                    fullWidth
                                                    value={rule.value === undefined ? '' : String(rule.value)}
                                                    onChange={(val) => updateFilterRule(rule.id, { value: val === 'true' })}
                                                    options={[
                                                        { label: 'Verdadeiro', value: 'true' },
                                                        { label: 'Falso', value: 'false' }
                                                    ]}
                                                    searchable={false}
                                                    clearable={false}
                                                />
                                            ) : (
                                                <TextPicker
                                                    fullWidth
                                                    placeholder="Valor..."
                                                    value={String(rule.value || '')}
                                                    onChange={(val) => updateFilterRule(rule.id, { value: val })}
                                                    type={filterDef?.type === 'number' ? 'number' : 'text'}
                                                />
                                            )}
                                        </Box>
                                    )}

                                    {!showValue && <Box sx={{ flex: { xs: 0, md: 1 } }} />}

                                    {!isMobile && (
                                        <IconButton size="small" onClick={() => removeFilterRule(rule.id)} className="notion-filter__remove">
                                            <DeleteOutline fontSize="small" />
                                        </IconButton>
                                    )}
                                </Stack>
                            )
                        })}
                    </Stack>
                )}
                <Box sx={{ p: '0 24px 24px 24px' }}>
                    <Button
                        fullWidth
                        startIcon={<Add />}
                        onClick={handleAddNewFilter}
                        className="notion-filter__add-btn"
                    >
                        Adicionar regra
                    </Button>
                </Box>
            </Box>
        </Box>
    )
}
