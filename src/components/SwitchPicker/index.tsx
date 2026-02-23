import { Box, Switch, Typography } from '@mui/material'
import { type AccessMode } from '../Dashboard/DashboardBodyCard'
import { isHidden as checkIsHidden, isReadOnly as checkIsReadOnly } from '../../utils/accessControl'

type SwitchPickerProps = {
    label: string
    checked: boolean
    onChange: (checked: boolean) => void
    disabled?: boolean
    className?: string
    accessMode?: AccessMode
}

const SwitchPicker = ({
    label,
    checked,
    onChange,
    disabled = false,
    className = '',
    accessMode = 'full'
}: SwitchPickerProps) => {
    const isHidden = checkIsHidden(accessMode)
    const isReadOnly = checkIsReadOnly(accessMode)
    const finalDisabled = disabled || isReadOnly

    if (isHidden) return null

    const handleClick = () => {
        if (!finalDisabled) {
            onChange(!checked)
        }
    }

    return (
        <Box
            className={`switch-picker-container ${finalDisabled ? 'Mui-disabled' : ''} ${className}`}
            onClick={handleClick}
        >
            <Typography className="switch-picker-label">
                {label}
            </Typography>
            <Switch
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={finalDisabled}
                onClick={(e) => e.stopPropagation()}
                color="primary"
            />
        </Box>
    )
}

export default SwitchPicker
