import React from 'react'; // version ^18.2.0
import styled, { css } from 'styled-components'; // version ^5.3.10
import { RadioButton as PrimeRadioButton } from 'primereact/radiobutton'; // version ^10.0.0
import { colors } from '../../styles/colors';
import { focusOutline, transition } from '../../styles/mixins';
import { textStyles } from '../../styles/typography';

/**
 * Props interface for the RadioButton component.
 * Extends HTML input attributes while overriding the onChange handler.
 */
interface RadioButtonProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  id: string;
  name: string;
  value: any;
  checked?: any;
  label?: string;
  hasError?: boolean;
  disabled?: boolean;
  onChange?: (checked: any) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Container component that wraps the radio button and label
 */
const RadioButtonContainer = styled.div<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};
  margin: 0.5rem 0;
  user-select: none;
`;

/**
 * Styled PrimeReact RadioButton with Metronomics design system styling
 */
const StyledRadioButton = styled(PrimeRadioButton)<{ hasError?: boolean; disabled?: boolean }>`
  ${focusOutline}
  
  .p-radiobutton-box {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid ${({ hasError, disabled }) => {
      if (hasError) return colors.error[500];
      if (disabled) return colors.neutral[300];
      return colors.neutral[400];
    }};
    background-color: ${({ disabled }) => (disabled ? colors.neutral[100] : colors.white)};
    transition: ${transition('border-color, background-color', 'fast')};
    
    &.p-highlight {
      border-color: ${({ hasError, disabled }) => {
        if (hasError) return colors.error[500];
        if (disabled) return colors.neutral[300];
        return colors.primary[500];
      }};
      background-color: ${({ disabled }) => (disabled ? colors.neutral[300] : colors.white)};
      
      .p-radiobutton-icon {
        width: 10px;
        height: 10px;
        background-color: ${({ hasError, disabled }) => {
          if (hasError) return colors.error[500];
          if (disabled) return colors.neutral[500];
          return colors.primary[500];
        }};
        transform: scale(1);
        transition: ${transition('transform, background-color', 'fast')};
      }
    }
    
    &:not(.p-disabled):not(.p-highlight):hover {
      border-color: ${({ hasError }) => (hasError ? colors.error[600] : colors.primary[400])};
    }
  }
`;

/**
 * Styled label component for the radio button
 */
const RadioButtonLabel = styled.label<{ disabled?: boolean }>`
  ${textStyles.body2}
  margin-left: 0.5rem;
  color: ${({ disabled }) => (disabled ? colors.neutral[500] : colors.neutral[900])};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
`;

/**
 * A customizable radio button component that extends PrimeReact RadioButton
 * with Metronomics design system styling.
 */
const RadioButton: React.FC<RadioButtonProps> = ({
  id,
  name,
  value,
  checked,
  label,
  hasError = false,
  disabled = false,
  onChange,
  className,
  style,
  ...rest
}) => {
  // Handle onChange event by calling the provided handler with the new checked state
  const handleChange = (e: { checked: boolean; value: any }) => {
    if (onChange && !disabled) {
      onChange(e.checked ? value : null);
    }
  };

  return (
    <RadioButtonContainer className={className} style={style} disabled={disabled}>
      <StyledRadioButton
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        hasError={hasError}
        aria-invalid={hasError}
        {...rest}
      />
      {label && (
        <RadioButtonLabel htmlFor={id} disabled={disabled}>
          {label}
        </RadioButtonLabel>
      )}
    </RadioButtonContainer>
  );
};

export default RadioButton;