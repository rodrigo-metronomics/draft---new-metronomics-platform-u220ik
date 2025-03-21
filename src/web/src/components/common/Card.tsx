import React, { ReactNode } from 'react';
import styled, { css } from 'styled-components'; // version ^5.3.10
import { Card as PrimeCard } from 'primereact/card'; // version ^10.0.0
import { 
  cardStyle, 
  flexBetween, 
  focusOutline, 
  transition, 
  boxShadow 
} from '../../styles/mixins';

/**
 * Props interface for the Card component
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Text to display in the card header */
  title?: string;
  /** Custom header content (overrides title) */
  header?: ReactNode;
  /** Content to display in the card footer */
  footer?: ReactNode;
  /** Action buttons or icons to display in the header */
  actions?: ReactNode;
  /** Visual style variant (default, primary, secondary, etc.) */
  variant?: string;
  /** Whether to add a shadow for elevated appearance */
  elevated?: boolean;
  /** Whether the card is clickable */
  interactive?: boolean;
  /** Whether to show a border around the card */
  bordered?: boolean;
  /** Whether the card should take up the full height of its container */
  fullHeight?: boolean;
  /** Content to render inside the card */
  children?: ReactNode;
  /** Click handler function (only used when interactive is true) */
  onClick?: () => void;
}

/**
 * Main styled card component built on PrimeReact Card
 */
const StyledCard = styled(PrimeCard)<{
  variant?: string;
  elevated?: boolean;
  interactive?: boolean;
  bordered?: boolean;
  fullHeight?: boolean;
}>`
  ${cardStyle}
  overflow: hidden;
  padding: 0; /* Override the padding from cardStyle to control it in child components */
  
  /* Apply different background/border colors based on variant */
  ${props => props.variant === 'primary' && css`
    border-left: 4px solid ${props => props.theme.colors?.primary[500]};
  `}
  
  ${props => props.variant === 'secondary' && css`
    border-left: 4px solid ${props => props.theme.colors?.secondary[500]};
  `}
  
  ${props => props.variant === 'success' && css`
    border-left: 4px solid ${props => props.theme.colors?.success[500]};
  `}
  
  ${props => props.variant === 'warning' && css`
    border-left: 4px solid ${props => props.theme.colors?.warning[500]};
  `}
  
  ${props => props.variant === 'error' && css`
    border-left: 4px solid ${props => props.theme.colors?.error[500]};
  `}
  
  /* Apply box-shadow when elevated prop is true */
  ${props => props.elevated && css`
    box-shadow: ${boxShadow('md')};
    border: none;
    
    &:hover {
      box-shadow: ${boxShadow('lg')};
    }
  `}
  
  /* Apply cursor:pointer and hover effects when interactive prop is true */
  ${props => props.interactive && css`
    cursor: pointer;
    transition: ${transition('transform, box-shadow', 'fast')};
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${boxShadow('md')};
    }
    
    &:active {
      transform: translateY(0);
    }
  `}
  
  /* Apply border styling when bordered prop is true (default) */
  ${props => !props.bordered && css`
    border: none;
  `}
  
  /* Apply height:100% when fullHeight prop is true */
  ${props => props.fullHeight && css`
    height: 100%;
    display: flex;
    flex-direction: column;
  `}
  
  /* Apply focusOutline when interactive and focused */
  ${props => props.interactive && css`
    ${focusOutline}
  `}
`;

/**
 * Card header component with flex layout for title and actions
 */
const CardHeader = styled.div`
  ${flexBetween}
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme.colors?.border?.light};
  font-weight: 500;
`;

/**
 * Card title component with proper text overflow handling
 */
const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/**
 * Card content component with padding and flex growth
 */
const CardContent = styled.div`
  padding: 16px;
  flex-grow: 1;
`;

/**
 * Card footer component with top border and slightly different background
 */
const CardFooter = styled.div`
  padding: 16px;
  border-top: 1px solid ${props => props.theme.colors?.border?.light};
  background-color: ${props => props.theme.colors?.background?.secondary};
`;

/**
 * Card actions component with flex layout and proper spacing
 */
const CardActions = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

/**
 * A versatile card component that serves as a container for grouping related content
 * with consistent styling. Supports various visual styles, interactive behaviors,
 * and layout options.
 */
const Card = ({
  title,
  header,
  footer,
  actions,
  variant = 'default',
  elevated = false,
  interactive = false,
  bordered = true,
  fullHeight = false,
  children,
  onClick,
  className,
  style,
  ...rest
}: CardProps) => {
  // If card is interactive and has onClick, render as a button for accessibility
  const isButton = interactive && onClick;
  const Component = isButton ? 'button' : 'div';
  
  return (
    <StyledCard
      as={Component}
      variant={variant}
      elevated={elevated}
      interactive={interactive}
      bordered={bordered}
      fullHeight={fullHeight}
      onClick={onClick}
      className={className}
      style={style}
      // Accessibility attributes
      tabIndex={interactive && !isButton ? 0 : undefined}
      role={interactive && !isButton ? 'button' : undefined}
      aria-pressed={interactive && !isButton ? false : undefined}
      {...rest}
    >
      {/* Render header only if title, header or actions are provided */}
      {(title || header || actions) && (
        <CardHeader>
          {/* Use custom header or title */}
          {header || (title && <CardTitle>{title}</CardTitle>)}
          {/* Render actions if provided */}
          {actions && <CardActions>{actions}</CardActions>}
        </CardHeader>
      )}
      
      {/* Main content area */}
      <CardContent>{children}</CardContent>
      
      {/* Optional footer */}
      {footer && <CardFooter>{footer}</CardFooter>}
    </StyledCard>
  );
};

export default Card;