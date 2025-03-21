import React from 'react';
import { Dropdown as PrimeDropdown } from 'primereact/dropdown'; // version ^10.0.0
import styled, { css } from 'styled-components'; // version ^5.3.10
import { neutral, primary, border, statusColors } from '../../styles/colors';
import { inputReset, focusOutline, transition } from '../../styles/mixins';
import { textStyles } from '../../styles/typography';
import { Size, SelectOption } from '../../types/common.types';

interface DropdownProps {
  id?: string;
  name?: string;
  label?: string;
  value?: any;
  placeholder?: string;
  options?: SelectOption[];
  error?: boolean;
  errorMessage?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  variant?: 'outlined' | 'filled';
  size?: Size;
  onChange?: (e: any) => void;
  onBlur?: (e: any) => void;
  onFocus?: (e: any) => void;
  className?: string;
  style?: React.CSSProperties;
  optionLabel?: string;
  optionValue?: string;
  showClear?: boolean;
  emptyMessage?: string;
}

const StyledDropdown = styled(PrimeDropdown)<{
  error?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  variant?: string;
  size?: Size;
}>`
  ${inputReset}
  ${textStyles.body1}
  ${focusOutline}
  
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  border: ${props => props.variant === 'outlined' ? `1px solid ${border.default}` : 'none'};
  border-radius: 0.25rem;
  background-color: ${props => 
    props.variant === 'outlined' 
      ? neutral.white 
      : neutral[100]
  };
  transition: ${transition('all', 'fast')};
  
  ${props => (props.disabled || props.readOnly) && css`
    background-color: ${neutral.lightest};
    cursor: not-allowed;
    opacity: 0.7;
  `}
  
  ${props => props.error && css`
    border-color: ${statusColors.error} !important;
  `}
  
  &:hover:not(:disabled):not([readonly]) {
    border-color: ${props => props.error ? statusColors.error : primary[400]};
  }
  
  &:focus-within:not([readonly]) {
    border-color: ${props => props.error ? statusColors.error : primary[500]};
    box-shadow: 0 0 0 2px ${props => props.error 
      ? `rgba(239, 68, 68, 0.25)` // statusColors.error with opacity
      : `rgba(24, 144, 255, 0.25)` // primary[500] with opacity
    };
  }
  
  ${props => {
    switch (props.size) {
      case 'SMALL':
        return css`
          .p-dropdown-label {
            padding: 0.25rem 0.5rem;
            font-size: 0.875rem;
          }
          .p-dropdown-trigger {
            padding: 0.25rem;
          }
        `;
      case 'LARGE':
        return css`
          .p-dropdown-label {
            padding: 0.625rem 1rem;
            font-size: 1.125rem;
          }
          .p-dropdown-trigger {
            padding: 0.625rem;
          }
        `;
      default: // MEDIUM
        return css`
          .p-dropdown-label {
            padding: 0.5rem 0.75rem;
            font-size: 1rem;
          }
          .p-dropdown-trigger {
            padding: 0.5rem;
          }
        `;
    }
  }}
  
  .p-dropdown-label {
    color: ${neutral.darkest};
    transition: ${transition('color', 'fast')};
  }
  
  .p-dropdown-label.p-placeholder {
    color: ${neutral[500]};
  }
  
  .p-dropdown-trigger {
    color: ${neutral[600]};
    transition: ${transition('color', 'fast')};
  }
  
  &:hover:not(:disabled):not([readonly]) .p-dropdown-trigger {
    color: ${neutral[700]};
  }
  
  .p-dropdown-panel {
    border-radius: 0.25rem;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    
    .p-dropdown-items {
      padding: 0.25rem 0;
      
      .p-dropdown-item {
        padding: 0.5rem 1rem;
        transition: ${transition('background-color', 'fast')};
        
        &:hover {
          background-color: ${neutral[100]};
        }
        
        &.p-highlight {
          background-color: ${primary[100]};
          color: ${primary[700]};
        }
      }
    }
  }
  
  /* Clear button styling */
  .p-dropdown-clear-icon {
    color: ${neutral[500]};
    transition: ${transition('color', 'fast')};
    
    &:hover {
      color: ${neutral[700]};
    }
  }
  
  /* Disabled state */
  &.p-disabled {
    opacity: 0.6;
    pointer-events: none;
  }
  
  /* PrimeReact specific overrides */
  .p-dropdown-items-wrapper {
    max-height: 200px;
  }
  
  /* Empty message styling */
  .p-dropdown-empty-message {
    padding: 0.5rem 1rem;
    color: ${neutral[500]};
  }
`;

const Label = styled.label<{ disabled?: boolean }>`
  ${textStyles.body1}
  color: ${props => props.disabled ? neutral[400] : neutral[800]};
  margin-bottom: 0.25rem;
  display: block;
  font-weight: 500;
`;

const ErrorMessage = styled.div`
  color: ${statusColors.error};
  font-size: 0.75rem;
  margin-top: 0.25rem;
  min-height: 1.25rem;
`;

const DropdownContainer = styled.div<{ fullWidth?: boolean }>`
  width: ${props => props.fullWidth ? '100%' : 'auto'};
  display: flex;
  flex-direction: column;
`;

const Dropdown = (props: DropdownProps) => {
  const {
    id,
    name,
    label,
    value,
    placeholder,
    options,
    error,
    errorMessage,
    fullWidth,
    disabled,
    readOnly,
    variant,
    size,
    onChange,
    onBlur,
    onFocus,
    className,
    style,
    optionLabel,
    optionValue,
    showClear,
    emptyMessage,
  } = props;

  const handleChange = (e: any) => {
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <DropdownContainer fullWidth={fullWidth}>
      {label && <Label htmlFor={id} disabled={disabled}>{label}</Label>}
      <StyledDropdown
        id={id}
        name={name}
        value={value}
        options={options}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        error={error}
        fullWidth={fullWidth}
        variant={variant}
        size={size}
        className={className}
        style={style}
        optionLabel={optionLabel}
        optionValue={optionValue}
        showClear={showClear}
        emptyMessage={emptyMessage}
        aria-label={label}
        aria-invalid={error}
        aria-describedby={error && errorMessage ? `${id}-error` : undefined}
      />
      {error && errorMessage && (
        <ErrorMessage id={`${id}-error`}>{errorMessage}</ErrorMessage>
      )}
    </DropdownContainer>
  );
};

Dropdown.defaultProps = {
  error: false,
  fullWidth: true,
  disabled: false,
  readOnly: false,
  variant: 'outlined',
  size: 'MEDIUM',
  optionLabel: 'label',
  optionValue: 'value',
  showClear: false,
  emptyMessage: 'No options available'
};

export default Dropdown;