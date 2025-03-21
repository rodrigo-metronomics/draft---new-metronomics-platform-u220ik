import React, { useState, useMemo } from 'react';
import styled from 'styled-components'; // version ^5.3.10

import Pagination from './Pagination';
import Spinner from './Spinner';
import { SortDirection } from '../../types/common.types';
import { colors } from '../../styles/colors';
import { focusOutline, flexCenter } from '../../styles/mixins';
import { mediaQueries } from '../../styles/breakpoints';

// Interfaces
interface TableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  body?: (rowData: any, rowIndex: number) => React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  width?: string;
  hidden?: boolean;
}

interface TableProps {
  data: any[];
  columns: TableColumn[];
  loading?: boolean;
  sortable?: boolean;
  defaultSortField?: string;
  defaultSortDirection?: SortDirection;
  onSort?: (sortField: string, sortDirection: SortDirection) => void;
  selectable?: boolean;
  selectedRows?: any[];
  onSelectionChange?: (selectedRows: any[]) => void;
  paginated?: boolean;
  currentPage?: number;
  pageSize?: number;
  totalRecords?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  serverSide?: boolean;
  emptyMessage?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
  tableClassName?: string;
}

// Styled Components
const TableWrapper = styled.div`
  position: relative;
  width: 100%;
  overflow-x: auto;
  border-radius: ${props => props.theme.borderRadius.md};
  background-color: ${props => props.theme.colors.background.card};
  box-shadow: ${props => props.theme.shadows.sm};
`;

const StyledTable = styled.table<{
  striped?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  compact?: boolean;
}>`
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
  font-size: ${props => props.theme.typography.fontSize.sm};
  color: ${props => props.theme.colors.text.primary};
  border: ${props => props.bordered ? `1px solid ${props.theme.colors.border.default}` : 'none'};
  
  & th, & td {
    padding: ${props => props.compact ? props.theme.spacing.xs : props.theme.spacing.sm} ${props => props.theme.spacing.md};
  }
  
  & th {
    text-align: left;
    font-weight: ${props => props.theme.typography.fontWeight.semibold};
  }
  
  & tbody tr:nth-child(odd) {
    background-color: ${props => props.striped ? props.theme.colors.background.alt : 'transparent'};
  }
  
  & tbody tr:hover {
    background-color: ${props => props.hoverable ? props.theme.colors.background.hover : 'transparent'};
  }
`;

const TableHeader = styled.thead`
  background-color: ${props => props.theme.colors.background.alt};
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
`;

const TableHeaderCell = styled.th<{
  sortable?: boolean;
  sorted?: boolean;
}>`
  position: relative;
  cursor: ${props => props.sortable ? 'pointer' : 'default'};
  user-select: none;
  font-weight: ${props => props.sorted ? props.theme.typography.fontWeight.bold : props.theme.typography.fontWeight.semibold};
  color: ${props => props.sorted ? props.theme.colors.primary.main : props.theme.colors.text.primary};
  
  ${props => props.sortable && `
    &:hover {
      color: ${props.theme.colors.primary.main};
    }
  `}
  
  ${focusOutline}
`;

const SortIcon = styled.span<{
  direction: SortDirection;
}>`
  display: inline-block;
  margin-left: ${props => props.theme.spacing.xs};
  transform: ${props => props.direction === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)'};
  transition: transform ${props => props.theme.transitions.duration.short}ms ${props => props.theme.transitions.easing.easeInOut};
`;

const TableBody = styled.tbody`
  & tr {
    transition: background-color ${props => props.theme.transitions.duration.short}ms ${props => props.theme.transitions.easing.easeInOut};
  }
`;

const TableRow = styled.tr<{
  selected?: boolean;
  selectable?: boolean;
}>`
  cursor: ${props => props.selectable ? 'pointer' : 'default'};
  background-color: ${props => props.selected ? props.theme.colors.background.selected : 'transparent'};
  
  ${props => props.selectable && `
    &:focus {
      ${focusOutline}
    }
  `}
`;

const TableCell = styled.td`
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
`;

const EmptyMessageCell = styled.td`
  text-align: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.text.secondary};
  font-style: italic;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: ${props => props.theme.zIndices.overlay};
`;

const TableHeaderContent = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border.default};
`;

const TableFooterContent = styled.div`
  padding: ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.border.default};
`;

const PaginationContainer = styled.div`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-top: 1px solid ${props => props.theme.colors.border.default};
`;

/**
 * A reusable table component that displays data in rows and columns with support for
 * sorting, pagination, selection, and customization.
 */
const Table: React.FC<TableProps> = ({
  data = [],
  columns = [],
  loading = false,
  sortable = false,
  defaultSortField,
  defaultSortDirection = 'asc',
  onSort,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  paginated = false,
  currentPage = 1,
  pageSize = 10,
  totalRecords = 0,
  onPageChange,
  onPageSizeChange,
  serverSide = false,
  emptyMessage = 'No records found',
  header,
  footer,
  className,
  style,
  id,
  striped = true,
  hoverable = true,
  bordered = false,
  compact = false,
  tableClassName
}) => {
  // State for sorting
  const [sortField, setSortField] = useState<string | undefined>(defaultSortField);
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultSortDirection);

  // State for selection
  const [selectedRowsState, setSelectedRowsState] = useState<any[]>(selectedRows);

  // Update selected rows when prop changes
  React.useEffect(() => {
    setSelectedRowsState(selectedRows);
  }, [selectedRows]);

  // Sort handler
  const handleSortToggle = (field: string) => {
    if (!sortable) return;
    
    const newDirection: SortDirection = 
      sortField === field && sortDirection === 'asc'
        ? 'desc'
        : 'asc';
    
    setSortField(field);
    setSortDirection(newDirection);
    
    if (onSort) {
      onSort(field, newDirection);
    }
  };

  // Selection handler
  const handleRowSelection = (row: any) => {
    if (!selectable) return;
    
    const isSelected = selectedRowsState.some(selectedRow => 
      selectedRow === row || 
      (selectedRow.id && row.id && selectedRow.id === row.id)
    );
    
    let newSelectedRows: any[];
    
    if (isSelected) {
      newSelectedRows = selectedRowsState.filter(selectedRow => 
        selectedRow !== row && 
        !(selectedRow.id && row.id && selectedRow.id === row.id)
      );
    } else {
      newSelectedRows = [...selectedRowsState, row];
    }
    
    setSelectedRowsState(newSelectedRows);
    
    if (onSelectionChange) {
      onSelectionChange(newSelectedRows);
    }
  };

  // Function to render header cell with optional sort indicator
  const renderHeaderCell = (
    column: TableColumn, 
    currentSortField: string | undefined, 
    currentSortDirection: SortDirection, 
    onSortToggle: (field: string) => void
  ) => {
    const isSortable = sortable && column.sortable;
    const isSorted = isSortable && currentSortField === column.field;
    
    return (
      <TableHeaderCell 
        key={column.field}
        sortable={isSortable}
        sorted={isSorted}
        onClick={() => isSortable && onSortToggle(column.field)}
        style={column.style}
        className={column.className}
        role="columnheader"
        scope="col"
        aria-sort={
          isSorted 
            ? currentSortDirection === 'asc' 
              ? 'ascending' 
              : 'descending' 
            : undefined
        }
      >
        {column.header}
        {isSortable && isSorted && (
          <SortIcon direction={currentSortDirection}>
            ▲
          </SortIcon>
        )}
      </TableHeaderCell>
    );
  };

  // Function to render a body cell with data or custom template
  const renderBodyCell = (column: TableColumn, rowData: any, rowIndex: number) => {
    const cellValue = rowData[column.field];
    
    return (
      <TableCell 
        key={column.field}
        style={column.style}
        className={column.className}
        role="cell"
      >
        {column.body ? column.body(rowData, rowIndex) : cellValue}
      </TableCell>
    );
  };

  // Function to render an empty message when no data is available
  const renderEmptyMessage = (emptyMessage: string, colSpan: number) => {
    return (
      <tr>
        <EmptyMessageCell colSpan={colSpan} role="cell">
          {emptyMessage}
        </EmptyMessageCell>
      </tr>
    );
  };

  // Get sorted and paginated data when not server-side
  const displayData = useMemo(() => {
    if (serverSide) {
      return data;
    }
    
    // Sort the data if sortable and sortField is provided
    let sortedData = [...data];
    if (sortable && sortField) {
      sortedData.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        // Handle undefined or null values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        
        // Compare values based on their type
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        return sortDirection === 'asc'
          ? aValue - bValue
          : bValue - aValue;
      });
    }
    
    // Paginate the data if paginated
    if (paginated) {
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize;
      return sortedData.slice(start, end);
    }
    
    return sortedData;
  }, [data, sortable, sortField, sortDirection, paginated, currentPage, pageSize, serverSide]);

  return (
    <TableWrapper className={className} style={style}>
      {header && <TableHeaderContent>{header}</TableHeaderContent>}
      
      <StyledTable
        id={id}
        className={tableClassName}
        striped={striped}
        hoverable={hoverable}
        bordered={bordered}
        compact={compact}
        role="table"
        aria-busy={loading}
      >
        <TableHeader role="rowgroup">
          <tr role="row">
            {columns
              .filter(column => !column.hidden)
              .map(column => renderHeaderCell(column, sortField, sortDirection, handleSortToggle))}
          </tr>
        </TableHeader>
        
        <TableBody role="rowgroup">
          {displayData.length > 0 ? (
            displayData.map((rowData, rowIndex) => {
              const isSelected = selectedRowsState.some(selectedRow => 
                selectedRow === rowData || 
                (selectedRow.id && rowData.id && selectedRow.id === rowData.id)
              );
              
              return (
                <TableRow 
                  key={rowData.id || rowIndex}
                  selected={isSelected}
                  selectable={selectable}
                  onClick={() => selectable && handleRowSelection(rowData)}
                  tabIndex={selectable ? 0 : undefined}
                  role="row"
                  aria-selected={selectable ? isSelected : undefined}
                >
                  {columns
                    .filter(column => !column.hidden)
                    .map(column => renderBodyCell(column, rowData, rowIndex))}
                </TableRow>
              );
            })
          ) : (
            renderEmptyMessage(emptyMessage, columns.filter(col => !col.hidden).length)
          )}
        </TableBody>
      </StyledTable>
      
      {loading && (
        <LoadingOverlay>
          <Spinner size="medium" />
        </LoadingOverlay>
      )}
      
      {footer && <TableFooterContent>{footer}</TableFooterContent>}
      
      {paginated && (
        <PaginationContainer>
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalRecords={totalRecords || data.length}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </PaginationContainer>
      )}
    </TableWrapper>
  );
};

export default Table;