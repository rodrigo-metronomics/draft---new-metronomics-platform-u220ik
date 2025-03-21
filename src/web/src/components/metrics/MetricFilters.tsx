# src/web/src/components/metrics/MetricFilters.tsx
```typescript
import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.10
import debounce from 'lodash/debounce'; // version ^4.0.8

import Dropdown from '../common/Dropdown';
import Input from '../common/Input';
import useTeams from '../../hooks/useTeams';
import useGoals from '../../hooks/useGoals';
import useOrganization from '../../hooks/useOrganization';
import { MetricFilters, MetricType } from '../../types/metric.types';
import { METRIC_TYPES } from '../../utils/constants/metricTypes';

/**
 * Interface defining the props for the MetricFilters component
 */
interface MetricFiltersProps {
  filters: MetricFilters;
  onFilterChange: (filters: MetricFilters) => void;
  className?: string;
}

/**
 * Component for filtering metrics by team, type, goal, and search term
 * @param props - MetricFiltersProps
 * @returns Rendered metric filters component
 */
const MetricFilters: React.FC<MetricFiltersProps> = ({ filters, onFilterChange, className }) => {
  // Destructure props to access filters, onFilterChange, and className
  const { teamId, type, goalId, search } = filters;

  // Get current organization using useOrganization hook
  const { currentOrganization } = useOrganization();

  // Get teams data using useTeams hook
  const { teams, isLoading: isTeamsLoading } = useTeams({});

  // Get goals data using useGoals hook
  const { goals, isLoading: isGoalsLoading } = useGoals({});

  // Set up local state for filter values
  const [teamFilter, setTeamFilter] = useState<string | null>(teamId || null);
  const [typeFilter, setTypeFilter] = useState<MetricType | null>(type || null);
  const [goalFilter, setGoalFilter] = useState<string | null>(goalId || null);
  const [searchTerm, setSearchTerm] = useState<string | null>(search || null);

  // Create debounced search handler to prevent excessive filter updates
  const debouncedSearchHandler = useCallback(
    debounce((newSearchTerm: string | null) => {
      onFilterChange({
        ...filters,
        search: newSearchTerm,
      });
    }, 300),
    [filters, onFilterChange]
  );

  // Handle team selection change
  const handleTeamChange = (e: any) => {
    const newTeamId = e.target.value === '' ? null : e.target.value;
    setTeamFilter(newTeamId);
    onFilterChange({
      ...filters,
      teamId: newTeamId,
    });
  };

  // Handle metric type selection change
  const handleTypeChange = (e: any) => {
    const newType = e.target.value === '' ? null : e.target.value;
    setTypeFilter(newType);
    onFilterChange({
      ...filters,
      type: newType,
    });
  };

  // Handle goal selection change
  const handleGoalChange = (e: any) => {
    const newGoalId = e.target.value === '' ? null : e.target.value;
    setGoalFilter(newGoalId);
    onFilterChange({
      ...filters,
      goalId: newGoalId,
    });
  };

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value === '' ? null : e.target.value;
    setSearchTerm(newSearchTerm);
    debouncedSearchHandler(newSearchTerm);
  };

  // Format team options for dropdown
  const teamOptions = teams
    ? [{ label: 'All Teams', value: '' }, ...teams.map(team => ({ label: team.name, value: team.id }))]
    : [];

  // Format goal options for dropdown
  const goalOptions = goals?.data
    ? [{ label: 'All Goals', value: '' }, ...goals.data.map(goal => ({ label: goal.title, value: goal.id }))]
    : [];

  // Format metric type options for dropdown
  const metricTypeOptions = Object.values(METRIC_TYPES).map(type => ({ label: type, value: type }));
  metricTypeOptions.unshift({ label: 'All Types', value: '' });

  // Render filter container with dropdowns and search input
  return (
    <FilterContainer className={className}>
      {/* Render team filter dropdown */}
      <FilterItem>
        <Dropdown
          id="team-filter"
          placeholder="Select Team"
          options={teamOptions}
          value={teamFilter}
          onChange={handleTeamChange}
          disabled={isTeamsLoading || !currentOrganization}
        />
      </FilterItem>

      {/* Render metric type filter dropdown */}
      <FilterItem>
        <Dropdown
          id="type-filter"
          placeholder="Select Type"
          options={metricTypeOptions}
          value={typeFilter}
          onChange={handleTypeChange}
          disabled={isGoalsLoading || !currentOrganization}
        />
      </FilterItem>

      {/* Render goal filter dropdown */}
      <FilterItem>
        <Dropdown
          id="goal-filter"
          placeholder="Select Goal"
          options={goalOptions}
          value={goalFilter}
          onChange={handleGoalChange}
          disabled={isGoalsLoading || !currentOrganization}
        />
      </FilterItem>

      {/* Render search input for text filtering */}
      <SearchContainer>
        <Input
          id="search-filter"
          placeholder="Search"
          type="text"
          value={searchTerm || ''}
          onChange={handleSearchChange}
          fullWidth={true}
        />
      </SearchContainer>
    </FilterContainer>
  );
};

// Styled components using styled-components library
const FilterContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  width: 100%;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FilterItem = styled.div`
  flex: 1;
  min-width: 200px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SearchContainer = styled.div`
  flex: 2;
  min-width: 250px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

export default MetricFilters;