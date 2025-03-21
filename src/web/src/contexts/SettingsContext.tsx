import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getItemWithPrefix, setItemWithPrefix } from '../utils/helpers/localStorageHelper';
import { ThemeMode } from '../types/common.types';

// Storage key for settings in localStorage
const SETTINGS_STORAGE_KEY = 'settings';

/**
 * Interface defining the structure of application settings
 */
export interface Settings {
  theme: ThemeMode;
  language: string;
  notifications: {
    email: boolean;
    browser: boolean;
    mobile: boolean;
  };
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    reducedMotion: boolean;
  };
  calendar: {
    defaultView: 'day' | 'week' | 'month';
    startOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
    showWeekends: boolean;
  };
  dashboard: {
    defaultMetrics: string[]; // IDs of metrics to show by default
    refreshInterval: number; // in seconds
  };
}

/**
 * Default application settings
 */
const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  language: 'en',
  notifications: {
    email: true,
    browser: true,
    mobile: false,
  },
  accessibility: {
    fontSize: 'medium',
    highContrast: false,
    reducedMotion: false,
  },
  calendar: {
    defaultView: 'week',
    startOfWeek: 0, // Sunday
    showWeekends: true,
  },
  dashboard: {
    defaultMetrics: [],
    refreshInterval: 300, // 5 minutes
  },
};

/**
 * Interface defining the structure of the settings context value
 */
export interface SettingsContextType {
  settings: Settings;
  updateSettings: (updater: Partial<Settings> | ((prev: Settings) => Partial<Settings>)) => void;
  resetSettings: () => void;
}

/**
 * React context for settings state and methods
 */
export const SettingsContext = createContext<SettingsContextType | null>(null);

/**
 * Context provider component that manages application settings state and provides settings context to children
 * 
 * @param {object} props - Component props
 * @param {ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component with settings context
 */
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize settings state with default values
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedSettings = getItemWithPrefix(SETTINGS_STORAGE_KEY, null);
    if (savedSettings) {
      setSettings((prevSettings) => ({
        ...prevSettings,
        ...savedSettings,
      }));
    }
  }, []);

  /**
   * Updates specific settings and persists to localStorage
   * 
   * @param {Partial<Settings> | ((prev: Settings) => Partial<Settings>)} updater - 
   * Either a partial settings object or a function that returns partial settings
   */
  const updateSettings = (updater: Partial<Settings> | ((prev: Settings) => Partial<Settings>)) => {
    setSettings((prevSettings) => {
      // Allow function updates for computed values
      const updates = typeof updater === 'function' ? updater(prevSettings) : updater;
      
      // Create new settings by merging updates
      const newSettings = {
        ...prevSettings,
        ...updates,
      };
      
      // Save to localStorage
      setItemWithPrefix(SETTINGS_STORAGE_KEY, newSettings);
      
      return newSettings;
    });
  };

  /**
   * Resets all settings to default values
   */
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setItemWithPrefix(SETTINGS_STORAGE_KEY, DEFAULT_SETTINGS);
  };

  // Create context value object with settings state and methods
  const contextValue: SettingsContextType = {
    settings,
    updateSettings,
    resetSettings,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Custom hook for accessing the SettingsContext within components
 * 
 * @returns {SettingsContextType} Settings context value
 * @throws {Error} If used outside of SettingsProvider
 */
export const useSettingsContext = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  
  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  
  return context;
};