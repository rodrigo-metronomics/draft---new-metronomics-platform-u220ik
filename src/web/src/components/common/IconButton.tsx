import React from 'react';
import styled, { css } from 'styled-components';
import { Button as PrimeButton } from 'primereact/button'; // version ^10.0.0
import { colors } from '../../styles/colors';
import { 
  buttonReset, 
  focusOutline, 
  flexCenter, 
  transition 
} from '../../styles/mixins';
import { ButtonVariant, Size, Severity } from '../../types/common.types';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon element to display in the button */
  icon: React.ReactNode;
  /** Button style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: Size;
  /** Whether the button is in loading state */
  loading?: boolean;
  /** Whether to make the button circular */
  rounded?: boolean;
  /** Whether to use outlined style */
  outlined?: boolean;
  /** Whether to use text-only style (no background) */
  text?: boolean;
  /** Whether to add shadow for a raised appearance */
  raised?: boolean;
  /** Contextual styling (success, warning, error, info) */
  severity?: Severity;
  /** Optional badge text to display */
  badge?: string;
  /** Additional class for the badge */
  badgeClassName?: string;
  /** Tooltip text */
  tooltip?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Click handler function */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const StyledIconButton = styled(PrimeButton)<{
  variant?: ButtonVariant;
  size?: Size;
  rounded?: boolean;
  outlined?: boolean;
  text?: boolean;
  raised?: boolean;
  severity?: Severity;
  loading?: boolean;
}>`
  ${buttonReset}
  ${focusOutline}
  ${flexCenter}
  ${() => transition('all', 'fast')}
  
  /* Base styles */
  position: relative;
  padding: 0;
  overflow: hidden;
  
  /* Size variations */
  ${props => {
    switch (props.size) {
      case 'SMALL':
        return css`
          width: 32px;
          height: 32px;
          font-size: 14px;
        `;
      case 'LARGE':
        return css`
          width: 48px;
          height: 48px;
          font-size: 20px;
        `;
      default: // MEDIUM is default
        return css`
          width: 40px;
          height: 40px;
          font-size: 16px;
        `;
    }
  }}
  
  /* Rounded or square shape */
  border-radius: ${props => props.rounded ? '50%' : '4px'};
  
  /* Variant styles */
  ${props => {
    if (props.text) {
      return css`
        background-color: transparent;
        border: none;
        
        &:hover {
          background-color: rgba(0, 0, 0, 0.04);
        }
        
        &:active {
          background-color: rgba(0, 0, 0, 0.08);
        }
      `;
    }
    
    if (props.outlined) {
      return css`
        background-color: transparent;
        border: 1px solid;
        
        ${() => {
          switch (props.variant) {
            case 'PRIMARY':
              return css`
                border-color: ${colors.primary[500]};
                color: ${colors.primary[500]};
                
                &:hover {
                  background-color: ${colors.primary[50]};
                }
              `;
            case 'SECONDARY':
              return css`
                border-color: ${colors.secondary[500]};
                color: ${colors.secondary[500]};
                
                &:hover {
                  background-color: ${colors.secondary[50]};
                }
              `;
            case 'TERTIARY':
              return css`
                border-color: ${colors.neutral[500]};
                color: ${colors.neutral[500]};
                
                &:hover {
                  background-color: ${colors.neutral[50]};
                }
              `;
            case 'DANGER':
              return css`
                border-color: ${colors.error[500]};
                color: ${colors.error[500]};
                
                &:hover {
                  background-color: ${colors.error[50]};
                }
              `;
            default:
              return '';
          }
        }}
      `;
    }
    
    return css`
      border: none;
      
      ${() => {
        switch (props.variant) {
          case 'PRIMARY':
            return css`
              background-color: ${colors.primary[500]};
              color: ${colors.white};
              
              &:hover {
                background-color: ${colors.primary[600]};
              }
              
              &:active {
                background-color: ${colors.primary[700]};
              }
            `;
          case 'SECONDARY':
            return css`
              background-color: ${colors.secondary[500]};
              color: ${colors.white};
              
              &:hover {
                background-color: ${colors.secondary[600]};
              }
              
              &:active {
                background-color: ${colors.secondary[700]};
              }
            `;
          case 'TERTIARY':
            return css`
              background-color: ${colors.neutral[200]};
              color: ${colors.neutral[800]};
              
              &:hover {
                background-color: ${colors.neutral[300]};
              }
              
              &:active {
                background-color: ${colors.neutral[400]};
              }
            `;
          case 'DANGER':
            return css`
              background-color: ${colors.error[500]};
              color: ${colors.white};
              
              &:hover {
                background-color: ${colors.error[600]};
              }
              
              &:active {
                background-color: ${colors.error[700]};
              }
            `;
          default:
            return '';
        }
      }}
    `;
  }}
  
  /* Severity overrides variant if provided */
  ${props => {
    if (props.severity) {
      if (props.outlined) {
        switch (props.severity) {
          case 'SUCCESS':
            return css`
              border-color: ${colors.success[500]};
              color: ${colors.success[500]};
              
              &:hover {
                background-color: ${colors.success[50]};
              }
            `;
          case 'INFO':
            return css`
              border-color: ${colors.info[500]};
              color: ${colors.info[500]};
              
              &:hover {
                background-color: ${colors.info[50]};
              }
            `;
          case 'WARNING':
            return css`
              border-color: ${colors.warning[500]};
              color: ${colors.warning[500]};
              
              &:hover {
                background-color: ${colors.warning[50]};
              }
            `;
          case 'ERROR':
            return css`
              border-color: ${colors.error[500]};
              color: ${colors.error[500]};
              
              &:hover {
                background-color: ${colors.error[50]};
              }
            `;
          default:
            return '';
        }
      } else if (!props.text) {
        switch (props.severity) {
          case 'SUCCESS':
            return css`
              background-color: ${colors.success[500]};
              color: ${colors.white};
              
              &:hover {
                background-color: ${colors.success[600]};
              }
              
              &:active {
                background-color: ${colors.success[700]};
              }
            `;
          case 'INFO':
            return css`
              background-color: ${colors.info[500]};
              color: ${colors.white};
              
              &:hover {
                background-color: ${colors.info[600]};
              }
              
              &:active {
                background-color: ${colors.info[700]};
              }
            `;
          case 'WARNING':
            return css`
              background-color: ${colors.warning[500]};
              color: ${colors.white};
              
              &:hover {
                background-color: ${colors.warning[600]};
              }
              
              &:active {
                background-color: ${colors.warning[700]};
              }
            `;
          case 'ERROR':
            return css`
              background-color: ${colors.error[500]};
              color: ${colors.white};
              
              &:hover {
                background-color: ${colors.error[600]};
              }
              
              &:active {
                background-color: ${colors.error[700]};
              }
            `;
          default:
            return '';
        }
      }
    }
    return '';
  }}
  
  /* Raised (with shadow) */
  ${props => props.raised && css`
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
    
    &:hover {
      box-shadow: 0 6px 10px rgba(0, 0, 0, 0.25);
    }
  `}
  
  /* Disabled state */
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }
  
  /* Loading state */
  ${props => props.loading && css`
    color: transparent !important;
    pointer-events: none;
    opacity: 0.8;
  `}
`;

const SpinnerWrapper = styled.span`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: inline-block;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 2px solid #fff;
  width: 16px;
  height: 16px;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
  }
`;

const BadgeWrapper = styled.span<{ size?: Size }>`
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(40%, -40%);
  background-color: ${colors.error[500]};
  color: ${colors.white};
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  font-size: ${props => props.size === 'LARGE' ? '12px' : '10px'};
  min-width: ${props => props.size === 'LARGE' ? '20px' : '16px'};
  height: ${props => props.size === 'LARGE' ? '20px' : '16px'};
  padding: 0 4px;
  line-height: 1;
  font-weight: bold;
`;

/**
 * A button component that displays only an icon with various style options
 */
const IconButton: React.FC<IconButtonProps> = ({ 
  icon,
  variant = 'PRIMARY',
  size = 'MEDIUM',
  loading = false,
  rounded = true,
  outlined = false,
  text = false,
  raised = false,
  severity,
  badge,
  badgeClassName,
  tooltip,
  ariaLabel,
  onClick,
  disabled,
  ...rest
}) => {
  // Disable button when in loading state
  const isDisabled = disabled || loading;
  
  return (
    <StyledIconButton
      variant={variant}
      size={size}
      rounded={rounded}
      outlined={outlined}
      text={text}
      raised={raised}
      severity={severity}
      loading={loading}
      disabled={isDisabled}
      onClick={onClick}
      tooltip={tooltip}
      aria-label={ariaLabel || 'Button'}
      {...rest}
    >
      {loading && <SpinnerWrapper />}
      {icon}
      {badge && (
        <BadgeWrapper size={size} className={badgeClassName}>
          {badge}
        </BadgeWrapper>
      )}
    </StyledIconButton>
  );
};

export default IconButton;