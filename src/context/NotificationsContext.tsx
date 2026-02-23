
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { comunicacaoService } from '../services/comunicacoes'
import { useAuth } from './AuthContext'
import NotificationToast from '../components/NotificationToast'

interface NotificationData {
    title: string
    body: string
    link?: string
    actions?: any[]
}


interface NotificationsContextType {
    unreadCount: number
    refreshUnreadCount: () => Promise<void>
    showNotification: (data: NotificationData) => void
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export const useNotifications = () => {
    const context = useContext(NotificationsContext)
    if (!context) {
        throw new Error('useNotifications deve ser usado dentro de NotificationsProvider')
    }
    return context
}

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
    const { user, permissions } = useAuth()
    const [unreadCount, setUnreadCount] = useState(0)
    const [activeNotification, setActiveNotification] = useState<NotificationData | null>(null)

    const refreshUnreadCount = useCallback(async () => {
        // Only fetch if authenticated and has basic notification permission
        if (!user || !permissions.includes('erp:notificacoes:listar')) {
            setUnreadCount(0)
            return
        }

        try {
            const data = await comunicacaoService.getUnreadCount()
            setUnreadCount(data.count)
        } catch (err) {
            console.error('Failed to fetch unread count:', err)
        }
    }, [user, permissions])

    const showNotification = useCallback((data: NotificationData) => {
        setActiveNotification(data)
    }, [])

    const handleToastClose = () => {
        setActiveNotification(null)
    }



    useEffect(() => {
        refreshUnreadCount()


        // WebSocket implementation
        const wsUrl = import.meta.env.VITE_WS_SERVICE_BASE_URL
        let socket: Socket | null = null

        if (wsUrl && user) {
            console.log('[NotificationsContext] Connecting to WebSocket:', wsUrl)

            socket = io(wsUrl, {
                transports: ['websocket', 'polling'],
            })

            socket.on('connect', () => {
                console.log('[NotificationsContext] WebSocket connected:', socket?.id)
                // Register user with their ID
                if (user?.id) {
                    socket?.emit('register-user', user.id)
                }
            })

            socket.on('connect_error', (err: any) => {
                console.error('[NotificationsContext] WebSocket connection error:', err)
            })

            socket.on('notification', (data: any) => {
                console.log('[NotificationsContext] Notification received via WS:', data)
                refreshUnreadCount()

                // Show toast if data has title/body
                if (data) {
                    // Extract link from actions if available
                    let link = undefined;
                    if (data.actions && Array.isArray(data.actions) && data.actions.length > 0) {
                        const navigateAction = data.actions.find((a: any) => a.action === 'navigate');
                        if (navigateAction) link = navigateAction.url;
                    } else if (data.data?.actions) {
                        // Handle nested data structure if necessary
                        const navigateAction = data.data.actions.find((a: any) => a.action === 'navigate');
                        if (navigateAction) link = navigateAction.url;
                    }

                    // Fallback to simpler structure
                    const title = data.title || (data.data && data.data.title) || 'Nova Notificação';
                    const body = data.body || (data.data && data.data.body) || 'Você tem uma nova notificação';

                    if (title) {
                        showNotification({
                            title,
                            body,
                            link
                        })
                    }
                }
            })

            socket.on('disconnect', (reason: any) => {
                console.log('[NotificationsContext] WebSocket disconnected:', reason)
            })
        }

        return () => {

            if (socket) {
                console.log('[NotificationsContext] Disconnecting WebSocket')
                socket.disconnect()
            }
        }
    }, [refreshUnreadCount, user, showNotification])

    return (
        <NotificationsContext.Provider
            value={{
                unreadCount,
                refreshUnreadCount,
                showNotification
            }}
        >
            {children}
            {activeNotification && (
                <NotificationToast
                    title={activeNotification.title}
                    message={activeNotification.body}
                    link={activeNotification.link}
                    onClose={handleToastClose}
                />
            )}
        </NotificationsContext.Provider>
    )
}
