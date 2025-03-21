import React, { ReactNode } from 'react';
import styled, { css } from 'styled-components'; // version ^5.3.10
import { Button as PrimeButton } from 'primereact/button'; // version ^10.0.0
import { colors } from '../../styles/colors';
import { buttonReset, focusOutline, flexCenter, transition } from '../../styles/mixins';
import { ButtonVariant, Size, Severity } from '../../types/common.types';

// Interface for Button component props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  icon?: ReactNode;
  iconPos?: string;
  variant?: ButtonVariant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  rounded?: boolean;
  outlined?: boolean;
  text?: boolean;
  raised?: boolean;
  severity?: Severity;
  badge?: string;
  badgeClassName?: string;
  children?: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

// Styled button component that extends PrimeReact Button
const StyledButton = styled(PrimeButton)<{
  variant?: ButtonVariant;
  size?: Size;
  fullWidth?: boolean;
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
  position: relative;
  transition: ${transition('all')};
  font-weight: 500;
  border-radius: 4px;
  
  /* Size variants */
  ${props => {
    switch (props.size) {
      case Size.SMALL:
        return css`
          padding: 6px 12px;
          font-size: 0.875rem;
        `;
      case Size.LARGE:
        return css`
          padding: 12px 24px;
          font-size: 1.125rem;
        `;
      default: // Medium
        return css`
          padding: 8px 16px;
          font-size: 1rem;
        `;
    }
  }}
  
  /* Button variants */
  ${props => {
    switch (props.variant) {
      case ButtonVariant.PRIMARY:
        return css`
          background-color: ${colors.primary[500]};
          color: ${colors.white};
          border: 1px solid ${colors.primary[500]};
          
          &:hover:not(:disabled) {
            background-color: ${colors.primary[600]};
            border-color: ${colors.primary[600]};
          }
          
          &:active:not(:disabled) {
            background-color: ${colors.primary[700]};
            border-color: ${colors.primary[700]};
          }
        `;
      case ButtonVariant.SECONDARY:
        return css`
          background-color: ${colors.secondary[500]};
          color: ${colors.white};
          border: 1px solid ${colors.secondary[500]};
          
          &:hover:not(:disabled) {
            background-color: ${colors.secondary[600]};
            border-color: ${colors.secondary[600]};
          }
          
          &:active:not(:disabled) {
            background-color: ${colors.secondary[700]};
            border-color: ${colors.secondary[700]};
          }
        `;
      case ButtonVariant.TERTIARY:
        return css`
          background-color: transparent;
          color: ${colors.primary[500]};
          border: 1px solid transparent;
          
          &:hover:not(:disabled) {
            background-color: ${colors.primary[50]};
          }
          
          &:active:not(:disabled) {
            background-color: ${colors.primary[100]};
          }
        `;
      case ButtonVariant.DANGER:
        return css`
          background-color: ${colors.error[500]};
          color: ${colors.white};
          border: 1px solid ${colors.error[500]};
          
          &:hover:not(:disabled) {
            background-color: ${colors.error[600]};
            border-color: ${colors.error[600]};
          }
          
          &:active:not(:disabled) {
            background-color: ${colors.error[700]};
            border-color: ${colors.error[700]};
          }
        `;
      default:
        return '';
    }
  }}
  
  /* Severity variants */
  ${props => {
    if (props.severity) {
      switch (props.severity) {
        case Severity.SUCCESS:
          return css`
            background-color: ${colors.success[500]};
            color: ${colors.white};
            border: 1px solid ${colors.success[500]};
            
            &:hover:not(:disabled) {
              background-color: ${colors.success[600]};
              border-color: ${colors.success[600]};
            }
            
            &:active:not(:disabled) {
              background-color: ${colors.success[700]};
              border-color: ${colors.success[700]};
            }
          `;
        case Severity.WARNING:
          return css`
            background-color: ${colors.warning[500]};
            color: ${colors.white};
            border: 1px solid ${colors.warning[500]};
            
            &:hover:not(:disabled) {
              background-color: ${colors.warning[600]};
              border-color: ${colors.warning[600]};
            }
            
            &:active:not(:disabled) {
              background-color: ${colors.warning[700]};
              border-color: ${colors.warning[700]};
            }
          `;
        case Severity.ERROR:
          return css`
            background-color: ${colors.error[500]};
            color: ${colors.white};
            border: 1px solid ${colors.error[500]};
            
            &:hover:not(:disabled) {
              background-color: ${colors.error[600]};
              border-color: ${colors.error[600]};
            }
            
            &:active:not(:disabled) {
              background-color: ${colors.error[700]};
              border-color: ${colors.error[700]};
            }
          `;
        case Severity.INFO:
        default:
          return css`
            background-color: ${colors.info[500]};
            color: ${colors.white};
            border: 1px solid ${colors.info[500]};
            
            &:hover:not(:disabled) {
              background-color: ${colors.info[600]};
              border-color: ${colors.info[600]};
            }
            
            &:active:not(:disabled) {
              background-color: ${colors.info[700]};
              border-color: ${colors.info[700]};
            }
          `;
      }
    }
    return '';
  }}
  
  /* Outlined variant */
  ${props => props.outlined && css`
    background-color: transparent;
    color: ${props.severity 
      ? colors[props.severity.toLowerCase()][500] 
      : props.variant === ButtonVariant.DANGER 
        ? colors.error[500]
        : props.variant === ButtonVariant.SECONDARY
          ? colors.secondary[500]
          : colors.primary[500]};
    
    &:hover:not(:disabled) {
      background-color: ${props.severity 
        ? colors[props.severity.toLowerCase()][50] 
        : props.variant === ButtonVariant.DANGER 
          ? colors.error[50]
          : props.variant === ButtonVariant.SECONDARY
            ? colors.secondary[50]
            : colors.primary[50]};
    }
    
    &:active:not(:disabled) {
      background-color: ${props.severity 
        ? colors[props.severity.toLowerCase()][100] 
        : props.variant === ButtonVariant.DANGER 
          ? colors.error[100]
          : props.variant === ButtonVariant.SECONDARY
            ? colors.secondary[100]
            : colors.primary[100]};
    }
  `}
  
  /* Text variant */
  ${props => props.text && css`
    background-color: transparent;
    border-color: transparent;
    color: ${props.severity 
      ? colors[props.severity.toLowerCase()][500] 
      : props.variant === ButtonVariant.DANGER 
        ? colors.error[500]
        : props.variant === ButtonVariant.SECONDARY
          ? colors.secondary[500]
          : colors.primary[500]};
    
    &:hover:not(:disabled) {
      background-color: ${props.severity 
        ? colors[props.severity.toLowerCase()][50] 
        : props.variant === ButtonVariant.DANGER 
          ? colors.error[50]
          : props.variant === ButtonVariant.SECONDARY
            ? colors.secondary[50]
            : colors.primary[50]};
    }
    
    &:active:not(:disabled) {
      background-color: ${props.severity 
        ? colors[props.severity.toLowerCase()][100] 
        : props.variant === ButtonVariant.DANGER 
          ? colors.error[100]
          : props.variant === ButtonVariant.SECONDARY
            ? colors.secondary[100]
            : colors.primary[100]};
    }
  `}
  
  /* Raised variant */
  ${props => props.raised && css`
    box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2);
    
    &:hover:not(:disabled) {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.25);
    }
    
    &:active:not(:disabled) {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
  `}
  
  /* Full width */
  ${props => props.fullWidth && css`
    width: 100%;
  `}
  
  /* Rounded corners */
  ${props => props.rounded && css`
    border-radius: 50px;
  `}
  
  /* Disabled state */
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  /* Loading state */
  ${props => props.loading && css`
    opacity: 0.8;
    pointer-events: none;
  `}
`;

// Spinner component shown during loading state
const SpinnerWrapper = styled.span`
  display: inline-block;
  width: 1em;
  height: 1em;
  margin-right: ${props => props.iconPos === 'right' ? '0' : '0.5em'};
  margin-left: ${props => props.iconPos === 'right' ? '0.5em' : '0'};
  
  &::after {
    content: "";
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 2px solid currentColor;
    border-color: currentColor transparent currentColor transparent;
    animation: spin 1.2s linear infinite;
  }
  
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

// Icon wrapper component for proper positioning and sizing
const IconWrapper = styled.span<{ iconPos?: string, size?: Size }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: ${props => props.iconPos === 'right' ? '0' : '0.5em'};
  margin-left: ${props => props.iconPos === 'right' ? '0.5em' : '0'};
  
  ${props => {
    switch (props.size) {
      case Size.SMALL:
        return css`
          font-size: 0.875rem;
        `;
      case Size.LARGE:
        return css`
          font-size: 1.125rem;
        `;
      default: // Medium
        return css`
          font-size: 1rem;
        `;
    }
  }}
`;

// Badge component for displaying notification counts
const BadgeWrapper = styled.span`
  position: absolute;
  top: -8px;
  right: -8px;
  min-width: 1.2em;
  height: 1.2em;
  background-color: ${colors.error[500]};
  color: ${colors.white};
  border-radius: 1em;
  padding: 0 0.3em;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/**
 * A versatile button component that supports various styles, sizes, and states
 */
const Button = ({
  label,
  icon,
  iconPos = 'left',
  variant = ButtonVariant.PRIMARY,
  size = Size.MEDIUM,
  loading = false,
  fullWidth = false,
  rounded = false,
  outlined = false,
  text = false,
  raised = false,
  severity,
  badge,
  badgeClassName,
  children,
  onClick,
  disabled,
  className,
  ...props
}: ButtonProps) => {
  // Disable button when loading
  const isDisabled = disabled || loading;
  
  // Handle icon position
  const hasLeftIcon = icon && iconPos === 'left';
  const hasRightIcon = icon && iconPos === 'right';
  
  return (
    <StyledButton
      variant={variant}
      size={size}
      iconPos={iconPos}
      loading={loading}
      fullWidth={fullWidth}
      rounded={rounded}
      outlined={outlined}
      text={text}
      raised={raised}
      severity={severity}
      disabled={isDisabled}
      className={className}
      onClick={onClick}
      aria-busy={loading}
      {...props}
    >
      {loading && <SpinnerWrapper iconPos={iconPos} />}
      
      {!loading && hasLeftIcon && (
        <IconWrapper iconPos={iconPos} size={size}>
          {icon}
        </IconWrapper>
      )}
      
      {label || children}
      
      {!loading && hasRightIcon && (
        <IconWrapper iconPos={iconPos} size={size}>
          {icon}
        </IconWrapper>
      )}
      
      {badge && (
        <BadgeWrapper className={badgeClassName}>{badge}</BadgeWrapper>
      )}
    </StyledButton>
  );
};

export default Button;