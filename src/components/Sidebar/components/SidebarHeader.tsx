import { IconButton } from '@mui/material'
import { ChevronLeft, DarkMode, LightMode, UnfoldMore, UnfoldLess } from '@mui/icons-material'
import logoConcordia from '../../../assets/images/logo.png'

type SidebarHeaderProps = {
    open: boolean
    isMobile: boolean
    themeMode: 'light' | 'dark'
    onToggle: () => void
    onLogoClick: () => void
    onChangeTheme: (mode: 'light' | 'dark') => void
    onToggleAll: () => void
    allExpanded: boolean
    onVersionClick: () => void
    version: string
}

export const SidebarHeader = ({
    open,
    isMobile,
    themeMode,
    onToggle,
    onLogoClick,
    onChangeTheme,
    onToggleAll,
    allExpanded,
    onVersionClick,
    version
}: SidebarHeaderProps) => {
    const logoClasses = open ? 'sidebar-logo' : 'sidebar-logo sidebar-logo--compact'
    const showFullContent = open || isMobile

    return (
        <div className="sidebar-header-wrapper">
            <div className="sidebar-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <img
                        src={logoConcordia}
                        alt="Logo Concordia"
                        className={logoClasses}
                        onClick={onLogoClick}
                        style={{ cursor: 'pointer' }}
                    />

                    {showFullContent && (
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                                className="sidebar-version-link"
                                onClick={onVersionClick}
                                title="Notas da Atualização"
                            >
                                v{version}
                            </button>
                            <IconButton
                                size="small"
                                onClick={onToggleAll}
                                className="expand-toggle-btn-header"
                                title={allExpanded ? 'Recolher todos' : 'Expandir todos'}
                            >
                                {allExpanded ? <UnfoldLess fontSize="small" /> : <UnfoldMore fontSize="small" />}
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={() => onChangeTheme(themeMode === 'dark' ? 'light' : 'dark')}
                                className="theme-toggle-btn-header"
                                title={themeMode === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                            >
                                {themeMode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
                            </IconButton>
                        </div>
                    )}
                </div>

                {isMobile && (
                    <IconButton onClick={onToggle} size="small" className="sidebar-close">
                        <ChevronLeft />
                    </IconButton>
                )}
            </div>
        </div>
    )
}
