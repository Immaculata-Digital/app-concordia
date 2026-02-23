/**
 * Design Tokens mapping directly to HEX/RGB values.
 * This separates the visual identity from the implementation.
 */
export const tokens = {
  light: {
    primary: '#0A3D62',
    primaryDark: '#082d49',
    secondary: '#2D3436',
    text: '#2D3436',
    accent: '#F9CA24',
    background: '#F9FDFD',
    surface: '#F9FDFD',
    onPrimary: '#F9FDFD',
    onPrimaryMuted: 'rgba(249, 253, 253, 0.8)',
    onPrimarySoft: 'rgba(249, 253, 253, 0.1)',
    onSecondary: 'rgba(45, 52, 54, 0.72)',
    sidebarBg: '#F9FDFD',
    border: 'rgba(10, 61, 98, 0.14)',
    borderLight: 'rgba(10, 61, 98, 0.1)',
    borderLighter: 'rgba(10, 61, 98, 0.06)',
    hover: 'rgba(10, 61, 98, 0.06)',
    hoverStrong: 'rgba(10, 61, 98, 0.1)',
    shadow: 'rgba(10, 61, 98, 0.12)',
    shadowStrong: 'rgba(10, 61, 98, 0.2)',
    glass: {
      background: 'rgba(249, 253, 253, 0.72)',
      border: 'rgba(249, 253, 253, 0.4)',
      blur: 'blur(20px) saturate(180%)',
    },
  },
  dark: {
    primary: '#0A3D62',
    primaryDark: '#082d49',
    secondary: '#F9FDFD',
    text: '#F9FDFD',
    accent: '#F9CA24',
    background: '#041d2e',
    surface: '#05233a',
    onPrimary: '#F9FDFD',
    onPrimaryMuted: 'rgba(249, 253, 253, 0.8)',
    onPrimarySoft: 'rgba(249, 253, 253, 0.3)',
    onSecondary: 'rgba(249, 253, 253, 0.7)',
    sidebarBg: '#05233a',
    border: 'rgba(255, 255, 255, 0.12)',
    borderLight: 'rgba(255, 255, 255, 0.08)',
    borderLighter: 'rgba(255, 255, 255, 0.05)',
    hover: 'rgba(255, 255, 255, 0.08)',
    hoverStrong: 'rgba(255, 255, 255, 0.12)',
    shadow: 'rgba(0, 0, 0, 0.4)',
    shadowStrong: 'rgba(0, 0, 0, 0.6)',
    glass: {
      background: 'rgba(5, 35, 58, 0.72)',
      border: 'rgba(255, 255, 255, 0.1)',
      blur: 'blur(20px) saturate(180%)',
    },
  },
  typography: {
    fontTitle: "'Poppins', sans-serif",
    fontBody: "'Poppins', system-ui, -apple-system, blinkmacsystemfont, 'Segoe UI', sans-serif",
    fontContract: "'Times New Roman', Times, serif",
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.8125rem',  // 13px (Preferred for dense UIs)
      md: '0.875rem',   // 14px (Standard Body)
      lg: '1rem',       // 16px
      xl: '1.25rem',    // 20px
      xxl: '1.5rem',    // 24px
      display: '2rem',  // 32px
    }
  },
  shapes: {
    borderRadius: 8,
  },
};
