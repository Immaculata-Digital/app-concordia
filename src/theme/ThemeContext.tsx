import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ThemeProvider as MuiThemeProvider, StyledEngineProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import type { PaletteMode } from '@mui/material';
import { createAppTheme } from './index';

type ThemeMode = PaletteMode | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  resolvedMode: PaletteMode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // 1. Initialize mode from localStorage (using legacy key for continuity if available)
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('marshall-theme-mode');
    return (saved as ThemeMode) || 'system';
  });

  const [resolvedMode, setResolvedMode] = useState<PaletteMode>('light');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateMode = () => {
      const activeMode = mode === 'system' 
        ? (mediaQuery.matches ? 'dark' : 'light') 
        : mode;
      
      setResolvedMode(activeMode);
      
      // Update legacy class bridge and persistence
      const root = document.documentElement;
      if (activeMode === 'dark') {
        root.classList.add('theme-dark');
        root.style.setProperty('color-scheme', 'dark');
      } else {
        root.classList.remove('theme-dark');
        root.style.setProperty('color-scheme', 'light');
      }
    };

    updateMode();
    mediaQuery.addEventListener('change', updateMode);
    return () => mediaQuery.removeEventListener('change', updateMode);
  }, [mode]);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem('marshall-theme-mode', newMode);
  };

  // Re-create theme when resolvedMode changes
  const theme = useMemo(() => createAppTheme(resolvedMode), [resolvedMode]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, resolvedMode }}>
      <StyledEngineProvider injectFirst>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </MuiThemeProvider>
      </StyledEngineProvider>
    </ThemeContext.Provider>
  );
};
