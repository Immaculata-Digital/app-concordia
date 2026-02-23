import React from 'react';
import { Box, CircularProgress, Fade } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

interface DashboardContentProps {
    loading?: boolean;
    hasData?: boolean;
    children: React.ReactNode;
    sx?: SxProps<Theme>;
    p?: any;
    useSkeleton?: boolean;
}

/**
 * A standard container for dashboard content that manages loading states
 * without unmounting children, thus preserving scroll position.
 */
export const DashboardContent = ({
    loading = false,
    hasData = false,
    children,
    sx,
    p = 3,
    useSkeleton = false
}: DashboardContentProps) => {
    return (
        <Box sx={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
            {/* Initial load centered spinner */}
            {loading && !hasData && !useSkeleton && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Main content - kept mounted when loading if hasData is true OR if using skeletons */}
            {(hasData || (!loading && !hasData) || useSkeleton) && (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        overflow: 'auto',
                        p,
                        opacity: (loading && hasData && !useSkeleton) ? 0.7 : 1,
                        pointerEvents: (loading && hasData && !useSkeleton) ? 'none' : 'auto',
                        transition: 'opacity 0.2s ease-in-out',
                        ...(sx as any)
                    }}
                >
                    {children}
                </Box>
            )}

            {/* Small top-right spinner for refreshes */}
            {loading && hasData && !useSkeleton && (
                <Fade in={loading}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 24,
                            right: 24,
                            zIndex: 10,
                            bgcolor: 'background.paper',
                            borderRadius: '50%',
                            p: 1,
                            display: 'flex',
                            boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <CircularProgress size={20} thickness={4} />
                    </Box>
                </Fade>
            )}
        </Box>
    );
};
