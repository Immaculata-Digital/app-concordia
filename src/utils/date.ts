
/**
 * Formata uma data para o formato UTC ISO string (YYYY-MM-DDT00:00:00.000Z)
 * a partir de uma string de data (YYYY-MM-DD ou ISO).
 * Isso garante que a data seja interpretada como o dia correto independente do timezone.
 */
export const toUTCDate = (dateValue: string | null | undefined): string | null => {
    if (!dateValue) return null

    // Se for apenas a data YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return `${dateValue}T00:00:00.000Z`
    }

    // Se for uma ISO string, tenta extrair apenas a parte da data e forçar UTC 00:00
    try {
        const date = new Date(dateValue)
        if (isNaN(date.getTime())) return null

        // Se a string original já tinha T, vamos re-normalizar para garantir que seja 00:00 UTC do dia pretendido
        // Isso é delicado porque se a string veio com um offset (ex: -03:00) e for 21:00, or dia muda.
        // Mas se a intenção for sempre o dia que está na string, extraímos as partes locais se não houver Z ou T.

        if (dateValue.includes('T')) {
            // Se já é ISO, assumimos que já está correto ou extraímos a parte da data
            return date.toISOString()
        }

        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        return `${year}-${month}-${day}T00:00:00.000Z`
    } catch {
        return null
    }
}

/**
 * Formata uma data para exibição (DD/MM/YYYY) sem problemas de fuso horário.
 * Ignora a parte do tempo e trata como UTC.
 */
export const formatDateDisplay = (dateValue: string | null | undefined): string => {
    if (!dateValue) return '-'

    try {
        // Extrair apenas os primeiros 10 caracteres (YYYY-MM-DD)
        const dateStr = dateValue.substring(0, 10)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return '-'

        const [year, month, day] = dateStr.split('-')
        return `${day}/${month}/${year}`
    } catch {
        return '-'
    }
}
