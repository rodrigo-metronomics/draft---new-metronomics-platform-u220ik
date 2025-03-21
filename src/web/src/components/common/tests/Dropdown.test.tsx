import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0
import Dropdown from '../Dropdown';
import { Size, SelectOption } from '../../types/common.types';
import { renderWithProviders } from '../../../../tests/testUtils';

describe('Dropdown', () => {
  it('should render with default props', () => {
    // Define mock options array with label and value properties
    const options: SelectOption[] = [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
    ];

    // Render the Dropdown component with basic props (options and placeholder)
    renderWithProviders(<Dropdown options={options} placeholder="Select an option" />);

    // Verify that the dropdown displays the placeholder text
    expect(screen.getByText('Select an option')).toBeInTheDocument();

    // Verify that the dropdown has the default styling (outlined variant, medium size)
    const dropdownElement = screen.getByRole('combobox');
    expect(dropdownElement).toHaveClass('p-dropdown');
  });

  it('should render with label', () => {
    // Define mock options array
    const options: SelectOption[] = [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
    ];

    // Render the Dropdown component with a label prop
    renderWithProviders(<Dropdown options={options} label="My Label" />);

    // Verify that the label is displayed
    expect(screen.getByText('My Label')).toBeInTheDocument();

    // Verify that the label has the correct styling
    const labelElement = screen.getByText('My Label');
    expect(labelElement).toBeVisible();
  });

  it('should render with error state', () => {
    // Define mock options array
    const options: SelectOption[] = [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
    ];

    // Render the Dropdown component with error prop set to true and an errorMessage
    renderWithProviders(<Dropdown options={options} error errorMessage="This field is required" />);

    // Verify that the dropdown has the error styling (red border)
    const dropdownElement = screen.getByRole('combobox');
    expect(dropdownElement).toHaveClass('p-dropdown');

    // Verify that the error message is displayed
    expect(screen.getByText('This field is required')).toBeInTheDocument();

    // Verify that the error message has the correct styling
    const errorMessageElement = screen.getByText('This field is required');
    expect(errorMessageElement).toBeVisible();
  });

  it('should render with different sizes', () => {
    // Define mock options array
    const options: SelectOption[] = [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
    ];

    // Render the Dropdown component with SMALL size
    renderWithProviders(<Dropdown options={options} size={Size.SMALL} />);

    // Verify that the dropdown has the correct small size styling
    const dropdownElementSmall = screen.getByRole('combobox');
    expect(dropdownElementSmall).toHaveClass('p-dropdown');

    // Render the Dropdown component with MEDIUM size
    renderWithProviders(<Dropdown options={options} size={Size.MEDIUM} />);

    // Verify that the dropdown has the correct medium size styling
    const dropdownElementMedium = screen.getByRole('combobox');
    expect(dropdownElementMedium).toHaveClass('p-dropdown');

    // Render the Dropdown component with LARGE size
    renderWithProviders(<Dropdown options={options} size={Size.LARGE} />);

    // Verify that the dropdown has the correct large size styling
    const dropdownElementLarge = screen.getByRole('combobox');
    expect(dropdownElementLarge).toHaveClass('p-dropdown');
  });

  it('should render with different variants', () => {
    // Define mock options array
    const options: SelectOption[] = [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
    ];

    // Render the Dropdown component with 'outlined' variant
    renderWithProviders(<Dropdown options={options} variant="outlined" />);

    // Verify that the dropdown has the correct outlined styling
    const dropdownElementOutlined = screen.getByRole('combobox');
    expect(dropdownElementOutlined).toHaveClass('p-dropdown');

    // Render the Dropdown component with 'filled' variant
    renderWithProviders(<Dropdown options={options} variant="filled" />);

    // Verify that the dropdown has the correct filled styling
    const dropdownElementFilled = screen.getByRole('combobox');
    expect(dropdownElementFilled).toHaveClass('p-dropdown');
  });

  it('should render as disabled', () => {
    // Define mock options array
    const options: SelectOption[] = [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
    ];

    // Render the Dropdown component with disabled prop set to true
    renderWithProviders(<Dropdown options={options} disabled />);

    // Verify that the dropdown has the disabled attribute
    const dropdownElement = screen.getByRole('combobox');
    expect(dropdownElement).toHaveAttribute('aria-disabled', 'true');

    // Verify that the dropdown has the correct disabled styling
    expect(dropdownElement).toHaveClass('p-disabled');

    // Attempt to open the dropdown
    fireEvent.click(dropdownElement);

    // Verify that the dropdown panel does not open
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should render as read-only', () => {
    // Define mock options array
    const options: SelectOption[] = [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
    ];

    // Render the Dropdown component with readOnly prop set to true
    renderWithProviders(<Dropdown options={options} readOnly />);

    // Verify that the dropdown has the read-only styling
    const dropdownElement = screen.getByRole('combobox');
    expect(dropdownElement).toHaveClass('p-disabled');

    // Attempt to open the dropdown
    fireEvent.click(dropdownElement);

    // Verify that the dropdown panel does not open
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('should render with full width', () => {
    // Define mock options array
    const options: SelectOption[] = [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
    ];

    // Render the Dropdown component with fullWidth prop set to true
    renderWithProviders(<Dropdown options={options} fullWidth />);

    // Verify that the dropdown has the correct full width styling
    const dropdownElement = screen.getByRole('combobox');
    expect(dropdownElement).toHaveStyle('width: 100%');
  });

  it('should render with custom className', () => {
    // Define mock options array
    const options: SelectOption[] = [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
    ];

    // Render the Dropdown component with a custom className
    renderWithProviders(<Dropdown options={options} className="custom-dropdown" />);

    // Verify that the dropdown has the custom class applied
    const dropdownElement = screen.getByRole('combobox');
    expect(dropdownElement).toHaveClass('custom-dropdown');
  });

  it('should open dropdown panel on click', async () => {
    // Define mock options array
    const options: SelectOption[] = [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
    ];

    // Render the Dropdown component
    renderWithProviders(<Dropdown options={options} placeholder="Select an option" />);

    // Click on the dropdown
    const dropdownElement = screen.getByRole('combobox');
    fireEvent.click(dropdownElement);

    // Verify that the dropdown panel is displayed
    const listboxElement = await screen.findByRole('listbox');
    expect(listboxElement).toBeVisible();

    // Verify that the options are visible in the panel
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('should select an option when clicked', async () => {
    // Define mock options array
    const options: SelectOption[] = [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
    ];

    // Create a mock function for onChange
    const onChange = vi.fn();

    // Render the Dropdown component with the mock onChange handler
    renderWithProviders(<Dropdown options={options} onChange={onChange} placeholder="Select an option" />);

    // Click on the dropdown to open the panel
    const dropdownElement = screen.getByRole('combobox');
    fireEvent.click(dropdownElement);

    // Click on an option in the panel
    const optionElement = await screen.findByText('Option 1');
    fireEvent.click(optionElement);

    // Verify that the selected option is displayed in the dropdown
    expect(dropdownElement).toHaveTextContent('Option 1');

    // Verify that the onChange handler was called with the correct value
    expect(onChange).toHaveBeenCalledTimes(1);

    // Verify that the dropdown panel is closed after selection
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('should clear selection when clear button is clicked', async () => {
    // Define mock options array
    const options: SelectOption[] = [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
    ];

    // Create a mock function for onChange
    const onChange = vi.fn();

    // Render the Dropdown component with showClear prop set to true and a selected value
    renderWithProviders(<Dropdown options={options} onChange={onChange} showClear value="option1" />);

    // Verify that the selected option is displayed
    const dropdownElement = screen.getByRole('combobox');
    expect(dropdownElement).toHaveTextContent('Option 1');

    // Verify that the clear button is visible
    const clearButton = screen.getByLabelText('clear');
    expect(clearButton).toBeVisible();

    // Click on the clear button
    fireEvent.click(clearButton);

    // Verify that the onChange handler was called with null
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: null }));

    // Verify that the dropdown displays the placeholder again
    expect(dropdownElement).toHaveTextContent('Select an option');
  });

  it('should display empty message when no options are available', async () => {
    // Render the Dropdown component with an empty options array
    renderWithProviders(<Dropdown options={[]} placeholder="Select an option" />);

    // Click on the dropdown to open the panel
    const dropdownElement = screen.getByRole('combobox');
    fireEvent.click(dropdownElement);

    // Verify that the empty message is displayed in the panel
    const emptyMessageElement = await screen.findByText('No options available');
    expect(emptyMessageElement).toBeInTheDocument();
  });

  it('should be accessible via keyboard', async () => {
    // Define mock options array
    const options: SelectOption[] = [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
    ];

    // Create a mock function for onChange
    const onChange = vi.fn();

    // Render the Dropdown component with the mock onChange handler
    renderWithProviders(<Dropdown options={options} onChange={onChange} placeholder="Select an option" />);

    // Simulate pressing Tab to focus the dropdown
    const dropdownElement = screen.getByRole('combobox');
    dropdownElement.focus();

    // Verify that the dropdown receives focus
    expect(dropdownElement).toHaveFocus();

    // Simulate pressing Enter key to open the panel
    fireEvent.keyDown(dropdownElement, { key: 'Enter' });

    // Verify that the dropdown panel is displayed
    const listboxElement = await screen.findByRole('listbox');
    expect(listboxElement).toBeVisible();

    // Simulate pressing Arrow Down key to navigate to an option
    fireEvent.keyDown(listboxElement, { key: 'ArrowDown' });

    // Simulate pressing Enter key to select the option
    fireEvent.keyDown(listboxElement, { key: 'Enter' });

    // Verify that the onChange handler was called with the correct value
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ value: 'option1' }));

    // Verify that the dropdown panel is closed after selection
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
  });

  it('should call onBlur when focus is lost', () => {
    // Define mock options array
    const options: SelectOption[] = [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
    ];

    // Create a mock function for onBlur
    const onBlur = vi.fn();

    // Render the Dropdown component with the mock onBlur handler
    renderWithProviders(<Dropdown options={options} onBlur={onBlur} />);

    // Simulate pressing Tab to focus the dropdown
    const dropdownElement = screen.getByRole('combobox');
    dropdownElement.focus();

    // Simulate pressing Tab again to move focus away
    fireEvent.keyDown(dropdownElement, { key: 'Tab' });

    // Verify that the onBlur handler was called
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('should call onFocus when focused', () => {
    // Define mock options array
    const options: SelectOption[] = [
      { label: 'Option 1', value: 'option1' },
      { label: 'Option 2', value: 'option2' },
    ];

    // Create a mock function for onFocus
    const onFocus = vi.fn();

    // Render the Dropdown component with the mock onFocus handler
    renderWithProviders(<Dropdown options={options} onFocus={onFocus} />);

    // Simulate pressing Tab to focus the dropdown
    const dropdownElement = screen.getByRole('combobox');
    dropdownElement.focus();

    // Verify that the onFocus handler was called
    expect(onFocus).toHaveBeenCalledTimes(1);
  });
});