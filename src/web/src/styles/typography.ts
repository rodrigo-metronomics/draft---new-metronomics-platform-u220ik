import { css } from 'styled-components'; // ^5.3.10
import { breakpoints } from './breakpoints';

// Base font size to use for rem calculations
const baseFontSize = '16px';
const baseFontSizeValue = parseInt(baseFontSize, 10);

/**
 * Converts pixel values to rem units based on the base font size
 * 
 * @param pixelValue - The pixel value to convert to rem
 * @returns Converted rem value as a string with 'rem' unit
 */
export const remCalc = (pixelValue: number): string => {
  return `${pixelValue / baseFontSizeValue}rem`;
};

/**
 * Font family definitions for consistent typography across the application
 */
export const fontFamilies = {
  primary: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  secondary: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  mono: '"Roboto Mono", SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
};

/**
 * Standard font weights for consistent typography
 */
export const fontWeights = {
  light: 300,
  regular: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
};

/**
 * Standard font sizes in rem units
 */
export const fontSizes = {
  xs: remCalc(12),
  sm: remCalc(14),
  md: remCalc(16),
  lg: remCalc(18),
  xl: remCalc(20),
  xxl: remCalc(24),
  xxxl: remCalc(32),
};

/**
 * Standard line heights for consistent typography
 */
export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
};

/**
 * Standard letter spacing values
 */
export const letterSpacings = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
};

/**
 * Interface for text style configuration
 */
interface TextStyleConfig {
  fontSize?: string;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: string;
  textTransform?: string;
  fontFamily?: string;
  [key: string]: any;
}

/**
 * Interface for responsive text style configuration
 */
interface ResponsiveTextStyleConfig {
  base: TextStyleConfig;
  sm?: TextStyleConfig;
  md?: TextStyleConfig;
  lg?: TextStyleConfig;
  xl?: TextStyleConfig;
}

/**
 * Creates a responsive text style with different properties for different breakpoints
 * 
 * @param styleConfig - Configuration object with base styles and responsive overrides
 * @returns Styled-components CSS object with responsive text styles
 */
export const createResponsiveTextStyle = (styleConfig: ResponsiveTextStyleConfig) => {
  const { base, sm, md, lg, xl } = styleConfig;
  
  return css`
    font-size: ${base.fontSize || fontSizes.md};
    font-weight: ${base.fontWeight || fontWeights.regular};
    line-height: ${base.lineHeight || lineHeights.normal};
    letter-spacing: ${base.letterSpacing || letterSpacings.normal};
    font-family: ${base.fontFamily || fontFamilies.primary};
    ${base.textTransform && `text-transform: ${base.textTransform};`}

    ${sm && breakpoints.sm && css`
      @media (min-width: ${breakpoints.sm}) {
        ${sm.fontSize && `font-size: ${sm.fontSize};`}
        ${sm.fontWeight && `font-weight: ${sm.fontWeight};`}
        ${sm.lineHeight && `line-height: ${sm.lineHeight};`}
        ${sm.letterSpacing && `letter-spacing: ${sm.letterSpacing};`}
        ${sm.textTransform && `text-transform: ${sm.textTransform};`}
      }
    `}

    ${md && breakpoints.md && css`
      @media (min-width: ${breakpoints.md}) {
        ${md.fontSize && `font-size: ${md.fontSize};`}
        ${md.fontWeight && `font-weight: ${md.fontWeight};`}
        ${md.lineHeight && `line-height: ${md.lineHeight};`}
        ${md.letterSpacing && `letter-spacing: ${md.letterSpacing};`}
        ${md.textTransform && `text-transform: ${md.textTransform};`}
      }
    `}

    ${lg && breakpoints.lg && css`
      @media (min-width: ${breakpoints.lg}) {
        ${lg.fontSize && `font-size: ${lg.fontSize};`}
        ${lg.fontWeight && `font-weight: ${lg.fontWeight};`}
        ${lg.lineHeight && `line-height: ${lg.lineHeight};`}
        ${lg.letterSpacing && `letter-spacing: ${lg.letterSpacing};`}
        ${lg.textTransform && `text-transform: ${lg.textTransform};`}
      }
    `}

    ${xl && breakpoints.xl && css`
      @media (min-width: ${breakpoints.xl}) {
        ${xl.fontSize && `font-size: ${xl.fontSize};`}
        ${xl.fontWeight && `font-weight: ${xl.fontWeight};`}
        ${xl.lineHeight && `line-height: ${xl.lineHeight};`}
        ${xl.letterSpacing && `letter-spacing: ${xl.letterSpacing};`}
        ${xl.textTransform && `text-transform: ${xl.textTransform};`}
      }
    `}
  `;
};

/**
 * Predefined text styles for different typographic elements
 */
export const textStyles = {
  h1: createResponsiveTextStyle({
    base: {
      fontSize: fontSizes.xxxl,
      fontWeight: fontWeights.bold,
      lineHeight: lineHeights.tight,
      letterSpacing: letterSpacings.tight,
      fontFamily: fontFamilies.secondary,
    },
    sm: {
      fontSize: remCalc(36),
    },
    lg: {
      fontSize: remCalc(40),
    },
  }),

  h2: createResponsiveTextStyle({
    base: {
      fontSize: fontSizes.xxl,
      fontWeight: fontWeights.bold,
      lineHeight: lineHeights.tight,
      letterSpacing: letterSpacings.tight,
      fontFamily: fontFamilies.secondary,
    },
    sm: {
      fontSize: remCalc(28),
    },
    lg: {
      fontSize: remCalc(32),
    },
  }),

  h3: createResponsiveTextStyle({
    base: {
      fontSize: fontSizes.xl,
      fontWeight: fontWeights.semibold,
      lineHeight: lineHeights.tight,
      fontFamily: fontFamilies.secondary,
    },
    sm: {
      fontSize: remCalc(22),
    },
    lg: {
      fontSize: remCalc(24),
    },
  }),

  h4: createResponsiveTextStyle({
    base: {
      fontSize: fontSizes.lg,
      fontWeight: fontWeights.semibold,
      lineHeight: lineHeights.tight,
      fontFamily: fontFamilies.secondary,
    },
    lg: {
      fontSize: remCalc(20),
    },
  }),

  h5: createResponsiveTextStyle({
    base: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.semibold,
      lineHeight: lineHeights.tight,
      fontFamily: fontFamilies.secondary,
    },
  }),

  h6: createResponsiveTextStyle({
    base: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.semibold,
      lineHeight: lineHeights.tight,
      textTransform: 'uppercase',
      letterSpacing: letterSpacings.wide,
      fontFamily: fontFamilies.secondary,
    },
  }),

  body1: createResponsiveTextStyle({
    base: {
      fontSize: fontSizes.md,
      fontWeight: fontWeights.regular,
      lineHeight: lineHeights.normal,
    },
  }),

  body2: createResponsiveTextStyle({
    base: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.regular,
      lineHeight: lineHeights.normal,
    },
  }),

  caption: createResponsiveTextStyle({
    base: {
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.regular,
      lineHeight: lineHeights.normal,
    },
  }),

  button: createResponsiveTextStyle({
    base: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.tight,
      letterSpacing: letterSpacings.wide,
      textTransform: 'uppercase',
    },
  }),

  overline: createResponsiveTextStyle({
    base: {
      fontSize: fontSizes.xs,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.tight,
      letterSpacing: letterSpacings.wider,
      textTransform: 'uppercase',
    },
  }),

  label: createResponsiveTextStyle({
    base: {
      fontSize: fontSizes.sm,
      fontWeight: fontWeights.medium,
      lineHeight: lineHeights.tight,
    },
  }),
};