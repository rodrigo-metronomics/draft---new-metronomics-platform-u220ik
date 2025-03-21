import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DatePicker from '../DatePicker';
import { Size } from '../../types/common.types';
import { formatDate } from '../../utils/helpers/dateTimeHelper';

describe('DatePicker', () => {
  it('should render with default props', () => {
    render(<DatePicker value={null} />);
    
    const datePickerInput = screen.getByPlaceholderText('Select Date');
    expect(datePickerInput).toBeInTheDocument();
    
    // Check that it has the default styling (medium size)
    const datePickerContainer = datePickerInput.closest('div');
    expect(datePickerContainer).toHaveStyle('width: 100%'); // Default fullWidth is true
  });

  it('should render with placeholder text', () => {
    const placeholder = 'Choose a date';
    render(<DatePicker value={null} placeholder={placeholder} />);
    
    const datePickerInput = screen.getByPlaceholderText(placeholder);
    expect(datePickerInput).toBeInTheDocument();
  });

  it('should render with a selected date', () => {
    const testDate = new Date(2023, 3, 15); // April 15, 2023
    render(<DatePicker value={testDate} />);
    
    // Default format is MM/dd/yyyy
    const expectedFormattedDate = formatDate(testDate, 'MM/dd/yyyy');
    expect(screen.getByDisplayValue(expectedFormattedDate)).toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    // Test small size
    const { rerender } = render(<DatePicker value={null} size={Size.SMALL} />);
    let datePickerInput = screen.getByPlaceholderText('Select Date');
    let inputContainer = datePickerInput.closest('.p-inputtext');
    expect(inputContainer).toHaveStyle('font-size: 0.875rem');
    expect(inputContainer).toHaveStyle('padding: 6px 12px');
    
    // Test medium size
    rerender(<DatePicker value={null} size={Size.MEDIUM} />);
    datePickerInput = screen.getByPlaceholderText('Select Date');
    inputContainer = datePickerInput.closest('.p-inputtext');
    expect(inputContainer).toHaveStyle('font-size: 1rem');
    expect(inputContainer).toHaveStyle('padding: 8px 16px');
    
    // Test large size
    rerender(<DatePicker value={null} size={Size.LARGE} />);
    datePickerInput = screen.getByPlaceholderText('Select Date');
    inputContainer = datePickerInput.closest('.p-inputtext');
    expect(inputContainer).toHaveStyle('font-size: 1.125rem');
    expect(inputContainer).toHaveStyle('padding: 12px 24px');
  });

  it('should render in error state', () => {
    // Test with just error flag
    const { rerender } = render(<DatePicker value={null} error={true} />);
    let datePickerInput = screen.getByPlaceholderText('Select Date');
    let inputContainer = datePickerInput.closest('.p-inputtext');
    expect(inputContainer).toHaveStyle('border: 1px solid');
    expect(inputContainer).toHaveStyle('box-shadow: 0 0 0 1px');
    expect(datePickerInput).toHaveAttribute('aria-invalid', 'true');
    
    // Test with error message
    const errorMessage = 'Please select a valid date';
    rerender(<DatePicker value={null} error={true} errorMessage={errorMessage} id="date-test" />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(datePickerInput).toHaveAttribute('aria-describedby', 'date-test-error');
  });

  it('should render as disabled', () => {
    render(<DatePicker value={null} disabled={true} />);
    
    const datePickerInput = screen.getByPlaceholderText('Select Date');
    expect(datePickerInput).toBeDisabled();
    expect(datePickerInput.closest('.p-inputtext')).toHaveStyle('background-color: rgb(243, 244, 246)');
    expect(datePickerInput.closest('.p-inputtext')).toHaveStyle('cursor: not-allowed');
    
    // Calendar should not open when input is clicked
    fireEvent.click(datePickerInput);
    const calendar = document.querySelector('.p-datepicker');
    expect(calendar).not.toBeInTheDocument();
  });

  it('should render as read-only', () => {
    render(<DatePicker value={null} readOnly={true} />);
    
    const datePickerInput = screen.getByPlaceholderText('Select Date');
    expect(datePickerInput).toHaveAttribute('readonly');
    expect(datePickerInput.closest('.p-inputtext')).toHaveStyle('cursor: default');
    
    // Try typing in the field
    userEvent.type(datePickerInput, '04/15/2023');
    expect(datePickerInput).toHaveValue('');
  });

  it('should render with custom date format', () => {
    const testDate = new Date(2023, 3, 15); // April 15, 2023
    const customFormat = 'yyyy-MM-dd';
    render(<DatePicker value={testDate} dateFormat={customFormat} />);
    
    const expectedFormattedDate = formatDate(testDate, customFormat);
    expect(screen.getByDisplayValue(expectedFormattedDate)).toBeInTheDocument();
  });

  it('should render with time selection', async () => {
    render(<DatePicker value={null} showTime={true} />);
    
    const datePickerInput = screen.getByPlaceholderText('Select Date');
    fireEvent.click(datePickerInput);
    
    // Wait for the calendar panel to be visible
    await waitFor(() => {
      const timePicker = document.querySelector('.p-timepicker');
      expect(timePicker).toBeInTheDocument();
    });
  });

  it('should render with button bar', async () => {
    render(<DatePicker value={null} showButtonBar={true} />);
    
    const datePickerInput = screen.getByPlaceholderText('Select Date');
    fireEvent.click(datePickerInput);
    
    // Wait for the calendar panel to be visible
    await waitFor(() => {
      const todayButton = screen.getByText('Today');
      const clearButton = screen.getByText('Clear');
      expect(todayButton).toBeInTheDocument();
      expect(clearButton).toBeInTheDocument();
    });
    
    // Test Today button functionality
    const todayButton = screen.getByText('Today');
    fireEvent.click(todayButton);
    
    // Today's date should be selected
    const today = new Date();
    const formattedToday = formatDate(today, 'MM/dd/yyyy');
    
    await waitFor(() => {
      const updatedInput = screen.getByDisplayValue(formattedToday);
      expect(updatedInput).toBeInTheDocument();
    });
    
    // Open calendar again
    fireEvent.click(screen.getByDisplayValue(formattedToday));
    
    // Test Clear button functionality
    await waitFor(() => {
      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);
    });
    
    // Input should be cleared
    await waitFor(() => {
      const clearedInput = screen.getByPlaceholderText('Select Date');
      expect(clearedInput).toHaveValue('');
    });
  });

  it('should render inline', () => {
    render(<DatePicker value={null} inline={true} />);
    
    // Calendar should be visible without clicking
    const calendar = document.querySelector('.p-datepicker');
    expect(calendar).toBeInTheDocument();
    
    // Input should not be visible
    const input = document.querySelector('input');
    expect(input).not.toBeInTheDocument();
  });

  it('should open calendar when input is clicked', async () => {
    render(<DatePicker value={null} />);
    
    const datePickerInput = screen.getByPlaceholderText('Select Date');
    
    // Calendar should not be visible initially
    expect(document.querySelector('.p-datepicker')).not.toBeInTheDocument();
    
    // Click the input to open calendar
    fireEvent.click(datePickerInput);
    
    // Wait for calendar to be visible
    await waitFor(() => {
      const calendar = document.querySelector('.p-datepicker');
      expect(calendar).toBeInTheDocument();
    });
    
    // Click outside to close calendar
    fireEvent.mouseDown(document.body);
    
    // Calendar should close
    await waitFor(() => {
      const calendar = document.querySelector('.p-datepicker');
      expect(calendar).not.toBeInTheDocument();
    });
  });

  it('should select a date when clicked in calendar', async () => {
    const onChange = jest.fn();
    render(<DatePicker value={null} onChange={onChange} />);
    
    // Open the calendar
    const datePickerInput = screen.getByPlaceholderText('Select Date');
    fireEvent.click(datePickerInput);
    
    // Wait for calendar to be visible
    await waitFor(() => {
      const calendar = document.querySelector('.p-datepicker');
      expect(calendar).toBeInTheDocument();
    });
    
    // Click on a date (15th of current month)
    const dateCell = document.querySelector('.p-datepicker-calendar td:not(.p-datepicker-other-month) span:not(.p-disabled)');
    fireEvent.click(dateCell);
    
    // onChange should be called
    expect(onChange).toHaveBeenCalled();
    
    // Calendar should close after selection
    await waitFor(() => {
      const calendar = document.querySelector('.p-datepicker');
      expect(calendar).not.toBeInTheDocument();
    });
  });

  it('should handle manual date input', async () => {
    const onChange = jest.fn();
    render(<DatePicker value={null} onChange={onChange} />);
    
    const datePickerInput = screen.getByPlaceholderText('Select Date');
    
    // Clear the input and type a date
    userEvent.clear(datePickerInput);
    userEvent.type(datePickerInput, '04/15/2023');
    
    // Trigger blur to process the input
    fireEvent.blur(datePickerInput);
    
    // onChange should be called with the correct date
    expect(onChange).toHaveBeenCalled();
    const arg = onChange.mock.calls[0][0];
    expect(arg instanceof Date).toBeTruthy();
    expect(arg.getMonth()).toBe(3); // April is month 3 (0-indexed)
    expect(arg.getDate()).toBe(15);
    expect(arg.getFullYear()).toBe(2023);
    
    // Test invalid date
    userEvent.clear(datePickerInput);
    userEvent.type(datePickerInput, 'invalid-date');
    fireEvent.blur(datePickerInput);
    
    // Should still have the old call count (no new calls)
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should respect min and max date constraints', async () => {
    const onChange = jest.fn();
    const minDate = new Date(2023, 3, 10); // April 10, 2023
    const maxDate = new Date(2023, 3, 20); // April 20, 2023
    
    render(
      <DatePicker 
        value={null} 
        onChange={onChange} 
        minDate={minDate} 
        maxDate={maxDate} 
      />
    );
    
    // Open the calendar
    const datePickerInput = screen.getByPlaceholderText('Select Date');
    fireEvent.click(datePickerInput);
    
    // Wait for calendar to be visible
    await waitFor(() => {
      const calendar = document.querySelector('.p-datepicker');
      expect(calendar).toBeInTheDocument();
    });
    
    // Dates before minDate and after maxDate should have p-disabled class
    // This is a bit complex to test directly with DOM queries,
    // so we'll check our implementation indirectly by testing the manual input handling
    
    // First, try a date within range
    userEvent.clear(datePickerInput);
    userEvent.type(datePickerInput, '04/15/2023'); // Between min and max
    fireEvent.blur(datePickerInput);
    
    // onChange should be called
    expect(onChange).toHaveBeenCalled();
    onChange.mockClear();
    
    // Now try a date before minDate
    userEvent.clear(datePickerInput);
    userEvent.type(datePickerInput, '04/05/2023'); // Before minDate
    fireEvent.blur(datePickerInput);
    
    // onChange should not be called
    expect(onChange).not.toHaveBeenCalled();
    
    // Now try a date after maxDate
    userEvent.clear(datePickerInput);
    userEvent.type(datePickerInput, '04/25/2023'); // After maxDate
    fireEvent.blur(datePickerInput);
    
    // onChange should not be called
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should be accessible via keyboard', async () => {
    const onChange = jest.fn();
    render(<DatePicker value={null} onChange={onChange} />);
    
    // Focus the input using tab
    userEvent.tab();
    expect(document.activeElement).toHaveAttribute('placeholder', 'Select Date');
    
    // Open calendar with Enter
    fireEvent.keyDown(document.activeElement, { key: 'Enter' });
    
    // Calendar should open
    await waitFor(() => {
      const calendar = document.querySelector('.p-datepicker');
      expect(calendar).toBeInTheDocument();
    });
    
    // Press Escape to close the calendar
    fireEvent.keyDown(document.activeElement, { key: 'Escape' });
    
    // Calendar should close
    await waitFor(() => {
      const calendar = document.querySelector('.p-datepicker');
      expect(calendar).not.toBeInTheDocument();
    });
  });

  it('should call onChange when date is selected', async () => {
    const onChange = jest.fn();
    render(<DatePicker value={null} onChange={onChange} />);
    
    // Open the calendar
    const datePickerInput = screen.getByPlaceholderText('Select Date');
    fireEvent.click(datePickerInput);
    
    // Wait for calendar to be visible
    await waitFor(() => {
      const calendar = document.querySelector('.p-datepicker');
      expect(calendar).toBeInTheDocument();
    });
    
    // Click on a date
    const dateCell = document.querySelector('.p-datepicker-calendar td:not(.p-datepicker-other-month) span:not(.p-disabled)');
    fireEvent.click(dateCell);
    
    // onChange should be called exactly once
    expect(onChange).toHaveBeenCalledTimes(1);
    
    // The argument should be a Date object
    const arg = onChange.mock.calls[0][0];
    expect(arg instanceof Date).toBeTruthy();
  });

  it('should call onBlur when focus leaves the component', () => {
    const onBlur = jest.fn();
    render(<DatePicker value={null} onBlur={onBlur} />);
    
    // Focus the input
    const datePickerInput = screen.getByPlaceholderText('Select Date');
    fireEvent.focus(datePickerInput);
    
    // Blur the input
    fireEvent.blur(datePickerInput);
    
    // onBlur should be called
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('should call onFocus when the component receives focus', () => {
    const onFocus = jest.fn();
    render(<DatePicker value={null} onFocus={onFocus} />);
    
    // Focus the input
    const datePickerInput = screen.getByPlaceholderText('Select Date');
    fireEvent.focus(datePickerInput);
    
    // onFocus should be called
    expect(onFocus).toHaveBeenCalledTimes(1);
  });
});