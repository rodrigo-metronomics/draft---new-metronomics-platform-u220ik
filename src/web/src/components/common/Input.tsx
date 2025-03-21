import React from 'react'; // ^18.2.0
import { InputText } from 'primereact/inputtext'; // ^10.0.0
import styled, { css } from 'styled-components'; // ^5.3.10
import { neutral, primary, statusColors } from '../../styles/colors';
import { inputStyle, focusOutline, transition } from '../../styles/mixins';
import { textStyles } from '../../styles/typography';

/**
 * Props interface for the Input component
 */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  name: string;
  type?: string;
  value: any;
  placeholder?: string;
  hasError?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * StyledInput component extending PrimeReact's InputText component with Metronomics styling
 */
const StyledInput = styled(InputText)<{
  hasError?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}>`
  ${inputStyle}
  ${textStyles.body1}
  ${focusOutline}
  
  padding: 0.75rem 1rem;
  border: 1px solid ${neutral[300]};
  border-radius: 0.25rem;
  background-color: ${({ disabled, readOnly }) => 
    (disabled || readOnly) ? neutral[100] : neutral.white};
  color: ${neutral[900]};
  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
  height: 2.5rem;
  transition: ${transition('all', 'fast')};
  
  &::placeholder {
    color: ${neutral[400]};
  }
  
  ${({ hasError }) => hasError && css`
    border-color: ${statusColors.error};
    
    &:focus {
      border-color: ${statusColors.error};
    }
  `}
  
  ${({ disabled }) => disabled && css`
    cursor: not-allowed;
    opacity: 0.7;
  `}
  
  &:focus:not([readonly]):not([disabled]) {
    border-color: ${({ hasError }) => hasError ? statusColors.error : primary[500]};
  }
`;

/**
 * Input component that provides a standardized text input with various states
 * 
 * @param {InputProps} props - The component props
 * @returns {JSX.Element} Rendered input component
 */
const Input: React.FC<InputProps> = ({
  id,
  name,
  type = 'text',
  value,
  placeholder,
  hasError = false,
  fullWidth = true,
  disabled = false,
  readOnly = false,
  onChange,
  onBlur,
  onFocus,
  className,
  style,
  ...rest
}) => {
  return (
    <StyledInput
      id={id}
      name={name}
      type={type}
      value={value}
      placeholder={placeholder}
      hasError={hasError}
      fullWidth={fullWidth}
      disabled={disabled}
      readOnly={readOnly}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      className={className}
      style={style}
      aria-invalid={hasError}
      aria-disabled={disabled}
      {...rest}
    />
  );
};

export default Input;