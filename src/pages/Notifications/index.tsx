
import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Stack,
    Button,
    useTheme,
    useMediaQuery,
    Avatar,
    Paper,
    IconButton,
    Tooltip,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    ToggleButtonGroup,
    ToggleButton,
    Skeleton
} from '@mui/material';
import {
    Security as SecurityIcon,
    Update as UpdateIcon,
    DateRange as DeadlineIcon,
    Settings as SystemIcon,
    Star as PriorityIcon,
    DoneAll as DoneAllIcon,
    Check as CheckIcon,
    ViewHeadline as CompactIcon,
    ViewStream as SummaryIcon,
    ViewDay as FullIcon,
    Mail as AllIcon,
    MarkEmailUnread as UnreadIcon
} from '@mui/icons-material';

import { DashboardContent } from '../../components/Dashboard/DashboardContent';
import { useSearch } from '../../context/SearchContext';
import { useAuth } from '../../context/AuthContext';
import { useLoading } from '../../context/LoadingContext';
import { comunicacaoService } from '../../services/comunicacoes';
import { useNotifications } from '../../context/NotificationsContext';
import type { NotificationDTO } from '../../services/comunicacoes';
import { getAccessMode } from '../../utils/accessControl';

import type { NotificationItem, NotificationCategory } from './types';
import './style.css';

interface ExtendedNotification extends NotificationItem {
    avatar?: string;
    type?: 'mention' | 'alert' | 'update' | 'interaction';
    user?: string;
    priority?: boolean;
    categoryName?: string;
    categoryIcon?: string;
    link?: string;
}

const CategoryBadge = ({ item, density }: { item: ExtendedNotification; density: string }) => {
    // Unified Gold Color System for all categories as requested
    const colorStyle = {
        bg: 'rgba(219, 170, 61, 0.12)', // var(--color-primary) with opacity
        color: 'var(--color-primary)',
        border: 'rgba(219, 170, 61, 0.3)'
    };

    const isCompact = density === 'compact';

    return (
        <Box
            className="notification-category-badge"
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                px: isCompact ? 0.75 : 1,
                py: isCompact ? 0.25 : 0.25,
                borderRadius: '4px',
                bgcolor: colorStyle.bg,
                border: `1px solid ${colorStyle.border}`,
                color: colorStyle.color,
                fontSize: isCompact ? '0.6rem' : '0.625rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                lineHeight: 1,
                fontFamily: 'var(--font-body)',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                pointerEvents: 'none', // Allows clicks to pass through to the row

                position: 'static',
                ml: 0.5, // Small gap after the action button
                mr: 1,   // Gap before the timestamp

                '&:hover': {
                    bgcolor: colorStyle.bg.replace('0.12', '0.18'),
                }
            }}
        >
            {item.categoryName?.toUpperCase() || item.category.toUpperCase()}
        </Box>
    );
};

const UnreadBadge = () => (
    <Box
        sx={{
            position: 'absolute',
            top: -2,
            right: -2,
            width: 10,
            height: 10,
            bgcolor: 'var(--color-unread-badge-bg)', // Variável tema-dependente
            borderRadius: '50%',
            border: '2px solid var(--color-unread-badge-border)', // Variável tema-dependente
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 3,
            animation: 'pulse-unread 2s infinite ease-in-out'
        }}
    />
);

const SwipeableNotificationItem = ({
    item,
    density,
    isMobile,
    onToggleRead,
    getIcon,
    formatTimestamp,
    canMarkRead,
    canMarkUnread
}: {
    item: ExtendedNotification;
    density: string;
    isMobile: boolean;
    onToggleRead: (id: string, read: boolean) => void;
    getIcon: (item: ExtendedNotification) => React.ReactNode;
    formatTimestamp: (date: Date) => string;
    canMarkRead: boolean;
    canMarkUnread: boolean;
}) => {
    const navigate = useNavigate();
    const [dragX, setDragX] = useState(0);
    const [startX, setStartX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const threshold = 80;

    const handleTouchStart = (e: React.TouchEvent) => {
        // Allow swipe if user can mark as read OR unread
        if (!isMobile || (!canMarkRead && !canMarkUnread)) return;
        setStartX(e.touches[0].clientX);
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX;
        setDragX(diff);
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        // Swipe right = mark as read (needs canMarkRead)
        if (dragX >= threshold && canMarkRead) {
            onToggleRead(item.id, true);
            // Swipe left = mark as unread (needs canMarkUnread)  
        } else if (dragX <= -threshold && canMarkUnread) {
            onToggleRead(item.id, false);
        }
        setDragX(0);
        setIsDragging(false);
    };

    const renderMobileContent = () => (
        <Stack spacing={1.5} sx={{ width: '100%' }}>
            {/* Header: Icon + Title + Time */}
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <Box
                    sx={{
                        position: 'relative',
                        flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 36, height: 36, borderRadius: '50%',
                        bgcolor: item.avatar ? 'transparent' : 'var(--color-primary)',
                        color: '#FFF'
                    }}
                >
                    {getIcon(item)}
                    {!item.read && <UnreadBadge />}
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Typography
                            sx={{
                                fontWeight: item.read ? 600 : 700,
                                fontSize: '0.9rem',
                                color: 'var(--color-text)',
                                fontFamily: 'var(--font-body)',
                                lineHeight: 1.3,
                                mr: 1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical'
                            }}
                        >
                            {item.title}
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                            {item.read && <DoneAllIcon sx={{ fontSize: 14, color: 'var(--color-primary)', mt: 0.3 }} />}
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'var(--color-on-secondary)',
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                    whiteSpace: 'nowrap',
                                    pt: 0.3
                                }}
                            >
                                {formatTimestamp(item.timestamp)}
                            </Typography>
                        </Stack>
                    </Stack>
                </Box>
            </Stack>

            {/* Body: Description */}
            <Typography
                variant="body2"
                sx={{
                    color: 'var(--color-on-secondary)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.825rem',
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: density === 'resumido' ? 3 : density === 'compact' ? 2 : 10,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}
            >
                {item.description}
            </Typography>

            {/* Footer: Badge + Actions */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 0.5 }}>
                <CategoryBadge item={item} density={density} />

                <Stack direction="row" spacing={1}>
                    <Box className="notification-desktop-action">
                        {/* Mobile Action: Mark Read Button (Visible if unchecked) */}
                        {!item.read && canMarkRead && (
                            <IconButton
                                size="small"
                                onClick={(e) => { e.stopPropagation(); onToggleRead(item.id, true); }}
                                sx={{
                                    p: 0.5,
                                    color: 'var(--color-primary)',
                                    bgcolor: 'rgba(219, 170, 61, 0.1)',
                                    '&:hover': { bgcolor: 'rgba(219, 170, 61, 0.2)' }
                                }}
                            >
                                <CheckIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                        )}
                    </Box>
                </Stack>
            </Stack>

            {/* Action Buttons (Full width on mobile) */}
            {item.actions && item.actions.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    {item.actions.map((action, idx) => (
                        <Button
                            key={idx}
                            variant={action.primary ? "contained" : "outlined"}
                            size="small"
                            fullWidth
                            disableElevation
                            onClick={(e) => { e.stopPropagation(); action.onClick(); }}
                            sx={{
                                textTransform: 'none',
                                borderRadius: '8px',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                minHeight: 36,
                                bgcolor: action.primary ? 'var(--color-primary)' : 'transparent',
                                borderColor: action.primary ? 'transparent' : 'var(--color-border)',
                                color: action.primary ? '#000' : 'var(--color-text)',
                            }}
                        >
                            {action.label}
                        </Button>
                    ))}
                </Stack>
            )}
        </Stack>
    );

    const renderDesktopContent = () => (
        <>
            {density === 'compact' ? (
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                        sx={{
                            position: 'relative', // Para o badge
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 26, height: 26, borderRadius: '50%',
                            bgcolor: 'var(--color-primary)'
                        }}
                    >
                        {getIcon(item)}
                        {!item.read && <UnreadBadge />}
                    </Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                            sx={{
                                fontWeight: item.read ? 500 : 700,
                                fontSize: '0.825rem', color: 'var(--color-text)', fontFamily: 'var(--font-body)',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', mr: 2
                            }}
                        >
                            {item.title}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Box className="notification-desktop-action">
                                {/* Show mark as read if unread AND has permission, OR show mark as unread if read AND has permission */}
                                {((!item.read && canMarkRead) || (item.read && canMarkUnread)) && (
                                    <Tooltip title={item.read ? "Marcar como não lida" : "Marcar como lida"}>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => { e.stopPropagation(); onToggleRead(item.id, !item.read); }}
                                            sx={{ p: 0.5, color: 'var(--color-primary)' }}
                                        >
                                            {item.read ? <UnreadIcon sx={{ fontSize: 16 }} /> : <CheckIcon sx={{ fontSize: 16 }} />}
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </Box>

                            <CategoryBadge item={item} density={density} />
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'var(--color-on-secondary)',
                                    fontWeight: 600,
                                    fontFamily: 'var(--font-body)',
                                    fontSize: '0.675rem',
                                    minWidth: '42px', // Reserva espaço fixo para a data
                                    textAlign: 'right',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5
                                }}
                            >
                                {item.read && <DoneAllIcon sx={{ fontSize: 14, color: 'var(--color-primary)' }} />}
                                {formatTimestamp(item.timestamp)}
                            </Typography>
                        </Stack>
                    </Stack>
                </Stack>
            ) : (
                <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box
                        sx={{
                            position: 'relative', // Para o badge
                            m: 0, flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 40, height: 40, borderRadius: '50%',
                            bgcolor: item.avatar ? 'transparent' : 'var(--color-primary)',
                            color: '#FFF'
                        }}
                    >
                        {getIcon(item)}
                        {!item.read && <UnreadBadge />}
                    </Box>

                    <Box sx={{ flex: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Typography
                                sx={{
                                    fontWeight: 700,
                                    fontSize: density === 'completo' ? '1.05rem' : '0.875rem',
                                    color: 'var(--color-text)',
                                    fontFamily: 'var(--font-body)',
                                    lineHeight: 1.2,
                                    mr: 2,
                                    flex: 1,
                                    minWidth: 0,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                            >
                                {item.title}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                                <Box className="notification-desktop-action" sx={{ mr: 1 }}>
                                    {((!item.read && canMarkRead) || (item.read && canMarkUnread)) && (
                                        <Tooltip title={item.read ? "Marcar como não lida" : "Marcar como lida"}>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => { e.stopPropagation(); onToggleRead(item.id, !item.read); }}
                                                sx={{ p: 0.5, color: 'var(--color-primary)' }}
                                            >
                                                {item.read ? <UnreadIcon sx={{ fontSize: 16 }} /> : <CheckIcon sx={{ fontSize: 16 }} />}
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </Box>

                                <CategoryBadge item={item} density={density} />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: 'var(--color-on-secondary)',
                                        fontWeight: 600,
                                        fontFamily: 'var(--font-body)',
                                        fontSize: '0.675rem',
                                        minWidth: '42px', // Reserva espaço fixo para a data
                                        textAlign: 'right',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5
                                    }}
                                >
                                    {item.read && <DoneAllIcon sx={{ fontSize: 14, color: 'var(--color-primary)' }} />}
                                    {formatTimestamp(item.timestamp)}
                                </Typography>
                            </Stack>
                        </Stack>

                        <Typography
                            variant="body2"
                            sx={{
                                color: 'var(--color-on-secondary)',
                                mt: 1, // Espaçamento respirável premium
                                lineHeight: 1.5,
                                fontFamily: 'var(--font-body)',
                                fontSize: density === 'completo' ? '0.925rem' : '0.775rem',
                                ...(density === 'resumido' && {
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                } as any)
                            }}
                        >
                            {item.description}
                        </Typography>

                        {item.actions && item.actions.length > 0 && (
                            <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
                                {item.actions.map((action, idx) => (
                                    <Button
                                        key={idx}
                                        variant={action.primary ? "contained" : "outlined"}
                                        size="small"
                                        disableElevation
                                        onClick={(e) => { e.stopPropagation(); action.onClick(); }}
                                        sx={{
                                            textTransform: 'none',
                                            borderRadius: '6px',
                                            fontWeight: 700,
                                            px: density === 'completo' ? 2 : 1.25,
                                            py: density === 'completo' ? 0.6 : 0.3,
                                            fontSize: density === 'completo' ? '0.825rem' : '0.7rem',
                                            fontFamily: 'var(--font-body)',
                                            minHeight: density === 'completo' ? 32 : 24,
                                            bgcolor: action.primary ? 'var(--color-primary)' : 'rgba(0,0,0,0.02)',
                                            color: action.primary ? '#000' : 'var(--color-text)',
                                            '&:hover': { bgcolor: action.primary ? 'var(--color-primary-dark)' : 'rgba(0,0,0,0.05)' }
                                        }}
                                    >
                                        {action.label}
                                    </Button>
                                ))}
                            </Stack>
                        )}
                    </Box>

                </Stack>
            )}
        </>
    );

    return (
        <Box className="notification-swipe-container">
            {/* Background layer revealed on swipe */}
            <Box
                className={`notification-swipe-background ${dragX > 0 ? 'swipe-read' : (dragX < 0 ? 'swipe-unread' : '')}`}
                sx={{ opacity: Math.min(Math.abs(dragX) / threshold, 1) }}
            >
                {dragX > 0 ? <CheckIcon sx={{ fontSize: 24 }} /> : <UnreadIcon sx={{ fontSize: 24 }} />}
            </Box>

            <Paper
                elevation={0}
                className={`notification-page-item notification-row-wrapper ${item.read ? '' : 'unread'} notification-item-animate`}
                onClick={() => {
                    if (!item.read) {
                        onToggleRead(item.id, true);
                    }
                    if (item.link) {
                        navigate(item.link);
                    }
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                sx={{
                    px: isMobile ? 1.5 : 2,
                    py: isMobile ? 2 : (density === 'compact' ? 1 : density === 'resumido' ? 1.75 : 3),
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    cursor: item.link ? 'pointer' : 'default',
                    transition: isDragging ? 'none' : 'all 0.2s ease',
                    transform: dragX !== 0 ? `translateX(${dragX}px)` : 'scale(1)',
                    bgcolor: 'var(--color-surface)',
                    '&:hover': {
                        transform: dragX !== 0 ? `translateX(${dragX}px)` : 'scale(1.008)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
                        borderColor: 'rgb(var(--color-primary-rgb), 0.5)'
                    },
                }}
            >
                {isMobile ? renderMobileContent() : renderDesktopContent()}
            </Paper>
        </Box>
    );
};





const NotificationsPage = () => {
    const [notifications, setNotifications] = useState<ExtendedNotification[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [filter, setFilter] = useState<'all' | 'unread'>(() => {
        return (localStorage.getItem('notifications_filter') as any) || 'unread';
    });
    const [density, setDensity] = useState<'compact' | 'resumido' | 'completo'>(() => {
        return (localStorage.getItem('notifications_density') as any) || 'resumido';
    });
    const [densityAnchorEl, setDensityAnchorEl] = useState<null | HTMLElement>(null);

    const observer = useRef<IntersectionObserver | null>(null);
    const lastNotificationElementRef = useRef<HTMLDivElement | null>(null);

    // Auth & Permissions
    const { permissions } = useAuth();
    const { refreshUnreadCount } = useNotifications();

    // Usar getAccessMode seguindo o padrão do sistema (ex: ComunicacoesPage)
    const accessMode = useMemo(() => getAccessMode(permissions, 'erp:notificacoes'), [permissions]);

    // canList vem do accessMode - se não for 'hidden' e tiver view, pode listar
    const canList = accessMode !== 'hidden' && (typeof accessMode === 'object' ? accessMode.view : true);

    // Ações específicas de notificação (não seguem padrão CRUD)
    const canMarkRead = permissions.includes('erp:notificacoes:marcar-lida');
    const canMarkUnread = permissions.includes('erp:notificacoes:marcar-nao-lida');
    const canMarkAllRead = permissions.includes('erp:notificacoes:marcar-todas-lidas');

    useEffect(() => {
        localStorage.setItem('notifications_filter', filter);
    }, [filter]);

    useEffect(() => {
        localStorage.setItem('notifications_density', density);
    }, [density]);

    const { query, activeFilters, activeSorts, setPlaceholder, setFilters, setQuery, clearFilters } = useSearch();
    const { startLoading, stopLoading } = useLoading();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        setPlaceholder('Pesquisar notificações...');

        // Initial filters with empty category options
        const initialFilters: any[] = [
            { id: 'title', label: 'Título', field: 'title', type: 'text', page: 'notifications' },
            {
                id: 'category', label: 'Categoria', field: 'category', type: 'select', options: [], page: 'notifications'
            },
            { id: 'isPriority', label: 'Prioridade', field: 'isPriority', type: 'boolean', page: 'notifications' },
            { id: 'createdAt', label: 'Data', field: 'createdAt', type: 'date', page: 'notifications' }
        ];

        setFilters(initialFilters);

        // Fetch categories dynamically
        comunicacaoService.listNotificationCategories()
            .then(categories => {
                const options = categories.map(cat => ({
                    label: cat.name,
                    value: cat.code
                }));

                setFilters([
                    { id: 'title', label: 'Título', field: 'title', type: 'text', page: 'notifications' },
                    {
                        id: 'category', label: 'Categoria', field: 'category', type: 'select', options, page: 'notifications'
                    },
                    { id: 'isPriority', label: 'Prioridade', field: 'isPriority', type: 'boolean', page: 'notifications' },
                    { id: 'createdAt', label: 'Data', field: 'createdAt', type: 'date', page: 'notifications' }
                ]);
            })
            .catch(err => console.error('Failed to load notification categories:', err));

        return () => {
            setFilters([]);
            setPlaceholder('');
            setQuery('');
        };
    }, [setPlaceholder, setFilters, setQuery]);

    const mapNotification = (n: NotificationDTO): ExtendedNotification => ({
        id: n.id,
        category: n.category as NotificationCategory,
        categoryName: n.categoryName,
        categoryIcon: n.categoryIcon,
        title: n.title,
        description: n.body,
        timestamp: new Date(n.createdAt),
        read: n.currentStatusState === 'read',
        priority: n.isPriority,
        type: n.metadata?.type as any,
        user: n.metadata?.userName,
        avatar: n.metadata?.userAvatar,
        link: n.link,
        actions: n.actions?.map(a => ({
            label: a.label,
            onClick: () => {
                if (a.url) window.open(a.url, '_blank');
                else console.log('Action:', a.action);
            },
            primary: a.primary
        }))
    });

    const loadNotifications = async (targetPage: number, reset = false) => {
        // Se não tiver permissão de listar, nem tenta carregar
        if (!canList) {
            setNotifications([]);
            setLoading(false);
            setHasMore(false);
            if (reset) stopLoading();
            return;
        }

        try {
            if (reset) {
                setLoading(true);
                startLoading();
                setPage(1);
            } else {
                setLoadingMore(true);
            }

            // Pega o primeiro sort se existir
            const activeSort = activeSorts[0];

            // Only send filters if they have rules
            const currentFilters = activeFilters.rules.length > 0 ? activeFilters : undefined;

            const response = await comunicacaoService.listNotifications(
                targetPage,
                15, // Aumentado um pouco o limit para preencher melhor a tela
                filter === 'unread',
                query,
                activeSort?.field,
                activeSort?.order,
                currentFilters
            );

            const mappedItems = response.items.map(mapNotification);

            setNotifications(prev => {
                const updated = reset ? mappedItems : [...prev, ...mappedItems];
                setHasMore(updated.length < response.total);
                return updated;
            });
            setPage(targetPage);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            if (reset) stopLoading();
        }
    };

    // Debounce manual para busca onDemand via query
    useEffect(() => {
        const timer = setTimeout(() => {
            loadNotifications(1, true);
        }, 500);
        return () => clearTimeout(timer);
    }, [query, filter, activeSorts, activeFilters, canList]);

    useEffect(() => {
        if (!hasMore || loading || loadingMore) return;

        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadNotifications(page + 1);
            }
        });

        if (lastNotificationElementRef.current) {
            observer.current.observe(lastNotificationElementRef.current);
        }

        return () => {
            if (observer.current) observer.current.disconnect();
        };
    }, [hasMore, loading, loadingMore, page]);

    const filteredNotifications = useMemo(() => {
        let result = notifications;
        if (filter === 'unread') result = result.filter(n => !n.read);

        // A filtragem local aqui agora é redundante se a API já faz, 
        // mas mantemos como fallback se necessário ou se quisermos filtrar o cache local.
        if (query) {
            const s = query.toLowerCase();
            result = result.filter(n =>
                n.title.toLowerCase().includes(s) ||
                n.description.toLowerCase().includes(s)
            );
        }
        return result;
    }, [notifications, filter, query]);

    const groupedNotifications = useMemo(() => {
        const priority: ExtendedNotification[] = [];
        const today: ExtendedNotification[] = [];
        const older: ExtendedNotification[] = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        filteredNotifications.forEach(n => {
            if (n.priority && !n.read) {
                priority.push(n);
                return;
            }
            const d = new Date(n.timestamp);
            d.setHours(0, 0, 0, 0);
            if (d.getTime() === now.getTime()) today.push(n);
            else older.push(n);
        });

        return { 'priority': priority, 'today': today, 'older': older };
    }, [filteredNotifications]);

    const formatTimestamp = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(mins / 60);
        if (mins < 60) return `${mins}m`;
        if (hours < 24) return `${hours}h`;
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    const getIcon = (item: ExtendedNotification) => {
        const size = density === 'compact' ? 26 : 40;
        if (item.avatar) return <Avatar src={item.avatar} sx={{ width: size, height: size, borderRadius: '50%' }} />;
        const iconStyle = { fontSize: density === 'compact' ? 14 : 18, color: '#FFF' };
        if (item.category === 'system') return <UpdateIcon sx={iconStyle} />;
        if (item.category === 'alert') return item.type === 'alert' ? <SecurityIcon sx={iconStyle} /> : <DeadlineIcon sx={iconStyle} />;
        return <SystemIcon sx={iconStyle} />;
    };

    const handleMarkAllAsRead = async () => {
        if (!canMarkAllRead) return;
        try {
            await comunicacaoService.markAllRead();
            setNotifications(n => n.map(x => ({ ...x, read: true })));
            refreshUnreadCount();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleToggleRead = async (id: string, read: boolean) => {
        try {
            if (read) {
                if (!canMarkRead) return;
                await comunicacaoService.markAsRead(id);
            } else {
                if (!canMarkUnread) return;
                await comunicacaoService.markAsUnread(id);
            }
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read } : n));
            refreshUnreadCount();
        } catch (error) {
            console.error('Failed to toggle read status:', error);
        }
    };

    return (
        <DashboardContent
            loading={loading || loadingMore}
            hasData={notifications.length > 0}
            useSkeleton={true}
            sx={{
                px: isMobile ? 2.5 : 4,
                py: isMobile ? 2 : 4,
                '& .MuiBox-root': { overflow: 'visible' } // Ensure internal containers don't clip scale
            }}
        >
            <Box sx={{ maxWidth: 720, margin: '0 auto', width: '100%' }}>

                {/* Header */}
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4, px: 0.5 }}>
                    <Typography variant="h4" className="dashboard-title" sx={{ fontSize: '1.5rem' }}>
                        Notificações
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center">
                        <ToggleButtonGroup
                            value={filter}
                            exclusive
                            onChange={(_, val) => val && setFilter(val)}
                            size="small"
                            className="notification-toggle-group"
                        >
                            <ToggleButton value="all" className="notification-toggle-btn" sx={{ minWidth: 44 }}>
                                <AllIcon sx={{ fontSize: 18 }} />
                            </ToggleButton>
                            <ToggleButton value="unread" className="notification-toggle-btn" sx={{ minWidth: 44 }}>
                                <UnreadIcon sx={{ fontSize: 18 }} />
                            </ToggleButton>
                        </ToggleButtonGroup>

                        <Tooltip title="Densidade">
                            <IconButton
                                onClick={(e) => setDensityAnchorEl(e.currentTarget)}
                                className={`notification-action-btn ${Boolean(densityAnchorEl) ? 'notification-action-btn--active' : ''}`}
                            >
                                {density === 'compact' ? <CompactIcon sx={{ fontSize: 18 }} /> : density === 'resumido' ? <SummaryIcon sx={{ fontSize: 18 }} /> : <FullIcon sx={{ fontSize: 18 }} />}
                            </IconButton>
                        </Tooltip>

                        {canMarkAllRead && (
                            <Tooltip title="Marcar todas como lidas">
                                <IconButton
                                    onClick={handleMarkAllAsRead}
                                    className="notification-action-btn"
                                >
                                    <DoneAllIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                </Stack>

                {!canList ? (
                    <Box sx={{ p: 4, textAlign: 'center', color: 'text.secondary' }}>
                        <Typography variant="h6">Acesso restrito</Typography>
                        <Typography variant="body2">Você não tem permissão para visualizar as notificações.</Typography>
                    </Box>
                ) : loading ? (
                    <Stack spacing={2}>
                        {[1, 2, 3, 4, 5].map((i) => (
                            <Paper
                                key={i}
                                elevation={0}
                                sx={{
                                    px: 2,
                                    py: density === 'compact' ? 1.5 : 2.5,
                                    borderRadius: '10px',
                                    border: '1px solid var(--color-border)',
                                    bgcolor: 'var(--color-surface)',
                                }}
                            >
                                <Stack direction="row" spacing={2}>
                                    <Skeleton variant="circular" width={density === 'compact' ? 26 : 40} height={density === 'compact' ? 26 : 40} />
                                    <Box sx={{ flex: 1 }}>
                                        <Skeleton variant="text" width="40%" height={20} />
                                        <Skeleton variant="text" width="90%" height={16} />
                                        {density !== 'compact' && <Skeleton variant="text" width="60%" height={16} />}
                                    </Box>
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>
                ) : (
                    <>
                        {/* Groups */}
                        {Object.entries(groupedNotifications).map(([key, items]) => (
                            items.length > 0 && (
                                <Box key={key} sx={{ mb: density === 'compact' ? 2.5 : 4 }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: density === 'compact' ? 0.75 : 1.25, px: 1 }}>
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ opacity: key === 'priority' ? 0.7 : 0.4 }}>
                                            {key === 'priority' && <PriorityIcon className="priority-star-icon" sx={{ fontSize: 14 }} />}
                                            <Typography
                                                variant="overline"
                                                sx={{
                                                    fontWeight: 800,
                                                    color: 'var(--color-text)',
                                                    letterSpacing: 1.2,
                                                    fontFamily: 'var(--font-body)',
                                                    fontSize: '0.675rem'
                                                }}
                                            >
                                                {key === 'priority' ? 'PRIORIDADE' : key === 'today' ? 'HOJE' : 'ANTERIORES'}
                                            </Typography>
                                        </Stack>
                                    </Stack>

                                    <Stack spacing={density === 'compact' ? 0.75 : 1.25}>
                                        {items.map((item, idx) => (
                                            <div
                                                key={item.id}
                                                style={{ animationDelay: `${idx * 0.05}s` }}
                                                ref={
                                                    (idx === items.length - 1 && key === 'older') ||
                                                        (idx === items.length - 1 && key === 'today' && groupedNotifications.older.length === 0) ||
                                                        (idx === items.length - 1 && key === 'priority' && groupedNotifications.today.length === 0 && groupedNotifications.older.length === 0)
                                                        ? lastNotificationElementRef : null
                                                }
                                            >
                                                <SwipeableNotificationItem
                                                    item={item}
                                                    density={density}
                                                    isMobile={isMobile}
                                                    onToggleRead={handleToggleRead}
                                                    getIcon={getIcon}
                                                    formatTimestamp={formatTimestamp}
                                                    canMarkRead={canMarkRead}
                                                    canMarkUnread={canMarkUnread}
                                                />
                                            </div>
                                        ))}
                                    </Stack>
                                </Box>
                            )
                        ))}

                        {notifications.length === 0 && !loading && (
                            <Stack
                                spacing={2}
                                alignItems="center"
                                justifyContent="center"
                                sx={{ py: 12, opacity: 0.6 }}
                            >
                                <AllIcon sx={{ fontSize: 64, color: 'var(--color-primary)', opacity: 0.5 }} />
                                <Typography variant="h6" sx={{ color: 'var(--color-text)', fontWeight: 600 }}>
                                    Nenhuma notificação encontrada
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'var(--color-on-secondary)' }}>
                                    {query || activeFilters.rules.length > 0
                                        ? 'Não encontramos resultados para os filtros aplicados.'
                                        : 'Você está em dia com todos os seus alertas.'}
                                </Typography>
                                {(query || activeFilters.rules.length > 0) && (
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => { setQuery(''); clearFilters(); }}
                                        sx={{ mt: 2, borderRadius: '8px', textTransform: 'none', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                                    >
                                        Limpar filtros
                                    </Button>
                                )}
                            </Stack>
                        )}

                        {!hasMore && notifications.length > 0 && (
                            <Typography className="notification-end-message">
                                Você chegou ao fim das suas notificações
                            </Typography>
                        )}

                        {loadingMore && (
                            <Box className="notification-reveal-batch" sx={{ py: 2 }}>
                                <Skeleton variant="rectangular" width="100%" height={80} sx={{ borderRadius: '10px' }} />
                            </Box>
                        )}
                    </>
                )}

                <Menu
                    anchorEl={densityAnchorEl}
                    open={Boolean(densityAnchorEl)}
                    onClose={() => setDensityAnchorEl(null)}
                    className="density-menu"
                    PaperProps={{ sx: { borderRadius: '12px', mt: 1, minWidth: 200 } }}
                >
                    <MenuItem onClick={() => { setDensity('compact'); setDensityAnchorEl(null); }} selected={density === 'compact'} sx={{ fontSize: '0.8rem' }}>
                        <ListItemIcon><CompactIcon sx={{ fontSize: 16 }} /></ListItemIcon>
                        <ListItemText
                            primary="Compacto"
                            secondary="Uma única linha"
                            primaryTypographyProps={{ fontSize: '0.8rem', color: 'var(--color-text)' }}
                            secondaryTypographyProps={{ fontSize: '0.625rem', color: 'var(--color-on-secondary)' }}
                        />
                        {density === 'compact' && <CheckIcon sx={{ fontSize: 14, ml: 1, color: 'var(--color-primary)' }} />}
                    </MenuItem>
                    <MenuItem onClick={() => { setDensity('resumido'); setDensityAnchorEl(null); }} selected={density === 'resumido'} sx={{ fontSize: '0.8rem' }}>
                        <ListItemIcon><SummaryIcon sx={{ fontSize: 16 }} /></ListItemIcon>
                        <ListItemText
                            primary="Resumido"
                            secondary="Até 3 linhas"
                            primaryTypographyProps={{ fontSize: '0.8rem', color: 'var(--color-text)' }}
                            secondaryTypographyProps={{ fontSize: '0.625rem', color: 'var(--color-on-secondary)' }}
                        />
                        {density === 'resumido' && <CheckIcon sx={{ fontSize: 14, ml: 1, color: 'var(--color-primary)' }} />}
                    </MenuItem>
                    <MenuItem onClick={() => { setDensity('completo'); setDensityAnchorEl(null); }} selected={density === 'completo'} sx={{ fontSize: '0.8rem' }}>
                        <ListItemIcon><FullIcon sx={{ fontSize: 16 }} /></ListItemIcon>
                        <ListItemText
                            primary="Completo"
                            secondary="Texto integral"
                            primaryTypographyProps={{ fontSize: '0.8rem', color: 'var(--color-text)' }}
                            secondaryTypographyProps={{ fontSize: '0.625rem', color: 'var(--color-on-secondary)' }}
                        />
                        {density === 'completo' && <CheckIcon sx={{ fontSize: 14, ml: 1, color: 'var(--color-primary)' }} />}
                    </MenuItem>
                </Menu>
            </Box>
        </DashboardContent>
    );
};

export default NotificationsPage;
