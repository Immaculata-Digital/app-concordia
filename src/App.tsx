import AppRoutes from './routes'
import GlobalLoadingBar from './components/GlobalLoadingBar'
import { ChatProvider } from './context/ChatContext'
import { NotificationsProvider } from './context/NotificationsContext'

function App() {
  return (
    <NotificationsProvider>
      <ChatProvider>
        <GlobalLoadingBar />
        <AppRoutes />
      </ChatProvider>
    </NotificationsProvider>
  )
}

export default App
