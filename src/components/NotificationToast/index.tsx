import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../context/NotificationsContext'
import './style.css'
export interface NotificationToastProps {
    id?: string
    title: string
    message: string
    link?: string
    onClose: () => void
}

const NotificationToast = ({ id, title, message, link, onClose }: NotificationToastProps) => {
    const navigate = useNavigate()
    const { markAsRead } = useNotifications()
    const [isExiting, setIsExiting] = useState(false)

    const handleClick = async () => {
        if (id) {
            await markAsRead(id)
        }

        if (link) {
            navigate(link)
        } else {
            navigate('/notifications')
        }
        handleClose()
    }

    const handleClose = () => {
        setIsExiting(true)
        // Wait for exit animation
        setTimeout(onClose, 300)
    }

    const handleAnimationEnd = () => {
        handleClose()
    }

    return (
        <Box
            className={`notification-toast ${isExiting ? 'notification-toast-exit' : ''}`}
            onClick={handleClick}
            role="alert"
        >
            <Box className="notification-toast__content">
                <Box className="notification-toast__icon">
                    <NotificationsActiveIcon fontSize="small" />
                </Box>
                <Box className="notification-toast__text">
                    <Typography className="notification-toast__title">{title}</Typography>
                    <Typography className="notification-toast__message">{message}</Typography>
                </Box>
            </Box>
            <Box className="notification-toast__progress">
                <div
                    className="notification-toast__progress-bar"
                    onAnimationEnd={handleAnimationEnd}
                />
            </Box>
        </Box>
    )
}

export default NotificationToast
