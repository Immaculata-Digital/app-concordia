import { useState, useEffect } from 'react'
import { ListItemButton, ListItemIcon, ListItemText, Tooltip, Collapse, List } from '@mui/material'
import { NavLink, useLocation } from 'react-router-dom'
import { ExpandLess, ExpandMore } from '@mui/icons-material'
import React from 'react'
import type { SidebarItem } from '../hooks/useSidebar'

type SidebarLinkProps = {
    item: SidebarItem
    isActive: boolean
    open: boolean
    isMobile: boolean
    onClick?: () => void
}

export const SidebarLink = ({ item, isActive, open, isMobile, onClick }: SidebarLinkProps) => {
    const location = useLocation()
    const showFullContent = open || isMobile
    const hasChildren = item.children && item.children.length > 0
    const [isOpen, setIsOpen] = useState(() => {
        if (hasChildren) {
            return item.children?.some(child =>
                location.pathname.startsWith(child.path)
            ) || false
        }
        return false
    })

    // Update open state when path changes (for navigation from elsewhere)
    useEffect(() => {
        if (hasChildren && !isOpen) {
            const isChildActive = item.children?.some(child =>
                location.pathname.startsWith(child.path)
            )
            if (isChildActive) {
                setIsOpen(true)
            }
        }
    }, [location.pathname, item.children, hasChildren, isOpen])

    const handleClick = (e: React.MouseEvent) => {
        if (hasChildren) {
            e.preventDefault()
            e.stopPropagation()
            setIsOpen(!isOpen)
        } else {
            onClick?.()
        }
    }

    if (hasChildren) {
        return (
            <>
                <Tooltip title={item.label} placement="right" disableHoverListener={showFullContent}>
                    <ListItemButton
                        onClick={handleClick}
                        className={`sidebar-link ${isActive ? 'active' : ''}`}
                        sx={{ gap: 0 }}
                    >
                        <ListItemIcon className="sidebar-link__icon">
                            {item.icon}
                        </ListItemIcon>
                        {showFullContent && <ListItemText primary={item.label} />}
                        {showFullContent && (isOpen ? <ExpandLess /> : <ExpandMore />)}
                    </ListItemButton>
                </Tooltip>
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {item.children?.map((child) => (
                            <SidebarLink
                                key={child.label}
                                item={child}
                                isActive={location.pathname === child.path}
                                open={open}
                                isMobile={isMobile}
                                onClick={onClick}
                            />
                        ))}
                    </List>
                </Collapse>
            </>
        )
    }

    return (
        <Tooltip title={item.label} placement="right" disableHoverListener={showFullContent}>
            <ListItemButton
                component={NavLink}
                to={item.path}
                end
                className={`sidebar-link ${isActive ? 'active' : ''}`}
                sx={{ gap: 0, pl: item.isChild ? 4 : 2 }} // Indent child items
                onClick={onClick}
            >
                <ListItemIcon className="sidebar-link__icon">
                    {item.icon}
                </ListItemIcon>
                {showFullContent && <ListItemText primary={item.label} />}
            </ListItemButton>
        </Tooltip>
    )
}

