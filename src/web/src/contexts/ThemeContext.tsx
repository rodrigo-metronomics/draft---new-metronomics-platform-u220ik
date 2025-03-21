import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components'; // ^5.3.10
import { lightTheme, darkTheme, ThemeType } from '../styles/theme';
import { ThemeMode } from '../types/common.types';
import { useSettingsContext } from './SettingsContext';

// Storage key for theme preference
const THEME_STORAGE_KEY = 'theme';

/**
 * Interface defining the structure of the theme context value
 */
export interface ThemeContextType {
  theme: ThemeType;
  themeMode: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

/**
 * React context for theme state and methods
 */
export const ThemeContext = createContext<ThemeContextType | null>(null);

/**
 * Helper function to detect system theme preference
 * @returns 'light' or 'dark' based on system preference
 */
const getSystemTheme = (): 'light' | 'dark' => {
  // Check if window is defined (for SSR compatibility)
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
  }
  
  // Default to light if matchMedia is not available
  return 'light';
};

/**
 * Context provider component that manages theme state and provides theme context to children
 * 
 * @param {object} props - Component props
 * @param {ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component with theme context
 */
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Access settings context to get and update theme preferences
  const { settings, updateSettings } = useSettingsContext();
  const savedThemeMode = settings.theme;
  
  // Set up state for theme mode
  const [themeMode, setThemeMode] = useState<ThemeMode>(savedThemeMode);
  
  // Function to determine the actual theme object based on theme mode
  const getThemeByMode = (mode: ThemeMode): ThemeType => {
    if (mode === 'system') {
      return getSystemTheme() === 'dark' ? darkTheme : lightTheme;
    }
    return mode === 'dark' ? darkTheme : lightTheme;
  };
  
  // Set up effect to detect system theme changes
  useEffect(() => {
    if (themeMode !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Force re-render when system theme changes
    const handleChange = () => {
      // This will trigger a re-render
      setThemeMode('system');
    };
    
    // Add event listener with compatibility for older browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // For older browsers
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      // Clean up event listener with compatibility for older browsers
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        // For older browsers
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [themeMode]);
  
  // Function to update theme mode and persist in settings
  const setTheme = (mode: ThemeMode) => {
    setThemeMode(mode);
    updateSettings({ theme: mode });
  };
  
  // Function to toggle between light and dark modes
  const toggleTheme = () => {
    const newMode: ThemeMode = themeMode === 'light' || (themeMode === 'system' && getSystemTheme() === 'light') 
      ? 'dark' 
      : 'light';
    setTheme(newMode);
  };
  
  // Create context value object
  const contextValue: ThemeContextType = {
    theme: getThemeByMode(themeMode),
    themeMode,
    setTheme,
    toggleTheme,
  };
  
  // Memoize the active theme to prevent unnecessary re-renders
  const activeTheme = useMemo(() => getThemeByMode(themeMode), [themeMode]);
  
  return (
    <ThemeContext.Provider value={contextValue}>
      <StyledThemeProvider theme={activeTheme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook for accessing the ThemeContext within components
 * 
 * @returns {ThemeContextType} Theme context value
 * @throws {Error} If used outside of ThemeProvider
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};