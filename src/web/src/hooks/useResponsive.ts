import { useState, useEffect, useCallback } from 'react'; // v18.2.0
import {
  getDeviceType,
  isMobile,
  isTablet,
  isDesktop,
  getViewportWidth,
  getViewportHeight,
  getResponsiveValue,
  DeviceType,
  ResponsiveValue
} from '../utils/helpers/responsiveHelper';

/**
 * A custom React hook that provides responsive design utilities for components,
 * allowing them to adapt to different screen sizes and device types.
 * 
 * This hook handles window resize events and provides:
 * - Current device type (mobile, tablet, desktop)
 * - Viewport dimensions
 * - Boolean flags for device type checks
 * - Helper function for responsive value selection
 * 
 * @returns An object containing responsive design utilities
 */
export const useResponsive = () => {
  // Initialize state with current viewport dimensions
  const [width, setWidth] = useState<number>(getViewportWidth());
  const [height, setHeight] = useState<number>(getViewportHeight());
  
  // Determine the current device type based on viewport width
  const [deviceType, setDeviceType] = useState<DeviceType>(getDeviceType(width));
  
  // Create a memoized resize handler to prevent unnecessary re-renders
  const handleResize = useCallback(() => {
    const newWidth = getViewportWidth();
    const newHeight = getViewportHeight();
    
    // Only update state if dimensions have changed
    if (newWidth !== width) {
      setWidth(newWidth);
      // Update device type when width changes
      setDeviceType(getDeviceType(newWidth));
    }
    
    if (newHeight !== height) {
      setHeight(newHeight);
    }
  }, [width, height]);
  
  // Set up resize event listener
  useEffect(() => {
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Initial update to ensure values are correct
    handleResize();
    
    // Clean up event listener on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);
  
  // Convenience boolean flags for device type checks
  const isMobileView = isMobile(width);
  const isTabletView = isTablet(width);
  const isDesktopView = isDesktop(width);
  
  // Helper function for getting responsive values based on current device
  const getResponsiveValueForCurrentDevice = <T>(values: ResponsiveValue<T>): T => {
    return getResponsiveValue(values, deviceType);
  };
  
  return {
    // Current device information
    deviceType,
    width,
    height,
    
    // Boolean flags for easy device type checking
    isMobileView,
    isTabletView,
    isDesktopView,
    
    // Helper function for responsive value selection
    getResponsiveValue: getResponsiveValueForCurrentDevice,
    
    // Expose the original helper functions for advanced use cases
    checkIsMobile: isMobile,
    checkIsTablet: isTablet,
    checkIsDesktop: isDesktop
  };
};

export default useResponsive;