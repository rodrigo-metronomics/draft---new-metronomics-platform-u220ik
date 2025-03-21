import React from 'react';
import styled from 'styled-components';
import { Tooltip as PrimeTooltip } from 'primereact/tooltip'; // version ^10.0.0
import { colors } from '../../styles/colors';
import { transition } from '../../styles/mixins';
import { Position, Size } from '../../types/common.types';

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  position?: Position;
  size?: Size;
  className?: string;
  tooltipClassName?: string;
  id?: string;
  disabled?: boolean;
  showDelay?: number;
  hideDelay?: number;
  mouseTrack?: boolean;
  mouseTrackTop?: number;
  mouseTrackLeft?: number;
  showOnDisabled?: boolean;
  autoHide?: boolean;
  event?: string;
  target?: string;
}

const StyledTooltip = styled(PrimeTooltip)<{
  position?: Position;
  size?: Size;
  disabled?: boolean;
}>`
  .p-tooltip-text {
    background-color: ${colors.neutral[800]};
    color: ${colors.white};
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    transition: ${transition('opacity, transform', 'fast')};
    
    /* Size variations */
    padding: ${props => 
      props.size === 'small' ? '4px 8px' : 
      props.size === 'large' ? '8px 16px' : 
      '6px 12px'
    };
    
    font-size: ${props => 
      props.size === 'small' ? '12px' : 
      props.size === 'large' ? '16px' : 
      '14px'
    };
  }
  
  &.p-tooltip-top .p-tooltip-arrow {
    border-top-color: ${colors.neutral[800]};
  }
  
  &.p-tooltip-right .p-tooltip-arrow {
    border-right-color: ${colors.neutral[800]};
  }
  
  &.p-tooltip-bottom .p-tooltip-arrow {
    border-bottom-color: ${colors.neutral[800]};
  }
  
  &.p-tooltip-left .p-tooltip-arrow {
    border-left-color: ${colors.neutral[800]};
  }
`;

/**
 * A customizable tooltip component that displays informational text when hovering over or focusing on an element
 */
const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'right',
  size = 'medium',
  className,
  tooltipClassName,
  id,
  disabled = false,
  showDelay = 0,
  hideDelay = 0,
  mouseTrack = false,
  mouseTrackTop = 5,
  mouseTrackLeft = 5,
  showOnDisabled = false,
  autoHide = true,
  event = 'hover',
  target
}) => {
  // Generate a unique ID if none provided
  const tooltipId = id || `tooltip-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <>
      <StyledTooltip
        target={target || `#${tooltipId}`}
        content={content}
        position={position}
        size={size}
        className={tooltipClassName}
        disabled={disabled && !showOnDisabled}
        showDelay={showDelay}
        hideDelay={hideDelay}
        mouseTrack={mouseTrack}
        mouseTrackTop={mouseTrackTop}
        mouseTrackLeft={mouseTrackLeft}
        showOnDisabled={showOnDisabled}
        autoHide={autoHide}
        event={event}
      />
      
      {children && (
        <span 
          id={tooltipId}
          className={className}
          aria-describedby={tooltipId}
        >
          {children}
        </span>
      )}
    </>
  );
};

export default Tooltip;