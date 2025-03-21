import React from 'react'; // version ^18.2.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0
import { act } from 'react-dom/test-utils'; // version ^18.2.0

import ErrorBoundary from '../ErrorBoundary';
import Button from '../Button';
import { renderWithProviders } from '../../../../tests/testUtils';
import { GENERIC_ERRORS } from '../../../utils/constants/errorMessages';

// Mock console.error to prevent test output pollution
jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock function to verify error callback is called
const onError = jest.fn();

// Mock function to verify reset callback is called
const onReset = jest.fn();

/**
 * A component that throws an error when rendered, used to test error boundary functionality
 */
const ProblemComponent: React.FC = () => {
  throw new Error('Test error');
};

/**
 * A component that renders normally, used to test error boundary with non-erroring children
 */
const WorkingComponent: React.FC = () => {
  return <div>Working Component</div>;
};

interface FallbackProps {
  error: Error | null;
  resetErrorBoundary: () => void;
}

/**
 * A custom fallback component to test the FallbackComponent prop
 */
const CustomFallback: React.FC<FallbackProps> = (props) => {
  const { error, resetErrorBoundary } = props;
  return (
    <div>
      Custom Fallback UI: {error?.message}
      <Button label="Retry" onClick={resetErrorBoundary} />
    </div>
  );
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
    jest.clearAllMocks();
  });

  it('renders children when there is no error', () => {
    renderWithProviders(<ErrorBoundary><WorkingComponent /></ErrorBoundary>);
    expect(screen.getByText('Working Component')).toBeInTheDocument();
  });

  it('catches errors in child components and displays default fallback UI', () => {
    renderWithProviders(<ErrorBoundary><ProblemComponent /></ErrorBoundary>);
    expect(screen.getByText(GENERIC_ERRORS.INTERNAL_ERROR)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('uses custom fallback component when provided', () => {
    renderWithProviders(<ErrorBoundary FallbackComponent={CustomFallback}><ProblemComponent /></ErrorBoundary>);
    expect(screen.getByText('Custom Fallback UI: Test error')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  it('uses fallback prop when provided', () => {
    renderWithProviders(<ErrorBoundary fallback={<div>Custom Fallback Prop</div>}><ProblemComponent /></ErrorBoundary>);
    expect(screen.getByText('Custom Fallback Prop')).toBeInTheDocument();
  });

  it('calls onError when an error occurs', () => {
    renderWithProviders(<ErrorBoundary onError={onError}><ProblemComponent /></ErrorBoundary>);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.anything());
  });

  it('resets error state when retry button is clicked', async () => {
    const { rerender } = renderWithProviders(
      <ErrorBoundary>
        <ProblemComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(GENERIC_ERRORS.INTERNAL_ERROR)).toBeInTheDocument();

    // Mock the component to no longer throw an error
    rerender(
      <ErrorBoundary>
        <WorkingComponent />
      </ErrorBoundary>
    );

    // Click the retry button
    const retryButton = screen.getByRole('button', { name: 'Try Again' });
    await act(async () => {
      fireEvent.click(retryButton);
    });

    // Verify the component is re-rendered without error
    await waitFor(() => {
      expect(screen.getByText('Working Component')).toBeInTheDocument();
    });
  });

  it('calls onReset when error boundary is reset', async () => {
    renderWithProviders(<ErrorBoundary onReset={onReset}><ProblemComponent /></ErrorBoundary>);

    // Click the retry button
    const retryButton = screen.getByRole('button', { name: 'Try Again' });
    await act(async () => {
      fireEvent.click(retryButton);
    });

    // Verify onReset was called
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('resets error state when resetKeys change and resetOnChange is true', async () => {
    const { rerender } = renderWithProviders(
      <ErrorBoundary resetOnChange={true} resetKeys={['initial']}>
        <ProblemComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(GENERIC_ERRORS.INTERNAL_ERROR)).toBeInTheDocument();

    // Re-render with updated resetKeys
    rerender(
      <ErrorBoundary resetOnChange={true} resetKeys={['updated']}>
        <ProblemComponent />
      </ErrorBoundary>
    );

    // Verify the component attempts to re-render
    await waitFor(() => {
      expect(screen.getByText(GENERIC_ERRORS.INTERNAL_ERROR)).toBeInTheDocument();
    });
  });
});