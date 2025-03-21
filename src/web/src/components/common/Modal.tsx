import React, { useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components'; // version ^5.3.10
import { createPortal } from 'react-dom'; // version ^18.2.0
import { colors } from '../../styles/colors';
import { flexCenter, transition } from '../../styles/mixins';
import IconButton from './IconButton';
import { Position, Size } from '../../types/common.types';

interface ModalProps {
  /** Whether the modal is visible */
  visible?: boolean;
  /** Callback function when the modal is closed */
  onHide: () => void;
  /** Text to display in the header */
  header?: string;
  /** Custom content for the header */
  headerContent?: React.ReactNode;
  /** Content to display in the footer */
  footer?: React.ReactNode;
  /** Content to display in the modal body */
  children: React.ReactNode;
  /** Whether clicking outside the modal closes it */
  dismissable?: boolean;
  /** Whether pressing Escape key closes the modal */
  closeOnEscape?: boolean;
  /** Whether to show the close icon in the header */
  showCloseIcon?: boolean;
  /** Additional CSS class for the modal */
  className?: string;
  /** Additional CSS class for the modal content */
  contentClassName?: string;
  /** Inline styles for the modal */
  style?: React.CSSProperties;
  /** Inline styles for the modal content */
  contentStyle?: React.CSSProperties;
  /** ID attribute for the modal */
  id?: string;
  /** ID of the element that labels the modal for accessibility */
  ariaLabelledBy?: string;
  /** ID of the element that describes the modal for accessibility */
  ariaDescribedBy?: string;
  /** Size of the modal (SMALL, MEDIUM, LARGE) */
  size?: Size;
  /** Position of the modal (center, top, bottom, left, right) */
  position?: Position;
  /** Whether to block scrolling of the body when modal is open */
  blockScroll?: boolean;
  /** Callback function when the modal is shown */
  onShow?: () => void;
}

const ModalOverlay = styled.div<{ visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${() => colors.neutral[900] + '99'}; /* semi-transparent overlay */
  z-index: 1000;
  ${() => transition('opacity', 'normal')};
  opacity: ${props => (props.visible ? 1 : 0)};
  visibility: ${props => (props.visible ? 'visible' : 'hidden')};
  backdrop-filter: blur(2px);
`;

const ModalContainer = styled.div<{
  size: Size;
  position: Position;
  visible: boolean;
}>`
  position: fixed;
  z-index: 1001;
  background-color: ${colors.white};
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  ${() => transition('transform, opacity', 'normal')};
  opacity: ${props => (props.visible ? 1 : 0)};
  transform: ${props => (props.visible ? 'scale(1)' : 'scale(0.9)')};
  
  /* Size variations */
  ${props => {
    switch (props.size) {
      case 'small':
        return css`
          width: 320px;
          max-width: calc(100vw - 32px);
        `;
      case 'large':
        return css`
          width: 900px;
          max-width: calc(100vw - 32px);
        `;
      default: // medium is default
        return css`
          width: 600px;
          max-width: calc(100vw - 32px);
        `;
    }
  }}
  
  /* Position variations */
  ${props => {
    switch (props.position) {
      case 'top':
        return css`
          top: 5vh;
          left: 50%;
          transform: ${props.visible ? 'translate(-50%, 0) scale(1)' : 'translate(-50%, -20px) scale(0.9)'};
        `;
      case 'bottom':
        return css`
          bottom: 5vh;
          left: 50%;
          transform: ${props.visible ? 'translate(-50%, 0) scale(1)' : 'translate(-50%, 20px) scale(0.9)'};
        `;
      case 'left':
        return css`
          left: 5vw;
          top: 50%;
          transform: ${props.visible ? 'translate(0, -50%) scale(1)' : 'translate(-20px, -50%) scale(0.9)'};
        `;
      case 'right':
        return css`
          right: 5vw;
          top: 50%;
          transform: ${props.visible ? 'translate(0, -50%) scale(1)' : 'translate(20px, -50%) scale(0.9)'};
        `;
      default: // center is default
        return css`
          top: 50%;
          left: 50%;
          transform: ${props.visible ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.9)'};
        `;
    }
  }}
  
  /* Responsive adjustments */
  @media (max-width: 576px) {
    width: calc(100vw - 32px);
    max-height: calc(100vh - 32px);
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid ${colors.neutral[200]};
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: ${colors.neutral[800]};
`;

const ModalContent = styled.div`
  padding: 24px;
  overflow-y: auto;
  flex: 1 1 auto;
`;

const ModalFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid ${colors.neutral[200]};
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

/**
 * A versatile modal component that displays content in an overlay dialog
 */
const Modal: React.FC<ModalProps> = ({
  visible = false,
  onHide,
  header,
  headerContent,
  footer,
  children,
  dismissable = true,
  closeOnEscape = true,
  showCloseIcon = true,
  className,
  contentClassName,
  style,
  contentStyle,
  id,
  ariaLabelledBy,
  ariaDescribedBy,
  size = 'medium',
  position = 'center',
  blockScroll = true,
  onShow,
  ...rest
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Handle body scroll locking
  useEffect(() => {
    if (blockScroll) {
      if (visible) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [visible, blockScroll]);

  // Handle focus management
  useEffect(() => {
    if (visible) {
      previouslyFocused.current = document.activeElement as HTMLElement;
      
      // Set focus to the modal container
      if (modalRef.current) {
        setIsAnimating(true);
        modalRef.current.focus();
        
        // Call onShow callback after animation completes
        const timer = setTimeout(() => {
          setIsAnimating(false);
          if (onShow) onShow();
        }, 300); // match the transition duration
        
        return () => clearTimeout(timer);
      }
    } else if (previouslyFocused.current) {
      // Return focus to the previously focused element when modal closes
      previouslyFocused.current.focus();
    }
  }, [visible, onShow]);

  // Handle escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && visible && closeOnEscape) {
        onHide();
      }
    };

    if (visible && closeOnEscape) {
      document.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, closeOnEscape, onHide]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (dismissable && event.target === event.currentTarget) {
      onHide();
    }
  };

  // Don't render anything if not visible
  if (!visible) {
    return null;
  }

  return createPortal(
    <>
      <ModalOverlay 
        visible={visible} 
        onClick={handleBackdropClick} 
        data-testid="modal-overlay"
      />
      <ModalContainer
        ref={modalRef}
        size={size}
        position={position}
        visible={visible}
        className={className}
        style={style}
        id={id}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        data-testid="modal-container"
        {...rest}
      >
        {(header || headerContent || showCloseIcon) && (
          <ModalHeader>
            {headerContent || (header && <ModalTitle id={ariaLabelledBy}>{header}</ModalTitle>)}
            {showCloseIcon && (
              <IconButton
                icon={<i className="pi pi-times" />}
                onClick={onHide}
                variant="TERTIARY"
                size="small"
                aria-label="Close"
                data-testid="modal-close-button"
              />
            )}
          </ModalHeader>
        )}
        <ModalContent className={contentClassName} style={contentStyle} data-testid="modal-content">
          {children}
        </ModalContent>
        {footer && <ModalFooter data-testid="modal-footer">{footer}</ModalFooter>}
      </ModalContainer>
    </>,
    document.body
  );
};

export default Modal;