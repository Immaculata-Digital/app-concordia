import { useEffect, useRef } from 'react'
import {
  Box,
  IconButton,
  Stack,
  Tooltip,
  Badge,
  useTheme,
  useMediaQuery,
} from '@mui/material'

import {
  Menu as MenuIcon,
  MenuOpen,
} from '@mui/icons-material'


import { useSearch } from '../../context/SearchContext'
import { useAuth } from '../../context/AuthContext'
import { useChat } from '../../context/ChatContext'
import { useNotifications } from '../../context/NotificationsContext'
import BrainIcon from '../BrainIcon'
import SearchBar from '../SearchBar'
import './style.css'

type TopbarProps = {
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

const Topbar = ({ sidebarOpen, onToggleSidebar }: TopbarProps) => {
  const { user, permissions } = useAuth()
  const { unreadCount } = useNotifications()

  const {
    filters,
    setSearchOpen,
    searchOpen,
  } = useSearch()
  const { toggleChat, isChatOpen } = useChat()
  const showSearch = filters.length > 0
  const searchInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (showSearch) {
      setSearchOpen(true)
    }
  }, [showSearch, setSearchOpen])


  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchOpen])




  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('lg'))

  return (
    <header className="topbar">
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        className="topbar__container"
      >
        <IconButton
          aria-label={sidebarOpen ? 'Recolher menu lateral' : 'Expandir menu lateral'}
          onClick={onToggleSidebar}
          className="topbar__menu-btn"
        >
          {sidebarOpen ? (
            <MenuOpen />
          ) : isSmallScreen ? (
            <Badge
              badgeContent={unreadCount}
              color="error"
              max={99}
              className="topbar__badge"
            >
              <MenuIcon />
            </Badge>
          ) : (
            <MenuIcon />
          )}
        </IconButton>

        {showSearch ? (
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <SearchBar autoFocus={searchOpen} />
          </Box>
        ) : (
          <Box sx={{ flex: 1 }} />
        )}

        <Stack direction="row" alignItems="center" spacing={1} className="topbar__actions">
          {user && (permissions || []).includes('erp:aichat:visualizar') && (
            <Tooltip title="Abrir/Fechar Chat">
              <IconButton
                aria-label="Chat"
                className="topbar__chat-btn"
                onClick={toggleChat}
              >
                <BrainIcon
                  color={isChatOpen ? 'var(--color-primary)' : 'currentColor'}
                />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

      </Stack>


    </header>
  )
}

export default Topbar
