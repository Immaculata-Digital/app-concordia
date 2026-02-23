import { Stack, type StackProps } from '@mui/material'
import React from 'react'
import { isHidden as checkIsHidden } from '../../utils/accessControl'

/**
 * A specialized Stack for Dashboard cards that automatically filters out hidden children
 * based on their accessMode prop. Use this in mobile layouts or single-column dashboard views.
 */
export const DashboardStack = ({ children, ...props }: StackProps) => {
    const filteredChildren = React.Children.toArray(children).filter(child => {
        if (React.isValidElement(child) && (child.props as any).accessMode) {
            return !checkIsHidden((child.props as any).accessMode)
        }
        return child !== null && child !== undefined && (typeof child !== 'boolean' || child === true)
    })

    if (filteredChildren.length === 0) return null

    return (
        <Stack {...props}>
            {filteredChildren}
        </Stack>
    )
}
