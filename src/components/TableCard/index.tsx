import { useMemo, useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import type { AccessMode } from '../Dashboard/DashboardBodyCard'
export type { AccessMode }
import {
  isHidden as checkIsHidden,
  canEdit,
  canCreate,
  canDelete,
  canVisualizeItem,
} from '../../utils/accessControl'
import { useSearch } from '../../context/SearchContext'
import {
  Box,
  Menu,
  MenuItem,
  Stack,
  LinearProgress,
  Typography,
} from '@mui/material'
import {
  Delete,
  DeleteOutline,
  EditOutlined,
} from '@mui/icons-material'
import { useSearchParams } from 'react-router-dom'
import { TableCardModal } from '../Modals'
import Toast from '../Toast'

// Internal Hooks
import { useTableSettings } from './hooks/useTableSettings'
import { useTableSelection } from './hooks/useTableSelection'
import { useTableLocalEngine } from './hooks/useTableLocalEngine'
import { useTableForm } from './hooks/useTableForm'

// Internal Components
import { TableToolbar } from './components/TableToolbar'
import { TableControls } from './components/TableControls'
import { TablePagination } from './components/TablePagination'
import { CardView } from './components/CardView'
import { TableView } from './components/TableView'
import { TableBulkActions } from './components/TableBulkActions'
import { FormRenderer } from './components/FormRenderer'

import './style.css'

export type TableCardColumn<T extends TableCardRow> = {
  key: keyof T
  label: string
  dataType?: 'text' | 'number' | 'date' | 'status'
  render?: (value: any, row: T) => ReactNode
  defaultHidden?: boolean
}

export type TableCardFieldRenderProps<T extends TableCardRow> = {
  value: any
  onChange: (value: any) => void
  field: TableCardFormField<T>
  formValues: Partial<T>
  setFieldValue: (key: keyof T, value: any) => void
  disabled: boolean
  accessMode?: AccessMode
  fieldErrors?: Record<string, string>
}

export type TableCardFormField<T extends TableCardRow> = TableCardColumn<T> & {
  inputType?:
  | 'text' | 'number' | 'email' | 'password' | 'date' | 'select' | 'multiselect'
  options?: Array<{ label: string; value: any }>
  defaultValue?: any
  required?: boolean
  helperText?: string
  placeholder?: string
  disabled?: boolean
  isBlockEditor?: boolean
  renderInput?: (props: TableCardFieldRenderProps<T>) => ReactNode
}

export type TableCardRow = {
  id: string | number
  [key: string]: any
}

export type TableCardRowAction<T extends TableCardRow> = {
  label: string
  icon?: ReactNode
  onClick: (row: T) => void
  disabled?: boolean
  hidden?: boolean | ((row: T) => boolean)
}

export type TableCardBulkAction<T extends TableCardRow> = {
  label: string
  icon: ReactNode
  onClick: (selectedIds: T['id'][]) => void
  disabled?: boolean | ((selectedIds: T['id'][]) => boolean)
  hidden?: boolean
}

export type FetchDataParams = {
  page: number
  limit: number
  query: string
  filters: any
  sorts: any[]
}

type TableCardProps<T extends TableCardRow> = {
  title?: string
  columns: TableCardColumn<T>[]
  rows: T[]
  totalRows?: number
  onFetchData?: (params: FetchDataParams) => void
  onAdd?: (data: Partial<T>) => void | Promise<void | boolean> | boolean
  onEdit?: (id: T['id'], data: Partial<T>) => void | Promise<void | boolean> | boolean
  onDelete?: (id: T['id']) => void
  onBulkDelete?: (ids: T['id'][]) => void
  formFields?: TableCardFormField<T>[]
  rowActions?: TableCardRowAction<T>[]
  bulkActions?: TableCardBulkAction<T>[]
  disableDelete?: boolean
  disableEdit?: boolean
  disableView?: boolean
  onRowClick?: (row: T) => void
  onAddClick?: () => void
  loading?: boolean
  refreshTrigger?: any
  accessMode?: AccessMode
  fieldErrors?: Record<string, string>
  onDialogOpen?: () => void
  modalTitle?: string
  modalMaxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

const TableCard = <T extends TableCardRow>({
  title,
  columns,
  rows,
  totalRows,
  onFetchData,
  onAdd,
  onEdit,
  onDelete,
  onBulkDelete,
  formFields,
  rowActions,
  bulkActions,
  disableDelete = false,
  disableEdit = false,
  disableView = false,
  onRowClick,
  onAddClick,
  loading = false,
  refreshTrigger,
  accessMode = 'full',
  fieldErrors = {},
  onDialogOpen,
  modalTitle,
  modalMaxWidth,
}: TableCardProps<T>) => {
  const { query, activeFilters, activeSorts } = useSearch()
  const [searchParams, setSearchParams] = useSearchParams()

  // URL Params State
  const pageParam = parseInt(searchParams.get('p') || '1', 10)
  const limitParam = parseInt(searchParams.get('size') || '10', 10)

  const [currentPage, setCurrentPage] = useState(pageParam)
  const [rowsPerPage, setRowsPerPage] = useState(limitParam)
  const [customRows, setCustomRows] = useState(limitParam.toString())
  const [pageInput, setPageInput] = useState(pageParam.toString())
  const [isCustomMode, setIsCustomMode] = useState(![10, 25, 50, 100].includes(limitParam))

  // Sync internal state when URL changes
  useEffect(() => {
    setCurrentPage(pageParam)
    setPageInput(pageParam.toString())
    setRowsPerPage(limitParam)
    if (![10, 25, 50, 100].includes(limitParam)) {
      setCustomRows(limitParam.toString())
    }
  }, [pageParam, limitParam])

  // Debounced query for remote fetching
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 500)
    return () => clearTimeout(timer)
  }, [query])

  // Hooks
  const {
    density,
    setDensity,
    columnSettings,
    setColumnSettings,
    toggleColumnVisibility,
    changeColumnWidth
  } = useTableSettings({ title, columns })

  const { filteredRows } = useTableLocalEngine({
    rows,
    columns,
    query: debouncedQuery,
    activeFilters,
    activeSorts,
    onFetchData
  })

  const {
    selectedIds,
    allSelected,
    handleToggleSelectAll,
    handleToggleSelectRow,
    clearSelection,
  } = useTableSelection(filteredRows)

  const {
    dialog,
    formValues,
    initialFormValues,
    validationError,
    setValidationError,
    openDialog,
    closeDialog,
    handleFieldChange,
    handleSubmit,
    formSchema
  } = useTableForm({ formFields, columns, onAdd, onEdit, onDialogOpen })

  // Desktop Responsive Check
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table')
  useEffect(() => {
    const checkDesktop = () => {
      if (window.innerWidth >= 900) setViewMode('table')
      else setViewMode('card')
    }
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [])

  // Action Menu State
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [menuRow, setMenuRow] = useState<T | null>(null)
  const [isBulkDeleteArmed, setIsBulkDeleteArmed] = useState(false)
  const [isRowDeleteArmed, setIsRowDeleteArmed] = useState(false)
  const bulkDeleteTimeoutRef = useRef<any>(null)
  const rowDeleteTimeoutRef = useRef<any>(null)

  useEffect(() => {
    return () => {
      if (bulkDeleteTimeoutRef.current) clearTimeout(bulkDeleteTimeoutRef.current)
      if (rowDeleteTimeoutRef.current) clearTimeout(rowDeleteTimeoutRef.current)
    }
  }, [])

  // Column Metrics
  const effectiveColumns = useMemo(() => {
    return columnSettings
      .filter(s => s.visible)
      .map(s => {
        const col = columns.find(c => String(c.key) === s.key)
        return col ? { ...col, widthLevel: s.widthLevel } : null
      })
      .filter(Boolean) as (TableCardColumn<T> & { widthLevel: number })[]
  }, [columnSettings, columns])

  const [primaryColumn, ...secondaryColumns] = effectiveColumns
  const totalWidthUnits = useMemo(() => effectiveColumns.reduce((acc, col) => acc + (col.widthLevel || 2), 0), [effectiveColumns])

  // Pagination Logic
  const effectiveTotal = useMemo(() => onFetchData && totalRows !== undefined ? totalRows : filteredRows.length, [onFetchData, totalRows, filteredRows.length])
  const totalPages = useMemo(() => Math.ceil(effectiveTotal / rowsPerPage), [effectiveTotal, rowsPerPage])

  const handlePageChange = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages || 1))
    const params = new URLSearchParams(searchParams)
    params.set('p', String(validPage))
    setSearchParams(params)
    setCurrentPage(validPage)
  }, [totalPages, searchParams, setSearchParams])

  const handleRowsPerPageChange = useCallback((newSize: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('size', String(newSize))
    params.set('p', '1')
    setSearchParams(params)
    setRowsPerPage(newSize)
    setCurrentPage(1)
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) handlePageChange(totalPages)
  }, [totalPages, currentPage, handlePageChange])

  const paginatedRows = useMemo(() => {
    if (onFetchData) return rows
    const start = (currentPage - 1) * rowsPerPage
    return filteredRows.slice(start, start + rowsPerPage)
  }, [filteredRows, currentPage, rowsPerPage, onFetchData, rows])

  // Fetch Side Effect
  useEffect(() => {
    if (onFetchData) {
      onFetchData({
        page: currentPage,
        limit: rowsPerPage,
        query: debouncedQuery,
        filters: activeFilters,
        sorts: activeSorts,
      })
    }
  }, [onFetchData, currentPage, rowsPerPage, debouncedQuery, activeFilters, activeSorts, refreshTrigger])

  // Reset page when search or filters change
  const prevSearchRef = useRef({ query: debouncedQuery, filters: activeFilters, sorts: activeSorts })
  useEffect(() => {
    const prev = prevSearchRef.current
    const hasSearchChanged = prev.query !== debouncedQuery ||
      JSON.stringify(prev.filters) !== JSON.stringify(activeFilters) ||
      JSON.stringify(prev.sorts) !== JSON.stringify(activeSorts)

    if (hasSearchChanged) {
      handlePageChange(1)
      prevSearchRef.current = { query: debouncedQuery, filters: activeFilters, sorts: activeSorts }
    }
  }, [debouncedQuery, activeFilters, activeSorts, handlePageChange])

  // Action Handlers
  const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>, row: T) => {
    setAnchorEl(event.currentTarget); setMenuRow(row);
  }
  const handleCloseMenu = () => {
    setAnchorEl(null); setMenuRow(null);
    setIsRowDeleteArmed(false);
    if (rowDeleteTimeoutRef.current) clearTimeout(rowDeleteTimeoutRef.current);
  }

  const handleDeleteRow = () => {
    if (!menuRow || disableDelete) return;

    if (!isRowDeleteArmed) {
      setIsRowDeleteArmed(true);
      if (rowDeleteTimeoutRef.current) clearTimeout(rowDeleteTimeoutRef.current);
      rowDeleteTimeoutRef.current = setTimeout(() => setIsRowDeleteArmed(false), 3000);
      return;
    }

    if (rowDeleteTimeoutRef.current) clearTimeout(rowDeleteTimeoutRef.current);
    onDelete?.(menuRow.id);
    setIsRowDeleteArmed(false);
    handleCloseMenu();
  }

  const handleBulkDelete = () => {
    if (!isBulkDeleteArmed) {
      setIsBulkDeleteArmed(true);
      if (bulkDeleteTimeoutRef.current) clearTimeout(bulkDeleteTimeoutRef.current)
      bulkDeleteTimeoutRef.current = setTimeout(() => setIsBulkDeleteArmed(false), 3000)
      return
    }
    if (bulkDeleteTimeoutRef.current) clearTimeout(bulkDeleteTimeoutRef.current)
    onBulkDelete?.(selectedIds); clearSelection(); setIsBulkDeleteArmed(false);
  }

  const renderCell = (row: T, column: TableCardColumn<T>) => {
    const value = row[column.key]
    if (column.render) return column.render(value, row)
    if (column.dataType === 'date' && value) return new Date(value).toLocaleDateString()
    if (column.dataType === 'status') return <span className={`status-pill status-pill--${String(value).toLowerCase()}`}>{value}</span>
    return value ?? '--'
  }

  return (
    <Box className={`table-card table-card--density-${density}`}>
      <Stack spacing={2} className="table-card__stack-flex">
        <TableToolbar
          title={title}
          accessMode={accessMode}
          onAddClick={onAddClick}
          onAddEffect={() => openDialog('add')}
          canAdd={!!onAdd || !!onAddClick}
        >
          <TableControls
            viewMode={viewMode}
            setViewMode={setViewMode}
            density={density}
            setDensity={setDensity}
            columnSettings={columnSettings}
            toggleColumnVisibility={toggleColumnVisibility}
            changeColumnWidth={changeColumnWidth}
            reorderColumns={setColumnSettings}
            columns={columns}
          />
        </TableToolbar>

        <Box className="table-card__content">
          {checkIsHidden(accessMode) ? (
            <Box className="table-card__no-access">
              <Typography variant="body1" className="table-card__no-access-message" fontWeight={500}>Você não possui acesso para estes registros</Typography>
            </Box>
          ) : (
            <Box className={`table-card__content-wrapper ${loading ? 'table-card__content-wrapper--loading' : ''}`}>
              {viewMode === 'card' ? (
                <CardView
                  rows={paginatedRows}
                  selectedIds={selectedIds}
                  handleToggleSelectRow={handleToggleSelectRow}
                  disableView={disableView}
                  accessMode={accessMode}
                  onRowClick={onRowClick}
                  onEditEffect={(row) => openDialog('edit', row)}
                  primaryColumn={primaryColumn}
                  secondaryColumns={secondaryColumns}
                  handleOpenMenu={handleOpenMenu}
                  renderCell={renderCell}
                  showActionsButton={!!(rowActions && rowActions.length > 0) || !!onEdit || !!onDelete}
                />
              ) : (
                <TableView
                  rows={paginatedRows}
                  effectiveColumns={effectiveColumns}
                  totalWidthUnits={totalWidthUnits}
                  allSelected={allSelected}
                  handleToggleSelectAll={handleToggleSelectAll}
                  selectedIds={selectedIds}
                  handleToggleSelectRow={handleToggleSelectRow}
                  disableView={disableView}
                  accessMode={accessMode}
                  onRowClick={onRowClick}
                  onEditEffect={(row) => openDialog('edit', row)}
                  handleOpenMenu={handleOpenMenu}
                  renderCell={renderCell}
                  showActionsColumn={!!(rowActions && rowActions.length > 0) || !!onEdit || !!onDelete}
                />
              )}
              {loading && (
                <Box className="table-card__loading-overlay">
                  <LinearProgress className="table-card__loading-progress" />
                </Box>
              )}
            </Box>
          )}
        </Box>

        <TablePagination
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          effectiveTotal={effectiveTotal}
          totalPages={totalPages}
          handlePageChange={handlePageChange}
          handleRowsPerPageChange={handleRowsPerPageChange}
          isCustomMode={isCustomMode}
          setIsCustomMode={setIsCustomMode}
          customRows={customRows}
          setCustomRows={setCustomRows}
          pageInput={pageInput}
          setPageInput={setPageInput}
        />
      </Stack>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        {rowActions?.filter(action => {
          if (typeof action.hidden === 'function' && menuRow) {
            return !action.hidden(menuRow);
          }
          return !action.hidden;
        }).map((action) => (
          <MenuItem key={action.label} onClick={() => { if (menuRow) action.onClick(menuRow); handleCloseMenu(); }} disabled={action.disabled}>
            {action.icon && <span className="table-card__menu-icon-wrapper">{action.icon}</span>}{action.label}
          </MenuItem>
        ))}
        {onEdit && (
          <MenuItem onClick={() => { if (menuRow) openDialog('edit', menuRow); handleCloseMenu(); }} disabled={disableView || !canVisualizeItem(accessMode)}>
            <EditOutlined fontSize="small" className="table-card__menu-icon" />
            {canEdit(accessMode) && !disableEdit ? 'Editar' : 'Visualizar'}
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem
            onClick={handleDeleteRow}
            disabled={disableDelete || !canDelete(accessMode)}
            className="table-card__menu-item--error"
            title={isRowDeleteArmed ? 'Confirmar exclusão' : 'Excluir'}
          >
            {isRowDeleteArmed ? (
              <Delete fontSize="small" className="table-card__menu-icon table-card__menu-icon--error" />
            ) : (
              <DeleteOutline fontSize="small" className="table-card__menu-icon table-card__menu-icon--error" />
            )}
            {isRowDeleteArmed ? 'Confirmar exclusão' : 'Excluir'}
          </MenuItem>
        )}
      </Menu>

      <TableCardModal
        open={dialog.open}
        onClose={closeDialog}
        onSave={handleSubmit}
        title={modalTitle || title || 'registro'}
        mode={dialog.mode === 'add' ? 'add' : (canEdit(accessMode) && !disableEdit) ? 'edit' : 'view'}
        saving={loading}
        maxWidth={modalMaxWidth}
        isDirty={JSON.stringify(formValues) !== JSON.stringify(initialFormValues)}
        onConfirmDiscard={closeDialog}
        canSave={dialog.mode === 'add' ? canCreate(accessMode) : (canEdit(accessMode) && !disableEdit)}
      >
        {formSchema.map((field) => (
          <FormRenderer
            key={String(field.key)}
            field={field}
            formValues={formValues}
            handleFieldChange={handleFieldChange}
            accessMode={accessMode}
            mode={dialog.mode!}
            disableEdit={disableEdit}
            fieldErrors={fieldErrors}
          />
        ))}
      </TableCardModal>

      <TableBulkActions
        selectedIds={selectedIds}
        allSelected={allSelected}
        handleToggleSelectAll={handleToggleSelectAll}
        handleBulkDelete={handleBulkDelete}
        bulkActions={bulkActions}
        onBulkDelete={onBulkDelete}
        accessMode={accessMode}
        isBulkDeleteArmed={isBulkDeleteArmed}
        rowsLength={filteredRows.length}
      />

      <Toast open={Boolean(validationError)} message={validationError} onClose={() => setValidationError(null)} severity="error" />
    </Box>
  )
}

export default TableCard
