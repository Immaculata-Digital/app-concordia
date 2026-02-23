import React from 'react'
import { Dialog } from '@mui/material'
import { DashboardTopBar } from '../Dashboard/DashboardTopBar'
import { DashboardContent } from '../Dashboard/DashboardContent'

/**
 * DashboardModal Props
 * @property {boolean} open - Whether the modal is open
 * @property {() => void} onClose - Function to call when closing the modal
 * @property {string} title - The title of the dashboard
 * @property {boolean} loading - Whether the content is loading
 * @property {boolean} hasData - Whether there is data to display
 * @property {React.ReactNode} children - The content of the dashboard
 */
interface DashboardModalProps {
    open: boolean
    onClose: () => void
    title: string
    loading?: boolean
    hasData?: boolean
    useSkeleton?: boolean
    layoutKey?: string
    children: React.ReactNode
}

/**
 * DashboardModal Component
 * Encapsulates the generic part of a full-screen dashboard modal.
 * Follows system patterns for layout, styling, and transitions.
 */
export const DashboardModal = ({
    open,
    onClose,
    title,
    loading = false,
    hasData = true,
    useSkeleton = false,
    layoutKey,
    children
}: DashboardModalProps) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen
            PaperProps={{
                sx: {
                    bgcolor: 'var(--color-background)',
                    backgroundImage: 'none'
                }
            }}
        >
            <DashboardTopBar title={title} onClose={onClose} layoutKey={layoutKey} />
            <DashboardContent loading={loading} hasData={hasData} useSkeleton={useSkeleton} sx={{ pt: 1.5 }}>
                {children}
            </DashboardContent>
        </Dialog>
    )
}
