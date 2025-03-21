import { keyframes } from 'styled-components'; // version ^5.3.10

/**
 * Standardized transition durations to ensure consistent animation timing
 * across the Metronomics Platform.
 */
export const transitionDurations = {
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
};

/**
 * Standardized easing functions for different animation effects
 * to ensure consistent motion design throughout the application.
 */
export const transitionEasings = {
  standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Standard easing for most transitions
  accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)', // Accelerate - quick start and continuation
  decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)', // Decelerate - quick start, slow end
  sharp: 'cubic-bezier(0.4, 0.0, 0.6, 1)', // Sharp - quick acceleration and deceleration
  bounce: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', // Bounce - slight overshoot effect
};

/**
 * Standardized animation durations for keyframe animations
 * to maintain consistency across the application.
 */
export const animationDurations = {
  fast: '300ms',
  normal: '500ms',
  slow: '800ms',
};

/**
 * Helper function to create CSS transition strings with consistent format
 * @param properties - CSS properties to transition (single string or array)
 * @param duration - Transition duration (defaults to normal)
 * @param easing - Transition easing function (defaults to standard)
 * @param delay - Transition delay (defaults to 0ms)
 * @returns Formatted CSS transition string
 */
export const createTransition = (
  properties: string | string[],
  duration: string = transitionDurations.normal,
  easing: string = transitionEasings.standard,
  delay: string = '0ms',
): string => {
  const propertiesList = Array.isArray(properties) ? properties : [properties];
  return propertiesList
    .map((property) => `${property} ${duration} ${easing} ${delay}`)
    .join(', ');
};

/**
 * Fade in animation - gradually increases opacity from 0 to 1
 */
export const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

/**
 * Fade out animation - gradually decreases opacity from 1 to 0
 */
export const fadeOut = keyframes`
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
`;

/**
 * Slide in from bottom animation - moves element up while fading in
 */
export const slideInUp = keyframes`
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

/**
 * Slide in from top animation - moves element down while fading in
 */
export const slideInDown = keyframes`
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
`;

/**
 * Slide in from left animation - moves element right while fading in
 */
export const slideInLeft = keyframes`
  from {
    transform: translateX(-20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

/**
 * Slide in from right animation - moves element left while fading in
 */
export const slideInRight = keyframes`
  from {
    transform: translateX(20px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

/**
 * Pulse animation - gently scales element up and down to draw attention
 */
export const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

/**
 * Spin animation - rotates element 360 degrees (for loading indicators)
 */
export const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;