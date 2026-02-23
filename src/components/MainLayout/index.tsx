import { useEffect, useState, type ReactNode } from 'react'
import { Box, useTheme, useMediaQuery } from '@mui/material'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { SearchProvider } from '../../context/SearchContext'
import { useAuth } from '../../context/AuthContext'
import Sidebar from '../Sidebar'
import Topbar from '../Topbar'
import Chat from '../Chat'
import { useChat } from '../../context/ChatContext'
import { useThemeContext } from '../../theme/ThemeContext'
import './style.css'

type MainLayoutProps = {
  children?: ReactNode
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { isAuthenticated, permissions, loading, refreshPermissions } = useAuth()
  const { isChatOpen, isMaximized } = useChat()
  const location = useLocation()
  const theme = useTheme()
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('lg'))
  const { setMode, resolvedMode } = useThemeContext()

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return !isSmallScreen
    const stored = window.localStorage.getItem('marshall-sidebar-open')
    if (stored !== null) return stored === 'true'
    return !isSmallScreen
  })

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => {
      const newState = !prev
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('marshall-sidebar-open', String(newState))
      }
      return newState
    })
  }

  // Redirecionar para login se não estiver autenticado
  if (!loading && !isAuthenticated) {
    return <Navigate to="/" replace />
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        Carregando...
      </Box>
    )
  }

  // Atualizar permissões ao navegar
  useEffect(() => {
    if (isAuthenticated) {
      refreshPermissions()
    }
  }, [location.pathname, isAuthenticated, refreshPermissions])

  useEffect(() => {
    if (typeof document === 'undefined') return
    if (isChatOpen) {
      document.body.classList.add('chat-open')
    } else {
      document.body.classList.remove('chat-open')
    }
  }, [isChatOpen])

  return (
    <SearchProvider>
      <Box className="main-layout">
        <Sidebar
          open={sidebarOpen}
          onToggle={handleToggleSidebar}
          themeMode={resolvedMode}
          onChangeTheme={setMode}
        />
        <Box component="section" className="main-layout__content">
          <Topbar
            sidebarOpen={sidebarOpen}
            onToggleSidebar={handleToggleSidebar}
          />
          <Box component="main" className="main-layout__page">
            {children ?? <Outlet />}
          </Box>
        </Box>
        {(permissions || []).includes('erp:aichat:visualizar') && (
          <Box className={`main-layout__chat-wrapper ${isChatOpen ? 'open' : ''} ${isMaximized ? 'maximized' : ''}`}>
            <Chat />
          </Box>
        )}
      </Box>
    </SearchProvider>
  )
}

export default MainLayout
