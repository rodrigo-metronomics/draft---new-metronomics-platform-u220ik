import React from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.10
import Button from './Button';
import Card from './Card';
import { Severity } from '../../types/common.types';
import { GENERIC_ERRORS } from '../../utils/constants/errorMessages';

// Styled components for the error boundary UI
const ErrorContainer = styled.div`
  padding: 16px;
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const ErrorMessage = styled.p`
  font-size: 16px;
  font-weight: 500;
  margin: 16px 0;
  color: ${props => props.theme.colors?.error[500]};
`;

const ErrorActions = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: center;
`;

// Interface for the error boundary state
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Interface for props passed to fallback components
interface FallbackProps {
  error: Error | null;
  resetErrorBoundary: () => void;
}

// Interface for the ErrorBoundary component props
interface ErrorBoundaryProps {
  children: React.ReactNode;
  FallbackComponent?: React.ComponentType<FallbackProps>;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
  resetOnChange?: boolean;
  resetKeys?: Array<unknown>;
}

/**
 * Default fallback UI component displayed when an error occurs
 * Provides a simple error message and retry button
 */
const DefaultFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <Card variant="error">
      <ErrorContainer>
        <ErrorMessage>
          {error?.message || GENERIC_ERRORS.INTERNAL_ERROR}
        </ErrorMessage>
        <ErrorActions>
          <Button 
            label="Try Again" 
            severity={Severity.ERROR} 
            onClick={resetErrorBoundary}
            aria-label="Retry and recover from error"
          />
        </ErrorActions>
      </ErrorContainer>
    </Card>
  );
};

/**
 * React component that catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the application.
 * 
 * Usage:
 * ```jsx
 * <ErrorBoundary
 *   FallbackComponent={CustomErrorComponent}
 *   onError={(error, errorInfo) => logErrorToService(error, errorInfo)}
 *   resetKeys={[someValue]}
 *   resetOnChange={true}
 * >
 *   <ComponentThatMightError />
 * </ErrorBoundary>
 * ```
 */
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetKeys: Array<unknown>;

  static defaultProps = {
    resetOnChange: false,
    resetKeys: [],
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.resetKeys = props.resetKeys || [];
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log the error to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetOnChange, resetKeys } = this.props;

    // If resetOnChange is enabled, check if any resetKeys have changed
    if (resetOnChange && resetKeys && prevProps.resetKeys) {
      // Only compare if lengths are the same
      const keys = resetKeys || [];
      const prevKeys = prevProps.resetKeys || [];

      // Check if the keys have changed by comparing every element
      const haveKeysChanged = keys.length !== prevKeys.length || 
        keys.some((key, index) => key !== prevKeys[index]);

      if (haveKeysChanged) {
        this.resetErrorBoundary();
      }
    }

    // Update the stored resetKeys
    this.resetKeys = resetKeys || [];
  }

  resetErrorBoundary = (): void => {
    // Reset the error state
    this.setState({ hasError: false, error: null });
    
    // Call the onReset callback if provided
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { fallback, FallbackComponent, children } = this.props;

    // If there's an error, show the fallback UI
    if (hasError) {
      // If a custom FallbackComponent is provided, use it
      if (FallbackComponent) {
        return <FallbackComponent error={error} resetErrorBoundary={this.resetErrorBoundary} />;
      }

      // If a fallback React node is provided, use it
      if (fallback) {
        return fallback;
      }

      // Otherwise use the default fallback UI
      return <DefaultFallback error={error} resetErrorBoundary={this.resetErrorBoundary} />;
    }

    // If there's no error, render the children
    return children;
  }
}

export default ErrorBoundary;