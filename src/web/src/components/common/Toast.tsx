import React, { useRef, forwardRef, useImperativeHandle, ForwardRefRenderFunction } from 'react';
import styled from 'styled-components'; // version ^5.3.10
import { Toast as PrimeToast, ToastMessage } from 'primereact/toast'; // version ^10.0.0
import { colors, statusColors } from '../../styles/colors';
import { boxShadow } from '../../styles/mixins';

/**
 * Props interface for the Toast component
 */
export interface ToastProps {
  /**
   * Position of the toast container
   * @default 'top-right'
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  
  /**
   * Additional CSS class for the toast container
   */
  className?: string;
  
  /**
   * Inline styles for the toast container
   */
  style?: React.CSSProperties;
  
  /**
   * Base z-index value for the toast container
   * @default 1000
   */
  baseZIndex?: number;
  
  /**
   * Whether to automatically manage z-index
   * @default true
   */
  autoZIndex?: boolean;
}

/**
 * Interface for the methods exposed through the Toast ref
 */
export interface ToastRef {
  /**
   * Shows a toast message with the provided options
   */
  show(options: ToastOptions): void;
  
  /**
   * Shows a success toast message
   */
  success(summary: string, detail?: string, life?: number): void;
  
  /**
   * Shows an info toast message
   */
  info(summary: string, detail?: string, life?: number): void;
  
  /**
   * Shows a warning toast message
   */
  warn(summary: string, detail?: string, life?: number): void;
  
  /**
   * Shows an error toast message
   */
  error(summary: string, detail?: string, life?: number): void;
}

/**
 * Options interface for configuring toast messages
 */
export interface ToastOptions {
  /**
   * Severity level of the toast message
   */
  severity?: 'success' | 'info' | 'warn' | 'error';
  
  /**
   * Title/summary of the toast message
   */
  summary?: string;
  
  /**
   * Detailed message content
   */
  detail?: string;
  
  /**
   * Duration in milliseconds the toast will be displayed
   */
  life?: number;
  
  /**
   * Whether the toast should stay until manually closed
   */
  sticky?: boolean;
  
  /**
   * Whether the toast can be closed by the user
   * @default true
   */
  closable?: boolean;
  
  /**
   * Custom icon to display
   */
  icon?: string;
  
  /**
   * Callback when toast is clicked
   */
  onClick?: (message: ToastMessage) => void;
  
  /**
   * Callback when toast is closed
   */
  onClose?: (message: ToastMessage) => void;
}

/**
 * Styled component that wraps PrimeReact's Toast
 */
const StyledToast = styled(PrimeToast)`
  /* Ensure toast container has appropriate z-index */
  z-index: ${props => props.baseZIndex || 1000};

  /* Style the toast message container */
  .p-toast-message {
    border-radius: 6px;
    padding: 12px 16px;
    margin-bottom: 12px;
    box-shadow: ${boxShadow('md')};
    border-width: 0; /* Remove default border */
    display: flex;
    align-items: flex-start;

    /* Customize toast appearance based on severity */
    &.p-toast-message-success {
      background-color: ${colors.success[50]};
      border-left: 4px solid ${statusColors.success};
      color: ${colors.success[900]};
    }

    &.p-toast-message-info {
      background-color: ${colors.info[50]};
      border-left: 4px solid ${statusColors.info};
      color: ${colors.info[900]};
    }

    &.p-toast-message-warn {
      background-color: ${colors.warning[50]};
      border-left: 4px solid ${statusColors.warning};
      color: ${colors.warning[900]};
    }

    &.p-toast-message-error {
      background-color: ${colors.error[50]};
      border-left: 4px solid ${statusColors.error};
      color: ${colors.error[900]};
    }
  }

  /* Style the toast content */
  .p-toast-message-content {
    display: flex;
    align-items: flex-start;
    padding: 0;
  }

  /* Style the toast icon */
  .p-toast-message-icon {
    margin-right: 12px;
    font-size: 1.25rem;
  }

  /* Style the toast text */
  .p-toast-summary {
    font-weight: 600;
    margin-bottom: 4px;
  }

  .p-toast-detail {
    font-weight: 400;
    margin: 0;
  }

  /* Style the close button */
  .p-toast-icon-close {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: transparent;
    color: inherit;
    opacity: 0.7;
    transition: background-color 0.2s, opacity 0.2s;
    margin-left: 12px;
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.1);
      opacity: 1;
    }
    
    &:focus {
      outline: none;
      box-shadow: 0 0 0 2px ${colors.primary[100]};
    }
  }

  /* Responsive adjustments */
  @media (max-width: 576px) {
    width: 90%;
    
    .p-toast-message {
      padding: 10px 12px;
    }
  }
`;

/**
 * Implementation of the Toast component that forwards refs
 */
const ToastComponent: ForwardRefRenderFunction<ToastRef, ToastProps> = (props, ref) => {
  // Create ref for the PrimeReact Toast component
  const toastRef = useRef<PrimeToast>(null);
  
  // Destructure props with defaults
  const { 
    position = 'top-right',
    baseZIndex = 1000,
    autoZIndex = true,
    ...rest 
  } = props;

  // Expose methods through the ref
  useImperativeHandle(ref, () => ({
    show: (options: ToastOptions) => {
      if (toastRef.current) {
        toastRef.current.show(options as ToastMessage);
      }
    },
    success: (summary: string, detail?: string, life?: number) => {
      if (toastRef.current) {
        toastRef.current.show({
          severity: 'success',
          summary,
          detail,
          life: life || 3000,
          closable: true,
        });
      }
    },
    info: (summary: string, detail?: string, life?: number) => {
      if (toastRef.current) {
        toastRef.current.show({
          severity: 'info',
          summary,
          detail,
          life: life || 3000,
          closable: true,
        });
      }
    },
    warn: (summary: string, detail?: string, life?: number) => {
      if (toastRef.current) {
        toastRef.current.show({
          severity: 'warn',
          summary,
          detail,
          life: life || 4000,
          closable: true,
        });
      }
    },
    error: (summary: string, detail?: string, life?: number) => {
      if (toastRef.current) {
        toastRef.current.show({
          severity: 'error',
          summary,
          detail,
          life: life || 5000,
          closable: true,
        });
      }
    },
  }));

  return (
    <StyledToast 
      ref={toastRef} 
      position={position}
      baseZIndex={baseZIndex}
      autoZIndex={autoZIndex}
      {...rest} 
    />
  );
};

/**
 * Toast component with forwarded ref
 * Provides a reusable notification system with different severity levels
 */
export const Toast = forwardRef(ToastComponent);