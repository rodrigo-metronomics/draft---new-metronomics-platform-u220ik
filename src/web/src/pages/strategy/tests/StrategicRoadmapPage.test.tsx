import React from 'react'; // Core React library // ^18.2.0
import { screen, waitFor, fireEvent, within } from '@testing-library/react'; // React Testing Library utilities for querying and interacting with components // ^14.0.0
import userEvent from '@testing-library/user-event'; // Simulating user interactions in tests // ^14.0.0
import { vi } from 'vitest'; // Mocking functionality for tests // ^0.34.0

import StrategicRoadmapPage from '../StrategicRoadmapPage'; // Component being tested
import { renderWithRouter, waitForLoadingToFinish, createMockOrganization } from '../../../tests/testUtils'; // Test utilities for rendering components with router and waiting for loading states
import { createMockGoalsQueryResult } from '../../../tests/mocks/reactQueryMock';
import { GoalType, GoalStatus, GoalTimelineItem } from '../../../types/goal.types'; // Type definitions for goals and timeline items
import { ROUTES } from '../../../utils/constants/routes'; // Route constants for testing navigation

// Mock the useGoals hook
vi.mock('../../../hooks/useGoals', () => ({
  useGoals: vi.fn(),
}));

// Mock the useNavigate hook from react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// Helper function to create mock timeline items for testing
const createMockTimelineItems = (): GoalTimelineItem[] => {
  const bhagTimelineItem: GoalTimelineItem = {
    id: '1',
    title: '$100M valuation by 2030',
    type: GoalType.BHAG,
    startDate: '2023-01-01T00:00:00Z',
    endDate: '2030-12-31T23:59:59Z',
    status: GoalStatus.ACTIVE,
    progress: 25,
    parentId: null,
    color: 'blue',
  };

  const threeHagTimelineItem: GoalTimelineItem = {
    id: '2',
    title: '$50M annual revenue with 20% EBITDA by EOY 2025',
    type: GoalType.THREE_HAG,
    startDate: '2023-01-01T00:00:00Z',
    endDate: '2025-12-31T23:59:59Z',
    status: GoalStatus.ACTIVE,
    progress: 50,
    parentId: null,
    color: 'green',
  };

  const oneHagTimelineItem: GoalTimelineItem = {
    id: '3',
    title: 'Expand to 3 new markets by EOY',
    type: GoalType.ONE_HAG,
    startDate: '2023-01-01T00:00:00Z',
    endDate: '2023-12-31T23:59:59Z',
    status: GoalStatus.ACTIVE,
    progress: 75,
    parentId: null,
    color: 'purple',
  };

  const quarterlyTimelineItem: GoalTimelineItem = {
    id: '4',
    title: 'Increase sales by 15% this quarter',
    type: GoalType.QUARTERLY,
    startDate: '2023-04-01T00:00:00Z',
    endDate: '2023-06-30T23:59:59Z',
    status: GoalStatus.ACTIVE,
    progress: 90,
    parentId: null,
    color: 'orange',
  };

  const milestoneTimelineItem: GoalTimelineItem = {
    id: '5',
    title: 'Milestone 1',
    type: 'MILESTONE',
    startDate: '2023-05-01T00:00:00Z',
    endDate: '2023-05-01T00:00:00Z',
    status: GoalStatus.ACTIVE,
    progress: 0,
    parentId: '1',
    color: 'gray',
  };

  const milestoneTimelineItem2: GoalTimelineItem = {
    id: '6',
    title: 'Milestone 2',
    type: 'MILESTONE',
    startDate: '2023-06-01T00:00:00Z',
    endDate: '2023-06-01T00:00:00Z',
    status: GoalStatus.ACTIVE,
    progress: 0,
    parentId: '2',
    color: 'gray',
  };

  const milestoneTimelineItem3: GoalTimelineItem = {
    id: '7',
    title: 'Milestone 3',
    type: 'MILESTONE',
    startDate: '2023-07-01T00:00:00Z',
    endDate: '2023-07-01T00:00:00Z',
    status: GoalStatus.ACTIVE,
    progress: 0,
    parentId: '3',
    color: 'gray',
  };

  return [
    bhagTimelineItem,
    threeHagTimelineItem,
    oneHagTimelineItem,
    quarterlyTimelineItem,
    milestoneTimelineItem,
    milestoneTimelineItem2,
    milestoneTimelineItem3
  ];
};

// Helper function to create mock goals for testing
const createMockGoals = (): object[] => {
  const bhagGoal = {
    id: '1',
    title: '$100M valuation by 2030',
    type: 'BHAG',
    description: 'Achieve company valuation of $100M by 2030',
    startDate: '2023-01-01T00:00:00Z',
    endDate: '2030-12-31T23:59:59Z',
    status: 'active',
    progress: 25,
    organizationId: 'test-org-id',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  };

  const threeHagGoal = {
    id: '2',
    title: '$50M annual revenue with 20% EBITDA by EOY 2025',
    type: '3HAG',
    description: 'Achieve $50M in annual revenue with 20% EBITDA by the end of 2025',
    startDate: '2023-01-01T00:00:00Z',
    endDate: '2025-12-31T23:59:59Z',
    status: 'active',
    progress: 50,
    organizationId: 'test-org-id',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  };

  const oneHagGoal = {
    id: '3',
    title: 'Expand to 3 new markets by EOY',
    type: '1HAG',
    description: 'Enter and establish presence in 3 new geographic markets by end of year',
    startDate: '2023-01-01T00:00:00Z',
    endDate: '2023-12-31T23:59:59Z',
    status: 'active',
    progress: 75,
    organizationId: 'test-org-id',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  };

  const quarterlyGoal = {
    id: '4',
    title: 'Increase sales by 15% this quarter',
    type: 'QUARTERLY',
    description: 'Increase sales revenue by 15% compared to the previous quarter',
    startDate: '2023-04-01T00:00:00Z',
    endDate: '2023-06-30T23:59:59Z',
    status: 'active',
    progress: 90,
    organizationId: 'test-org-id',
    createdAt: '2023-04-01T00:00:00Z',
    updatedAt: '2023-04-01T00:00:00Z'
  };

  return [bhagGoal, threeHagGoal, oneHagGoal, quarterlyGoal];
};

describe('StrategicRoadmapPage component', () => {
  test('renders loading state initially', async () => {
    // Mock useGoals to return isLoading: true
    vi.mock('../../../hooks/useGoals', () => ({
      useGoals: vi.fn().mockReturnValue({
        goals: createMockGoalsQueryResult({ isLoading: true }),
        getTimelineItems: {
          getTimelineItems: vi.fn().mockReturnValue({
            data: [],
            isLoading: true,
            isError: false
          })
        }
      }),
    }));

    // Render StrategicRoadmapPage with renderWithRouter
    renderWithRouter(<StrategicRoadmapPage />, [], '/strategy/roadmap');

    // Verify loading spinner is displayed
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('renders timeline view with goals', async () => {
    // Mock useGoals to return timeline items and goals
    vi.mock('../../../hooks/useGoals', () => ({
      useGoals: vi.fn().mockReturnValue({
        goals: createMockGoalsQueryResult({ data: createMockGoals() }),
        getTimelineItems: {
          getTimelineItems: vi.fn().mockReturnValue({
            data: createMockTimelineItems(),
            isLoading: false,
            isError: false
          })
        }
      }),
    }));

    // Render StrategicRoadmapPage with renderWithRouter
    renderWithRouter(<StrategicRoadmapPage />, [], '/strategy/roadmap');

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Verify timeline view is displayed
    expect(screen.getByText('BHAG')).toBeVisible();

    // Verify timeline items are rendered
    expect(screen.getByText('$100M valuation by 2030')).toBeVisible();
  });

  test('switches between timeline and list views', async () => {
    // Mock useGoals to return timeline items and goals
    vi.mock('../../../hooks/useGoals', () => ({
      useGoals: vi.fn().mockReturnValue({
        goals: createMockGoalsQueryResult({ data: createMockGoals() }),
        getTimelineItems: {
          getTimelineItems: vi.fn().mockReturnValue({
            data: createMockTimelineItems(),
            isLoading: false,
            isError: false
          })
        }
      }),
    }));

    // Render StrategicRoadmapPage with renderWithRouter
    renderWithRouter(<StrategicRoadmapPage />, [], '/strategy/roadmap');

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Verify timeline view is displayed initially
    expect(screen.getByText('BHAG')).toBeVisible();

    // Click on list view tab
    fireEvent.click(screen.getByText('List'));

    // Verify list view is displayed with goal cards
    expect(screen.getByText('$100M valuation by 2030')).toBeVisible();

    // Click on timeline view tab
    fireEvent.click(screen.getByText('Timeline'));

    // Verify timeline view is displayed again
    expect(screen.getByText('BHAG')).toBeVisible();
  });

  test('filters goals by type', async () => {
    // Mock useGoals to return timeline items and goals
    const mockUseGoals = vi.fn().mockReturnValue({
      goals: createMockGoalsQueryResult({ data: createMockGoals() }),
      getTimelineItems: {
        getTimelineItems: vi.fn().mockReturnValue({
          data: createMockTimelineItems(),
          isLoading: false,
          isError: false
        })
      }
    });
    vi.mock('../../../hooks/useGoals', () => ({
      useGoals: mockUseGoals,
    }));

    // Render StrategicRoadmapPage with renderWithRouter
    renderWithRouter(<StrategicRoadmapPage />, [], '/strategy/roadmap');

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Select a goal type filter
    const goalTypeDropdown = screen.getByLabelText('Goal Type');
    fireEvent.mouseDown(goalTypeDropdown);
    const listbox = within(screen.getByRole('listbox'));
    fireEvent.click(listbox.getByText('1HAG'));

    // Verify setFilters is called with the correct filter value
    expect(mockUseGoals().getTimelineItems.getTimelineItems).toHaveBeenCalledWith(GoalType.ONE_HAG);

    // Verify filtered goals are displayed
    expect(screen.getByText('Expand to 3 new markets by EOY')).toBeVisible();
  });

  test('selects a goal when clicked', async () => {
    // Mock useGoals to return timeline items and goals
    vi.mock('../../../hooks/useGoals', () => ({
      useGoals: vi.fn().mockReturnValue({
        goals: createMockGoalsQueryResult({ data: createMockGoals() }),
        getTimelineItems: {
          getTimelineItems: vi.fn().mockReturnValue({
            data: createMockTimelineItems(),
            isLoading: false,
            isError: false
          })
        }
      }),
    }));

    // Render StrategicRoadmapPage with renderWithRouter
    renderWithRouter(<StrategicRoadmapPage />, [], '/strategy/roadmap');

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Click on a goal in the timeline or list view
    fireEvent.click(screen.getByText('$100M valuation by 2030'));

    // Verify the goal details are displayed in the side panel
    expect(screen.getByText('Details for $100M valuation by 2030')).toBeVisible();
  });

  test('navigates to goal detail page when view details is clicked', async () => {
    // Mock useGoals to return timeline items and goals
    vi.mock('../../../hooks/useGoals', () => ({
      useGoals: vi.fn().mockReturnValue({
        goals: createMockGoalsQueryResult({ data: createMockGoals() }),
        getTimelineItems: {
          getTimelineItems: vi.fn().mockReturnValue({
            data: createMockTimelineItems(),
            isLoading: false,
            isError: false
          })
        }
      }),
    }));

    // Mock useNavigate
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });

    // Render StrategicRoadmapPage with renderWithRouter
    renderWithRouter(<StrategicRoadmapPage />, [], '/strategy/roadmap');

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Click on a goal to select it
    fireEvent.click(screen.getByText('$100M valuation by 2030'));

    // Click on the View Details button in the side panel
    fireEvent.click(screen.getByText('Details for $100M valuation by 2030'));

    // Verify navigate is called with the correct route
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.STRATEGY.GOAL_DETAIL.replace(':id', '1'));
  });

  test('navigates to create goal page when new goal button is clicked', async () => {
    // Mock useGoals to return timeline items and goals
    vi.mock('../../../hooks/useGoals', () => ({
      useGoals: vi.fn().mockReturnValue({
        goals: createMockGoalsQueryResult({ data: createMockGoals() }),
        getTimelineItems: {
          getTimelineItems: vi.fn().mockReturnValue({
            data: createMockTimelineItems(),
            isLoading: false,
            isError: false
          })
        }
      }),
    }));

    // Mock useNavigate
    const mockNavigate = vi.fn();
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
      };
    });

    // Render StrategicRoadmapPage with renderWithRouter
    renderWithRouter(<StrategicRoadmapPage />, [], '/strategy/roadmap');

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Click on the New Goal button
    fireEvent.click(screen.getByText('New Goal'));

    // Verify navigate is called with the correct route
    expect(mockNavigate).toHaveBeenCalledWith(ROUTES.STRATEGY.GOAL_NEW);
  });

  test('displays empty state when no goals are found', async () => {
    // Mock useGoals to return empty arrays for timeline items and goals
    vi.mock('../../../hooks/useGoals', () => ({
      useGoals: vi.fn().mockReturnValue({
        goals: createMockGoalsQueryResult({ data: [] }),
        getTimelineItems: {
          getTimelineItems: vi.fn().mockReturnValue({
            data: [],
            isLoading: false,
            isError: false
          })
        }
      }),
    }));

    // Render StrategicRoadmapPage with renderWithRouter
    renderWithRouter(<StrategicRoadmapPage />, [], '/strategy/roadmap');

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Verify empty state message is displayed
    expect(screen.getByText('No strategic goals or milestones to display.')).toBeVisible();
  });

  test('handles error state', async () => {
    // Mock useGoals to return isError: true
    vi.mock('../../../hooks/useGoals', () => ({
      useGoals: vi.fn().mockReturnValue({
        goals: createMockGoalsQueryResult({ isError: true }),
        getTimelineItems: {
          getTimelineItems: vi.fn().mockReturnValue({
            data: [],
            isLoading: false,
            isError: true
          })
        }
      }),
    }));

    // Render StrategicRoadmapPage with renderWithRouter
    renderWithRouter(<StrategicRoadmapPage />, [], '/strategy/roadmap');

    // Wait for loading to finish
    await waitForLoadingToFinish();

    // Verify error message is displayed
    expect(screen.getByText('An error occurred while fetching data.')).toBeVisible();
  });
});