import { type FilterOperator } from '../../context/SearchContext'

export interface OperatorOption {
    label: string
    value: FilterOperator
}

export const getOperatorsForType = (type?: string): OperatorOption[] => {
    switch (type) {
        case 'number':
            return [
                { label: 'igual a', value: 'equals' },
                { label: 'diferente de', value: 'not_equals' },
                { label: 'maior que', value: 'greater_than' },
                { label: 'menor que', value: 'less_than' },
                { label: 'está vazio', value: 'is_empty' },
                { label: 'não está vazio', value: 'is_not_empty' },
            ]
        case 'date':
            return [
                { label: 'é', value: 'equals' },
                { label: 'antes de', value: 'before' },
                { label: 'depois de', value: 'after' },
                { label: 'a partir de', value: 'from' },
                { label: 'até', value: 'until' },
                { label: 'está vazio', value: 'is_empty' },
                { label: 'não está vazio', value: 'is_not_empty' },
            ]
        case 'multiselect':
            return [
                { label: 'contém', value: 'contains' },
                { label: 'não contém', value: 'not_contains' },
                { label: 'é igual a', value: 'is' },
                { label: 'é diferente de', value: 'is_not' },
                { label: 'está vazio', value: 'is_empty' },
                { label: 'não está vazio', value: 'is_not_empty' },
            ]
        case 'select':
        case 'boolean':
            return [
                { label: 'é', value: 'is' },
                { label: 'não é', value: 'is_not' },
                { label: 'está vazio', value: 'is_empty' },
                { label: 'não está vazio', value: 'is_not_empty' },
            ]
        case 'text':
        default:
            return [
                { label: 'contém', value: 'contains' },
                { label: 'não contém', value: 'not_contains' },
                { label: 'é igual a', value: 'equals' },
                { label: 'é diferente de', value: 'not_equals' },
                { label: 'começa com', value: 'starts_with' },
                { label: 'termina com', value: 'ends_with' },
                { label: 'está vazio', value: 'is_empty' },
                { label: 'não está vazio', value: 'is_not_empty' },
            ]
    }
}
