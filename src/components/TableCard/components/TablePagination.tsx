import { Stack, Typography, Box, TextField, IconButton, Tooltip, Button } from '@mui/material'
import { FirstPage, KeyboardArrowLeft, KeyboardArrowRight, LastPage } from '@mui/icons-material'
import SelectPicker from '../../SelectPicker'

interface TablePaginationProps {
    currentPage: number
    rowsPerPage: number
    effectiveTotal: number
    totalPages: number
    handlePageChange: (page: number) => void
    handleRowsPerPageChange: (newSize: number) => void
    isCustomMode: boolean
    setIsCustomMode: (val: boolean) => void
    customRows: string
    setCustomRows: (val: string) => void
    pageInput: string
    setPageInput: (val: string) => void
}

export const TablePagination = ({
    currentPage,
    rowsPerPage,
    effectiveTotal,
    totalPages,
    handlePageChange,
    handleRowsPerPageChange,
    isCustomMode,
    setIsCustomMode,
    customRows,
    setCustomRows,
    pageInput,
    setPageInput,
}: TablePaginationProps) => {
    return (
        <Box className="table-card__pagination">
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={{ xs: 3, md: 2 }}
                alignItems="center"
                justifyContent="space-between"
                className="table-card__pagination-container"
            >
                {/* Left Section: Info & Rows Selection */}
                <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    alignItems="center"
                    spacing={{ xs: 2, sm: 3 }}
                    className="table-card__pagination-info-group table-card__pagination-info-wrapper"
                >
                    <Typography className="table-card__pagination-info">
                        Exibindo <Box component="span" className="table-card__pagination-highlight">{(currentPage - 1) * rowsPerPage + 1}</Box> a <Box component="span" className="table-card__pagination-highlight">{Math.min(currentPage * rowsPerPage, effectiveTotal)}</Box> de <Box component="span" className="table-card__pagination-text-highlight">{effectiveTotal}</Box>
                    </Typography>

                    <Stack direction="row" alignItems="center" spacing={1} className="table-card__pagination-control-group">
                        <Box className="table-card__pagination-select-wrapper">
                            <SelectPicker
                                fullWidth
                                value={isCustomMode ? 'custom' : rowsPerPage}
                                onChange={(val) => {
                                    if (val === 'custom') {
                                        setIsCustomMode(true)
                                    } else {
                                        setIsCustomMode(false)
                                        handleRowsPerPageChange(Number(val))
                                    }
                                }}
                                options={[
                                    { label: '10 / pág.', value: 10 },
                                    { label: '25 / pág.', value: 25 },
                                    { label: '50 / pág.', value: 50 },
                                    { label: '100 / pág.', value: 100 },
                                    { label: 'Personalizado', value: 'custom' }
                                ]}
                                searchable={false}
                                clearable={false}
                            />
                        </Box>

                        {isCustomMode && (
                            <Stack direction="row" alignItems="center" spacing={1} className="table-card__custom-limit">
                                <TextField
                                    size="small"
                                    type="number"
                                    value={customRows}
                                    onChange={(e) => setCustomRows(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = parseInt(customRows)
                                            if (!isNaN(val) && val > 0) handleRowsPerPageChange(val)
                                        }
                                    }}
                                    onBlur={() => { if (customRows === '') setCustomRows(rowsPerPage.toString()) }}
                                    placeholder="Qtd"
                                    className="table-card__custom-limit-input"
                                />
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => {
                                        const val = parseInt(customRows)
                                        if (!isNaN(val) && val > 0) handleRowsPerPageChange(val)
                                    }}
                                    className="table-card__custom-limit-btn"
                                >
                                    Aplicar
                                </Button>
                            </Stack>
                        )}
                    </Stack>
                </Stack>

                {/* Right Section: Navigation */}
                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    className="table-card__pagination-nav table-card__pagination-nav-wrapper"
                >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Tooltip title="Primeira página">
                            <span>
                                <IconButton size="small" disabled={currentPage <= 1} onClick={() => handlePageChange(1)} className="table-card__pagination-btn">
                                    <FirstPage fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Página anterior">
                            <span>
                                <IconButton size="small" disabled={currentPage <= 1} onClick={() => handlePageChange(currentPage - 1)} className="table-card__pagination-btn">
                                    <KeyboardArrowLeft fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Stack>

                    <Stack direction="row" alignItems="center" justifyContent="center" className="table-card__page-jump table-card__page-jump-wrapper">
                        <TextField
                            size="small"
                            value={pageInput}
                            onChange={(e) => {
                                setPageInput(e.target.value)
                                const val = parseInt(e.target.value)
                                if (!isNaN(val) && val > 0 && val <= totalPages) {
                                    handlePageChange(val)
                                }
                            }}
                            onBlur={() => setPageInput(currentPage.toString())}
                            className="table-card__page-input"
                            autoComplete="off"
                        />
                        <Typography variant="body2" className="table-card__total-pages-text">
                            / {totalPages}
                        </Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Tooltip title="Próxima página">
                            <span>
                                <IconButton size="small" disabled={currentPage >= totalPages} onClick={() => handlePageChange(currentPage + 1)} className="table-card__pagination-btn">
                                    <KeyboardArrowRight fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Última página">
                            <span>
                                <IconButton size="small" disabled={currentPage >= totalPages} onClick={() => handlePageChange(totalPages)} className="table-card__pagination-btn">
                                    <LastPage fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Stack>
                </Stack>
            </Stack>
        </Box>
    )
}
