import React, { useState, ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { TabView, TabPanel } from 'primereact/tabview';
import { colors } from '../../styles/colors';
import { focusOutline, transition } from '../../styles/mixins';
import { Size } from '../../types/common.types';

// Interface for individual tab items
interface TabItem {
  /** The label text to display for the tab */
  label: string;
  /** Optional icon to display before the label */
  icon?: ReactNode;
  /** The content to display when the tab is active */
  content: ReactNode;
  /** Whether the tab is disabled */
  disabled?: boolean;
  /** Additional CSS class for the tab */
  className?: string;
  /** Additional CSS class for the tab header */
  headerClassName?: string;
  /** Additional CSS class for the tab content */
  contentClassName?: string;
}

// Props interface for the Tabs component
interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * Array of tab items to display
   */
  items?: TabItem[];
  
  /**
   * TabPanel components as children (alternative to items prop)
   */
  children?: ReactNode;
  
  /**
   * Index of the active tab (controlled mode)
   */
  activeIndex?: number;
  
  /**
   * Callback function when tab changes
   */
  onTabChange?: (index: number) => void;
  
  /**
   * Orientation of the tabs
   * @default 'top'
   */
  orientation?: 'top' | 'bottom' | 'left' | 'right';
  
  /**
   * Size of the tabs
   * @default Size.MEDIUM
   */
  size?: Size;
  
  /**
   * Whether to enable horizontal scrolling for overflow tabs
   * @default false
   */
  scrollable?: boolean;
  
  /**
   * Visual style variant
   * @default 'default'
   */
  variant?: 'default' | 'outlined' | 'filled';
  
  /**
   * Whether tabs should take up the full width
   * @default false
   */
  fullWidth?: boolean;
  
  /**
   * Whether to center the tabs
   * @default false
   */
  centered?: boolean;
  
  /**
   * Additional class name for tab headers
   */
  tabClassName?: string;
  
  /**
   * Additional class name for tab panels
   */
  panelClassName?: string;
}

// Styled component for TabView
const StyledTabView = styled(TabView)<{
  orientation?: string;
  size?: Size;
  scrollable?: boolean;
  variant?: string;
  fullWidth?: boolean;
  centered?: boolean;
}>`
  /* Base styles for the tab view */
  width: 100%;
  font-family: inherit;
  
  /* Apply different styles based on orientation */
  ${props => props.orientation === 'top' && css`
    .p-tabview-nav {
      border-bottom: 1px solid ${colors.neutral[300]};
    }
    
    .p-tabview-nav li.p-highlight .p-tabview-nav-link::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: ${colors.primary[500]};
    }
  `}
  
  ${props => props.orientation === 'bottom' && css`
    .p-tabview-nav {
      border-top: 1px solid ${colors.neutral[300]};
      order: 1;
    }
    
    .p-tabview-panels {
      order: 0;
    }
    
    .p-tabview-nav li.p-highlight .p-tabview-nav-link::after {
      content: '';
      position: absolute;
      top: -1px;
      left: 0;
      width: 100%;
      height: 2px;
      background-color: ${colors.primary[500]};
    }
  `}
  
  ${props => props.orientation === 'left' && css`
    display: flex;
    
    .p-tabview-nav {
      flex-direction: column;
      border-right: 1px solid ${colors.neutral[300]};
      min-width: 150px;
    }
    
    .p-tabview-panels {
      flex: 1;
      padding-left: 1rem;
    }
    
    .p-tabview-nav li.p-highlight .p-tabview-nav-link::after {
      content: '';
      position: absolute;
      right: -1px;
      top: 0;
      width: 2px;
      height: 100%;
      background-color: ${colors.primary[500]};
    }
  `}
  
  ${props => props.orientation === 'right' && css`
    display: flex;
    
    .p-tabview-nav {
      flex-direction: column;
      border-left: 1px solid ${colors.neutral[300]};
      order: 1;
      min-width: 150px;
    }
    
    .p-tabview-panels {
      flex: 1;
      order: 0;
      padding-right: 1rem;
    }
    
    .p-tabview-nav li.p-highlight .p-tabview-nav-link::after {
      content: '';
      position: absolute;
      left: -1px;
      top: 0;
      width: 2px;
      height: 100%;
      background-color: ${colors.primary[500]};
    }
  `}
  
  /* Apply different styles based on size */
  ${props => props.size === Size.SMALL && css`
    .p-tabview-nav li {
      font-size: 0.875rem;
    }
  `}
  
  ${props => props.size === Size.MEDIUM && css`
    .p-tabview-nav li {
      font-size: 1rem;
    }
  `}
  
  ${props => props.size === Size.LARGE && css`
    .p-tabview-nav li {
      font-size: 1.125rem;
    }
  `}
  
  /* Apply scrollable styles */
  ${props => props.scrollable && css`
    .p-tabview-nav {
      overflow-x: auto;
      scrollbar-width: thin;
      
      &::-webkit-scrollbar {
        height: 6px;
      }
      
      &::-webkit-scrollbar-track {
        background: ${colors.neutral[100]};
      }
      
      &::-webkit-scrollbar-thumb {
        background: ${colors.neutral[300]};
        border-radius: 3px;
      }
    }
  `}
  
  /* Apply variant styles */
  ${props => props.variant === 'outlined' && css`
    .p-tabview-nav {
      border: 1px solid ${colors.neutral[300]};
      border-radius: 4px;
      padding: 2px;
    }
    
    .p-tabview-nav li .p-tabview-nav-link {
      border-radius: 2px;
    }
  `}
  
  ${props => props.variant === 'filled' && css`
    .p-tabview-nav {
      background-color: ${colors.neutral[100]};
      border-radius: 4px;
      padding: 2px;
    }
    
    .p-tabview-nav li .p-tabview-nav-link {
      border-radius: 2px;
    }
    
    .p-tabview-nav li.p-highlight .p-tabview-nav-link {
      background-color: ${colors.white};
    }
  `}
  
  /* Apply fullWidth styles */
  ${props => props.fullWidth && css`
    .p-tabview-nav {
      display: flex;
      
      li {
        flex: 1 1 auto;
        text-align: center;
        
        .p-tabview-nav-link {
          justify-content: center;
        }
      }
    }
  `}
  
  /* Apply centered styles */
  ${props => props.centered && !props.fullWidth && css`
    .p-tabview-nav {
      justify-content: center;
    }
  `}
  
  /* Override PrimeReact styles */
  .p-tabview-nav {
    display: flex;
    padding: 0;
    margin: 0;
    list-style: none;
    background: none;
    
    li {
      margin-right: 2px;
      margin-bottom: 0;
      
      &:last-child {
        margin-right: 0;
      }
      
      .p-tabview-nav-link {
        display: flex;
        align-items: center;
        padding: 0;
        border: none;
        background: transparent;
        transition: ${transition('color, background-color', 'fast')};
        color: ${colors.neutral[700]};
        position: relative;
        cursor: pointer;
        text-decoration: none;
        
        &:focus {
          ${focusOutline}
        }
        
        &:hover {
          color: ${colors.primary[500]};
        }
      }
      
      &.p-highlight .p-tabview-nav-link {
        color: ${colors.primary[500]};
        font-weight: 500;
      }
      
      &.p-disabled .p-tabview-nav-link {
        color: ${colors.neutral[400]};
        cursor: not-allowed;
        pointer-events: none;
      }
    }
  }
  
  .p-tabview-panels {
    border: none;
    background: none;
    padding: 1rem 0;
  }
  
  .p-tabview-panel {
    padding: 0;
  }
`;

// Styled component for tab headers
const TabHeader = styled.div<{ active?: boolean; disabled?: boolean; size?: Size }>`
  display: flex;
  align-items: center;
  padding: ${props => {
    switch(props.size) {
      case Size.SMALL: return '0.5rem 0.75rem';
      case Size.LARGE: return '0.75rem 1.25rem';
      default: return '0.625rem 1rem'; // medium (default)
    }
  }};
  font-weight: ${props => props.active ? '500' : '400'};
  color: ${props => {
    if (props.disabled) return colors.neutral[400];
    if (props.active) return colors.primary[500];
    return colors.neutral[700];
  }};
  
  &:hover {
    color: ${props => !props.disabled && colors.primary[500]};
  }
`;

// Styled component for tab content
const TabContent = styled.div`
  padding: 1rem 0;
`;

// Styled component for tab icons
const TabIcon = styled.span<{ size?: Size }>`
  margin-right: 0.5rem;
  font-size: ${props => {
    switch(props.size) {
      case Size.SMALL: return '1rem';
      case Size.LARGE: return '1.5rem';
      default: return '1.25rem'; // medium (default)
    }
  }};
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

/**
 * A versatile tabs component that provides a tabbed interface for organizing content.
 * 
 * Features:
 * - Support for different orientations (top, bottom, left, right)
 * - Multiple size options (small, medium, large)
 * - Scrollable tabs for when there are many tabs
 * - Various styling options (default, outlined, filled)
 * - Support for full-width and centered tabs
 * - Accessible keyboard navigation
 */
const Tabs = (props: TabsProps) => {
  const {
    items,
    children,
    activeIndex: controlledActiveIndex,
    onTabChange,
    orientation = 'top',
    size = Size.MEDIUM,
    scrollable = false,
    variant = 'default',
    fullWidth = false,
    centered = false,
    tabClassName,
    panelClassName,
    className,
    style,
    ...rest
  } = props;
  
  // State for active tab index (for uncontrolled mode)
  const [activeIndexState, setActiveIndexState] = useState(0);
  
  // Determine if we're in controlled or uncontrolled mode
  const isControlled = controlledActiveIndex !== undefined;
  const activeIndex = isControlled ? controlledActiveIndex : activeIndexState;
  
  // Handle tab change
  const handleTabChange = (event: { originalEvent: React.SyntheticEvent; index: number }) => {
    if (!isControlled) {
      setActiveIndexState(event.index);
    }
    
    if (onTabChange) {
      onTabChange(event.index);
    }
  };
  
  // Create tab panels from items or children
  const tabPanels = items
    ? items.map((item, index) => (
        <TabPanel
          key={index}
          header={
            <TabHeader
              active={activeIndex === index}
              disabled={item.disabled}
              size={size}
              className={`${tabClassName || ''} ${item.headerClassName || ''}`}
            >
              {item.icon && <TabIcon size={size}>{item.icon}</TabIcon>}
              {item.label}
            </TabHeader>
          }
          disabled={item.disabled}
          className={`${item.className || ''} ${panelClassName || ''}`}
          contentClassName={item.contentClassName}
        >
          <TabContent>
            {item.content}
          </TabContent>
        </TabPanel>
      ))
    : children;
  
  return (
    <StyledTabView
      activeIndex={activeIndex}
      onTabChange={handleTabChange}
      orientation={orientation}
      size={size}
      scrollable={scrollable}
      variant={variant}
      fullWidth={fullWidth}
      centered={centered}
      className={className}
      style={style}
      {...rest}
    >
      {tabPanels}
    </StyledTabView>
  );
};

export default Tabs;