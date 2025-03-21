import React from 'react'; // version ^18.2.0
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0
import { vi } from 'vitest'; // version ^0.34.0
import Table from '../Table';
import { SortDirection } from '../../../types/common.types';
import { renderWithProviders } from '../../../../tests/testUtils';

/**
 * Helper function to set up test data and render the Table component
 * @param props 
 * @returns Rendered component and user event setup
 */
const setup = (props = {}) => {
  // LD1: Initialize user event setup for simulating user interactions
  const user = userEvent.setup();

  // LD1: Create mock data for the table
  const mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'CEO' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'CTO' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Developer' }
  ];

  // LD1: Define column definitions for the table
  const mockColumns = [
    { field: 'id', header: 'ID', sortable: true },
    { field: 'name', header: 'Name', sortable: true },
    { field: 'email', header: 'Email', sortable: false },
    { field: 'role', header: 'Role', sortable: true }
  ];

  // LD1: Mock functions for testing callbacks
  const onSort = vi.fn();
  const onSelectionChange = vi.fn();
  const onPageChange = vi.fn();
  const onPageSizeChange = vi.fn();

  // LD1: Define a column with a custom body template function
  const customBodyTemplate = vi.fn((rowData) => <span data-testid="custom-cell">{rowData.name}</span>);

  // LD1: Merge default props with any custom props provided
  const mergedProps = {
    data: mockData,
    columns: mockColumns,
    onSort: onSort,
    onSelectionChange: onSelectionChange,
    onPageChange: onPageChange,
    onPageSizeChange: onPageSizeChange,
    ...props
  };

  // LD1: Render the Table component with renderWithProviders
  const renderResult = renderWithProviders(<Table {...mergedProps} />);

  // LD1: Return the rendered component, user event setup, and test data
  return {
    ...renderResult,
    user,
    mockData,
    mockColumns,
    onSort,
    onSelectionChange,
    onPageChange,
    onPageSizeChange,
    customBodyTemplate
  };
};

describe('Table Component', () => {
  it('renders with basic data and columns', () => {
    // LD1: Render Table with basic data and columns
    const { getByRole, getByText } = setup();

    // LD1: Verify that the table element is in the document
    expect(getByRole('table')).toBeInTheDocument();

    // LD1: Verify that column headers are rendered correctly
    expect(getByText('ID')).toBeInTheDocument();
    expect(getByText('Name')).toBeInTheDocument();
    expect(getByText('Email')).toBeInTheDocument();
    expect(getByText('Role')).toBeInTheDocument();

    // LD1: Verify that data rows are rendered correctly
    expect(getByText('John Doe')).toBeInTheDocument();
    expect(getByText('jane@example.com')).toBeInTheDocument();
    expect(getByText('Developer')).toBeInTheDocument();
  });

  it('displays empty message when no data is provided', () => {
    // LD1: Render Table with empty data array
    const { getByText } = setup({ data: [] });

    // LD1: Verify that the empty message is displayed
    expect(getByText('No records found')).toBeInTheDocument();
  });

  it('displays loading spinner when loading prop is true', () => {
    // LD1: Render Table with loading prop set to true
    const { getByRole } = setup({ loading: true });

    // LD1: Verify that the loading spinner is displayed
    expect(getByRole('status')).toBeInTheDocument();
  });

  it('allows sorting when sortable prop is true', async () => {
    // LD1: Render Table with sortable prop set to true
    const { getByText, user, onSort } = setup({ sortable: true });

    // LD1: Click on a sortable column header
    const nameHeader = getByText('Name');
    await user.click(nameHeader);

    // LD1: Verify that the sort direction indicator is displayed
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

    // LD1: Verify that the onSort callback is called with correct parameters
    expect(onSort).toHaveBeenCalledTimes(1);
    expect(onSort).toHaveBeenCalledWith('name', 'asc');

    // LD1: Click on the same column header again
    await user.click(nameHeader);

    // LD1: Verify that the sort direction is reversed
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');

    // LD1: Verify that the onSort callback is called with updated parameters
    expect(onSort).toHaveBeenCalledTimes(2);
    expect(onSort).toHaveBeenCalledWith('name', 'desc');
  });

  it('allows row selection when selectable prop is true', async () => {
    // LD1: Render Table with selectable prop set to true
    const { getByText, user, onSelectionChange } = setup({ selectable: true });

    // LD1: Click on a row
    const row = getByText('John Doe').closest('tr');
    await user.click(row as Element);

    // LD1: Verify that the row is visually selected
    expect(row).toHaveAttribute('aria-selected', 'true');

    // LD1: Verify that the onSelectionChange callback is called with correct parameters
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenCalledWith([expect.objectContaining({ name: 'John Doe' })]);

    // LD1: Click on another row
    const anotherRow = getByText('Jane Smith').closest('tr');
    await user.click(anotherRow as Element);

    // LD1: Verify that the previous row is deselected and the new row is selected
    expect(row).not.toHaveAttribute('aria-selected');
    expect(anotherRow).toHaveAttribute('aria-selected', 'true');

    // LD1: Verify that the onSelectionChange callback is called with updated parameters
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    expect(onSelectionChange).toHaveBeenCalledWith([expect.objectContaining({ name: 'Jane Smith' })]);
  });

  it('renders pagination controls when paginated prop is true', async () => {
    // LD1: Render Table with paginated prop set to true
    const { getByRole, user, onPageChange, onPageSizeChange } = setup({ paginated: true, totalRecords: 50 });

    // LD1: Verify that pagination controls are displayed
    expect(getByRole('navigation')).toBeInTheDocument();

    // LD1: Click on next page button
    const nextPageButton = getByRole('button', { name: 'Next page' });
    await user.click(nextPageButton);

    // LD1: Verify that the onPageChange callback is called with correct parameters
    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(2);

    // LD1: Change page size using the dropdown
    const pageSizeSelect = getByRole('combobox', { name: 'Select rows per page' });
    await user.selectOptions(pageSizeSelect, '25');

    // LD1: Verify that the onPageSizeChange callback is called with correct parameters
    expect(onPageSizeChange).toHaveBeenCalledTimes(1);
    expect(onPageSizeChange).toHaveBeenCalledWith(25);
  });

  it('renders custom cell content using body template function', () => {
    // LD1: Define a column with a custom body template function
    const customColumns = [
      { field: 'name', header: 'Name', body: (rowData) => <span data-testid="custom-cell">{rowData.name}</span> }
    ];

    // LD1: Render Table with the custom column
    const { getByTestId } = setup({ columns: customColumns });

    // LD1: Verify that the custom cell content is rendered correctly
    expect(getByTestId('custom-cell')).toBeInTheDocument();
    expect(getByTestId('custom-cell')).toHaveTextContent('John Doe');
  });

  it('applies styling props correctly', () => {
    // LD1: Render Table with striped, hoverable, bordered, and compact props
    const { getByRole } = setup({ striped: true, hoverable: true, bordered: true, compact: true });

    // LD1: Verify that the appropriate CSS classes are applied to the table
    const table = getByRole('table');
    expect(table).toHaveClass('striped');
    expect(table).toHaveClass('hoverable');
    expect(table).toHaveClass('bordered');
    expect(table).toHaveClass('compact');
  });

  it('supports keyboard navigation for accessibility', async () => {
    // LD1: Render Table with selectable prop set to true
    const { getByText, user, onSelectionChange, onSort } = setup({ selectable: true, sortable: true });

    // LD1: Focus on a row using Tab key
    const row = getByText('John Doe').closest('tr');
    (row as HTMLElement).focus();

    // LD1: Press Enter key to select the row
    await user.keyboard('[Enter]');

    // LD1: Verify that the row is selected and the onSelectionChange callback is called
    expect(row).toHaveAttribute('aria-selected', 'true');
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange).toHaveBeenCalledWith([expect.objectContaining({ name: 'John Doe' })]);

    // LD1: Focus on a sortable column header
    const nameHeader = getByText('Name');
    (nameHeader as HTMLElement).focus();

    // LD1: Press Enter key to sort by that column
    await user.keyboard('[Enter]');

    // LD1: Verify that the column is sorted and the onSort callback is called
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    expect(onSort).toHaveBeenCalledTimes(1);
    expect(onSort).toHaveBeenCalledWith('name', 'asc');
  });

  it('renders custom header and footer content', () => {
    // LD1: Create custom header and footer content
    const headerContent = <div>Custom Header</div>;
    const footerContent = <div>Custom Footer</div>;

    // LD1: Render Table with the custom header and footer
    const { getByText } = setup({ header: headerContent, footer: footerContent });

    // LD1: Verify that the custom header and footer are rendered correctly
    expect(getByText('Custom Header')).toBeInTheDocument();
    expect(getByText('Custom Footer')).toBeInTheDocument();
  });
});