import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react'; // ^14.0.0
import userEvent from '@testing-library/user-event'; // ^14.0.0

import GoalCard from '../GoalCard';
import { Goal, GoalType, GoalStatus, GoalWithMetrics, GoalWithMilestones } from '../../types/goal.types';
import { Severity } from '../../types/common.types';
import { renderWithProviders } from '../../../tests/testUtils';

/**
 * Helper function to create a mock goal for testing
 * @param overrides 
 * @returns A mock goal object
 */
const createMockGoal = (overrides: Partial<Goal> = {}): Goal => {
  // Create a default mock goal with all required properties
  const mockGoal: Goal = {
    id: 'test-goal-id',
    type: GoalType.ONE_HAG,
    title: 'Test Goal',
    description: 'This is a test goal',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: GoalStatus.ACTIVE,
    progress: 50,
    organizationId: 'test-org-id',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    ...overrides, // Apply any overrides provided in the parameters
  };

  return mockGoal; // Return the mock goal object
};

/**
 * Helper function to create a mock goal with metrics for testing
 * @param overrides 
 * @returns A mock goal with metrics
 */
const createMockGoalWithMetrics = (overrides: Partial<GoalWithMetrics> = {}): GoalWithMetrics => {
  // Create a default mock goal using createMockGoal
  const mockGoal = createMockGoal();

  // Add metrics array with mock metric references
  const mockGoalWithMetrics: GoalWithMetrics = {
    ...mockGoal,
    metrics: [
      { id: 'metric-1', name: 'Metric 1' },
      { id: 'metric-2', name: 'Metric 2' },
    ],
    ...overrides, // Apply any overrides provided in the parameters
  };

  return mockGoalWithMetrics; // Return the mock goal with metrics object
};

/**
 * Helper function to create a mock goal with milestones for testing
 * @param overrides 
 * @returns A mock goal with milestones
 */
const createMockGoalWithMilestones = (overrides: Partial<GoalWithMilestones> = {}): GoalWithMilestones => {
  // Create a default mock goal using createMockGoal
  const mockGoal = createMockGoal();

  // Add milestones array with mock milestone objects
  const mockGoalWithMilestones: GoalWithMilestones = {
    ...mockGoal,
    milestones: [
      { id: 'milestone-1', title: 'Milestone 1', description: 'Description 1', dueDate: '2024-06-30', status: 'pending', goalId: 'test-goal-id', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      { id: 'milestone-2', title: 'Milestone 2', description: 'Description 2', dueDate: '2024-12-31', status: 'completed', goalId: 'test-goal-id', createdAt: '2024-01-01', updatedAt: '2024-01-01' },
    ],
    ...overrides, // Apply any overrides provided in the parameters
  };

  return mockGoalWithMilestones; // Return the mock goal with milestones object
};

describe('GoalCard Component', () => {
  it('renders basic goal information correctly', () => {
    // Create a mock goal with title, description, and dates
    const mockGoal = createMockGoal({
      title: 'Increase Revenue',
      description: 'Increase revenue by 20% in Q1',
      startDate: '2024-01-01',
      endDate: '2024-03-31',
    });

    // Render the GoalCard component with the mock goal
    renderWithProviders(<GoalCard goal={mockGoal} />);

    // Verify that the title, description, and date range are displayed correctly
    expect(screen.getByText('Increase Revenue')).toBeInTheDocument();
    expect(screen.getByText('Increase revenue by 20% in Q1')).toBeInTheDocument();
    expect(screen.getByText('Jan 1, 2024 - Dec 31, 2024')).toBeInTheDocument();
  });

  it('displays correct goal type label', () => {
    // Create mock goals with different goal types (BHAG, THREE_HAG, ONE_HAG, QUARTERLY)
    const bhagGoal = createMockGoal({ type: GoalType.BHAG });
    const threeHagGoal = createMockGoal({ type: GoalType.THREE_HAG });
    const oneHagGoal = createMockGoal({ type: GoalType.ONE_HAG });
    const quarterlyGoal = createMockGoal({ type: GoalType.QUARTERLY });

    // Render the GoalCard component for each goal type
    renderWithProviders(
      <>
        <GoalCard goal={bhagGoal} />
        <GoalCard goal={threeHagGoal} />
        <GoalCard goal={oneHagGoal} />
        <GoalCard goal={quarterlyGoal} />
      </>
    );

    // Verify that the correct type label is displayed for each goal type
    expect(screen.getByText('BHAG')).toBeInTheDocument();
    expect(screen.getByText('3HAG')).toBeInTheDocument();
    expect(screen.getByText('1HAG')).toBeInTheDocument();
    expect(screen.getByText('Quarterly')).toBeInTheDocument();
  });

  it('displays status badge with correct severity', () => {
    // Create mock goals with different statuses (DRAFT, ACTIVE, AT_RISK, COMPLETED, ARCHIVED)
    const draftGoal = createMockGoal({ status: GoalStatus.DRAFT });
    const activeGoal = createMockGoal({ status: GoalStatus.ACTIVE });
    const atRiskGoal = createMockGoal({ status: GoalStatus.AT_RISK });
    const completedGoal = createMockGoal({ status: GoalStatus.COMPLETED });
    const archivedGoal = createMockGoal({ status: GoalStatus.ARCHIVED });

    // Render the GoalCard component for each status
    renderWithProviders(
      <>
        <GoalCard goal={draftGoal} />
        <GoalCard goal={activeGoal} />
        <GoalCard goal={atRiskGoal} />
        <GoalCard goal={completedGoal} />
        <GoalCard goal={archivedGoal} />
      </>
    );

    // Verify that the status badge is displayed with the correct text and severity
    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('At Risk')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('shows progress bar with correct percentage', () => {
    // Create a mock goal with a specific progress value
    const mockGoal = createMockGoal({ progress: 75 });

    // Render the GoalCard component with the mock goal
    renderWithProviders(<GoalCard goal={mockGoal} />);

    // Verify that the progress bar is displayed with the correct percentage
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('shows metrics count when showMetrics is true', () => {
    // Create a mock goal with metrics
    const mockGoal = createMockGoalWithMetrics();

    // Render the GoalCard component with showMetrics prop set to true
    renderWithProviders(<GoalCard goal={mockGoal} showMetrics />);

    // Verify that the metrics count is displayed correctly
    expect(screen.getByText('2 Metrics')).toBeInTheDocument();
  });

  it('hides metrics count when showMetrics is false', () => {
    // Create a mock goal with metrics
    const mockGoal = createMockGoalWithMetrics();

    // Render the GoalCard component with showMetrics prop set to false
    renderWithProviders(<GoalCard goal={mockGoal} showMetrics={false} />);

    // Verify that the metrics count is not displayed
    expect(screen.queryByText('2 Metrics')).not.toBeInTheDocument();
  });

  it('shows milestones count when showMilestones is true', () => {
    // Create a mock goal with milestones
    const mockGoal = createMockGoalWithMilestones();

    // Render the GoalCard component with showMilestones prop set to true
    renderWithProviders(<GoalCard goal={mockGoal} showMilestones />);

    // Verify that the milestones count is displayed correctly
    expect(screen.getByText('2 Milestones')).toBeInTheDocument();
  });

  it('hides milestones count when showMilestones is false', () => {
    // Create a mock goal with milestones
    const mockGoal = createMockGoalWithMilestones();

    // Render the GoalCard component with showMilestones prop set to false
    renderWithProviders(<GoalCard goal={mockGoal} showMilestones={false} />);

    // Verify that the milestones count is not displayed
    expect(screen.queryByText('2 Milestones')).not.toBeInTheDocument();
  });

  it('shows action buttons when showActions is true', () => {
    // Create a mock goal
    const mockGoal = createMockGoal();

    // Render the GoalCard component with showActions prop set to true
    renderWithProviders(<GoalCard goal={mockGoal} showActions />);

    // Verify that the edit and delete buttons are displayed
    expect(screen.getByLabelText('Edit goal')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete goal')).toBeInTheDocument();
  });

  it('hides action buttons when showActions is false', () => {
    // Create a mock goal
    const mockGoal = createMockGoal();

    // Render the GoalCard component with showActions prop set to false
    renderWithProviders(<GoalCard goal={mockGoal} showActions={false} />);

    // Verify that the edit and delete buttons are not displayed
    expect(screen.queryByLabelText('Edit goal')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Delete goal')).not.toBeInTheDocument();
  });

  it('calls onClick handler when card is clicked and interactive is true', () => {
    // Create a mock goal
    const mockGoal = createMockGoal();

    // Create a mock onClick handler function
    const onClick = vi.fn();

    // Render the GoalCard component with the mock goal, onClick handler, and interactive set to true
    renderWithProviders(<GoalCard goal={mockGoal} onClick={onClick} interactive />);

    // Simulate clicking on the card
    fireEvent.click(screen.getByText('Test Goal').closest('div') as Element);

    // Verify that the onClick handler was called with the goal as argument
    expect(onClick).toHaveBeenCalledWith(mockGoal);
  });

  it('does not call onClick handler when interactive is false', () => {
    // Create a mock goal
    const mockGoal = createMockGoal();

    // Create a mock onClick handler function
    const onClick = vi.fn();

    // Render the GoalCard component with the mock goal, onClick handler, and interactive set to false
    renderWithProviders(<GoalCard goal={mockGoal} onClick={onClick} interactive={false} />);

    // Simulate clicking on the card
    fireEvent.click(screen.getByText('Test Goal').closest('div') as Element);

    // Verify that the onClick handler was not called
    expect(onClick).not.toHaveBeenCalled();
  });

  it('calls onEdit handler when edit button is clicked', () => {
    // Create a mock goal
    const mockGoal = createMockGoal();

    // Create a mock onEdit handler function
    const onEdit = vi.fn();

    // Render the GoalCard component with the mock goal, onEdit handler, and showActions set to true
    renderWithProviders(<GoalCard goal={mockGoal} onEdit={onEdit} showActions />);

    // Simulate clicking on the edit button
    fireEvent.click(screen.getByLabelText('Edit goal'));

    // Verify that the onEdit handler was called with the goal as argument
    expect(onEdit).toHaveBeenCalledWith(mockGoal);
  });

  it('calls onDelete handler when delete button is clicked', () => {
    // Create a mock goal
    const mockGoal = createMockGoal();

    // Create a mock onDelete handler function
    const onDelete = vi.fn();

    // Render the GoalCard component with the mock goal, onDelete handler, and showActions set to true
    renderWithProviders(<GoalCard goal={mockGoal} onDelete={onDelete} showActions />);

    // Simulate clicking on the delete button
    fireEvent.click(screen.getByLabelText('Delete goal'));

    // Verify that the onDelete handler was called with the goal as argument
    expect(onDelete).toHaveBeenCalledWith(mockGoal);
  });

  it('applies custom className when provided', () => {
    // Create a mock goal
    const mockGoal = createMockGoal();

    // Render the GoalCard component with a custom className
    renderWithProviders(<GoalCard goal={mockGoal} className="custom-class" />);

    // Verify that the custom class is applied to the component
    expect(screen.getByText('Test Goal').closest('div')).toHaveClass('custom-class');
  });
});