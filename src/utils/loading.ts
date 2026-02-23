type LoadingListener = (loading: boolean) => void

let loadingCount = 0
const listeners = new Set<LoadingListener>()

const notify = () => {
    const isLoading = loadingCount > 0
    listeners.forEach(listener => listener(isLoading))
}

export const loadingManager = {
    start: () => {
        loadingCount++
        notify()
    },
    stop: () => {
        loadingCount = Math.max(0, loadingCount - 1)
        notify()
    },
    subscribe: (listener: LoadingListener) => {
        listeners.add(listener)
        return () => listeners.delete(listener)
    }
}
