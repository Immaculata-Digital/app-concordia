import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { loadingManager } from '../utils/loading'

interface LoadingContextType {
    isLoading: boolean
    startLoading: () => void
    stopLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export const useLoading = () => {
    const context = useContext(LoadingContext)
    if (!context) {
        throw new Error('useLoading deve ser usado dentro de LoadingProvider')
    }
    return context
}

export const LoadingProvider = ({ children }: { children: ReactNode }) => {
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const unsubscribe = loadingManager.subscribe((loading) => {
            setIsLoading(loading)
        })
        return () => {
            unsubscribe()
        }
    }, [])

    return (
        <LoadingContext.Provider
            value={{
                isLoading,
                startLoading: loadingManager.start,
                stopLoading: loadingManager.stop,
            }}
        >
            {children}
        </LoadingContext.Provider>
    )
}
