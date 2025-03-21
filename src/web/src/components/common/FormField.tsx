import React, { ReactNode } from 'react';
import styled from 'styled-components'; // ^5.3.10
import { colors, statusColors } from '../../styles/colors';
import { textStyles } from '../../styles/typography';

/**
 * Interface for FormField props defining all available configuration options
 */
export interface FormFieldProps {
  id: string;
  name: string;
  label?: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  className?: string;
  style?: React.CSSProperties;
  helpText?: string;
  children: ReactNode;
}

/**
 * Container for the entire form field with configurable width
 */
const FormFieldContainer = styled.div<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
  width: ${props => props.fullWidth ? '100%' : 'auto'};
`;

/**
 * Styled label with required field indicator
 */
const Label = styled.label<{ required?: boolean }>`
  ${textStyles.label}
  color: ${colors.neutral[900]};
  margin-bottom: 0.5rem;
  font-weight: 500;
  
  ${props => props.required && `
    &::after {
      content: '*';
      color: ${statusColors.error};
      margin-left: 0.25rem;
    }
  `}
`;

/**
 * Error message container for validation feedback
 */
const ErrorMessage = styled.div`
  ${textStyles.caption}
  color: ${statusColors.error};
  margin-top: 0.25rem;
  font-weight: 400;
`;

/**
 * Help text container for additional field guidance
 */
const HelpText = styled.div`
  ${textStyles.caption}
  color: ${colors.neutral[500]};
  margin-top: 0.25rem;
  font-weight: 400;
`;

/**
 * A reusable form field component that provides consistent layout and styling for form inputs.
 * Handles labels, error messages, help text, and ARIA attributes for accessibility.
 */
const FormField: React.FC<FormFieldProps> = ({
  id,
  name,
  label,
  error,
  touched = false,
  required = false,
  fullWidth = true,
  className,
  style,
  helpText,
  children,
  ...rest
}) => {
  // Only show error if field has been touched and there is an error
  const showError = !!error && touched;
  
  return (
    <FormFieldContainer 
      fullWidth={fullWidth} 
      className={className} 
      style={style} 
      {...rest}
    >
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}
      
      {/* Pass necessary props to child input element if it's a valid React element */}
      {React.isValidElement(children) ? 
        React.cloneElement(children as React.ReactElement, { 
          id, 
          name, 
          'aria-invalid': showError,
          'aria-describedby': showError ? `${id}-error` : helpText ? `${id}-help` : undefined,
          required 
        }) : 
        children
      }
      
      {showError && (
        <ErrorMessage id={`${id}-error`} role="alert">
          {error}
        </ErrorMessage>
      )}
      
      {helpText && !showError && (
        <HelpText id={`${id}-help`}>
          {helpText}
        </HelpText>
      )}
    </FormFieldContainer>
  );
};

export default FormField;