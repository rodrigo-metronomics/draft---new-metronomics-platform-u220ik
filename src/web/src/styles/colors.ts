/**
 * Metronomics Platform UI Color System
 * 
 * This file defines the color palette and theme colors for the Metronomics Platform.
 * It provides a centralized location for all color-related constants to ensure
 * consistency across the application and support both light and dark themes.
 * 
 * The color system is designed to meet WCAG AA contrast requirements:
 * - 4.5:1 for normal text
 * - 3:1 for large text
 */

/**
 * Base color palette
 * Each color has shades from 50 (lightest) to 900 (darkest)
 */
export const colors = {
  // Basic colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Primary color - Blue
  primary: {
    50: '#e6f7ff',
    100: '#bae7ff',
    200: '#91d5ff',
    300: '#69c0ff',
    400: '#40a9ff',
    500: '#1890ff', // Main primary color
    600: '#096dd9',
    700: '#0050b3',
    800: '#003a8c',
    900: '#002766',
  },

  // Secondary color - Light Blue
  secondary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main secondary color
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Neutral color - Gray
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280', // Main neutral color
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Success color - Green
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Main success color
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },

  // Warning color - Amber
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main warning color
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Error color - Red
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Main error color
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Info color - Blue (similar to secondary but kept separate for semantic meaning)
  info: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9', // Main info color
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
};

/**
 * Theme-specific colors for light and dark modes
 * These map semantic color names to specific colors from the palette
 */
export const themeColors = {
  light: {
    // Background colors
    background: {
      primary: colors.white,
      secondary: colors.neutral[50],
      tertiary: colors.neutral[100],
    },
    // Text colors
    text: {
      primary: colors.neutral[900],
      secondary: colors.neutral[700],
      tertiary: colors.neutral[500],
      disabled: colors.neutral[400],
      inverse: colors.white,
    },
    // UI element colors
    surface: {
      default: colors.white,
      paper: colors.white,
      card: colors.white,
      dialog: colors.white,
      hover: colors.neutral[100],
      pressed: colors.neutral[200],
    },
    // Border colors
    border: {
      light: colors.neutral[200],
      default: colors.neutral[300],
      strong: colors.neutral[400],
    },
    // Action colors
    action: {
      active: colors.primary[600],
      hover: colors.primary[500],
      selected: colors.primary[100],
      disabled: colors.neutral[300],
      focus: alpha(colors.primary[500], 0.25),
    },
    // Overlay colors
    overlay: {
      light: alpha(colors.black, 0.05),
      default: alpha(colors.black, 0.2),
      heavy: alpha(colors.black, 0.5),
    },
  },
  dark: {
    // Background colors
    background: {
      primary: colors.neutral[900],
      secondary: colors.neutral[800],
      tertiary: colors.neutral[700],
    },
    // Text colors
    text: {
      primary: colors.neutral[50],
      secondary: colors.neutral[200],
      tertiary: colors.neutral[400],
      disabled: colors.neutral[500],
      inverse: colors.neutral[900],
    },
    // UI element colors
    surface: {
      default: colors.neutral[800],
      paper: colors.neutral[800],
      card: colors.neutral[800],
      dialog: colors.neutral[800],
      hover: colors.neutral[700],
      pressed: colors.neutral[600],
    },
    // Border colors
    border: {
      light: colors.neutral[700],
      default: colors.neutral[600],
      strong: colors.neutral[500],
    },
    // Action colors
    action: {
      active: colors.primary[400],
      hover: colors.primary[300],
      selected: colors.primary[800],
      disabled: colors.neutral[600],
      focus: alpha(colors.primary[400], 0.25),
    },
    // Overlay colors
    overlay: {
      light: alpha(colors.black, 0.1),
      default: alpha(colors.black, 0.4),
      heavy: alpha(colors.black, 0.7),
    },
  },
};

/**
 * Status colors for different states
 * Used for alerts, badges, notifications, etc.
 */
export const statusColors = {
  success: colors.success[500],
  warning: colors.warning[500],
  error: colors.error[500],
  info: colors.info[500],
};

/**
 * Metric-specific colors for data visualization
 */
export const metricColors = {
  positive: colors.success[500],
  negative: colors.error[500],
  neutral: colors.neutral[500],
  // A consistent color palette for charts
  chartColors: [
    colors.primary[500],
    colors.secondary[500],
    colors.success[500],
    colors.warning[500],
    colors.error[500],
    colors.info[600],
    colors.primary[700],
    colors.secondary[700],
    colors.success[700],
    colors.warning[700],
  ],
};

/**
 * Gradient definitions for backgrounds and UI elements
 */
export const gradients = {
  primary: `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[700]} 100%)`,
  secondary: `linear-gradient(135deg, ${colors.secondary[500]} 0%, ${colors.secondary[700]} 100%)`,
  success: `linear-gradient(135deg, ${colors.success[400]} 0%, ${colors.success[600]} 100%)`,
  warning: `linear-gradient(135deg, ${colors.warning[400]} 0%, ${colors.warning[600]} 100%)`,
  error: `linear-gradient(135deg, ${colors.error[400]} 0%, ${colors.error[600]} 100%)`,
};

/**
 * Utility function to add alpha transparency to a color
 * @param color - Hex color string
 * @param alpha - Alpha value between 0 and 1
 * @returns CSS rgba string
 */
export function alpha(color: string, value: number): string {
  // If color is transparent, return it as is
  if (color === 'transparent') return color;
  
  // Handle hex colors
  if (color.startsWith('#')) {
    // Convert hex to rgb
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${value})`;
  }
  
  // Handle rgba colors
  if (color.startsWith('rgba')) {
    // Extract rgb part and replace alpha
    return color.replace(/rgba\((.+),\s*[\d.]+\)/, `rgba($1, ${value})`);
  }
  
  // Handle rgb colors
  if (color.startsWith('rgb')) {
    // Convert to rgba
    return color.replace(/rgb/, 'rgba').replace(/\)/, `, ${value})`);
  }
  
  // If format is unknown, return original color
  return color;
}

/**
 * Utility function to darken a color by a percentage
 * @param color - Hex color string
 * @param percentage - Percentage to darken (0-100)
 * @returns Darkened hex color
 */
export function darken(color: string, percentage: number): string {
  // If color is transparent, return it as is
  if (color === 'transparent') return color;
  
  // Handle hex colors
  if (color.startsWith('#')) {
    // Convert hex to rgb
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);
    
    // Darken by reducing each component
    const factor = 1 - percentage / 100;
    r = Math.max(0, Math.floor(r * factor));
    g = Math.max(0, Math.floor(g * factor));
    b = Math.max(0, Math.floor(b * factor));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  // For non-hex colors, we'd need a more complex parser
  // For now, return the original color
  return color;
}

/**
 * Utility function to lighten a color by a percentage
 * @param color - Hex color string
 * @param percentage - Percentage to lighten (0-100)
 * @returns Lightened hex color
 */
export function lighten(color: string, percentage: number): string {
  // If color is transparent, return it as is
  if (color === 'transparent') return color;
  
  // Handle hex colors
  if (color.startsWith('#')) {
    // Convert hex to rgb
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);
    
    // Lighten by increasing each component
    const factor = percentage / 100;
    r = Math.min(255, Math.floor(r + (255 - r) * factor));
    g = Math.min(255, Math.floor(g + (255 - g) * factor));
    b = Math.min(255, Math.floor(b + (255 - b) * factor));
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  
  // For non-hex colors, we'd need a more complex parser
  // For now, return the original color
  return color;
}