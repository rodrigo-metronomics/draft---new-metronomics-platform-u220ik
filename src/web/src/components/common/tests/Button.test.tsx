import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button';
import { ButtonVariant, Size, Severity } from '../../types/common.types';

describe('Button', () => {
  it('should render with default props', () => {
    render(<Button label="Click me" />);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    // Default variant should be PRIMARY
    expect(button).toHaveStyle('background-color: rgb(24, 144, 255)'); // primary[500]
    // Default size is MEDIUM
    expect(button).toHaveStyle('font-size: 1rem');
  });

  it('should render with different variants', () => {
    // Test PRIMARY variant
    const { rerender } = render(<Button label="Primary" variant={ButtonVariant.PRIMARY} />);
    let button = screen.getByRole('button', { name: /primary/i });
    expect(button).toHaveStyle('background-color: rgb(24, 144, 255)'); // primary[500]
    
    // Test SECONDARY variant
    rerender(<Button label="Secondary" variant={ButtonVariant.SECONDARY} />);
    button = screen.getByRole('button', { name: /secondary/i });
    expect(button).toHaveStyle('background-color: rgb(14, 165, 233)'); // secondary[500]
    
    // Test TERTIARY variant
    rerender(<Button label="Tertiary" variant={ButtonVariant.TERTIARY} />);
    button = screen.getByRole('button', { name: /tertiary/i });
    expect(button).toHaveStyle('background-color: transparent');
    expect(button).toHaveStyle('color: rgb(24, 144, 255)'); // primary[500]
    
    // Test DANGER variant
    rerender(<Button label="Danger" variant={ButtonVariant.DANGER} />);
    button = screen.getByRole('button', { name: /danger/i });
    expect(button).toHaveStyle('background-color: rgb(239, 68, 68)'); // error[500]
  });

  it('should render with different sizes', () => {
    // Test SMALL size
    const { rerender } = render(<Button label="Small" size={Size.SMALL} />);
    let button = screen.getByRole('button', { name: /small/i });
    expect(button).toHaveStyle('font-size: 0.875rem');
    expect(button).toHaveStyle('padding: 6px 12px');
    
    // Test MEDIUM size
    rerender(<Button label="Medium" size={Size.MEDIUM} />);
    button = screen.getByRole('button', { name: /medium/i });
    expect(button).toHaveStyle('font-size: 1rem');
    expect(button).toHaveStyle('padding: 8px 16px');
    
    // Test LARGE size
    rerender(<Button label="Large" size={Size.LARGE} />);
    button = screen.getByRole('button', { name: /large/i });
    expect(button).toHaveStyle('font-size: 1.125rem');
    expect(button).toHaveStyle('padding: 12px 24px');
  });

  it('should render with icon', () => {
    const mockIcon = <span data-testid="mock-icon">🔍</span>;
    render(<Button label="With Icon" icon={mockIcon} />);
    
    // Verify icon is rendered
    const icon = screen.getByTestId('mock-icon');
    expect(icon).toBeInTheDocument();
    
    // Verify the default position (left)
    const button = screen.getByRole('button', { name: /with icon/i });
    expect(button.firstChild).toContainElement(icon);
  });

  it('should render with icon on the right', () => {
    const mockIcon = <span data-testid="mock-icon">🔍</span>;
    render(<Button label="Icon Right" icon={mockIcon} iconPos="right" />);
    
    // Verify icon is rendered
    const icon = screen.getByTestId('mock-icon');
    expect(icon).toBeInTheDocument();
    
    // Verify the icon is on the right
    const button = screen.getByRole('button', { name: /icon right/i });
    expect(button.lastChild).toContainElement(icon);
    
    // Verify the icon wrapper has the correct margin
    const iconWrapper = icon.parentElement;
    expect(iconWrapper).toHaveStyle('margin-left: 0.5em');
    expect(iconWrapper).toHaveStyle('margin-right: 0');
  });

  it('should render in loading state', () => {
    render(<Button label="Loading" loading={true} />);
    
    const button = screen.getByRole('button', { name: /loading/i });
    
    // Verify the loading spinner is present
    expect(button.querySelector('span')).toHaveStyle(`
      display: inline-block;
      width: 1em;
      height: 1em;
    `);
    
    // Verify the button is disabled while loading
    expect(button).toBeDisabled();
    
    // Verify the opacity is reduced
    expect(button).toHaveStyle('opacity: 0.8');
  });

  it('should render as disabled', () => {
    render(<Button label="Disabled" disabled={true} />);
    
    const button = screen.getByRole('button', { name: /disabled/i });
    
    // Verify the button is disabled
    expect(button).toBeDisabled();
    
    // Verify the disabled styling
    expect(button).toHaveStyle('opacity: 0.6');
    expect(button).toHaveStyle('cursor: not-allowed');
  });

  it('should render with full width', () => {
    render(<Button label="Full Width" fullWidth={true} />);
    
    const button = screen.getByRole('button', { name: /full width/i });
    
    // Verify the button has full width
    expect(button).toHaveStyle('width: 100%');
  });

  it('should render with rounded corners', () => {
    render(<Button label="Rounded" rounded={true} />);
    
    const button = screen.getByRole('button', { name: /rounded/i });
    
    // Verify the button has rounded corners
    expect(button).toHaveStyle('border-radius: 50px');
  });

  it('should render with outlined style', () => {
    render(<Button label="Outlined" variant={ButtonVariant.PRIMARY} outlined={true} />);
    
    const button = screen.getByRole('button', { name: /outlined/i });
    
    // Verify the button has outlined styling
    expect(button).toHaveStyle('background-color: transparent');
    expect(button).toHaveStyle('color: rgb(24, 144, 255)'); // primary[500]
  });

  it('should render with text style', () => {
    render(<Button label="Text" variant={ButtonVariant.PRIMARY} text={true} />);
    
    const button = screen.getByRole('button', { name: /text/i });
    
    // Verify the button has text-only styling
    expect(button).toHaveStyle('background-color: transparent');
    expect(button).toHaveStyle('border-color: transparent');
    expect(button).toHaveStyle('color: rgb(24, 144, 255)'); // primary[500]
  });

  it('should render with raised style', () => {
    render(<Button label="Raised" raised={true} />);
    
    const button = screen.getByRole('button', { name: /raised/i });
    
    // Verify the button has raised styling with shadow
    expect(button).toHaveStyle('box-shadow: 0 3px 5px rgba(0, 0, 0, 0.2)');
  });

  it('should render with different severity levels', () => {
    // Test SUCCESS severity
    const { rerender } = render(<Button label="Success" severity={Severity.SUCCESS} />);
    let button = screen.getByRole('button', { name: /success/i });
    expect(button).toHaveStyle('background-color: rgb(16, 185, 129)'); // success[500]
    
    // Test INFO severity
    rerender(<Button label="Info" severity={Severity.INFO} />);
    button = screen.getByRole('button', { name: /info/i });
    expect(button).toHaveStyle('background-color: rgb(14, 165, 233)'); // info[500]
    
    // Test WARNING severity
    rerender(<Button label="Warning" severity={Severity.WARNING} />);
    button = screen.getByRole('button', { name: /warning/i });
    expect(button).toHaveStyle('background-color: rgb(245, 158, 11)'); // warning[500]
    
    // Test ERROR severity
    rerender(<Button label="Error" severity={Severity.ERROR} />);
    button = screen.getByRole('button', { name: /error/i });
    expect(button).toHaveStyle('background-color: rgb(239, 68, 68)'); // error[500]
  });

  it('should render with badge', () => {
    render(<Button label="With Badge" badge="5" />);
    
    // Verify the badge is displayed
    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
    
    // Verify badge styling
    expect(badge).toHaveStyle(`
      position: absolute;
      top: -8px;
      right: -8px;
      background-color: rgb(239, 68, 68);
      color: rgb(255, 255, 255);
    `);
  });

  it('should render with custom className', () => {
    render(<Button label="Custom Class" className="custom-button" />);
    
    const button = screen.getByRole('button', { name: /custom class/i });
    
    // Verify the custom class is applied
    expect(button).toHaveClass('custom-button');
  });

  it('should render with children instead of label', () => {
    render(<Button><span data-testid="child-content">Child Content</span></Button>);
    
    // Verify the children content is displayed
    const childContent = screen.getByTestId('child-content');
    expect(childContent).toBeInTheDocument();
    
    // Verify the button contains the children
    const button = screen.getByRole('button');
    expect(button).toContainElement(childContent);
  });

  it('should call onClick handler when clicked', () => {
    const onClickMock = jest.fn();
    render(<Button label="Click Me" onClick={onClickMock} />);
    
    const button = screen.getByRole('button', { name: /click me/i });
    
    // Simulate a click
    fireEvent.click(button);
    
    // Verify the onClick handler was called
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick handler when disabled', () => {
    const onClickMock = jest.fn();
    render(<Button label="Disabled" onClick={onClickMock} disabled={true} />);
    
    const button = screen.getByRole('button', { name: /disabled/i });
    
    // Simulate a click
    fireEvent.click(button);
    
    // Verify the onClick handler was not called
    expect(onClickMock).not.toHaveBeenCalled();
  });

  it('should not call onClick handler when loading', () => {
    const onClickMock = jest.fn();
    render(<Button label="Loading" onClick={onClickMock} loading={true} />);
    
    const button = screen.getByRole('button', { name: /loading/i });
    
    // Simulate a click
    fireEvent.click(button);
    
    // Verify the onClick handler was not called
    expect(onClickMock).not.toHaveBeenCalled();
  });

  it('should be accessible via keyboard', async () => {
    const onClickMock = jest.fn();
    render(<Button label="Accessible" onClick={onClickMock} />);
    
    const button = screen.getByRole('button', { name: /accessible/i });
    
    // Focus the button using Tab key
    await userEvent.tab();
    expect(button).toHaveFocus();
    
    // Press Enter key
    await userEvent.keyboard('{Enter}');
    expect(onClickMock).toHaveBeenCalledTimes(1);
    
    // Press Space key
    await userEvent.keyboard(' ');
    expect(onClickMock).toHaveBeenCalledTimes(2);
  });
});