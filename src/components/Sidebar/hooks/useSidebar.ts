import { useState, useEffect, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { menusService, type MenuDefinition } from '../../../services/menus'
import { useAuth } from '../../../context/AuthContext'
import { useNotifications } from '../../../context/NotificationsContext'
import { getIcon } from '../constants/icons'

export type SidebarItem = {
    label: string
    icon: React.ReactElement
    path: string
    children?: SidebarItem[]
    isChild?: boolean
}

export type SidebarSectionData = {
    title: string
    items: SidebarItem[]
}

export const useSidebar = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logout, permissions, menus } = useAuth()
    const { unreadCount } = useNotifications()

    const [allMenus, setAllMenus] = useState<MenuDefinition[]>([])
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
        const saved = localStorage.getItem('sidebar_expanded_sections')
        return saved ? JSON.parse(saved) : {}
    })

    useEffect(() => {
        menusService.getAll()
            .then((menus: MenuDefinition[] | null) => {
                if (menus) setAllMenus(menus)
            })
            .catch((error: unknown) => {
                console.error('Failed to load menus:', error)
            })
    }, [])

    const menuStructure = useMemo(() => {
        // Prioritize dynamically fetched menus, fallback to context menus
        const sourceMenus = allMenus.length > 0 ? allMenus : menus

        const safePermissions = Array.isArray(permissions) ? permissions : []

        const hasPermission = (menu: MenuDefinition): boolean => {
            // Se tem permissão direta
            if (menu.key && safePermissions.some(p => typeof p === 'string' && p.toLowerCase() === menu.key.toLowerCase())) return true

            // Se tem filhos, verifica se tem permissão em algum filho
            if (menu.children && menu.children.length > 0) {
                return menu.children.some(child => hasPermission(child))
            }

            return false
        }

        const filterMenus = (menuList: MenuDefinition[]): MenuDefinition[] => {
            return menuList
                .filter(menu => hasPermission(menu))
                .map(menu => ({
                    ...menu,
                    children: menu.children ? filterMenus(menu.children) : undefined
                }))
        }

        const filteredMenus = filterMenus(sourceMenus)

        const mapToSidebarItem = (menu: MenuDefinition, isChild = false): SidebarItem => ({
            label: menu.name || '',
            icon: getIcon(menu.icon),
            path: (menu.url || '#').startsWith('/') ? (menu.url || '#') : `/${menu.url || '#'}`,
            children: menu.children?.map(child => mapToSidebarItem(child, true)),
            isChild
        })

        const groups = filteredMenus.reduce((acc: Record<string, SidebarItem[]>, menu: MenuDefinition) => {
            const category = menu.category || 'Outros'
            if (!acc[category]) {
                acc[category] = []
            }
            acc[category].push(mapToSidebarItem(menu))
            return acc
        }, {} as Record<string, SidebarItem[]>)

        return Object.entries(groups).map(([category, items]) => ({
            title: category,
            items
        }))
    }, [allMenus, menus, permissions])

    const allItemPaths = useMemo(() => {
        return menuStructure.flatMap(section => section.items.map(item => item.path))
    }, [menuStructure])

    const toggleSection = (title: string) => {
        setExpandedSections(prev => {
            const currentValue = prev[title] ?? true
            const newValue = !currentValue
            const newState = {
                ...prev,
                [title]: newValue
            }
            localStorage.setItem('sidebar_expanded_sections', JSON.stringify(newState))
            return newState
        })
    }

    // Auto-expand active section
    useEffect(() => {
        menuStructure.forEach(section => {
            const hasActiveChild = section.items.some(item => location.pathname.startsWith(item.path))
            if (hasActiveChild) {
                setExpandedSections(prev => {
                    if (prev[section.title]) return prev
                    const newState = { ...prev, [section.title]: true }
                    localStorage.setItem('sidebar_expanded_sections', JSON.stringify(newState))
                    return newState
                })
            }
        })
    }, [location.pathname, menuStructure])

    const handleLogout = async () => {
        try {
            await logout()
            navigate('/', { replace: true })
        } catch (error) {
            console.error('Erro ao fazer logout:', error)
            navigate('/', { replace: true })
        }
    }

    const isPathActive = (path: string) => {
        return location.pathname.startsWith(path) &&
            !allItemPaths.some(p => p !== path && p.startsWith(path + '/') && location.pathname.startsWith(p))
    }

    const toggleAllSections = (expand: boolean) => {
        const newState = menuStructure.reduce((acc, section) => {
            acc[section.title] = expand
            return acc
        }, {} as Record<string, boolean>)

        setExpandedSections(newState)
        localStorage.setItem('sidebar_expanded_sections', JSON.stringify(newState))
    }

    return {
        user,
        menuStructure,
        expandedSections,
        toggleSection,
        toggleAllSections,
        handleLogout,
        isPathActive,
        navigate,
        location,
        unreadCount
    }
}
