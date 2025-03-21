import React from 'react';
import styled from 'styled-components'; // version ^5.3.10
import { colors } from '../../styles/colors';
import { flexCenter } from '../../styles/mixins';
import { spin } from '../../styles/animations';
import { Size } from '../../types/common.types';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: Size;
  color?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  label?: string;
}

const SpinnerContainer = styled.div<{
  size?: Size;
  fullScreen?: boolean;
  overlay?: boolean;
}>`
  ${flexCenter}
  position: ${props => (props.fullScreen ? 'fixed' : props.overlay ? 'absolute' : 'relative')};
  
  ${props => (props.fullScreen || props.overlay) && `
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.7);
    z-index: 1000;
  `}
  
  flex-direction: column;
`;

const SpinnerCircle = styled.div<{
  size?: Size;
  color?: string;
}>`
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: ${props => props.color || colors.primary[500]};
  
  ${props => {
    switch (props.size) {
      case 'small':
        return `
          width: 16px;
          height: 16px;
          border-width: 2px;
        `;
      case 'large':
        return `
          width: 48px;
          height: 48px;
          border-width: 4px;
        `;
      default: // medium
        return `
          width: 32px;
          height: 32px;
          border-width: 3px;
        `;
    }
  }}
  
  animation: ${spin} 0.8s linear infinite;
`;

const SpinnerLabel = styled.span<{
  size?: Size;
}>`
  margin-top: 8px;
  text-align: center;
  color: ${colors.neutral[700]};
  
  ${props => {
    switch (props.size) {
      case 'small':
        return 'font-size: 0.75rem;';
      case 'large':
        return 'font-size: 1rem;';
      default: // medium
        return 'font-size: 0.875rem;';
    }
  }}
`;

/**
 * A loading spinner component that provides visual feedback during asynchronous operations.
 * 
 * @param {SpinnerProps} props - Component properties
 * @returns {JSX.Element} Rendered spinner component
 */
const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color = colors.primary[500],
  fullScreen = false,
  overlay = false,
  label,
  className,
  style,
  ...rest
}) => {
  return (
    <SpinnerContainer
      size={size}
      fullScreen={fullScreen}
      overlay={overlay}
      className={className}
      style={style}
      role="status"
      aria-live="polite"
      {...rest}
    >
      <SpinnerCircle size={size} color={color} />
      {label && <SpinnerLabel size={size}>{label}</SpinnerLabel>}
    </SpinnerContainer>
  );
};

export default Spinner;