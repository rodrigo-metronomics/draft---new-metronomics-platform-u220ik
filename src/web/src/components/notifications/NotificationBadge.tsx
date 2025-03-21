import React from 'react';
import styled from 'styled-components';
import { colors } from '../../styles/colors';
import { useNotifications } from '../../hooks/useNotifications';

type BadgePosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

interface NotificationBadgeProps {
  /** Number of notifications to display (optional, uses unreadCount from context if not provided) */
  count?: number;
  /** Position of the badge relative to its parent element */
  position?: BadgePosition;
  /** Whether to hide the badge when count is zero */
  hideWhenZero?: boolean;
  /** Additional CSS class for styling */
  className?: string;
  /** Maximum value to display before showing '+' suffix (e.g., 99+) */
  maxDisplayValue?: number;
}

const Badge = styled.div<{ position: BadgePosition }>`
  position: absolute;
  background-color: ${colors.error.main};
  color: ${colors.white};
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: bold;
  min-width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.25rem;
  box-sizing: border-box;
  border: 2px solid ${colors.white};
  z-index: 1;
  
  ${({ position }) => {
    switch (position) {
      case 'top-right':
        return `
          top: -0.5rem;
          right: -0.5rem;
        `;
      case 'top-left':
        return `
          top: -0.5rem;
          left: -0.5rem;
        `;
      case 'bottom-right':
        return `
          bottom: -0.5rem;
          right: -0.5rem;
        `;
      case 'bottom-left':
        return `
          bottom: -0.5rem;
          left: -0.5rem;
        `;
      default:
        return `
          top: -0.5rem;
          right: -0.5rem;
        `;
    }
  }}
`;

/**
 * A component that displays a notification count badge.
 * Can be positioned in different locations relative to its parent element.
 * Optionally hides when the count is zero.
 */
const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  position = 'top-right',
  hideWhenZero = true,
  className,
  maxDisplayValue = 99,
  ...rest
}) => {
  // Get unreadCount from useNotifications hook if count prop is not provided
  const { unreadCount } = useNotifications();
  
  // Determine the final count to display (defaulting to 0 if undefined)
  const displayCount = Math.max(0, count !== undefined ? count : (unreadCount || 0));
  
  // If hideWhenZero is true and count is zero, don't render the badge
  if (hideWhenZero && displayCount === 0) {
    return null;
  }
  
  // Format the count, adding a '+' if it exceeds maxDisplayValue
  const displayValue = displayCount > maxDisplayValue 
    ? `${maxDisplayValue}+` 
    : displayCount.toString();
  
  return (
    <Badge position={position} className={className} {...rest}>
      {displayValue}
    </Badge>
  );
};

export default NotificationBadge;