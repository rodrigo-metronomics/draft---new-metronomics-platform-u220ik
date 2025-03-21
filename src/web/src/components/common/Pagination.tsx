import React from 'react';
import styled, { css } from 'styled-components'; // version ^5.3.10
import { colors } from '../../styles/colors';
import { focusOutline, flexCenter, transition } from '../../styles/mixins';
import { mediaQueries } from '../../styles/breakpoints';
import Button from './Button';
import Select from './Select';
import { PaginationParams } from '../../types/common.types';

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalRecords: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
  showSummary?: boolean;
  maxVisiblePages?: number;
  pageSizeOptions?: number[];
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Generates an array of page numbers to display based on current page and total pages
 * 
 * @param currentPage Current active page
 * @param totalPages Total number of pages
 * @param maxVisiblePages Maximum number of page buttons to display
 * @returns Array of page numbers to display
 */
const getPageNumbers = (currentPage: number, totalPages: number, maxVisiblePages: number): number[] => {
  if (totalPages <= maxVisiblePages) {
    // If total pages is less than or equal to max visible pages, show all pages
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Calculate the range of page numbers to display
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = startPage + maxVisiblePages - 1;

  // Adjust if end page is beyond total pages
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  // Generate and return the array of page numbers
  return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
};

const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding: 8px 0;
  
  ${mediaQueries.sm} {
    flex-wrap: nowrap;
  }
`;

const PageSizeSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  ${mediaQueries.sm} {
    flex: 0 0 auto;
  }
`;

const PageSizeSelectorLabel = styled.span`
  color: ${colors.neutral[600]};
  font-size: 0.875rem;
  
  @media (max-width: 575px) {
    display: none;
  }
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  
  ${mediaQueries.sm} {
    flex: 0 0 auto;
  }
`;

const PageButton = styled.button<{ active?: boolean }>`
  ${flexCenter}
  ${focusOutline}
  
  min-width: 32px;
  height: 32px;
  border-radius: 4px;
  background-color: ${props => props.active ? colors.primary[100] : colors.white};
  color: ${props => props.active ? colors.primary[700] : colors.neutral[700]};
  border: 1px solid ${props => props.active ? colors.primary[300] : colors.neutral[300]};
  font-weight: ${props => props.active ? 600 : 400};
  transition: ${transition('all', 'fast')};
  cursor: pointer;
  
  &:hover:not(:disabled) {
    background-color: ${props => props.active ? colors.primary[200] : colors.neutral[100]};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PaginationSummary = styled.div`
  color: ${colors.neutral[600]};
  font-size: 0.875rem;
  white-space: nowrap;
  
  @media (max-width: 767px) {
    display: none;
  }
`;

/**
 * A reusable pagination component that provides navigation controls for paginated data.
 * It displays page numbers, previous/next buttons, and allows users to change the number of items per page.
 */
const Pagination: React.FC<PaginationProps> = ({
  currentPage = 1,
  pageSize = 10,
  totalRecords = 0,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  showSummary = true,
  maxVisiblePages = 5,
  pageSizeOptions = [10, 25, 50, 100],
  className,
  style,
}) => {
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  
  // Get the array of page numbers to display
  const pageNumbers = getPageNumbers(currentPage, totalPages, maxVisiblePages);
  
  // Create options for the page size selector
  const sizeOptions = pageSizeOptions.map(size => ({ 
    value: size, 
    label: size.toString() 
  }));
  
  return (
    <PaginationContainer className={className} style={style}>
      {showPageSizeSelector && (
        <PageSizeSelector>
          <PageSizeSelectorLabel>Rows per page:</PageSizeSelectorLabel>
          <Select
            value={pageSize}
            options={sizeOptions}
            onChange={(value) => onPageSizeChange(Number(value))}
            size="small"
            aria-label="Select rows per page"
          />
        </PageSizeSelector>
      )}
      
      <PaginationControls>
        <Button 
          variant="tertiary"
          size="small"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          icon={<span aria-hidden="true">&lt;</span>}
        />
        
        {pageNumbers.map(page => (
          <PageButton 
            key={page}
            active={page === currentPage}
            onClick={() => onPageChange(page)}
            aria-label={page === currentPage ? `Page ${page}, current page` : `Go to page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </PageButton>
        ))}
        
        <Button 
          variant="tertiary"
          size="small"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          icon={<span aria-hidden="true">&gt;</span>}
        />
      </PaginationControls>
      
      {showSummary && totalRecords > 0 && (
        <PaginationSummary>
          {`${Math.min((currentPage - 1) * pageSize + 1, totalRecords)}-${Math.min(currentPage * pageSize, totalRecords)} of ${totalRecords} items`}
        </PaginationSummary>
      )}
    </PaginationContainer>
  );
};

export default Pagination;