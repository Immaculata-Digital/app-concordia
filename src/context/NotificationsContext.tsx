
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { comunicacaoService } from '../services/comunicacoes'
import { useAuth } from './AuthContext'
import NotificationToast from '../components/NotificationToast'

interface NotificationData {
    id?: string
    title: string
    body: string
    link?: string
    actions?: any[]
}


interface NotificationsContextType {
    unreadCount: number
    refreshUnreadCount: () => Promise<void>
    showNotification: (data: NotificationData) => void
    markAsRead: (id: string) => Promise<void>
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
                query: {
                    tenantId: user.tenantId
                }
            })

            socket.on('connect', () => {
                console.log('[NotificationsContext] WebSocket connected:', socket?.id)
            })

            socket.on('connect_error', (err: any) => {
                console.error('[NotificationsContext] WebSocket connection error:', err)
            })

            // Evento disparado pelo api-concordia
            socket.on('nova_notificacao', (data: any) => {
                console.log('[NotificationsContext] Nova notificação via WS:', data)

                // Atualiza o contador de não lidas
                refreshUnreadCount()

                // Verifica se o usuário tem a nova funcionalidade de receber alertas
                const hasAlertPermission = permissions.includes('erp:notificacoes:receber-alertas')

                if (hasAlertPermission && data) {
                    showNotification({
                        id: data.uuid || data.id,
                        title: data.titulo || 'Nova Notificação',
                        body: data.mensagem || 'Você recebeu um novo alerta.',
                        link: data.tipo === 'novo_pedido' ? `/pedidos/comandas?id=${data.dataId}` : undefined
                    })
                }
            })

            // Fallback para o evento antigo 'notification' caso ainda seja usado por outros serviços
            socket.on('notification', (data: any) => {
                console.log('[NotificationsContext] Notification received (legacy):', data)
                refreshUnreadCount()
                // ... legacy logic if needed
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

    const markAsRead = useCallback(async (id: string) => {
        try {
            await comunicacaoService.markAsRead(id)
            await refreshUnreadCount()
        } catch (err) {
            console.error('Failed to mark notification as read:', err)
        }
    }, [refreshUnreadCount])

    return (
        <NotificationsContext.Provider
            value={{
                unreadCount,
                refreshUnreadCount,
                showNotification,
                markAsRead
            }}
        >
            {children}
            {activeNotification && (
                <NotificationToast
                    id={activeNotification.id}
                    title={activeNotification.title}
                    message={activeNotification.body}
                    link={activeNotification.link}
                    onClose={handleToastClose}
                />
            )}
        </NotificationsContext.Provider>
    )
}
