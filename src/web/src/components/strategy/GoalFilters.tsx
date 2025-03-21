import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components'; // version ^5.3.10

import Card from '../common/Card';
import Dropdown from '../common/Dropdown';
import DatePicker from '../common/DatePicker';
import Input from '../common/Input';
import Button from '../common/Button';
import { GoalType, GoalStatus, GoalFilters as GoalFiltersType } from '../../types/goal.types';
import { DateRange } from '../../types/common.types';
import { useOrganizationContext } from '../../contexts/OrganizationContext';

// Styled components for layout and styling
const FiltersContainer = styled.div<{ expanded?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  max-height: ${props => (props.expanded ? 'none' : '0')};
  overflow: ${props => (props.expanded ? 'visible' : 'hidden')};
  transition: all 0.3s ease;
`;

const FilterRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-end;
  margin-bottom: 0.5rem;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 200px;
`;

const FilterLabel = styled.label`
  font-weight: 500;
  margin-bottom: 0.25rem;
  color: ${props => props.theme.colors?.neutral[800]};
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const DateRangeContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.5rem;
  align-items: center;
`;

// Define the GoalFiltersProps interface
interface GoalFiltersProps {
  initialFilters: GoalFiltersType;
  onFilterChange: (filters: GoalFiltersType) => void;
  expanded?: boolean;
}

/**
 * Component that provides filtering capabilities for strategic goals
 * @param {GoalFiltersProps} props - Component props
 * @returns {JSX.Element} Rendered goal filters component
 */
const GoalFilters: React.FC<GoalFiltersProps> = ({ initialFilters, onFilterChange, expanded = true }) => {
  // Access current organization from context
  const { currentOrganization } = useOrganizationContext();

  // Initialize local state for filters with initialFilters or default values
  const [filters, setFilters] = useState<GoalFiltersType>(initialFilters || {
    type: null,
    status: null,
    search: null,
    dateRange: null,
    organizationId: currentOrganization?.id || null,
  });

  // Initialize local state for temporary filters during editing
  const [tempFilters, setTempFilters] = useState<GoalFiltersType>({ ...filters });

  // Handle type filter change by updating tempFilters
  const handleTypeChange = (e: any) => {
    setTempFilters(prev => ({ ...prev, type: e.value as GoalType || null }));
  };

  // Handle status filter change by updating tempFilters
  const handleStatusChange = (e: any) => {
    setTempFilters(prev => ({ ...prev, status: e.value as GoalStatus || null }));
  };

  // Handle search text change by updating tempFilters
  const handleSearchChange = (e: any) => {
    setTempFilters(prev => ({ ...prev, search: e.target.value || null }));
  };

  // Handle start date change by updating tempFilters.dateRange
  const handleStartDateChange = (date: Date | null) => {
    setTempFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        startDate: date ? date.toISOString() : null,
      } as DateRange,
    }));
  };

  // Handle end date change by updating tempFilters.dateRange
  const handleEndDateChange = (date: Date | null) => {
    setTempFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        endDate: date ? date.toISOString() : null,
      } as DateRange,
    }));
  };

  // Handle apply filters button click by updating filters and calling onFilterChange
  const handleApplyFilters = () => {
    setFilters({ ...tempFilters, organizationId: currentOrganization?.id || null });
    onFilterChange({ ...tempFilters, organizationId: currentOrganization?.id || null });
  };

  // Handle clear filters button click by resetting to default filters
  const handleClearFilters = () => {
    const defaultFilters = {
      type: null,
      status: null,
      search: null,
      dateRange: null,
      organizationId: currentOrganization?.id || null,
    };
    setTempFilters(defaultFilters);
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  // Use useEffect to update local filters when initialFilters changes
  useEffect(() => {
    setTempFilters(initialFilters);
    setFilters(initialFilters);
  }, [initialFilters]);

  // Render Card component containing all filter controls
  return (
    <Card title="Goal Filters">
      <FiltersContainer expanded={expanded}>
        <FilterRow>
          <FilterGroup>
            <FilterLabel htmlFor="goalType">Goal Type</FilterLabel>
            <Dropdown
              id="goalType"
              name="goalType"
              value={tempFilters.type || null}
              options={[
                { label: 'All', value: null },
                { label: 'BHAG', value: GoalType.BHAG },
                { label: '3HAG', value: GoalType.THREE_HAG },
                { label: '1HAG', value: GoalType.ONE_HAG },
                { label: 'Quarterly', value: GoalType.QUARTERLY },
              ]}
              onChange={handleTypeChange}
              placeholder="Select Type"
            />
          </FilterGroup>
          <FilterGroup>
            <FilterLabel htmlFor="goalStatus">Goal Status</FilterLabel>
            <Dropdown
              id="goalStatus"
              name="goalStatus"
              value={tempFilters.status || null}
              options={[
                { label: 'All', value: null },
                { label: 'Draft', value: GoalStatus.DRAFT },
                { label: 'Active', value: GoalStatus.ACTIVE },
                { label: 'At Risk', value: GoalStatus.AT_RISK },
                { label: 'Completed', value: GoalStatus.COMPLETED },
                { label: 'Archived', value: GoalStatus.ARCHIVED },
              ]}
              onChange={handleStatusChange}
              placeholder="Select Status"
            />
          </FilterGroup>
        </FilterRow>
        <FilterRow>
          <FilterGroup>
            <FilterLabel htmlFor="searchText">Search</FilterLabel>
            <Input
              id="searchText"
              name="searchText"
              type="text"
              placeholder="Search by title or description"
              value={tempFilters.search || ''}
              onChange={handleSearchChange}
            />
          </FilterGroup>
        </FilterRow>
        <FilterRow>
          <FilterGroup>
            <FilterLabel>Date Range</FilterLabel>
            <DateRangeContainer>
              <FilterGroup>
                <FilterLabel htmlFor="startDate">Start Date</FilterLabel>
                <DatePicker
                  id="startDate"
                  name="startDate"
                  placeholder="Start Date"
                  value={tempFilters.dateRange?.startDate ? new Date(tempFilters.dateRange.startDate) : null}
                  onChange={handleStartDateChange}
                  fullWidth={false}
                />
              </FilterGroup>
              <FilterGroup>
                <FilterLabel htmlFor="endDate">End Date</FilterLabel>
                <DatePicker
                  id="endDate"
                  name="endDate"
                  placeholder="End Date"
                  value={tempFilters.dateRange?.endDate ? new Date(tempFilters.dateRange.endDate) : null}
                  onChange={handleEndDateChange}
                  fullWidth={false}
                />
              </FilterGroup>
            </DateRangeContainer>
          </FilterGroup>
        </FilterRow>
        <ActionButtons>
          <Button label="Apply Filters" onClick={handleApplyFilters} />
          <Button label="Clear Filters" variant="secondary" onClick={handleClearFilters} />
        </ActionButtons>
      </FiltersContainer>
    </Card>
  );
};

export default GoalFilters;