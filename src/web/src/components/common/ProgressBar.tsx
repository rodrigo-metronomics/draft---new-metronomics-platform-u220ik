import React from 'react';
import styled from 'styled-components';
import { ProgressBar as PrimeProgressBar } from 'primereact/progressbar'; // version ^10.0.0
import { colors } from '../../styles/colors';
import { transition } from '../../styles/mixins';
import { Size } from '../../types/common.types';

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  variant?: string;
  severity?: string;
  size?: Size;
  showValue?: boolean;
  valueTemplate?: string;
  indeterminate?: boolean;
  striped?: boolean;
  animated?: boolean;
  color?: string;
  backgroundColor?: string;
  label?: string;
  unit?: string;
}

const StyledProgressBar = styled(PrimeProgressBar)<{
  variant?: string;
  severity?: string;
  size?: Size;
  striped?: boolean;
  animated?: boolean;
  color?: string;
  backgroundColor?: string;
}>`
  /* Base styles */
  height: ${(props) => {
    switch (props.size) {
      case 'small':
        return '8px';
      case 'large':
        return '16px';
      case 'medium':
      default:
        return '12px';
    }
  }};
  border-radius: 4px;
  background-color: ${(props) => props.backgroundColor || colors.neutral[200]};
  
  /* Progress bar styling */
  & .p-progressbar-value {
    background-color: ${(props) => {
      if (props.color) return props.color;
      if (props.variant) {
        switch (props.variant) {
          case 'primary':
            return colors.primary[500];
          case 'secondary':
            return colors.secondary[500];
          case 'success':
            return colors.success[500];
          case 'warning':
            return colors.warning[500];
          case 'error':
            return colors.error[500];
          case 'info':
            return colors.info[500];
          default:
            return colors.primary[500];
        }
      }
      if (props.severity) {
        switch (props.severity) {
          case 'success':
            return colors.success[500];
          case 'warning':
            return colors.warning[500];
          case 'error':
            return colors.error[500];
          case 'info':
            return colors.info[500];
          default:
            return colors.primary[500];
        }
      }
      return colors.primary[500];
    }};
    
    /* Striped pattern */
    ${(props) =>
      props.striped &&
      `
      background-image: linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.15) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.15) 50%,
        rgba(255, 255, 255, 0.15) 75%,
        transparent 75%,
        transparent
      );
      background-size: 1rem 1rem;
    `}
    
    /* Animation for striped pattern */
    ${(props) =>
      props.animated &&
      props.striped &&
      `
      animation: p-progressbar-stripes 1s linear infinite;
      
      @keyframes p-progressbar-stripes {
        from {
          background-position: 1rem 0;
        }
        to {
          background-position: 0 0;
        }
      }
    `}
    
    /* Smooth transition */
    transition: ${transition('width', 'normal')};
  }
  
  /* Label styling for text contrast */
  & .p-progressbar-label {
    color: #fff;
    font-weight: 500;
  }
`;

const ProgressLabel = styled.div<{
  size?: Size;
}>`
  font-size: ${(props) => {
    switch (props.size) {
      case 'small':
        return '12px';
      case 'large':
        return '16px';
      case 'medium':
      default:
        return '14px';
    }
  }};
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

/**
 * A flexible progress bar component that visualizes progress or completion status
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  value = 0,
  variant = 'primary',
  size = 'medium',
  showValue = false,
  valueTemplate = '{value}%',
  indeterminate = false,
  striped = false,
  animated = false,
  severity,
  color,
  backgroundColor,
  label,
  unit = '%',
  className,
  style,
  ...rest
}) => {
  // Ensure value is between 0 and 100
  const percentage = Math.max(0, Math.min(100, value));
  
  // Format value based on template
  const formattedValue = valueTemplate.replace('{value}', percentage.toString());
  
  return (
    <div style={style} className={className}>
      {label && (
        <ProgressLabel size={size}>
          <span>{label}</span>
          {showValue && <span>{formattedValue}</span>}
        </ProgressLabel>
      )}
      <StyledProgressBar
        value={percentage}
        showValue={showValue && !label}
        mode={indeterminate ? 'indeterminate' : 'determinate'}
        variant={variant}
        severity={severity}
        size={size}
        striped={striped}
        animated={animated}
        color={color}
        backgroundColor={backgroundColor}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={indeterminate ? undefined : percentage}
        aria-label={label || 'Progress'}
        valueTemplate={unit ? `{value}${unit}` : valueTemplate}
        {...rest}
      />
    </div>
  );
};

export default ProgressBar;