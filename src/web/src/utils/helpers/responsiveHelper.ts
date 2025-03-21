import { breakpoints, deviceSizes } from '../../styles/breakpoints';

/**
 * Defines the possible device types for responsive design.
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Generic type for responsive values that can vary by device type.
 * Mobile value is required, while tablet and desktop values are optional fallbacks.
 */
export type ResponsiveValue<T> = {
  mobile: T;
  tablet?: T;
  desktop?: T;
};

/**
 * Parse pixel values from breakpoint strings for use in comparison operations
 */
const MOBILE_MAX = parseInt(deviceSizes.mobile.max.replace('px', ''));
const TABLET_MAX = parseInt(deviceSizes.tablet.max.replace('px', ''));

/**
 * Determines the current device type based on viewport width.
 * 
 * @param width - The viewport width in pixels
 * @returns The detected device type ('mobile', 'tablet', or 'desktop')
 */
export const getDeviceType = (width: number): DeviceType => {
  // Default to desktop if width is not provided
  if (width === undefined || width === null) {
    return 'desktop';
  }

  // Check against device size ranges
  if (width <= MOBILE_MAX) {
    return 'mobile';
  } else if (width <= TABLET_MAX) {
    return 'tablet';
  } else {
    return 'desktop';
  }
};

/**
 * Checks if the current viewport width falls within the mobile device range.
 * 
 * @param width - The viewport width in pixels
 * @returns True if the width is in the mobile range, false otherwise
 */
export const isMobile = (width: number): boolean => {
  if (width === undefined || width === null) {
    return false;
  }
  
  return width <= MOBILE_MAX;
};

/**
 * Checks if the current viewport width falls within the tablet device range.
 * 
 * @param width - The viewport width in pixels
 * @returns True if the width is in the tablet range, false otherwise
 */
export const isTablet = (width: number): boolean => {
  if (width === undefined || width === null) {
    return false;
  }
  
  return width > MOBILE_MAX && width <= TABLET_MAX;
};

/**
 * Checks if the current viewport width falls within the desktop device range.
 * 
 * @param width - The viewport width in pixels
 * @returns True if the width is in the desktop range, false otherwise
 */
export const isDesktop = (width: number): boolean => {
  if (width === undefined || width === null) {
    return true; // Default to desktop if width is not provided
  }
  
  return width > TABLET_MAX;
};

/**
 * Safely gets the current viewport width, handling server-side rendering scenarios.
 * 
 * @returns The current viewport width or 0 if window is not available
 */
export const getViewportWidth = (): number => {
  if (typeof window !== 'undefined') {
    return window.innerWidth;
  }
  return 0; // Return 0 for server-side rendering
};

/**
 * Safely gets the current viewport height, handling server-side rendering scenarios.
 * 
 * @returns The current viewport height or 0 if window is not available
 */
export const getViewportHeight = (): number => {
  if (typeof window !== 'undefined') {
    return window.innerHeight;
  }
  return 0; // Return 0 for server-side rendering
};

/**
 * Returns the appropriate value based on the current device type.
 * Follows a mobile-first approach with fallbacks to smaller device types
 * if a specific value is not provided.
 * 
 * @param values - Object containing values for different device types
 * @param deviceType - The current device type
 * @returns The value corresponding to the current device type, with fallbacks
 */
export const getResponsiveValue = <T>(values: ResponsiveValue<T>, deviceType: DeviceType): T => {
  if (deviceType === 'desktop') {
    // For desktop, try desktop value first, then tablet, then mobile as fallbacks
    return values.desktop !== undefined ? values.desktop : 
           (values.tablet !== undefined ? values.tablet : values.mobile);
  } else if (deviceType === 'tablet') {
    // For tablet, try tablet value first, then mobile as fallback
    return values.tablet !== undefined ? values.tablet : values.mobile;
  } else {
    // For mobile, always use mobile value
    return values.mobile;
  }
};