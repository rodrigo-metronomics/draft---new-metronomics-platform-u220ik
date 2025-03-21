import React from 'react';
import styled, { css } from 'styled-components';
import { InputSwitch } from 'primereact/inputswitch'; // version ^10.0.0
import { colors } from '../../styles/colors';
import { focusOutline, transition } from '../../styles/mixins';
import { textStyles } from '../../styles/typography';
import { Size } from '../../types/common.types';

interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  id?: string;
  name?: string;
  checked?: boolean;
  label?: string;
  labelPosition?: 'left' | 'right';
  size?: Size;
  hasError?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}

const ToggleContainer = styled.div<{ disabled?: boolean; labelPosition?: string }>`
  display: flex;
  align-items: center;
  flex-direction: ${({ labelPosition }) => labelPosition === 'left' ? 'row-reverse' : 'row'};
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  opacity: ${({ disabled }) => disabled ? 0.7 : 1};
  margin: 0.5rem 0;
  user-select: none;
`;

const StyledToggle = styled(InputSwitch)<{ hasError?: boolean; disabled?: boolean; size?: Size }>`
  ${focusOutline}
  
  .p-inputswitch-slider {
    background-color: ${({ disabled }) => disabled ? colors.neutral[200] : colors.neutral[300]};
    border-radius: 999px;
    ${transition('background-color, border-color', 'fast')}
    
    ${({ hasError }) => hasError && css`
      border: 1px solid ${colors.error[500]};
    `}
  }
  
  .p-inputswitch-slider::before {
    background-color: ${colors.white};
    border-radius: 50%;
    ${transition('transform', 'fast')}
  }
  
  &.p-inputswitch-checked .p-inputswitch-slider {
    background-color: ${({ disabled }) => disabled ? colors.primary[300] : colors.primary[500]};
  }
  
  // Size variants
  ${({ size }) => size === Size.SMALL && css`
    width: 2rem;
    height: 1rem;
    
    .p-inputswitch-slider::before {
      width: 0.75rem;
      height: 0.75rem;
    }
  `}
  
  ${({ size }) => (size === Size.MEDIUM || !size) && css`
    width: 2.5rem;
    height: 1.25rem;
    
    .p-inputswitch-slider::before {
      width: 1rem;
      height: 1rem;
    }
  `}
  
  ${({ size }) => size === Size.LARGE && css`
    width: 3rem;
    height: 1.5rem;
    
    .p-inputswitch-slider::before {
      width: 1.25rem;
      height: 1.25rem;
    }
  `}
`;

const ToggleLabel = styled.label<{ disabled?: boolean; labelPosition?: string }>`
  ${textStyles.body2}
  margin-left: ${({ labelPosition }) => labelPosition === 'right' ? '0.5rem' : 0};
  margin-right: ${({ labelPosition }) => labelPosition === 'left' ? '0.5rem' : 0};
  color: ${({ disabled }) => disabled ? colors.neutral[500] : colors.neutral[700]};
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
`;

/**
 * A customizable toggle switch component that extends PrimeReact InputSwitch 
 * with Metronomics design system styling.
 */
export const Toggle: React.FC<ToggleProps> = ({
  id,
  name,
  checked,
  label,
  labelPosition = 'right',
  size = Size.MEDIUM,
  hasError = false,
  disabled = false,
  onChange,
  className,
  style,
  ...rest
}) => {
  const handleChange = (e: { value: boolean; originalEvent: React.ChangeEvent<HTMLInputElement> }) => {
    if (onChange) {
      onChange(e.value);
    }
  };

  return (
    <ToggleContainer 
      className={className} 
      style={style}
      disabled={disabled}
      labelPosition={labelPosition}
    >
      <StyledToggle
        id={id}
        name={name}
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        hasError={hasError}
        size={size}
        aria-checked={checked}
        {...rest}
      />
      {label && (
        <ToggleLabel 
          htmlFor={id} 
          disabled={disabled}
          labelPosition={labelPosition}
        >
          {label}
        </ToggleLabel>
      )}
    </ToggleContainer>
  );
};

export default Toggle;