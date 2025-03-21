import React from 'react'; // ^18.2.0
import { render, screen, fireEvent } from '@testing-library/react'; // ^14.0.0
import userEvent from '@testing-library/user-event'; // ^14.0.0
import { describe, it, expect, vi } from 'vitest'; // ^0.34.0

import Input from '../Input';
import { renderWithProviders } from '../../../tests/testUtils';

// Setup function to render the Input component with various props
const setup = (props = {}) => {
  // Render the Input component with the provided props using renderWithProviders
  const result = renderWithProviders(<Input id="test-input" name="test-input" value="" {...props} />);

  // Return the result for use in tests
  return result;
};

describe('Input component', () => {
  it('renders correctly with default props', () => {
    // Render Input component with minimal required props
    setup();

    // Verify the input element is in the document
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toBeInTheDocument();

    // Check that default attributes are applied correctly
    expect(inputElement).toHaveAttribute('type', 'text');
    expect(inputElement).toHaveAttribute('name', 'test-input');
    expect(inputElement).toHaveAttribute('id', 'test-input');
  });

  it('applies fullWidth style when fullWidth prop is true', () => {
    // Render Input component with fullWidth prop set to true
    setup({ fullWidth: true });

    // Verify the input has the appropriate width styling
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toHaveStyle('width: 100%');
  });

  it('applies error styling when hasError prop is true', () => {
    // Render Input component with hasError prop set to true
    setup({ hasError: true });

    // Verify the input has error styling (red border)
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toHaveStyle('border-color: #f44336');
  });

  it('applies disabled styling when disabled prop is true', () => {
    // Render Input component with disabled prop set to true
    setup({ disabled: true });

    // Verify the input has disabled attribute and styling
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toBeDisabled();
    expect(inputElement).toHaveStyle('cursor: not-allowed');
    expect(inputElement).toHaveStyle('opacity: 0.7');
  });

  it('applies readOnly styling when readOnly prop is true', () => {
    // Render Input component with readOnly prop set to true
    setup({ readOnly: true });

    // Verify the input has readOnly attribute and styling
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toHaveAttribute('readonly');
  });

  it('handles onChange events correctly', async () => {
    // Create a mock onChange handler using vi.fn()
    const onChange = vi.fn();

    // Render Input component with the mock handler
    setup({ onChange });

    // Simulate user typing in the input
    const inputElement = screen.getByRole('textbox');
    await userEvent.type(inputElement, 'test value');

    // Verify the onChange handler was called with the expected value
    expect(onChange).toHaveBeenCalledTimes(10);
  });

  it('handles onBlur events correctly', () => {
    // Create a mock onBlur handler using vi.fn()
    const onBlur = vi.fn();

    // Render Input component with the mock handler
    setup({ onBlur });

    // Simulate user focusing and then blurring the input
    const inputElement = screen.getByRole('textbox');
    inputElement.focus();
    inputElement.blur();

    // Verify the onBlur handler was called
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('handles onFocus events correctly', () => {
    // Create a mock onFocus handler using vi.fn()
    const onFocus = vi.fn();

    // Render Input component with the mock handler
    setup({ onFocus });

    // Simulate user focusing the input
    const inputElement = screen.getByRole('textbox');
    inputElement.focus();

    // Verify the onFocus handler was called
    expect(onFocus).toHaveBeenCalledTimes(1);
  });

  it('applies custom className when provided', () => {
    // Render Input component with a custom className
    setup({ className: 'custom-class' });

    // Verify the input has the custom class applied
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toHaveClass('custom-class');
  });

  it('applies custom style when provided', () => {
    // Render Input component with custom inline styles
    setup({ style: { backgroundColor: 'red' } });

    // Verify the input has the custom styles applied
    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toHaveStyle('background-color: red');
  });

  it('renders with different input types', () => {
    // Render Input component with different type props (text, password, email, number)
    setup({ type: 'text' });
    const textInput = screen.getByRole('textbox');
    expect(textInput).toHaveAttribute('type', 'text');

    setup({ type: 'password' });
    const passwordInput = screen.getByRole('textbox');
    expect(passwordInput).toHaveAttribute('type', 'password');

    setup({ type: 'email' });
    const emailInput = screen.getByRole('textbox');
    expect(emailInput).toHaveAttribute('type', 'email');

    setup({ type: 'number' });
    const numberInput = screen.getByRole('textbox');
    expect(numberInput).toHaveAttribute('type', 'number');
  });
});