import { createTheme, type ThemeOptions, type PaletteMode } from '@mui/material/styles';
import { tokens } from './tokens';
import { getContrastText } from '../utils/colorUtils';

/**
 * MUI Theme Configuration
 */

export const getThemeOptions = (mode: PaletteMode): ThemeOptions => {
  const t = mode === 'dark' ? tokens.dark : tokens.light;

  return {
    palette: {
      mode,
      primary: {
        main: t.primary,
        dark: t.primaryDark,
        contrastText: getContrastText(t.primary),
      },
      secondary: {
        main: t.secondary,
      },
      background: {
        default: t.background,
        paper: t.surface,
      },
      text: {
        primary: t.text,
        secondary: t.onSecondary,
      },
      divider: t.borderLighter,
      action: {
        hover: t.hover,
        selected: t.hoverStrong,
      },
    },
    typography: {
      fontFamily: tokens.typography.fontBody,
      h1: { fontFamily: tokens.typography.fontTitle, fontWeight: 700, letterSpacing: '-0.02em' },
      h2: { fontFamily: tokens.typography.fontTitle, fontWeight: 700, letterSpacing: '-0.01em' },
      h3: { fontFamily: tokens.typography.fontTitle, fontWeight: 600, letterSpacing: '-0.01em' },
      h4: { fontFamily: tokens.typography.fontTitle, fontWeight: 600 },
      h5: { fontFamily: tokens.typography.fontTitle, fontWeight: 600 },
      h6: { fontFamily: tokens.typography.fontTitle, fontWeight: 600 },
      subtitle1: { fontWeight: 600, letterSpacing: '-0.01em' },
      body1: { fontSize: '0.95rem', lineHeight: 1.5 },
      body2: { fontSize: '0.875rem', lineHeight: 1.5 },
      button: { 
        textTransform: 'none', 
        fontWeight: 600,
        fontSize: '0.875rem',
        fontFamily: tokens.typography.fontBody 
      },
      caption: {
        fontSize: '0.75rem',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        fontWeight: 700,
      },
    },
    shape: {
      borderRadius: tokens.shapes.borderRadius,
    },
    // Standardized Z-Index Scale (Material Design)
    zIndex: {
      mobileStepper: 1000,
      fab: 1050,
      speedDial: 1050,
      appBar: 1100,
      drawer: 1200,
      modal: 1300,
      snackbar: 1400,
      tooltip: 1500,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: 'background-color 0.3s ease, color 0.3s ease',
            backgroundColor: t.background,
            color: t.text,
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 8,
            paddingLeft: '20px',
            paddingRight: '20px',
            height: '54px',
            fontFamily: tokens.typography.fontBody,
            fontWeight: 600,
            fontSize: '0.875rem',
            '&.Mui-disabled': {
              backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
              color: mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)',
              cursor: 'not-allowed',
              pointerEvents: 'auto',
            },
          },
          containedPrimary: {
            backgroundColor: t.primary,
            color: t.onPrimary,
            '&:hover': {
              backgroundColor: t.primaryDark,
            },
            '&.MuiButton-root.Mui-disabled': {
              backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
              color: mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.26)',
              cursor: 'not-allowed',
              pointerEvents: 'auto',
            },
          },
          outlinedPrimary: {
            borderColor: t.primary,
            color: t.onSecondary,
            '&:hover': {
              borderColor: t.primary,
              backgroundColor: t.hover,
              color: t.primary,
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&:hover': {
              backgroundColor: t.hover,
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            minWidth: '36px',
            color: t.onSecondary,
            '.Mui-selected &': {
              color: t.primary,
            },
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            '&.Mui-checked': {
              color: t.primary,
            },
            '&.MuiCheckbox-indeterminate': {
              color: t.primary,
            },
          },
        },
      },
      MuiRadio: {
        styleOverrides: {
          root: {
            '&.Mui-checked': {
              color: t.primary,
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '15px',
            color: t.onSecondary,
            '&.Mui-focused': {
              color: t.primary,
            },
          },
          outlined: {
            transform: 'translate(14px, 15px) scale(1)',
            '&.MuiInputLabel-shrink': {
              transform: 'translate(14px, -9px) scale(0.75)',
            },
            '&.MuiInputLabel-sizeSmall': {
              transform: 'translate(14px, 9.5px) scale(1)',
              '&.MuiInputLabel-shrink': {
                transform: 'translate(14px, -8px) scale(0.75)',
              },
            },
          },
        },
        variants: [
          {
            props: { color: 'info' },
            style: {
              color: 'rgba(255, 255, 255, 0.7)',
              '&.Mui-focused': {
                color: 'white',
              },
            },
          }
        ],
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: tokens.shapes.borderRadius,
            fontSize: '15px',
            backgroundColor: 'transparent',
            height: '54px',
            '&.MuiInputBase-multiline': {
              height: 'auto',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderWidth: '1px',
              borderColor: t.border,
              transition: 'border-color 0.2s ease',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: t.borderLight,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: t.primary,
              borderWidth: '2px',
            },
            '&.Mui-disabled': {
              backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: t.borderLighter,
              },
            },
          },
          input: {
            padding: '0 16px',
            height: '100%',
            boxSizing: 'border-box',
            '&:-webkit-autofill': {
              WebkitBoxShadow: mode === 'dark' ? '0 0 0 100px #262626 inset' : '0 0 0 100px #ffffff inset',
              WebkitTextFillColor: t.text,
              caretColor: t.text,
              borderRadius: 'inherit',
            },
            '&.Mui-disabled': {
              WebkitTextFillColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.45)' : 'rgba(18, 18, 18, 0.45)',
            },
          },
        },
        variants: [
          {
            props: { color: 'info' },
            style: {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              color: 'white',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.3)',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgba(255, 255, 255, 0.5)',
              },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'white',
              },
              '& .MuiInputBase-input::placeholder': {
                color: 'rgba(255, 255, 255, 0.7)',
                opacity: 1,
              },
            },
          }
        ],
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            height: '54px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            boxSizing: 'border-box',
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            fontSize: '13px',
            marginTop: '4px',
            marginLeft: '4px',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${t.borderLighter}`,
            padding: '12px 16px',
            color: t.text,
          },
          head: {
            backgroundColor: mode === 'dark' ? '#262626' : t.surface,
            color: mode === 'dark' ? '#FFFFFF' : t.text,
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          },
          stickyHeader: {
            backgroundColor: t.surface,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: t.glass.background,
            backdropFilter: t.glass.blur,
            WebkitBackdropFilter: t.glass.blur,
            borderRight: `1px solid ${t.glass.border}`,
            borderLeft: 'none',
            borderRadius: 0,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: t.glass.background,
            backdropFilter: t.glass.blur,
            WebkitBackdropFilter: t.glass.blur,
            borderBottom: `1px solid ${t.glass.border}`,
            color: t.text,
            boxShadow: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: tokens.shapes.borderRadius,
            border: `1px solid ${t.border}`,
            transition: 'box-shadow 0.3s ease, transform 0.3s ease',
          },
        },
        variants: [
          {
            props: { variant: 'glass' as any },
            style: {
              background: t.glass.background,
              backdropFilter: t.glass.blur,
              WebkitBackdropFilter: t.glass.blur,
              border: `1px solid ${t.glass.border}`,
              boxShadow: mode === 'dark' 
                ? '0 8px 32px 0 rgba(0, 0, 0, 0.36)' 
                : '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
            },
          },
        ],
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            width: 52,
            height: 32,
            padding: 0,
            display: 'flex',
          },
          switchBase: {
            padding: 0,
            margin: 0,
            top: 0,
            left: 0,
            transform: 'translate(8px, 8px)',
            transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            '&.Mui-checked': {
              transform: 'translate(24px, 4px)',
              color: '#fff',
              '& + .MuiSwitch-track': {
                backgroundColor: t.primary,
                opacity: 1,
                border: 0,
              },
              '& .MuiSwitch-thumb': {
                width: 24,
                height: 24,
              },
            },
          },
          thumb: {
            width: 16,
            height: 16,
            boxShadow: 'none',
            transition: 'all 0.2s ease',
          },
          track: {
            borderRadius: 16,
            opacity: 1,
            backgroundColor: t.borderLight,
            transition: 'background-color 0.2s ease',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '8px 16px',
            fontWeight: 500,
            color: '#fff',
            '& .MuiAlert-icon': {
              color: '#fff',
              opacity: 0.9,
            },
            '& .MuiAlert-message': {
              padding: '8px 0',
            },
            '& .MuiAlert-action': {
              paddingTop: 0,
              paddingBottom: 0,
              marginRight: -8,
              color: '#fff',
            },
          },
          standardError: {
            backgroundColor: '#d32f2f',
            boxShadow: '0 8px 24px rgb(211 47 47 / 25%)',
            color: '#fff',
          },
          standardSuccess: {
            backgroundColor: '#2e7d32',
            boxShadow: '0 8px 24px rgb(46 125 50 / 25%)',
            color: '#fff',
          },
          standardWarning: {
            backgroundColor: '#ed6c02',
            boxShadow: '0 8px 24px rgb(237 108 2 / 25%)',
            color: '#fff',
          },
          standardInfo: {
            backgroundColor: t.primary,
            color: t.onPrimary,
            '& .MuiAlert-icon': { color: t.onPrimary },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 28,
            boxShadow: '0 24px 48px rgb(0 0 0 / 20%)',
            background: t.glass.background,
            backdropFilter: t.glass.blur,
            WebkitBackdropFilter: t.glass.blur,
            border: `1px solid ${t.glass.border}`,
            overflow: 'hidden',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: '20px',
            fontWeight: 600,
            letterSpacing: '-0.01em',
            padding: '24px 24px 16px',
            borderBottom: 'none',
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            padding: '24px',
            '& > *:first-child': {
              marginTop: 0,
            },
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: '16px 24px 24px',
            gap: 8,
            borderTop: 'none',
            '& .MuiButton-root': {
              borderRadius: 10,
              boxShadow: 'none',
            },
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: t.text,
            '&:hover': {
              backgroundColor: t.hover,
            },
            '&.Mui-selected': {
              backgroundColor: t.hoverStrong,
              '&:hover': {
                backgroundColor: t.hoverStrong,
              },
            },
            '&.Mui-disabled': {
              color: t.onSecondary,
              opacity: 0.5,
              pointerEvents: 'none',
              '& .MuiTypography-root': {
                color: t.onSecondary,
              },
              '& .MuiSvgIcon-root': {
                color: t.onSecondary,
              },
            },
            '& .MuiSvgIcon-root': {
              color: t.text,
              minWidth: '36px',
            },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            background: t.glass.background,
            backdropFilter: t.glass.blur,
            WebkitBackdropFilter: t.glass.blur,
            border: `1px solid ${t.glass.border}`,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: mode === 'dark' 
              ? 'linear-gradient(165deg, #282828, #1e1e1e)' 
              : 'linear-gradient(165deg, #ffffff, #fcfcfc)',
            boxShadow: mode === 'dark'
              ? '0 4px 20px rgba(0, 0, 0, 0.4)'
              : '0 2px 4px rgba(0, 0, 0, 0.04), 0 8px 16px rgba(0, 0, 0, 0.06)',
            '&:hover': {
              boxShadow: mode === 'dark'
                ? '0 8px 32px rgba(0, 0, 0, 0.6)'
                : '0 8px 32px rgba(0, 0, 0, 0.08)',
              transform: 'translateY(-4px)',
            },
          },
        },
      },
    },
  };
};

export const createAppTheme = (mode: PaletteMode) => {
  return createTheme(getThemeOptions(mode));
};
