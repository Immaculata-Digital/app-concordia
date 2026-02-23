import { Drawer, useMediaQuery, useTheme, Tooltip, ListItemButton, ListItemIcon, ListItemText, Badge, Box } from '@mui/material'
import { NotificationsNone } from '@mui/icons-material'

import { useSidebar } from './hooks/useSidebar'
import { SidebarHeader } from './components/SidebarHeader'
import { SidebarSection } from './components/SidebarSection'
import { SidebarFooter } from './components/SidebarFooter'
import changelogData from '../../assets/data/changelog.json'

import './style.css'

type SidebarProps = {
  open: boolean
  onToggle: () => void
  themeMode: 'light' | 'dark'
  onChangeTheme: (mode: 'light' | 'dark') => void
}

const Sidebar = ({ open, onToggle, themeMode, onChangeTheme }: SidebarProps) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'))

  const {
    user,
    menuStructure,
    expandedSections,
    toggleSection,
    toggleAllSections,
    handleLogout,
    isPathActive,
    navigate,
    unreadCount
  } = useSidebar()

  const withState = (base: string, closedModifier: string) =>
    open ? base : `${base} ${closedModifier}`

  const showFullContent = open || isMobile

  const allExpanded = menuStructure.length > 0 &&
    menuStructure.every(section => expandedSections[section.title] ?? true);

  const drawerContent = (
    <Box
      className="sidebar-inner"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <SidebarHeader
        open={open}
        isMobile={isMobile}
        themeMode={themeMode}
        onToggle={onToggle}
        onLogoClick={() => navigate('/dashboard')}
        onChangeTheme={onChangeTheme}
        onToggleAll={() => toggleAllSections(!allExpanded)}
        allExpanded={allExpanded}
        onVersionClick={() => navigate('/changelog')}
        version={changelogData.versions[0]?.version || '0.0.0'}
      />

      <nav className="sidebar-content">
        {/* Notificações fixo no topo */}
        <Tooltip title="Notificações" placement="right" disableHoverListener={showFullContent}>
          <ListItemButton
            className={`sidebar-link sidebar-notification-btn ${isPathActive('/notifications') ? 'active' : ''}`}
            sx={{ gap: 0 }}
            onClick={() => navigate('/notifications')}
          >
            <ListItemIcon className="sidebar-link__icon">
              <Badge
                badgeContent={unreadCount}
                color="error"
                max={99}
                sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: 'var(--color-primary)',
                    color: '#000',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    minWidth: 16,
                    height: 16,
                    borderRadius: '50%',
                    border: '1.5px solid var(--color-surface)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }
                }}
              >
                <NotificationsNone fontSize="small" />
              </Badge>
            </ListItemIcon>
            {showFullContent && <ListItemText primary="Notificações" />}
          </ListItemButton>
        </Tooltip>



        {menuStructure.map((section, index) => (
          <SidebarSection
            key={section.title}
            index={index}
            title={section.title}
            items={section.items}
            isExpanded={expandedSections[section.title] ?? true}
            open={open}
            isMobile={isMobile}
            onToggle={toggleSection}
            isPathActive={isPathActive}
            onLinkClick={() => isMobile && onToggle()}
          />
        ))}
      </nav>

      <SidebarFooter
        user={user}
        open={open}
        isMobile={isMobile}
        onLogout={handleLogout}
      />
    </Box>
  )

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onToggle}
        classes={{ paper: 'sidebar-paper sidebar-paper--mobile' }}
      >
        {drawerContent}
      </Drawer>
    )
  }

  return (
    <div className={withState('sidebar-container', 'sidebar-container--closed')}>
      <Drawer
        variant="permanent"
        open={open}
        className={withState('sidebar', 'sidebar--closed')}
        classes={{ paper: withState('sidebar-paper', 'sidebar-paper--closed') }}
      >
        {drawerContent}
      </Drawer>
    </div>
  )
}

export default Sidebar
