import { useState } from 'react'
import { Box, Typography } from '@mui/material'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import { useNavigate } from 'react-router-dom'
import './style.css'

export interface NotificationToastProps {
    title: string
    message: string
    link?: string
    onClose: () => void
}

const NotificationToast = ({ title, message, link, onClose }: NotificationToastProps) => {
    const navigate = useNavigate()
    const [isExiting, setIsExiting] = useState(false)

    const handleClick = () => {
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
