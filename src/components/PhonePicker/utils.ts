
export type Country = {
    code: string
    name: string
    dialCode: string
    flag: string
}

// Lista de países com códigos DDI
export const COUNTRIES: Country[] = [
    { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
    { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
    { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
    { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
    { code: 'CO', name: 'Colômbia', dialCode: '+57', flag: '🇨🇴' },
    { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
    { code: 'PE', name: 'Peru', dialCode: '+51', flag: '🇵🇪' },
    { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
    { code: 'ES', name: 'Espanha', dialCode: '+34', flag: '🇪🇸' },
    { code: 'FR', name: 'França', dialCode: '+33', flag: '🇫🇷' },
    { code: 'DE', name: 'Alemanha', dialCode: '+49', flag: '🇩🇪' },
    { code: 'IT', name: 'Itália', dialCode: '+39', flag: '🇮🇹' },
    { code: 'GB', name: 'Reino Unido', dialCode: '+44', flag: '🇬🇧' },
    { code: 'JP', name: 'Japão', dialCode: '+81', flag: '🇯🇵' },
    { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
    { code: 'IN', name: 'Índia', dialCode: '+91', flag: '🇮🇳' },
    { code: 'AU', name: 'Austrália', dialCode: '+61', flag: '🇦🇺' },
    { code: 'CA', name: 'Canadá', dialCode: '+1', flag: '🇨🇦' },
]

export const DEFAULT_COUNTRY = COUNTRIES[0] // Brasil por padrão

// Parsear número de telefone para extrair país e número
export const parsePhoneNumber = (value: string): { country: Country; number: string } => {
    if (!value) {
        return { country: DEFAULT_COUNTRY, number: '' }
    }

    // Tentar encontrar o país correspondente
    // Primeiro tentamos procurar pelo código com ou sem +
    for (const country of COUNTRIES) {
        const cleanDialCode = country.dialCode.replace('+', '')

        // Verifica se começa com o código DDI (ex: +55 ou 55)
        if (value.startsWith(country.dialCode) || value.startsWith(cleanDialCode)) {
            // Determina o tamanho do prefixo encontrado para remover
            const prefixLength = value.startsWith(country.dialCode)
                ? country.dialCode.length
                : cleanDialCode.length

            const number = value.substring(prefixLength).trim()
            // Se encontrou, retorna. Formata o número para exibir corretamente se necessário
            // Mas aqui retornamos apenas os dígitos crus do número local
            return { country, number }
        }
    }

    // Se não encontrou código de país, assumir país padrão
    // E assumir que o valor inteiro é o número (pode ser um número local sem DDI)
    return { country: DEFAULT_COUNTRY, number: value }
}

// Formatar número de telefone
export const formatPhoneNumber = (number: string, country: Country): string => {
    if (!number) return ''

    // Remove caracteres não numéricos
    const digits = number.replace(/\D/g, '')

    // Formatação específica para Brasil
    if (country.code === 'BR') {
        if (digits.length <= 2) {
            return digits
        } else if (digits.length <= 6) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
        } else if (digits.length <= 10) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
        } else {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
        }
    }

    // US e CA (NANP): (XXX) XXX-XXXX
    if (['US', 'CA'].includes(country.code)) {
        if (digits.length <= 3) return digits
        if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }

    // Argentina (AR)
    // Móveis com 9+8 dígitos, fixos variáveis. Padrão comum: (XX) XXXX-XXXX ou (XX) 15-XXXX-XXXX
    // Tentativa de simplificação: (XX) XXXX-XXXX
    if (country.code === 'AR') {
        if (digits.length <= 2) return digits
        if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    }

    // Chile (CL) - Fixos 9 digitos, Móveis 9 digitos + 9
    // Padrão comum: 9 XXXX XXXX (móvel) ou 2 XXXX XXXX (Santiago)
    if (country.code === 'CL') {
        if (digits.length <= 1) return digits
        if (digits.length <= 5) return `${digits.slice(0, 1)} ${digits.slice(1)}`
        return `${digits.slice(0, 1)} ${digits.slice(1, 5)} ${digits.slice(5)}`
    }

    // Colombia (CO) - Móvel: 3XX XXX XXXX (10 dígitos)
    if (country.code === 'CO') {
        if (digits.length <= 3) return digits
        if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
    }

    // Mexico (MX) - 10 dígitos: XX XXXX XXXX
    if (country.code === 'MX') {
        if (digits.length <= 2) return digits
        if (digits.length <= 6) return `${digits.slice(0, 2)} ${digits.slice(2)}`
        return `${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`
    }

    // Peru (PE) - Móvel: 9XX XXX XXX (9 dígitos)
    if (country.code === 'PE') {
        if (digits.length <= 3) return digits
        if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
    }

    // Portugal (PT) - 9 dígitos: XXX XXX XXX
    if (country.code === 'PT') {
        if (digits.length <= 3) return digits
        if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
    }

    // Espanha (ES) - 9 dígitos: XXX XX XX XX
    if (country.code === 'ES') {
        if (digits.length <= 3) return digits
        if (digits.length <= 5) return `${digits.slice(0, 3)} ${digits.slice(3)}`
        if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`
        return `${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`
    }

    // França (FR) - 9 dígitos (sem o 0 inicial): X XX XX XX XX
    if (country.code === 'FR') {
        if (digits.length <= 1) return digits
        if (digits.length <= 3) return `${digits.slice(0, 1)} ${digits.slice(1)}`
        if (digits.length <= 5) return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3)}`
        if (digits.length <= 7) return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`
        return `${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 7)} ${digits.slice(7)}`
    }

    // Alemanha (DE) - Variável, mas comum: Vorwahl (Area) + Numero. Não tem padrão fixo rígido como US/BR.
    // Vamos usar um genérico espaçado para não errar muito: XXXX XXXXXX

    // Itália (IT) - Móvel: 3XX XXXXXXX (10 dígitos). Fixo variável.
    if (country.code === 'IT') {
        if (digits.length <= 3) return digits
        if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
    }

    // Reino Unido (GB) - Móvel: 07XXX XXXXXX (11 dígitos, mas sem 0 no internacional seria 10: 7XXX XXXXXX)
    // Formato internacional (+44 7XXX XXXXXX): XXXX XXXXXX
    if (country.code === 'GB') {
        if (digits.length <= 4) return digits
        return `${digits.slice(0, 4)} ${digits.slice(4)}`
    }

    // Japão (JP) - (03) XXXX-XXXX ou 090-XXXX-XXXX. Sem o 0: 3-XXXX-XXXX ou 90-XXXX-XXXX
    if (country.code === 'JP') {
        if (digits.length <= 2) return digits // Area code 2 digits usually
        if (digits.length <= 6) return `${digits.slice(0, 2)}-${digits.slice(2)}`
        return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`
    }

    // China (CN) - Móvel: 1XX XXXX XXXX (11 dígitos)
    if (country.code === 'CN') {
        if (digits.length <= 3) return digits
        if (digits.length <= 7) return `${digits.slice(0, 3)} ${digits.slice(3)}`
        return `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`
    }

    // Índia (IN) - XXXXX-XXXXX
    if (country.code === 'IN') {
        if (digits.length <= 5) return digits
        return `${digits.slice(0, 5)}-${digits.slice(5)}`
    }

    // Austrália (AU) - Móvel: 4XX XXX XXX (9 dígitos sem o 0)
    if (country.code === 'AU') {
        if (digits.length <= 3) return digits
        if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
    }

    // Padrão genérico para outros (DE, etc): Agrupa de 4 em 4 se possível ou só retorna
    if (digits.length > 4) {
        // Ex: 12345678 -> 1234 5678
        return digits.replace(/(\d{4})(?=\d)/g, '$1 ')
    }

    return digits
}
