
import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Chip,
  Stack,
  Typography,
  Grid,
} from '@mui/material'
import Toast from '../../components/Toast'

import { PasswordOutlined, VisibilityOutlined, Groups2Outlined, SecurityOutlined } from '@mui/icons-material'
import TableCard, {
  type TableCardColumn,
  type TableCardRow,
  type TableCardRowAction,
  type TableCardBulkAction,
} from '../../components/TableCard'
import { TableCardModal } from '../../components/Modals'
import { useSearch } from '../../context/SearchContext'
import { useAuth } from '../../context/AuthContext'
import TextPicker from '../../components/TextPicker'
import MultiSelectPicker from '../../components/MultiSelectPicker'
import MailPicker from '../../components/MailPicker'
import { type UserDTO } from '../../services/users'
import {
  useUserList,
  useCreateUser,
  useUpdateUserBasic,
  useUpdateUserGroups,
  useUpdateUserPermissions,
  useDeleteUser,
  useResetPassword,
} from '../../hooks/queries/users'
import { useAccessGroupList, useFeatureList } from '../../hooks/queries/accessGroups'
import { useDebounce } from '../../hooks/useDebounce'
import './style.css'

type UserRow = TableCardRow & UserDTO & {
  groupNames: string[]
  allowFeatureNames: string[]
  deniedFeatureNames: string[]
}

const UsersPage = () => {
  const { setFilters, setPlaceholder, setQuery, query } = useSearch()
  const debouncedSearch = useDebounce(query, 500)

  // Queries
  const { data: usersData, isLoading: loadingUsers, error: usersError } = useUserList({ search: debouncedSearch })
  const { data: groupsData, isLoading: loadingGroups } = useAccessGroupList()
  const { data: featuresData, isLoading: loadingFeatures } = useFeatureList()

  // Mapped Data
  const groups = useMemo(() =>
    groupsData?.map((g) => ({ label: g.name, value: g.id })) || [],
    [groupsData])

  const featureOptions = useMemo(() =>
    featuresData?.map((f) => ({ label: f.name, value: f.key })) || [],
    [featuresData])

  const featureDictionary = useMemo(() => {
    const dict: Record<string, string> = {}
    featuresData?.forEach((f) => {
      dict[f.key] = f.name
    })
    return dict
  }, [featuresData])

  const users = useMemo<UserRow[]>(() => {
    if (!usersData || !groupsData) return []
    return usersData.map((u) => ({
      ...u,
      groupNames: u.groupIds.map((id) => groupsData.find((g) => g.id === id)?.name || id),
      allowFeatureNames: u.allowFeatures.map((k) => featureDictionary[k] || k),
      deniedFeatureNames: u.deniedFeatures.map((k) => featureDictionary[k] || k),
    }))
  }, [usersData, groupsData, featureDictionary])

  const loading = loadingUsers || loadingGroups || loadingFeatures

  // Local State for UI
  const [detailUser, setDetailUser] = useState<UserRow | null>(null)
  const [toast, setToast] = useState<{ open: boolean; message: string; severity?: 'success' | 'error' | 'warning' | 'info' }>({ open: false, message: '' })

  // Dialog State
  const [manageGroupsDialog, setManageGroupsDialog] = useState<{
    open: boolean
    userIds: string[]
    groupIds: string[]
  }>({
    open: false,
    userIds: [],
    groupIds: []
  })

  const [manageAccessDialog, setManageAccessDialog] = useState<{
    open: boolean
    userIds: string[]
    allowFeatures: string[]
    deniedFeatures: string[]
  }>({
    open: false,
    userIds: [],
    allowFeatures: [],
    deniedFeatures: []
  })

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add')
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [formValues, setFormValues] = useState<Partial<UserRow>>({})
  const [initialFormValues, setInitialFormValues] = useState<Partial<UserRow>>({})

  // Mutations
  const createUserMutation = useCreateUser()
  const updateUserMutation = useUpdateUserBasic()
  const updateGroupsMutation = useUpdateUserGroups()
  const updatePermissionsMutation = useUpdateUserPermissions()
  const deleteUserMutation = useDeleteUser()
  const resetPasswordMutation = useResetPassword()

  const { permissions } = useAuth()

  const hasPermission = (permission: string) => {
    return permissions.includes(permission)
  }

  useEffect(() => {
    setPlaceholder('Pesquisar usuários...')
    const filters = [
      { id: 'login', label: 'Login', field: 'login', type: 'text' as const, page: 'usuarios' },
      { id: 'fullName', label: 'Nome Completo', field: 'fullName', type: 'text' as const, page: 'usuarios' },
      { id: 'email', label: 'E-mail', field: 'email', type: 'text' as const, page: 'usuarios' },
      { id: 'groups', label: 'Grupos de Acessos', field: 'groupNames', type: 'text' as const, page: 'usuarios' },
      { id: 'allowFeatures', label: 'Permissões Concedidas', field: 'allowFeatureNames', type: 'text' as const, page: 'usuarios' },
      { id: 'deniedFeatures', label: 'Permissões Negadas', field: 'deniedFeatureNames', type: 'text' as const, page: 'usuarios' },
    ]
    setFilters(filters, 'fullName')
    return () => {
      setFilters([])
      setPlaceholder('')
      setQuery('')
    }
  }, [setFilters, setPlaceholder, setQuery])

  // Handlers
  const handleCreateUser = async (data: Partial<UserRow>) => {
    if (!data.login || !data.email || !data.fullName) {
      setToast({ open: true, message: 'Preencha os campos obrigatórios', severity: 'error' })
      return
    }

    createUserMutation.mutate({
      login: data.login,
      fullName: data.fullName,
      email: data.email,
      groupIds: [],
      allowFeatures: [],
      deniedFeatures: [],
      createdBy: 'admin'
    }, {
      onSuccess: () => {
        setToast({ open: true, message: 'Usuário criado com sucesso. Senha enviada para o e-mail.', severity: 'success' })
        setModalOpen(false)
      },
      onError: (err) => {
        setToast({ open: true, message: err instanceof Error ? err.message : 'Erro ao criar usuário', severity: 'error' })
      }
    })
  }

  const handleUpdateUser = async (id: string, data: Partial<UserRow>) => {
    updateUserMutation.mutate({
      id,
      data: {
        login: data.login || '',
        fullName: data.fullName || '',
        email: data.email || '',
        updatedBy: 'admin'
      }
    }, {
      onSuccess: () => {
        setToast({ open: true, message: 'Usuário atualizado com sucesso', severity: 'success' })
        setModalOpen(false)
      },
      onError: () => {
        setToast({ open: true, message: 'Erro ao atualizar usuário', severity: 'error' })
      }
    })
  }

  const handleDeleteUser = async (id: string) => {
    deleteUserMutation.mutate(id, {
      onSuccess: () => setToast({ open: true, message: 'Usuário removido com sucesso', severity: 'success' }),
      onError: () => setToast({ open: true, message: 'Erro ao remover usuário', severity: 'error' })
    })
  }

  const handleBulkDelete = async (ids: string[]) => {
    // Handling bulk delete via Promise.all until API supports bulk delete
    try {
      await Promise.all(ids.map(id => deleteUserMutation.mutateAsync(id)))
      setToast({ open: true, message: 'Usuários removidos com sucesso', severity: 'success' })
    } catch (err) {
      setToast({ open: true, message: 'Erro ao remover alguns usuários', severity: 'error' })
    }
  }

  const handleResetPassword = async (user: UserRow) => {
    resetPasswordMutation.mutate(user.email, {
      onSuccess: () => setToast({ open: true, message: 'Reset de senha solicitado. Verifique o e-mail do usuário.', severity: 'success' }),
      onError: () => setToast({ open: true, message: 'Erro ao resetar senha', severity: 'error' })
    })
  }

  const handleSaveGroups = async () => {
    if (manageGroupsDialog.userIds.length === 0) return

    // Process sequentially or parallel based on API capabilities (usually calls mutation loop)
    try {
      await Promise.all(
        manageGroupsDialog.userIds.map(id =>
          updateGroupsMutation.mutateAsync({
            id,
            data: {
              groupIds: manageGroupsDialog.groupIds,
              updatedBy: 'admin'
            }
          })
        )
      )
      setToast({ open: true, message: 'Grupos atualizados com sucesso', severity: 'success' })
      setManageGroupsDialog(prev => ({ ...prev, open: false }))
    } catch (err) {
      setToast({ open: true, message: 'Erro ao atualizar grupos', severity: 'error' })
    }
  }

  const handleSaveAccess = async () => {
    if (manageAccessDialog.userIds.length === 0) return
    try {
      await Promise.all(
        manageAccessDialog.userIds.map(id =>
          updatePermissionsMutation.mutateAsync({
            id,
            data: {
              allowFeatures: manageAccessDialog.allowFeatures,
              deniedFeatures: manageAccessDialog.deniedFeatures,
              updatedBy: 'admin'
            }
          })
        )
      )
      setToast({ open: true, message: 'Permissões atualizadas com sucesso', severity: 'success' })
      setManageAccessDialog(prev => ({ ...prev, open: false }))
    } catch (err) {
      setToast({ open: true, message: 'Erro ao atualizar permissões', severity: 'error' })
    }
  }

  const openAddModal = () => {
    setModalMode('add')
    setSelectedUser(null)
    const initial = { login: '', fullName: '', email: '' }
    setFormValues(initial)
    setInitialFormValues(initial)
    setModalOpen(true)
  }

  const openEditModal = (user: UserRow) => {
    const canEditUser = hasPermission('erp:usuarios:editar')
    setModalMode(canEditUser ? 'edit' : 'view')
    setSelectedUser(user)
    const initial = {
      login: user.login,
      fullName: user.fullName,
      email: user.email,
    }
    setFormValues(initial)
    setInitialFormValues(initial)
    setModalOpen(true)
  }

  const handleSave = () => {
    if (modalMode === 'add') {
      handleCreateUser(formValues)
    } else if (modalMode === 'edit' && selectedUser) {
      handleUpdateUser(selectedUser.id, formValues)
    }
  }

  const isDirty = useMemo(() => {
    return JSON.stringify(formValues) !== JSON.stringify(initialFormValues)
  }, [formValues, initialFormValues])

  const tableColumns = useMemo<TableCardColumn<UserRow>[]>(() => [
    { key: 'login', label: 'Login' },
    { key: 'fullName', label: 'Nome Completo' },
    { key: 'email', label: 'E-mail' },
    {
      key: 'groupNames',
      label: 'Grupos de Acessos',
      render: (value, row) => {
        const groups = value as string[]
        const canEdit = hasPermission('erp:usuarios:editar')
        const content = (
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {(!groups || groups.length === 0) ? <span>-</span> : groups.map(g => <Chip key={g} label={g} size="small" variant="outlined" />)}
          </Stack>
        )

        if (!canEdit) return content

        return (
          <Box
            onClick={(e) => {
              e.stopPropagation()
              setManageGroupsDialog({
                open: true,
                userIds: [row.id],
                groupIds: row.groupIds || []
              })
            }}
            className="users-page__cell-clickable"
          >
            {content}
          </Box>
        )
      }
    },
    {
      key: 'allowFeatures',
      label: 'Permissões Concedidas',
      defaultHidden: true,
      render: (value, row) => {
        const feats = value as string[]
        const canEdit = hasPermission('erp:usuarios:editar')
        const content = (
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {(!feats || feats.length === 0) ? <span>-</span> : feats.map(f => (
              <Chip
                key={f}
                label={featureDictionary[f] || f}
                size="small"
                variant="outlined"
                color="success"
                className="users-page__chip"
              />
            ))}
          </Stack>
        )

        if (!canEdit) return content

        return (
          <Box
            onClick={(e) => {
              e.stopPropagation()
              setManageAccessDialog({
                open: true,
                userIds: [row.id],
                allowFeatures: row.allowFeatures || [],
                deniedFeatures: row.deniedFeatures || []
              })
            }}
            className="users-page__cell-clickable"
          >
            {content}
          </Box>
        )
      }
    },
    {
      key: 'deniedFeatures',
      label: 'Permissões Negadas',
      defaultHidden: true,
      render: (value, row) => {
        const feats = value as string[]
        const canEdit = hasPermission('erp:usuarios:editar')
        const content = (
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {(!feats || feats.length === 0) ? <span>-</span> : feats.map(f => (
              <Chip
                key={f}
                label={featureDictionary[f] || f}
                size="small"
                variant="outlined"
                color="error"
                className="users-page__chip"
              />
            ))}
          </Stack>
        )

        if (!canEdit) return content

        return (
          <Box
            onClick={(e) => {
              e.stopPropagation()
              setManageAccessDialog({
                open: true,
                userIds: [row.id],
                allowFeatures: row.allowFeatures || [],
                deniedFeatures: row.deniedFeatures || []
              })
            }}
            className="users-page__cell-clickable"
          >
            {content}
          </Box>
        )
      }
    },
  ], [featureDictionary, permissions])

  const rowActions: TableCardRowAction<UserRow>[] = useMemo(() => [
    {
      label: 'Ficha do Usuário',
      icon: <VisibilityOutlined fontSize="small" />,
      onClick: (row) => setDetailUser(row),
    },
    {
      label: 'Gerenciar Grupos',
      icon: <Groups2Outlined fontSize="small" />,
      onClick: (row) => setManageGroupsDialog({
        open: true,
        userIds: [row.id],
        groupIds: row.groupIds || []
      }),
      disabled: !hasPermission('erp:usuarios:editar')
    },
    {
      label: 'Permissões Específicas',
      icon: <SecurityOutlined fontSize="small" />,
      onClick: (row) => setManageAccessDialog({
        open: true,
        userIds: [row.id],
        allowFeatures: row.allowFeatures || [],
        deniedFeatures: row.deniedFeatures || []
      }),
      disabled: !hasPermission('erp:usuarios:editar')
    },
    {
      label: 'Resetar Senha',
      icon: <PasswordOutlined fontSize="small" />,
      onClick: (row) => handleResetPassword(row),
      disabled: !hasPermission('erp:usuarios:editar')
    },
  ], [permissions])

  const bulkActions: TableCardBulkAction<UserRow>[] = useMemo(() => [
    {
      label: 'Gerenciar Grupos',
      icon: <Groups2Outlined />,
      onClick: (ids) => {
        const selectedUsers = users.filter(u => ids.includes(u.id))
        let initialGroups: string[] = []
        if (selectedUsers.length === 1) {
          initialGroups = selectedUsers[0].groupIds || []
        }
        setManageGroupsDialog({
          open: true,
          userIds: ids as string[],
          groupIds: initialGroups
        })
      },
      disabled: (ids) => ids.length === 0 || !hasPermission('erp:usuarios:editar')
    },
    {
      label: 'Permissões Específicas',
      icon: <SecurityOutlined />,
      onClick: (ids) => {
        const selectedUsers = users.filter(u => ids.includes(u.id))
        let initialAllow: string[] = []
        let initialDenied: string[] = []
        if (selectedUsers.length === 1) {
          initialAllow = selectedUsers[0].allowFeatures || []
          initialDenied = selectedUsers[0].deniedFeatures || []
        }
        setManageAccessDialog({
          open: true,
          userIds: ids as string[],
          allowFeatures: initialAllow,
          deniedFeatures: initialDenied
        })
      },
      disabled: (ids) => ids.length === 0 || !hasPermission('erp:usuarios:editar')
    },
    {
      label: 'Resetar Senhas',
      icon: <PasswordOutlined />,
      onClick: (ids) => {
        ids.forEach(id => {
          const user = users.find(u => u.id === id)
          if (user) handleResetPassword(user)
        })
      },
      disabled: (ids) => ids.length === 0 || !hasPermission('erp:usuarios:editar')
    },
  ], [permissions, users])

  if (permissions.length > 0 && !hasPermission('erp:usuarios:listar')) {
    return (
      <Box className="users-page">
        <Typography variant="h6" align="center" className="users-page__no-access">
          Você não tem permissão para listar usuários
        </Typography>
      </Box>
    )
  }

  return (
    <Box className="users-page">
      <TableCard
        title="Usuários"
        columns={tableColumns}
        rows={users}
        loading={loading}
        onAddClick={hasPermission('erp:usuarios:criar') ? openAddModal : undefined}
        onRowClick={openEditModal}
        onDelete={hasPermission('erp:usuarios:excluir') ? (id) => handleDeleteUser(id as string) : undefined}
        onBulkDelete={hasPermission('erp:usuarios:excluir') ? handleBulkDelete : undefined}
        rowActions={rowActions}
        bulkActions={bulkActions}
        disableDelete={!hasPermission('erp:usuarios:excluir')}
        disableEdit={!hasPermission('erp:usuarios:editar')}
        disableView={!hasPermission('erp:usuarios:visualizar')}
      />

      {/* Main Modal */}
      <TableCardModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        title="Usuário"
        mode={modalMode}
        saving={createUserMutation.isPending || updateUserMutation.isPending}
        isDirty={isDirty}
        maxWidth="sm"
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <TextPicker
              label="Login"
              value={formValues.login || ''}
              onChange={(val) => setFormValues(prev => ({ ...prev, login: val }))}
              fullWidth
              required
              disabled={modalMode !== 'add'}
              placeholder="Username do sistema"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextPicker
              label="Nome Completo"
              value={formValues.fullName || ''}
              onChange={(val) => setFormValues(prev => ({ ...prev, fullName: val }))}
              fullWidth
              required
              disabled={modalMode === 'view'}
              placeholder="Ex: João Silva"
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <MailPicker
              label="E-mail"
              value={formValues.email || ''}
              onChange={(val) => setFormValues(prev => ({ ...prev, email: val }))}
              fullWidth
              required
              disabled={modalMode === 'view'}
              placeholder="usuario@email.com"
            />
          </Grid>
        </Grid>
      </TableCardModal>

      {/* Detail Dashboard Modal */}
      <TableCardModal
        open={!!detailUser}
        onClose={() => setDetailUser(null)}
        title="Ficha do Usuário"
        mode="view"
        maxWidth="md"
      >
        {detailUser && (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="overline" color="textSecondary">Informações Básicas</Typography>
              <Typography variant="body1"><strong>Login:</strong> {detailUser.login}</Typography>
              <Typography variant="body1"><strong>Nome:</strong> {detailUser.fullName}</Typography>
              <Typography variant="body1"><strong>E-mail:</strong> {detailUser.email}</Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="overline" color="textSecondary">Auditoria</Typography>
              <Typography variant="body1"><strong>Criado em:</strong> {new Date(detailUser.createdAt).toLocaleString()}</Typography>
              <Typography variant="body1"><strong>Criado por:</strong> {detailUser.createdBy}</Typography>
              <Typography variant="body1"><strong>Última Alt.:</strong> {new Date(detailUser.updatedAt).toLocaleString()}</Typography>
              <Typography variant="body1"><strong>Alt. por:</strong> {detailUser.updatedBy}</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="overline" color="textSecondary">Vínculos de Grupos</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" className="users-page__audit-stack">
                {(detailUser.groupNames || []).map(g => (
                  <Chip key={g} label={g} color="primary" variant="outlined" />
                ))}
              </Stack>
            </Grid>
          </Grid>
        )}
      </TableCardModal>

      {/* Manage Groups Dialog */}
      <TableCardModal
        open={manageGroupsDialog.open}
        onClose={() => setManageGroupsDialog(prev => ({ ...prev, open: false }))}
        onSave={handleSaveGroups}
        title="Gerenciar Grupos"
        mode="edit"
        saving={updateGroupsMutation.isPending}
        maxWidth="xs"
      >
        <Stack spacing={2} className="users-page__dialog-stack">
          <MultiSelectPicker
            label="Grupos de Acesso"
            options={groups}
            value={manageGroupsDialog.groupIds}
            onChange={(vals) => setManageGroupsDialog(prev => ({ ...prev, groupIds: vals as string[] }))}
            placeholder="Selecione os grupos"
          />
        </Stack>
      </TableCardModal>

      {/* Manage Specific Access Dialog */}
      <TableCardModal
        open={manageAccessDialog.open}
        onClose={() => setManageAccessDialog(prev => ({ ...prev, open: false }))}
        onSave={handleSaveAccess}
        title="Permissões Específicas"
        mode="edit"
        saving={updatePermissionsMutation.isPending}
        maxWidth="sm"
      >
        <Stack spacing={3} className="users-page__dialog-stack">
          <MultiSelectPicker
            label="Funcionalidades Permitidas"
            options={featureOptions}
            value={manageAccessDialog.allowFeatures}
            onChange={(vals) => setManageAccessDialog(prev => ({ ...prev, allowFeatures: vals as string[] }))}
            placeholder="Permitir mesmo sem grupo"
          />
          <MultiSelectPicker
            label="Funcionalidades Bloqueadas"
            options={featureOptions}
            value={manageAccessDialog.deniedFeatures}
            onChange={(vals) => setManageAccessDialog(prev => ({ ...prev, deniedFeatures: vals as string[] }))}
            placeholder="Bloquear mesmo com grupo"
          />
        </Stack>
      </TableCardModal>

      <Toast
        open={toast.open || Boolean(usersError)}
        message={toast.open ? toast.message : (usersError ? 'Erro ao carregar usuários' : '')}
        onClose={() => {
          setToast((prev) => ({ ...prev, open: false }))
        }}
        severity={toast.open ? toast.severity : 'error'}
      />
    </Box>
  )
}

export default UsersPage
