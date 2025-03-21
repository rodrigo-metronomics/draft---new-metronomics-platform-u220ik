/**
 * Theme Configuration - Metronomics Platform
 * 
 * This file defines the theme configuration for the Metronomics Platform,
 * providing a comprehensive theme object that integrates colors, typography,
 * spacing, shadows, and other design tokens. The theme supports both light and dark modes
 * and ensures consistent styling across the application.
 * 
 * The theme structure extends the DefaultTheme from styled-components and
 * can be accessed in styled components using the ThemeProvider.
 * 
 * Usage example:
 * ```
 * import { ThemeProvider } from 'styled-components';
 * import { lightTheme, darkTheme } from './styles/theme';
 * 
 * function App() {
 *   const [isDarkMode, setIsDarkMode] = useState(false);
 *   const theme = isDarkMode ? darkTheme : lightTheme;
 *   
 *   return (
 *     <ThemeProvider theme={theme}>
 *       <YourApp />
 *     </ThemeProvider>
 *   );
 * }
 * ```
 */

import { DefaultTheme } from 'styled-components'; // ^5.3.10
import { 
  colors, 
  themeColors, 
  statusColors, 
  metricColors, 
  gradients 
} from './colors';
import { 
  fontFamilies, 
  fontSizes, 
  fontWeights, 
  lineHeights, 
  letterSpacings, 
  textStyles 
} from './typography';
import { 
  breakpoints, 
  mediaQueries 
} from './breakpoints';
import { 
  transitionDurations, 
  transitionEasings, 
  animationDurations 
} from './animations';
import { 
  flexCenter, 
  flexBetween, 
  cardStyle, 
  focusOutline,
  boxShadow
} from './mixins';

/**
 * Global spacing values used throughout the application
 * Follows an 8-point grid system (except for xs which is 4px)
 */
const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem',  // 8px
  md: '1rem',    // 16px
  lg: '1.5rem',  // 24px
  xl: '2rem',    // 32px
  xxl: '3rem',   // 48px
};

/**
 * Global border radius values for consistent UI elements
 */
const borderRadius = {
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  round: '50%',
};

/**
 * Global z-index values to manage component stacking order
 */
const zIndices = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
};

/**
 * Comprehensive theme type definition that extends styled-components DefaultTheme
 * This provides TypeScript support and autocomplete for theme properties
 */
export interface ThemeType extends DefaultTheme {
  colors: {
    // Base color palette
    palette: typeof colors;
    // Theme specific colors
    background: typeof themeColors.light.background | typeof themeColors.dark.background;
    text: typeof themeColors.light.text | typeof themeColors.dark.text;
    surface: typeof themeColors.light.surface | typeof themeColors.dark.surface;
    border: typeof themeColors.light.border | typeof themeColors.dark.border;
    action: typeof themeColors.light.action | typeof themeColors.dark.action;
    overlay: typeof themeColors.light.overlay | typeof themeColors.dark.overlay;
    // Status colors
    status: typeof statusColors;
    // Metric colors
    metrics: typeof metricColors;
    // Gradients
    gradients: typeof gradients;
  };
  typography: {
    fontFamilies: typeof fontFamilies;
    fontSizes: typeof fontSizes;
    fontWeights: typeof fontWeights;
    lineHeights: typeof lineHeights;
    letterSpacings: typeof letterSpacings;
    textStyles: typeof textStyles;
  };
  spacing: typeof spacing;
  breakpoints: typeof breakpoints;
  mediaQueries: typeof mediaQueries;
  borderRadius: typeof borderRadius;
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  transitions: {
    durations: typeof transitionDurations;
    easings: typeof transitionEasings;
    animations: typeof animationDurations;
    create: (properties: string | string[], duration?: string, easing?: string, delay?: string) => string;
  };
  zIndices: typeof zIndices;
  mixins: {
    flexCenter: typeof flexCenter;
    flexBetween: typeof flexBetween;
    cardStyle: typeof cardStyle;
    focusOutline: typeof focusOutline;
    boxShadow: typeof boxShadow;
  };
}

/**
 * Helper function to create a consistent theme object with all required properties
 * 
 * @param mode - Theme mode ('light' or 'dark')
 * @returns A complete theme object with all required properties
 */
export const createTheme = (mode: 'light' | 'dark'): ThemeType => {
  // Select the appropriate theme colors based on mode
  const themeSpecificColors = themeColors[mode];
  
  return {
    colors: {
      palette: colors,
      ...themeSpecificColors,
      status: statusColors,
      metrics: metricColors,
      gradients: gradients,
    },
    typography: {
      fontFamilies,
      fontSizes,
      fontWeights,
      lineHeights,
      letterSpacings,
      textStyles,
    },
    spacing,
    breakpoints,
    mediaQueries,
    borderRadius,
    shadows: {
      sm: boxShadow('sm'),
      md: boxShadow('md'),
      lg: boxShadow('lg'),
      xl: boxShadow('xl'),
    },
    transitions: {
      durations: transitionDurations,
      easings: transitionEasings,
      animations: animationDurations,
      create: (
        properties: string | string[],
        duration: string = transitionDurations.normal,
        easing: string = transitionEasings.standard,
        delay: string = '0ms',
      ): string => {
        const propertiesList = Array.isArray(properties) ? properties : [properties];
        return propertiesList
          .map((property) => `${property} ${duration} ${easing} ${delay}`)
          .join(', ');
      },
    },
    zIndices,
    mixins: {
      flexCenter,
      flexBetween,
      cardStyle,
      focusOutline,
      boxShadow,
    },
  };
};

/**
 * Light theme configuration for the application
 */
export const lightTheme = createTheme('light');

/**
 * Dark theme configuration for the application
 */
export const darkTheme = createTheme('dark');

/**
 * Default theme (light) for the application
 */
export const defaultTheme = lightTheme;