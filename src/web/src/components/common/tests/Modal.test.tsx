import React from 'react'; // version ^18.2.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0
import { vi } from 'vitest'; // version ^0.34.0

import Modal from '../Modal'; // Import the Modal component to be tested
import IconButton from '../IconButton'; // Used to test interaction with the close button in the modal
import { Size } from '../../types/common.types'; // Import size types for testing different modal sizes
import { renderWithProviders } from '../../../../tests/testUtils'; // Utility function to render components with necessary providers for testing

describe('Modal', () => {
  // Set up test suite for Modal component

  it('should not render when visible is false', () => {
    // Test that verifies the Modal component does not render when visible prop is false
    render(<Modal visible={false} onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with visible prop set to false
    expect(screen.queryByTestId('modal-overlay')).not.toBeInTheDocument(); // Verify that the modal is not present in the document
  });

  it('should render when visible is true', () => {
    // Test that verifies the Modal component renders correctly when visible prop is true
    render(<Modal visible={true} onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with visible prop set to true
    expect(screen.getByTestId('modal-overlay')).toBeInTheDocument(); // Verify that the modal is present in the document
    expect(screen.getByTestId('modal-overlay')).toBeVisible(); // Verify that the modal overlay is visible
    expect(screen.getByTestId('modal-container')).toBeVisible(); // Verify that the modal container is visible
  });

  it('should render with header text', () => {
    // Test that verifies the Modal component renders correctly with header text
    const headerText = 'Test Header';
    render(<Modal visible={true} header={headerText} onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with visible prop set to true and header prop set to a text value
    expect(screen.getByText(headerText)).toBeInTheDocument(); // Verify that the modal header contains the specified text
  });

  it('should render with custom header content', () => {
    // Test that verifies the Modal component renders correctly with custom header content
    const customHeaderTestId = 'custom-header';
    const headerContent = <div data-testid={customHeaderTestId}>Custom Header Content</div>; // Create custom header content with a specific test ID
    render(<Modal visible={true} headerContent={headerContent} header="Default Header" onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with visible prop set to true and headerContent prop set to the custom content
    expect(screen.getByTestId(customHeaderTestId)).toBeInTheDocument(); // Verify that the modal contains the custom header content
    expect(screen.queryByText('Default Header')).not.toBeInTheDocument(); // Verify that the default header text is not rendered
  });

  it('should render with footer content', () => {
    // Test that verifies the Modal component renders correctly with footer content
    const footerTestId = 'custom-footer';
    const footerContent = <div data-testid={footerTestId}>Custom Footer Content</div>; // Create footer content with a specific test ID
    render(<Modal visible={true} footer={footerContent} onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with visible prop set to true and footer prop set to the footer content
    expect(screen.getByTestId(footerTestId)).toBeInTheDocument(); // Verify that the modal contains the footer content
  });

  it('should render with children content', () => {
    // Test that verifies the Modal component renders correctly with children content
    const childrenTestId = 'children-content';
    const childrenContent = <div data-testid={childrenTestId}>Children Content</div>; // Create children content with a specific test ID
    render(<Modal visible={true} onHide={() => {}}>{childrenContent}</Modal>); // Render the Modal component with visible prop set to true and the children content
    expect(screen.getByTestId(childrenTestId)).toBeInTheDocument(); // Verify that the modal contains the children content
  });

  it('should render with different sizes', () => {
    // Test that verifies the Modal component renders correctly with different sizes
    render(<Modal visible={true} size={Size.SMALL} onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with SMALL size
    expect(screen.getByTestId('modal-container')).toHaveStyle('width: 320px'); // Verify that the modal has the correct small size styling

    render(<Modal visible={true} size={Size.MEDIUM} onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with MEDIUM size
    expect(screen.getByTestId('modal-container')).toHaveStyle('width: 600px'); // Verify that the modal has the correct medium size styling

    render(<Modal visible={true} size={Size.LARGE} onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with LARGE size
    expect(screen.getByTestId('modal-container')).toHaveStyle('width: 900px'); // Verify that the modal has the correct large size styling
  });

  it('should render with different positions', () => {
    // Test that verifies the Modal component renders correctly with different positions
    render(<Modal visible={true} position="center" onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with center position
    expect(screen.getByTestId('modal-container')).toHaveStyle('top: 50%'); // Verify that the modal has the correct center position styling

    render(<Modal visible={true} position="top" onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with top position
    expect(screen.getByTestId('modal-container')).toHaveStyle('top: 5vh'); // Verify that the modal has the correct top position styling

    render(<Modal visible={true} position="bottom" onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with bottom position
    expect(screen.getByTestId('modal-container')).toHaveStyle('bottom: 5vh'); // Verify that the modal has the correct bottom position styling

    render(<Modal visible={true} position="left" onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with left position
    expect(screen.getByTestId('modal-container')).toHaveStyle('left: 5vw'); // Verify that the modal has the correct left position styling

    render(<Modal visible={true} position="right" onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with right position
    expect(screen.getByTestId('modal-container')).toHaveStyle('right: 5vw'); // Verify that the modal has the correct right position styling
  });

  it('should call onHide when close icon is clicked', async () => {
    // Test that verifies the Modal component calls onHide when the close icon is clicked
    const onHideMock = vi.fn(); // Create a mock function for onHide
    render(<Modal visible={true} showCloseIcon={true} onHide={onHideMock}>{/* Content */}</Modal>); // Render the Modal component with visible prop set to true, showCloseIcon prop set to true, and the mock onHide handler
    const closeButton = screen.getByTestId('modal-close-button'); // Find the close icon button
    await userEvent.click(closeButton); // Simulate a click on the close icon button
    expect(onHideMock).toHaveBeenCalledTimes(1); // Verify that the onHide handler was called
  });

  it('should not show close icon when showCloseIcon is false', () => {
    // Test that verifies the Modal component does not show the close icon when showCloseIcon prop is false
    render(<Modal visible={true} showCloseIcon={false} onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with visible prop set to true and showCloseIcon prop set to false
    expect(screen.queryByTestId('modal-close-button')).not.toBeInTheDocument(); // Verify that the close icon is not present in the document
  });

  it('should call onHide when backdrop is clicked and dismissable is true', async () => {
    // Test that verifies the Modal component calls onHide when the backdrop is clicked and dismissable prop is true
    const onHideMock = vi.fn(); // Create a mock function for onHide
    render(<Modal visible={true} dismissable={true} onHide={onHideMock}>{/* Content */}</Modal>); // Render the Modal component with visible prop set to true, dismissable prop set to true, and the mock onHide handler
    const overlay = screen.getByTestId('modal-overlay'); // Find the modal overlay (backdrop)
    await userEvent.click(overlay); // Simulate a click on the modal overlay
    expect(onHideMock).toHaveBeenCalledTimes(1); // Verify that the onHide handler was called
  });

  it('should not call onHide when backdrop is clicked and dismissable is false', async () => {
    // Test that verifies the Modal component does not call onHide when the backdrop is clicked and dismissable prop is false
    const onHideMock = vi.fn(); // Create a mock function for onHide
    render(<Modal visible={true} dismissable={false} onHide={onHideMock}>{/* Content */}</Modal>); // Render the Modal component with visible prop set to true, dismissable prop set to false, and the mock onHide handler
    const overlay = screen.getByTestId('modal-overlay'); // Find the modal overlay (backdrop)
    await userEvent.click(overlay); // Simulate a click on the modal overlay
    expect(onHideMock).not.toHaveBeenCalled(); // Verify that the onHide handler was not called
  });

  it('should call onHide when Escape key is pressed and closeOnEscape is true', async () => {
    // Test that verifies the Modal component calls onHide when the Escape key is pressed and closeOnEscape prop is true
    const onHideMock = vi.fn(); // Create a mock function for onHide
    render(<Modal visible={true} closeOnEscape={true} onHide={onHideMock}>{/* Content */}</Modal>); // Render the Modal component with visible prop set to true, closeOnEscape prop set to true, and the mock onHide handler
    await userEvent.keyboard('{Escape}'); // Simulate pressing the Escape key
    expect(onHideMock).toHaveBeenCalledTimes(1); // Verify that the onHide handler was called
  });

  it('should not call onHide when Escape key is pressed and closeOnEscape is false', async () => {
    // Test that verifies the Modal component does not call onHide when the Escape key is pressed and closeOnEscape prop is false
    const onHideMock = vi.fn(); // Create a mock function for onHide
    render(<Modal visible={true} closeOnEscape={false} onHide={onHideMock}>{/* Content */}</Modal>); // Render the Modal component with visible prop set to true, closeOnEscape prop set to false, and the mock onHide handler
    await userEvent.keyboard('{Escape}'); // Simulate pressing the Escape key
    expect(onHideMock).not.toHaveBeenCalled(); // Verify that the onHide handler was not called
  });

  it('should apply custom className to modal container', () => {
    // Test that verifies the Modal component applies custom className to the modal container
    const customClassName = 'custom-modal-class';
    render(<Modal visible={true} className={customClassName} onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with visible prop set to true and className prop set to a custom class name
    expect(screen.getByTestId('modal-container')).toHaveClass(customClassName); // Verify that the modal container has the custom class applied
  });

  it('should apply custom contentClassName to modal content', () => {
    // Test that verifies the Modal component applies custom contentClassName to the modal content
    const customClassName = 'custom-content-class';
    render(<Modal visible={true} contentClassName={customClassName} onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with visible prop set to true and contentClassName prop set to a custom class name
    expect(screen.getByTestId('modal-content')).toHaveClass(customClassName); // Verify that the modal content has the custom class applied
  });

  it('should apply custom style to modal container', () => {
    // Test that verifies the Modal component applies custom style to the modal container
    const customStyle = { backgroundColor: 'red' };
    render(<Modal visible={true} style={customStyle} onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with visible prop set to true and style prop set to custom styles
    expect(screen.getByTestId('modal-container')).toHaveStyle(customStyle); // Verify that the modal container has the custom styles applied
  });

  it('should apply custom contentStyle to modal content', () => {
    // Test that verifies the Modal component applies custom contentStyle to the modal content
    const customStyle = { color: 'blue' };
    render(<Modal visible={true} contentStyle={customStyle} onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with visible prop set to true and contentStyle prop set to custom styles
    expect(screen.getByTestId('modal-content')).toHaveStyle(customStyle); // Verify that the modal content has the custom styles applied
  });

  it('should apply id to modal container', () => {
    // Test that verifies the Modal component applies id to the modal container
    const customId = 'custom-modal-id';
    render(<Modal visible={true} id={customId} onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with visible prop set to true and id prop set to a custom id
    expect(screen.getByTestId('modal-container')).toHaveAttribute('id', customId); // Verify that the modal container has the custom id applied
  });

  it('should apply aria attributes for accessibility', () => {
    // Test that verifies the Modal component applies aria attributes for accessibility
    const labelledBy = 'header-id';
    const describedBy = 'description-id';
    render(<Modal visible={true} ariaLabelledBy={labelledBy} ariaDescribedBy={describedBy} onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with visible prop set to true, ariaLabelledBy prop set to a custom id, and ariaDescribedBy prop set to a custom id
    expect(screen.getByTestId('modal-container')).toHaveAttribute('aria-labelledby', labelledBy); // Verify that the modal has the aria-labelledby attribute with the correct value
    expect(screen.getByTestId('modal-container')).toHaveAttribute('aria-describedby', describedBy); // Verify that the modal has the aria-describedby attribute with the correct value
  });

  it('should trap focus within the modal when open', async () => {
    // Test that verifies the Modal component traps focus within the modal when open
    const focusableContent = (
      <>
        <button data-testid="first-focusable">First Focusable</button>
        <button data-testid="second-focusable">Second Focusable</button>
      </>
    );
    render(<Modal visible={true} onHide={() => {}}>{focusableContent}</Modal>); // Render the Modal component with visible prop set to true and content with focusable elements
    const firstFocusable = screen.getByTestId('first-focusable');
    const secondFocusable = screen.getByTestId('second-focusable');

    expect(firstFocusable).toHaveFocus(); // Verify that focus is automatically set to the first focusable element in the modal

    await userEvent.tab(); // Simulate pressing Tab to navigate through focusable elements
    expect(secondFocusable).toHaveFocus(); // Verify that focus cycles through the focusable elements within the modal

    await userEvent.tab(); // Simulate pressing Tab again
    expect(firstFocusable).toHaveFocus(); // Verify that focus cycles back to the first element

    // This is a basic test. More robust focus trapping tests may be needed for complex scenarios.
  });

  it('should call onShow when modal becomes visible', () => {
    // Test that verifies the Modal component calls onShow when the modal becomes visible
    const onShowMock = vi.fn(); // Create a mock function for onShow
    const { rerender } = render(<Modal visible={false} onShow={onShowMock} onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with visible prop set to false and the mock onShow handler
    rerender(<Modal visible={true} onShow={onShowMock} onHide={() => {}}>{/* Content */}</Modal>); // Update the component to set visible prop to true
    expect(onShowMock).toHaveBeenCalledTimes(1); // Verify that the onShow handler was called
  });

  it('should block body scroll when blockScroll is true', () => {
    // Test that verifies the Modal component blocks body scroll when blockScroll prop is true
    render(<Modal visible={true} blockScroll={true} onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with visible prop set to true and blockScroll prop set to true
    expect(document.body).toHaveStyle('overflow: hidden'); // Verify that the document body has overflow hidden style applied
  });

  it('should not block body scroll when blockScroll is false', () => {
    // Test that verifies the Modal component does not block body scroll when blockScroll prop is false
    render(<Modal visible={true} blockScroll={false} onHide={() => {}}>{/* Content */}</Modal>); // Render the Modal component with visible prop set to true and blockScroll prop set to false
    expect(document.body).not.toHaveStyle('overflow: hidden'); // Verify that the document body does not have overflow hidden style applied
  });
});