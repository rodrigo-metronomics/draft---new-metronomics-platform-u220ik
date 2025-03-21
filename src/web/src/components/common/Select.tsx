import React from 'react';
import styled, { css } from 'styled-components';

import { colors, statusColors } from '../../styles/colors';
import { inputStyle, focusOutline, transition } from '../../styles/mixins';
import { textStyles } from '../../styles/typography';
import { Size, SelectOption } from '../../types/common.types';

// Interface for the Select component props
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id?: string;
  name?: string;
  value?: any;
  placeholder?: string;
  options?: SelectOption[];
  hasError?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  size?: Size;
  onChange?: (value: any) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  className?: string;
  style?: React.CSSProperties;
}

// Container component for the select
const SelectContainer = styled.div<{ fullWidth?: boolean }>`
  position: relative;
  display: inline-block;
  width: ${(props) => (props.fullWidth ? '100%' : 'auto')};
`;

// Custom arrow component
const SelectArrow = styled.div<{ disabled?: boolean }>`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: ${(props) => (props.disabled ? colors.neutral[400] : colors.neutral[600])};
`;

// Styled select component
const StyledSelect = styled.select<{
  hasError?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  size?: Size;
}>`
  ${inputStyle}
  ${textStyles.body1}
  ${focusOutline}
  ${transition('all', 'fast')}
  
  appearance: none;
  padding: ${(props) => {
    switch (props.size) {
      case 'small':
        return '0.5rem 0.75rem';
      case 'large':
        return '1rem 1.25rem';
      default:
        return '0.75rem 1rem';
    }
  }};
  
  height: ${(props) => {
    switch (props.size) {
      case 'small':
        return '2rem';
      case 'large':
        return '3rem';
      default:
        return '2.5rem';
    }
  }};
  
  border: 1px solid ${colors.neutral[300]};
  border-radius: 0.25rem;
  background-color: ${(props) => (props.disabled ? colors.neutral[100] : colors.white)};
  color: ${colors.neutral[900]};
  width: ${(props) => (props.fullWidth ? '100%' : 'auto')};
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  
  &:hover:not(:disabled) {
    border-color: ${colors.neutral[400]};
  }
  
  &:focus {
    border-color: ${(props) => (props.hasError ? statusColors.error : colors.primary[500])};
  }
  
  ${(props) =>
    props.hasError &&
    css`
      border-color: ${statusColors.error};
      
      &:focus {
        border-color: ${statusColors.error};
      }
    `}
  
  ${(props) =>
    props.disabled &&
    css`
      opacity: 0.7;
      background-color: ${colors.neutral[100]};
    `}
  
  /* Custom dropdown arrow */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236B7280' d='M2.18 4.34c-.26-.32-.02-.84.39-.84h6.86c.41 0 .65.52.39.84L6.39 9.06c-.21.25-.57.25-.78 0L2.18 4.34z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 0.75rem;
  padding-right: 2.5rem;
  
  &::-ms-expand {
    display: none;
  }
  
  &::placeholder,
  & option[value=""][disabled] {
    color: ${colors.neutral[400]};
  }
`;

/**
 * A customizable select component that provides a native HTML select element 
 * with Metronomics design system styling.
 */
const Select: React.FC<SelectProps> = ({
  id,
  name,
  value,
  placeholder,
  options = [],
  hasError = false,
  fullWidth = true,
  disabled = false,
  size = 'medium',
  onChange,
  onBlur,
  onFocus,
  className,
  style,
  ...rest
}) => {
  // Handle the onChange event
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <SelectContainer fullWidth={fullWidth} className={className} style={style}>
      <StyledSelect
        id={id}
        name={name}
        value={value}
        hasError={hasError}
        fullWidth={fullWidth}
        disabled={disabled}
        size={size}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </StyledSelect>
    </SelectContainer>
  );
};

export default Select;