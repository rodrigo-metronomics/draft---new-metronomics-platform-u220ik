import React from 'react';
import { Badge as PrimeBadge } from 'primereact/badge'; // ^10.0.0
import styled, { css } from 'styled-components'; // ^5.3.10
import { colors, statusColors } from '../../styles/colors';
import { textStyles } from '../../styles/typography';
import { Severity, Size } from '../../types/common.types';

/**
 * Props for the Badge component
 */
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Text or numeric content to display in the badge */
  value?: string | number;
  /** Visual style variant (success, info, warning, error) */
  severity?: string;
  /** Size of the badge (small, medium, large) */
  size?: string;
  /** Position of the badge when used as an overlay (top-right, top-left, bottom-right, bottom-left) */
  position?: string;
  /** Whether to use pill shape with fully rounded corners */
  pill?: boolean;
  /** Whether to use an outlined style instead of filled */
  outlined?: boolean;
  /** Whether to display as a small dot without text */
  dot?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

/**
 * Styled PrimeReact Badge with Metronomics design system styling
 */
const StyledBadge = styled(PrimeBadge)<{
  severity: string;
  size: string;
  position: string;
  pill: boolean;
  outlined: boolean;
  dot: boolean;
}>`
  ${textStyles.badge}
  
  /* Apply styles based on severity */
  ${props => {
    let backgroundColor;
    let textColor = colors.white;
    
    // Determine background color based on severity
    switch (props.severity) {
      case Severity.SUCCESS:
        backgroundColor = statusColors.success;
        break;
      case Severity.WARNING:
        backgroundColor = statusColors.warning;
        break;
      case Severity.ERROR:
        backgroundColor = statusColors.error;
        break;
      case Severity.INFO:
      default:
        backgroundColor = statusColors.info;
        break;
    }
    
    if (props.outlined) {
      return css`
        background-color: transparent;
        color: ${backgroundColor};
        border: 1px solid ${backgroundColor};
      `;
    }
    
    return css`
      background-color: ${backgroundColor};
      color: ${textColor};
    `;
  }}
  
  /* Apply styles based on size */
  ${props => {
    switch (props.size) {
      case Size.SMALL:
        return css`
          font-size: 0.75rem;
          min-width: ${props.dot ? '0.5rem' : '1.25rem'};
          height: ${props.dot ? '0.5rem' : '1.25rem'};
          padding: ${props.dot ? '0' : '0 0.25rem'};
        `;
      case Size.LARGE:
        return css`
          font-size: 1rem;
          min-width: ${props.dot ? '1rem' : '2rem'};
          height: ${props.dot ? '1rem' : '2rem'};
          padding: ${props.dot ? '0' : '0 0.5rem'};
        `;
      case Size.MEDIUM:
      default:
        return css`
          font-size: 0.875rem;
          min-width: ${props.dot ? '0.75rem' : '1.5rem'};
          height: ${props.dot ? '0.75rem' : '1.5rem'};
          padding: ${props.dot ? '0' : '0 0.375rem'};
        `;
    }
  }}
  
  /* Apply pill style with fully rounded corners */
  ${props => props.pill && css`
    border-radius: 999px;
  `}
  
  /* Apply dot style (minimal size, no text) */
  ${props => props.dot && css`
    border-radius: 50%;
    display: inline-block;
    padding: 0;
  `}
  
  /* Apply positioning styles for overlay badges */
  ${props => {
    if (props.position) {
      const positions = props.position.split('-');
      const vertical = positions[0] || 'top';
      const horizontal = positions[1] || 'right';
      
      return css`
        position: absolute;
        ${vertical}: ${props.size === Size.SMALL ? '-4px' : '-8px'};
        ${horizontal}: ${props.size === Size.SMALL ? '-4px' : '-8px'};
      `;
    }
    
    return '';
  }}
`;

/**
 * A customizable badge component that displays status indicators, counts, or labels
 * with various visual styles and positioning options.
 * 
 * @example
 * // Basic usage with text
 * <Badge value="New" />
 * 
 * @example
 * // Numeric badge with success style
 * <Badge value={5} severity={Severity.SUCCESS} />
 * 
 * @example
 * // Positioned badge on another element
 * <Button label="Messages">
 *   <Badge value={3} position="top-right" />
 * </Button>
 * 
 * @example
 * // Dot style for simple indicators
 * <MenuItem label="Notifications">
 *   <Badge dot severity={Severity.ERROR} position="top-right" />
 * </MenuItem>
 */
const Badge: React.FC<BadgeProps> = ({
  value,
  severity = Severity.INFO,
  size = Size.MEDIUM,
  position = 'top-right',
  pill = false,
  outlined = false,
  dot = false,
  className,
  style,
  ...rest
}) => {
  return (
    <StyledBadge
      value={dot ? null : value}
      severity={severity}
      size={size}
      position={position}
      pill={pill}
      outlined={outlined}
      dot={dot}
      className={className}
      style={style}
      {...rest}
    />
  );
};

export default Badge;