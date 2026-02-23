import type { AccessMode } from '../components/Dashboard/DashboardBodyCard'

/**
 * Determines the access mode for a given base permission.
 */
export const getAccessMode = (permissions: string[] = [], basePermission: string): AccessMode => {
    const safePermissions = permissions || []
    // Collect all permissions that start with this base
    const relevant = safePermissions.filter(p => p.startsWith(basePermission))

    const hasListar = safePermissions.includes(`${basePermission}:listar`) || safePermissions.includes(basePermission)
    const hasVisualizar = safePermissions.includes(`${basePermission}:visualizar`)
    const hasEditar = safePermissions.includes(`${basePermission}:editar`)
    const hasCriar = safePermissions.includes(`${basePermission}:criar`) || safePermissions.includes(`${basePermission}:adicionar`)

    // Rule #3: Visibility is strictly controlled by :listar (or the base permission itself).
    const view = hasListar

    if (!view) return 'hidden'

    const create = hasCriar
    const edit = hasEditar
    const del = relevant.some(p => p.endsWith(':excluir') || p.endsWith(':remover'))
    const preview = relevant.some(p => p.endsWith(':preview'))
    const download = relevant.some(p => p.endsWith(':download'))

    return {
        view,
        visualizeItem: hasVisualizar,
        create,
        edit,
        delete: del,
        preview,
        download
    }
}

export const isHidden = (mode: AccessMode): boolean => {
    if (mode === 'hidden') return true
    if (typeof mode === 'object' && mode.view === false) return true
    return false
}

export const isReadOnly = (mode: AccessMode): boolean => {
    if (mode === 'read-only' || mode === 'hidden') return true
    if (typeof mode === 'object') {
        return !mode.edit && !mode.create
    }
    return false
}

export const canVisualizeItem = (mode: AccessMode): boolean => {
    if (mode === 'read-only' || mode === 'full') return true
    if (typeof mode === 'object') return !!mode.visualizeItem
    return false
}

export const isFull = (mode: AccessMode): boolean => {
    if (mode === 'full') return true
    if (typeof mode === 'object') {
        return !!(mode.edit || mode.create || mode.delete)
    }
    return false
}

export const canCreate = (mode: AccessMode): boolean => {
    if (mode === 'full') return true
    if (typeof mode === 'object') return !!mode.create
    return false
}

export const canEdit = (mode: AccessMode): boolean => {
    if (mode === 'full') return true
    if (typeof mode === 'object') return !!mode.edit
    return false
}

export const canDelete = (mode: AccessMode): boolean => {
    if (mode === 'full') return true
    if (typeof mode === 'object') return !!mode.delete
    return false
}

export const canPreview = (mode: AccessMode): boolean => {
    if (mode === 'full') return true
    if (typeof mode === 'object') return !!mode.preview
    return false
}

export const canDownload = (mode: AccessMode): boolean => {
    if (mode === 'full') return true
    if (typeof mode === 'object') return !!mode.download
    return false
}

/**
 * Adjusts the access mode based on whether we are currently editing or creating an item.
 * This ensures Rule #2: fields are disabled if the specific action (edit vs create) is not allowed.
 */
export const getContextualAccessMode = (mode: AccessMode, isEditing: boolean): AccessMode => {
    if (typeof mode !== 'object') return mode
    return {
        ...mode,
        // When editing, we only care about edit permission for field enablement.
        // When creating, we only care about create permission for field enablement.
        edit: isEditing ? !!mode.edit : false,
        create: !isEditing ? !!mode.create : false
    }
}
