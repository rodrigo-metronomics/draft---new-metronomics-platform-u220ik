/**
 * Defines responsive breakpoints and media queries for the Metronomics Platform.
 * Supports a mobile-first approach with standardized device size ranges for consistent responsive behavior.
 */

/**
 * Standard breakpoint sizes in pixels.
 * Following the mobile-first approach, these values represent the minimum width
 * at which the corresponding size class begins.
 */
export const breakpoints = {
  xs: '0px',     // Extra small devices
  sm: '576px',   // Small devices (mobile)
  md: '768px',   // Medium devices (tablets)
  lg: '992px',   // Large devices (desktops)
  xl: '1200px',  // Extra large devices
};

/**
 * Device category size ranges defining the minimum and maximum widths
 * for mobile, tablet, and desktop devices.
 * These align with the UI design requirements for consistent responsive behavior.
 */
export const deviceSizes = {
  mobile: {
    min: '0px',
    max: '575px',
  },
  tablet: {
    min: '576px',
    max: '991px',
  },
  desktop: {
    min: '992px',
    max: 'none',
  },
};

/**
 * Creates a media query string for use in styled-components.
 * 
 * @param breakpoint - The breakpoint value (e.g., '576px')
 * @returns Media query string for the specified breakpoint
 */
export const createMediaQuery = (breakpoint: string): string => {
  return `@media (min-width: ${breakpoint})`;
};

/**
 * Ready-to-use media query strings for styled-components.
 * 
 * Usage example:
 * ```
 * import styled from 'styled-components';
 * import { mediaQueries } from './breakpoints';
 * 
 * const ResponsiveComponent = styled.div`
 *   width: 100%;
 *   
 *   ${mediaQueries.sm} {
 *     width: 50%;
 *   }
 *   
 *   ${mediaQueries.lg} {
 *     width: 33%;
 *   }
 * `;
 * ```
 */
export const mediaQueries = {
  // Breakpoint-based queries (mobile-first approach)
  xs: createMediaQuery(breakpoints.xs),
  sm: createMediaQuery(breakpoints.sm),
  md: createMediaQuery(breakpoints.md),
  lg: createMediaQuery(breakpoints.lg),
  xl: createMediaQuery(breakpoints.xl),
  
  // Device-specific media queries
  mobile: `@media (max-width: ${deviceSizes.mobile.max})`,
  tablet: `@media (min-width: ${deviceSizes.tablet.min}) and (max-width: ${deviceSizes.tablet.max})`,
  desktop: `@media (min-width: ${deviceSizes.desktop.min})`,
};