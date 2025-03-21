import React, { forwardRef, useImperativeHandle, useRef, ForwardRefRenderFunction } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.10
import { Toast, ToastRef, ToastOptions } from '../common/Toast';
import {
  NotificationType,
  NotificationPriority,
  NotificationToastOptions as INotificationToastOptions,
} from '../../types/notification.types';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { getNotificationIcon } from './NotificationItem';

/**
 * Maps notification priority to toast severity level
 * @param priority NotificationPriority
 * @returns Toast severity level (success, info, warn, error)
 */
const mapPriorityToSeverity = (priority: NotificationPriority): string => {
  switch (priority) {
    case NotificationPriority.HIGH:
      return 'error';
    case NotificationPriority.MEDIUM:
      return 'warn';
    case NotificationPriority.LOW:
      return 'info';
    default:
      return 'info';
  }
};

/**
 * Interface for the props of the NotificationToast component.
 * Extends ToastProps to include specific properties for notification display.
 */
export interface NotificationToastProps {
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
}

/**
 * Styled component that extends the base Toast component for notification-specific styling
 */
const StyledNotificationToast = styled(Toast)`
  /* Customizes the toast container with appropriate z-index and positioning */
  /* Applies custom styling to match the notification design in the Metronomics system */
  /* Adds notification-specific styling for different notification types */
  /* Ensures proper spacing and layout for notification content */
`;

/**
 * Styled component for the notification content area
 */
const NotificationContent = styled.div`
  /* Display: flex */
  /* Align-items: center */
  /* Gap: 0.75rem */
`;

/**
 * Styled component for the notification icon container
 */
const IconContainer = styled.div`
  /* Display: flex */
  /* Align-items: center */
  /* Justify-content: center */
  /* Flex-shrink: 0 */
  /* Width: 1.5rem */
  /* Height: 1.5rem */
`;

/**
 * Styled component for the notification text container
 */
const TextContainer = styled.div`
  /* Flex: 1 */
  /* Min-width: 0 */
  /* Overflow: hidden */
`;

/**
 * Interface for the ref object that allows imperative control of the NotificationToast component
 */
export interface NotificationToastRef {
  /**
   * Shows a toast message with the provided options
   * @param options ToastOptions
   */
  show: (options: ToastOptions) => void;
  /**
   * Shows a notification with type and priority
   * @param type NotificationType
   * @param priority NotificationPriority
   * @param summary string
   * @param detail string
   */
  showNotification: (type: NotificationType, priority: NotificationPriority, summary: string, detail: string) => void;
}

/**
 * Implementation of the NotificationToast component with ref forwarding
 * @param props NotificationToastProps
 * @param ref React.Ref<NotificationToastRef>
 * @returns Rendered NotificationToast component
 */
const NotificationToastComponent: ForwardRefRenderFunction<NotificationToastRef, NotificationToastProps> = (props, ref) => {
  // Create a ref for the underlying Toast component
  const toastRef = useRef<ToastRef>(null);

  // Destructure props to access position and other properties
  const {
    position = 'top-right',
    className,
    style,
  } = props;

  // Access the notification context
  const { showToast } = useNotificationContext();

  // Expose methods through useImperativeHandle to allow parent components to show notification toasts
  useImperativeHandle(ref, () => ({
    show: (options: ToastOptions) => {
      // Implement show method to display a notification toast with custom options
      toastRef.current?.show(options);
    },
    showNotification: (type: NotificationType, priority: NotificationPriority, summary: string, detail: string) => {
      // Implement showNotification method to display a notification with type and priority
      const severity = mapPriorityToSeverity(priority);
      const icon = getNotificationIcon(type);

      showToast({
        severity: severity as 'success' | 'info' | 'warn' | 'error',
        summary: summary,
        detail: detail,
      });
    },
  }), [showToast]);

  // Return the StyledNotificationToast component with ref passed to it
  return (
    <StyledNotificationToast
      ref={toastRef}
      position={position}
      className={className}
      style={style}
    />
  );
};

/**
 * A specialized toast component for displaying notification alerts with appropriate styling based on notification type and priority
 */
export const NotificationToast = forwardRef(NotificationToastComponent);