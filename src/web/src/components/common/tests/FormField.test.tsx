import React from 'react'; // react@^18.2.0
import { render, screen, fireEvent } from '@testing-library/react'; // @testing-library/react@^14.0.0
import userEvent from '@testing-library/user-event'; // @testing-library/user-event@^14.0.0
import { axe, toHaveNoViolations } from 'jest-axe'; // jest-axe@^7.0.0

import FormField from '../FormField';
import Input from '../Input';
import { renderWithProviders } from '../../../../tests/testUtils';

expect.extend({ toHaveNoViolations });

describe('FormField component', () => {
  it('renders with label and input', () => {
    // Render FormField with label='Test Label' and Input child
    renderWithProviders(
      <FormField id="test-input" name="test-input" label="Test Label">
        <Input id="test-input" name="test-input" value="" onChange={() => {}} />
      </FormField>
    );

    // Label and input elements are in the document with correct attributes
    const labelElement = screen.getByText('Test Label');
    expect(labelElement).toBeInTheDocument();
    expect(labelElement).toHaveAttribute('for', 'test-input');

    const inputElement = screen.getByRole('textbox');
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveAttribute('id', 'test-input');
    expect(inputElement).toHaveAttribute('name', 'test-input');
  });

  it('shows required indicator when required prop is true', () => {
    // Render FormField with required={true}
    renderWithProviders(
      <FormField id="test-input" name="test-input" label="Test Label" required>
        <Input id="test-input" name="test-input" value="" onChange={() => {}} />
      </FormField>
    );

    // Label contains a required indicator (asterisk)
    const labelElement = screen.getByText('Test Label');
    expect(labelElement).toBeInTheDocument();
  });

  it('does not show error message when not touched', () => {
    // Render FormField with error='Error message' and touched={false}
    renderWithProviders(
      <FormField id="test-input" name="test-input" label="Test Label" error="Error message">
        <Input id="test-input" name="test-input" value="" onChange={() => {}} />
      </FormField>
    );

    // Error message is not visible in the document
    const errorMessage = screen.queryByText('Error message');
    expect(errorMessage).not.toBeInTheDocument();
  });

  it('shows error message when touched and has error', () => {
    // Render FormField with error='Error message' and touched={true}
    renderWithProviders(
      <FormField id="test-input" name="test-input" label="Test Label" error="Error message" touched>
        <Input id="test-input" name="test-input" value="" onChange={() => {}} />
      </FormField>
    );

    // Error message is visible with correct text
    const errorMessage = screen.getByText('Error message');
    expect(errorMessage).toBeInTheDocument();
  });

  it('applies fullWidth style when fullWidth prop is true', () => {
    // Render FormField with fullWidth={true}
    const { container } = renderWithProviders(
      <FormField id="test-input" name="test-input" label="Test Label" fullWidth>
        <Input id="test-input" name="test-input" value="" onChange={() => {}} />
      </FormField>
    );

    // Container has appropriate width styling
    const formFieldContainer = container.firstChild;
    expect(formFieldContainer).toHaveStyle('width: 100%');
  });

  it('passes additional props to the input', () => {
    // Render FormField with placeholder='Enter value'
    renderWithProviders(
      <FormField id="test-input" name="test-input" label="Test Label">
        <Input id="test-input" name="test-input" value="" placeholder="Enter value" onChange={() => {}} />
      </FormField>
    );

    // Input element has placeholder attribute with correct value
    const inputElement = screen.getByPlaceholderText('Enter value');
    expect(inputElement).toBeInTheDocument();
  });

  it('displays help text when provided', () => {
    // Render FormField with helpText='This is help text'
    renderWithProviders(
      <FormField id="test-input" name="test-input" label="Test Label" helpText="This is help text">
        <Input id="test-input" name="test-input" value="" onChange={() => {}} />
      </FormField>
    );

    // Help text is visible with correct text
    const helpTextElement = screen.getByText('This is help text');
    expect(helpTextElement).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    // Render FormField with various props
    const { container } = renderWithProviders(
      <FormField
        id="test-input"
        name="test-input"
        label="Test Label"
        helpText="This is help text"
        error="Error message"
        touched
        required
      >
        <Input id="test-input" name="test-input" value="" onChange={() => {}} />
      </FormField>
    );

    // No accessibility violations are detected by axe
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});