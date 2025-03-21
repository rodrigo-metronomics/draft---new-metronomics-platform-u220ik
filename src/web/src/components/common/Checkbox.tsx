import React from 'react';
import styled, { css } from 'styled-components';
import { Checkbox as PrimeCheckbox } from 'primereact/checkbox'; // ^10.0.0
import { colors } from '../../styles/colors';
import { focusOutline, transition } from '../../styles/mixins';
import { textStyles } from '../../styles/typography';

/**
 * Props for the Checkbox component that extends HTML input attributes
 * while customizing the onChange handler for checkbox-specific behavior
 */
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  id?: string;
  name?: string;
  checked?: boolean;
  label?: string;
  hasError?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Container component that wraps the checkbox and label elements
 */
const CheckboxContainer = styled.div<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};
  margin: 0.5rem 0;
  user-select: none;
`;

/**
 * Styled PrimeReact Checkbox component with Metronomics design system styling
 */
const StyledCheckbox = styled(PrimeCheckbox)<{ hasError?: boolean; disabled?: boolean }>`
  ${focusOutline}
  
  .p-checkbox-box {
    border-radius: 4px;
    border-color: ${({ hasError, disabled }) => 
      hasError 
        ? colors.error[500] 
        : disabled 
          ? colors.neutral[300] 
          : colors.neutral[400]};
    transition: ${transition('background-color, border-color', 'fast')};
    
    &.p-highlight {
      background-color: ${({ disabled }) => 
        disabled ? colors.neutral[300] : colors.primary[500]};
      border-color: ${({ disabled }) => 
        disabled ? colors.neutral[300] : colors.primary[500]};
      
      .p-checkbox-icon {
        color: ${colors.white};
      }
    }
    
    &:hover:not(.p-disabled) {
      border-color: ${({ hasError }) => 
        hasError ? colors.error[500] : colors.primary[400]};
    }
  }
`;

/**
 * Styled label component for the checkbox with consistent typography
 */
const CheckboxLabel = styled.label<{ disabled?: boolean }>`
  ${textStyles.body2}
  margin-left: 0.5rem;
  color: ${({ disabled }) => 
    disabled ? colors.neutral[700] : colors.neutral[900]};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
`;

/**
 * A customizable checkbox component that extends PrimeReact Checkbox with
 * Metronomics design system styling. Provides consistent visual appearance
 * and behavior for checkbox inputs throughout the application.
 */
const Checkbox: React.FC<CheckboxProps> = ({
  id,
  name,
  checked = false,
  label,
  hasError = false,
  disabled = false,
  onChange,
  className,
  style,
  ...rest
}) => {
  /**
   * Handles checkbox state changes and calls the provided onChange handler
   */
  const handleChange = (e: { checked: boolean }) => {
    if (onChange) {
      onChange(e.checked);
    }
  };

  return (
    <CheckboxContainer className={className} style={style} disabled={disabled}>
      <StyledCheckbox
        inputId={id}
        name={name}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        hasError={hasError}
        aria-invalid={hasError}
        {...rest}
      />
      {label && (
        <CheckboxLabel htmlFor={id} disabled={disabled}>
          {label}
        </CheckboxLabel>
      )}
    </CheckboxContainer>
  );
};

export default Checkbox;