import axios from 'axios'

const API_BRASIL_BANKS_URL = 'https://brasilapi.com.br/api/banks/v1'

export type Bank = {
    ispb: string
    name: string
    code: number | null
    fullName: string
}

let banksCache: Bank[] | null = null

export const getBanks = async (): Promise<Bank[]> => {
    if (banksCache) return banksCache

    try {
        const response = await axios.get<Bank[]>(API_BRASIL_BANKS_URL)
        banksCache = response.data
        return banksCache
    } catch (error) {
        console.error("Erro ao carregar bancos:", error)
        return []
    }
}

export const getBankName = async (code: string): Promise<string> => {
    const banks = await getBanks()
    const bank = banks.find(b => b.code?.toString().padStart(3, '0') === code)
    return bank ? bank.name : ''
}
