import { Collapse, Divider, List, ListItemButton, Typography } from '@mui/material'
import { ChevronRight } from '@mui/icons-material'
import type { SidebarItem } from '../hooks/useSidebar'
import { SidebarLink } from './SidebarLink'

type SidebarSectionProps = {
    index: number
    title: string
    items: SidebarItem[]
    isExpanded: boolean
    open: boolean
    isMobile: boolean
    onToggle: (title: string) => void
    isPathActive: (path: string) => void
    onLinkClick?: () => void
}

export const SidebarSection = ({
    index,
    title,
    items,
    isExpanded,
    open,
    isMobile,
    onToggle,
    isPathActive,
    onLinkClick
}: SidebarSectionProps) => {
    const showHeader = open || isMobile

    return (
        <div className={`sidebar-section ${isExpanded ? 'is-expanded' : ''}`}>
            {showHeader ? (
                <ListItemButton
                    onClick={() => onToggle(title)}
                    className={`sidebar-section__header ${isExpanded ? 'is-expanded' : ''}`}
                    disableRipple
                    aria-expanded={isExpanded}
                >
                    <Typography variant="caption" className="sidebar-section__title">
                        {title}
                    </Typography>
                    <div className="sidebar-section__arrow">
                        <ChevronRight
                            fontSize="small"
                            style={{
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        />
                    </div>
                </ListItemButton>
            ) : isExpanded && index > 0 ? (
                <Divider className="sidebar-section__divider" />
            ) : null}

            <Collapse
                in={isExpanded}
                timeout="auto"
            >
                <List disablePadding>
                    {items.map((item) => (
                        <SidebarLink
                            key={item.label}
                            item={item}
                            isActive={isPathActive(item.path) as unknown as boolean}
                            open={open}
                            isMobile={isMobile}
                            onClick={onLinkClick}
                        />
                    ))}
                </List>
            </Collapse>
        </div>
    )
}
