import React from 'react'; // ^18.2.0
import { InputTextarea } from 'primereact/inputtextarea'; // ^10.0.0
import styled, { css } from 'styled-components'; // ^5.3.10
import { neutral, primary, statusColors } from '../../styles/colors';
import { inputStyle, focusOutline, transition } from '../../styles/mixins';
import { textStyles } from '../../styles/typography';

/**
 * Props for the TextArea component
 */
interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  id?: string;
  name?: string;
  value?: any;
  placeholder?: string;
  hasError?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  rows?: number;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Styled TextArea component that extends PrimeReact's InputTextarea
 * with Metronomics Platform styling
 */
const StyledTextArea = styled(InputTextarea)<{
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
  background-color: ${props => (props.disabled || props.readOnly) ? neutral[100] : neutral.white};
  color: ${neutral[900]};
  min-height: 6rem;
  resize: vertical;
  transition: ${transition('all', 'fast')};
  width: ${props => (props.fullWidth ? '100%' : 'auto')};

  &::placeholder {
    color: ${neutral[400]};
  }

  ${props =>
    props.hasError &&
    css`
      border-color: ${statusColors.error};
      
      &:focus {
        border-color: ${statusColors.error};
      }
    `}

  ${props =>
    !props.hasError &&
    css`
      &:focus {
        border-color: ${primary[500]};
      }
    `}

  ${props =>
    props.disabled &&
    css`
      cursor: not-allowed;
      opacity: 0.7;
    `}
`;

/**
 * TextArea component for multi-line text input with consistent styling and behavior.
 * 
 * @example
 * <TextArea
 *   id="comments"
 *   name="comments"
 *   placeholder="Enter your comments"
 *   rows={6}
 *   onChange={handleChange}
 * />
 */
const TextArea: React.FC<TextAreaProps> = ({
  id,
  name,
  value,
  placeholder,
  hasError = false,
  fullWidth = true,
  disabled = false,
  readOnly = false,
  rows = 4,
  onChange,
  onBlur,
  onFocus,
  className,
  style,
  ...rest
}) => {
  return (
    <StyledTextArea
      id={id}
      name={name}
      value={value}
      placeholder={placeholder}
      hasError={hasError}
      fullWidth={fullWidth}
      disabled={disabled}
      readOnly={readOnly}
      rows={rows}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      className={className}
      style={style}
      aria-invalid={hasError}
      aria-disabled={disabled}
      aria-readonly={readOnly}
      {...rest}
    />
  );
};

export default TextArea;