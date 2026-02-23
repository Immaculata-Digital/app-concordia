import {
    Avatar,
    Box,
    Divider,
    ListItemIcon,
    Menu,
    MenuItem,
    Stack,
    Tooltip,
    Typography,
    ListItemButton,
} from '@mui/material'
import {
    AccountCircle,
    Logout,
} from '@mui/icons-material'
import React, { useState } from 'react'

type SidebarFooterProps = {
    user: any
    open: boolean
    isMobile: boolean
    onLogout: () => void
}

export const SidebarFooter = ({
    user,
    open,
    isMobile,
    onLogout,
}: SidebarFooterProps) => {
    const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null)

    const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setUserMenuAnchor(event.currentTarget)
    }

    const handleUserMenuClose = () => {
        setUserMenuAnchor(null)
    }

    const showFullContent = open || isMobile

    return (
        <div className="sidebar-footer">
            <Divider className="sidebar-footer__divider" />
            <Stack spacing={0.5} className="sidebar-footer__content">

                {user && (
                    <>
                        <Tooltip title="Menu do usuário" placement="right" disableHoverListener={showFullContent}>
                            <ListItemButton
                                className={`sidebar-footer__item ${showFullContent ? 'sidebar-footer__profile-card' : 'sidebar-footer__item--collapsed'}`}
                                onClick={handleUserMenuOpen}
                            >
                                <ListItemIcon className="sidebar-footer__icon">
                                    <Avatar className="sidebar-footer__avatar">
                                        {user.fullName.charAt(0).toUpperCase()}
                                    </Avatar>
                                </ListItemIcon>
                                {showFullContent && (
                                    <Box className="sidebar-footer__user-info">
                                        <Typography variant="body2" className="sidebar-footer__user-name" noWrap>
                                            {user.fullName.split(' ')[0]}
                                        </Typography>
                                        <Typography variant="body1" className="sidebar-footer__user-email" noWrap>
                                            {user.email}
                                        </Typography>
                                    </Box>
                                )}
                            </ListItemButton>
                        </Tooltip>

                        <Menu
                            anchorEl={userMenuAnchor}
                            open={Boolean(userMenuAnchor)}
                            onClose={handleUserMenuClose}
                            className="sidebar-user-menu"
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: showFullContent ? 'left' : 'right',
                            }}
                            transformOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                            }}
                            TransitionProps={{ timeout: 400 }}
                            slotProps={{
                                paper: {
                                    className: showFullContent ? 'sidebar-user-menu__paper--expanded' : ''
                                }
                            }}
                        >
                            <MenuItem disabled className="sidebar-user-menu__item">
                                <AccountCircle sx={{ mr: 1.5, color: 'primary.main' }} />
                                <Box>
                                    <Typography variant="body2" fontWeight="700" color="text.primary">
                                        {user.fullName}
                                    </Typography>
                                    <Typography variant="body1" color="text.secondary">
                                        {user.email}
                                    </Typography>
                                </Box>
                            </MenuItem>
                            <Divider sx={{ my: 1 }} />
                            <MenuItem
                                onClick={() => { handleUserMenuClose(); onLogout(); }}
                                className="sidebar-user-menu__logout"
                            >
                                <Logout sx={{ mr: 1.5 }} fontSize="small" />
                                Sair da conta
                            </MenuItem>
                        </Menu>
                    </>
                )}
            </Stack>
        </div>
    )
}
