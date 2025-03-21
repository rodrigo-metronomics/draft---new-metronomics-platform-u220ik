import { css } from 'styled-components'; // version ^5.3.10
import { colors, themeColors } from './colors';
import { breakpoints, mediaQueries } from './breakpoints';
import { transitionDurations, transitionEasings } from './animations';

/**
 * Creates a CSS transition string with standardized duration and easing
 * @param properties - CSS properties to transition (e.g., 'all', 'opacity', 'transform')
 * @param duration - Duration name from transitionDurations (e.g., 'fast', 'normal', 'slow')
 * @param easing - Easing name from transitionEasings (e.g., 'standard', 'accelerate')
 * @returns Formatted CSS transition property string
 */
export const transition = (
  properties: string,
  duration: keyof typeof transitionDurations = 'normal',
  easing: keyof typeof transitionEasings = 'standard'
): string => {
  return `${properties} ${transitionDurations[duration]} ${transitionEasings[easing]}`;
};

/**
 * Creates a CSS box-shadow with standardized elevation levels
 * @param level - Elevation level (sm, md, lg, xl)
 * @returns CSS box-shadow value for the specified elevation level
 */
export const boxShadow = (level: 'sm' | 'md' | 'lg' | 'xl'): string => {
  const shadows = {
    sm: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.08)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
  };
  
  return shadows[level];
};

/**
 * CSS mixin for centering content with flexbox (both horizontally and vertically)
 */
export const flexCenter = css`
  display: flex;
  align-items: center;
  justify-content: center;
`;

/**
 * CSS mixin for aligning content with space-between using flexbox
 */
export const flexBetween = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

/**
 * CSS mixin for creating a column-oriented flex container
 */
export const flexColumn = css`
  display: flex;
  flex-direction: column;
`;

/**
 * CSS mixin for creating a row-oriented flex container
 */
export const flexRow = css`
  display: flex;
  flex-direction: row;
`;

/**
 * CSS mixin for consistent card styling across the application
 */
export const cardStyle = css`
  background-color: ${themeColors.light.surface.card};
  border-radius: 8px;
  box-shadow: ${boxShadow('sm')};
  padding: 16px;
  transition: ${transition('box-shadow', 'fast')};
  
  &:hover {
    box-shadow: ${boxShadow('md')};
  }
`;

/**
 * CSS mixin for accessible focus outlines on interactive elements
 */
export const focusOutline = css`
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${themeColors.light.action.focus};
  }
  
  &:focus:not(:focus-visible) {
    box-shadow: none;
  }
  
  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px ${themeColors.light.action.focus};
  }
`;

/**
 * CSS mixin to reset browser default button styles
 */
export const buttonReset = css`
  appearance: none;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
  cursor: pointer;
  
  &:disabled {
    cursor: not-allowed;
  }
`;

/**
 * CSS mixin for consistent form input styling
 */
export const inputStyle = css`
  display: block;
  width: 100%;
  padding: 8px 12px;
  font-size: 16px;
  line-height: 1.5;
  color: ${themeColors.light.text.primary};
  background-color: ${themeColors.light.background.primary};
  border: 1px solid ${themeColors.light.border.default};
  border-radius: 4px;
  transition: ${transition('border-color, box-shadow', 'fast')};
  
  &:focus {
    border-color: ${colors.primary[500]};
    box-shadow: 0 0 0 2px ${themeColors.light.action.focus};
    outline: none;
  }
  
  &:disabled {
    background-color: ${themeColors.light.background.tertiary};
    color: ${themeColors.light.text.disabled};
    cursor: not-allowed;
  }
  
  &::placeholder {
    color: ${themeColors.light.text.tertiary};
  }
`;

/**
 * CSS mixin for creating scrollable containers with consistent styling
 */
export const scrollable = css`
  overflow-y: auto;
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS devices */
  
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${themeColors.light.background.secondary};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${themeColors.light.border.default};
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${themeColors.light.border.strong};
  }
`;

/**
 * CSS mixin for text truncation with ellipsis
 */
export const ellipsis = css`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * CSS mixin to hide scrollbars while maintaining scroll functionality
 */
export const hideScrollbar = css`
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  
  &::-webkit-scrollbar {
    display: none; /* Chrome, Safari and Opera */
  }
`;

/**
 * CSS mixin for consistent padding that adjusts based on screen size
 */
export const responsivePadding = css`
  padding: 16px;
  
  ${mediaQueries.sm} {
    padding: 24px;
  }
  
  ${mediaQueries.lg} {
    padding: 32px;
  }
`;