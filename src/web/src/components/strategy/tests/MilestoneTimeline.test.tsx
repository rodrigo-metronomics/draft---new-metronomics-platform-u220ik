import React from 'react'; // react@^18.2.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // ^14.0.0
import userEvent from '@testing-library/user-event'; // ^14.0.0
import { vi } from 'vitest'; // ^0.34.0

import MilestoneTimeline from '../MilestoneTimeline'; // Import the component being tested
import { Milestone, MilestoneStatus } from '../../../types/goal.types'; // Import types needed for creating test data
import { renderWithProviders } from '../../../../tests/testUtils'; // Import test utility for rendering components with necessary providers

/**
 * Creates an array of mock milestone objects for testing
 * @returns {Milestone[]} Array of mock milestone objects
 */
const createMockMilestones = (): Milestone[] => {
  // Create an array of milestone objects with different statuses, dates, and properties
  return [
    {
      id: '1',
      title: 'Launch MVP',
      description: 'Initial product launch with core features',
      dueDate: '2023-06-30T00:00:00.000Z',
      status: MilestoneStatus.COMPLETED,
      goalId: 'goal1',
      createdAt: '2023-01-15T00:00:00.000Z',
      updatedAt: '2023-06-30T00:00:00.000Z',
    },
    {
      id: '2',
      title: 'Expand to new market',
      description: 'Enter European market with localized offering',
      dueDate: '2023-09-15T00:00:00.000Z',
      status: MilestoneStatus.IN_PROGRESS,
      goalId: 'goal1',
      createdAt: '2023-01-15T00:00:00.000Z',
      updatedAt: '2023-07-10T00:00:00.000Z',
    },
    {
      id: '3',
      title: 'Reach 1000 customers',
      description: 'Achieve customer acquisition milestone',
      dueDate: '2023-08-01T00:00:00.000Z',
      status: MilestoneStatus.MISSED,
      goalId: 'goal1',
      createdAt: '2023-01-15T00:00:00.000Z',
      updatedAt: '2023-08-02T00:00:00.000Z',
    },
    {
      id: '4',
      title: 'Release v2.0',
      description: 'Major feature update with premium tier',
      dueDate: '2023-12-15T00:00:00.000Z',
      status: MilestoneStatus.PENDING,
      goalId: 'goal1',
      createdAt: '2023-01-15T00:00:00.000Z',
      updatedAt: '2023-01-15T00:00:00.000Z',
    },
  ];
};

describe('MilestoneTimeline', () => {
  it('renders correctly with milestones', () => {
    // Create mock milestone data
    const mockMilestones = createMockMilestones();

    // Render the MilestoneTimeline component with the mock data
    renderWithProviders(<MilestoneTimeline milestones={mockMilestones} />);

    // Verify that milestone titles are displayed
    expect(screen.getByText('Launch MVP')).toBeInTheDocument();
    expect(screen.getByText('Expand to new market')).toBeInTheDocument();
    expect(screen.getByText('Reach 1000 customers')).toBeInTheDocument();
    expect(screen.getByText('Release v2.0')).toBeInTheDocument();

    // Verify that milestone dates are formatted correctly
    expect(screen.getByText('Jun 30, 2023')).toBeInTheDocument();
    expect(screen.getByText('Sep 15, 2023')).toBeInTheDocument();
    expect(screen.getByText('Aug 1, 2023')).toBeInTheDocument();
    expect(screen.getByText('Dec 15, 2023')).toBeInTheDocument();

    // Verify that milestone descriptions are displayed
    expect(screen.getByText('Initial product launch with core features')).toBeInTheDocument();
  });

  it('displays empty state when no milestones provided', () => {
    // Render the MilestoneTimeline component with an empty array of milestones
    renderWithProviders(<MilestoneTimeline milestones={[]} />);

    // Verify that the empty state message is displayed
    expect(screen.getByText('No milestones to display')).toBeInTheDocument();
  });

  it('sorts milestones by due date', () => {
    // Create mock milestone data with different due dates in random order
    const mockMilestones = [
      { ...createMockMilestones()[1], dueDate: '2023-09-15T00:00:00.000Z' },
      { ...createMockMilestones()[0], dueDate: '2023-06-30T00:00:00.000Z' },
      { ...createMockMilestones()[3], dueDate: '2023-12-15T00:00:00.000Z' },
      { ...createMockMilestones()[2], dueDate: '2023-08-01T00:00:00.000Z' },
    ];

    // Render the MilestoneTimeline component with the mock data
    renderWithProviders(<MilestoneTimeline milestones={mockMilestones} />);

    // Verify that milestones are displayed in ascending order by due date
    const milestoneDates = screen.getAllByText(/^(Jun|Aug|Sep|Dec) \d{1,2}, \d{4}$/);
    expect(milestoneDates[0]).toHaveTextContent('Jun 30, 2023');
    expect(milestoneDates[1]).toHaveTextContent('Aug 1, 2023');
    expect(milestoneDates[2]).toHaveTextContent('Sep 15, 2023');
    expect(milestoneDates[3]).toHaveTextContent('Dec 15, 2023');
  });

  it('displays correct status badges', () => {
    // Create mock milestone data with different statuses
    const mockMilestones = createMockMilestones();

    // Render the MilestoneTimeline component with the mock data
    renderWithProviders(<MilestoneTimeline milestones={mockMilestones} />);

    // Verify that each milestone has the correct status badge
    const completedBadge = screen.getByText('Completed');
    expect(completedBadge).toBeInTheDocument();

    const inProgressBadge = screen.getByText('In Progress');
    expect(inProgressBadge).toBeInTheDocument();

    const missedBadge = screen.getByText('Missed');
    expect(missedBadge).toBeInTheDocument();

    const pendingBadge = screen.getByText('Pending');
    expect(pendingBadge).toBeInTheDocument();
  });

  it('calculates and displays progress correctly', () => {
    // Create mock milestone data with a known number of completed milestones
    const mockMilestones = createMockMilestones();
    const completedMilestones = mockMilestones.filter(milestone => milestone.status === MilestoneStatus.COMPLETED).length;
    const expectedProgress = (completedMilestones / mockMilestones.length) * 100;

    // Render the MilestoneTimeline component with showProgress=true
    renderWithProviders(<MilestoneTimeline milestones={mockMilestones} showProgress={true} />);

    // Verify that the progress bar is displayed
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();

    // Verify that the progress percentage matches the expected value
    expect(progressBar).toHaveAttribute('aria-valuenow', expectedProgress.toString());
  });

  it('does not display progress bar when showProgress is false', () => {
    // Create mock milestone data
    const mockMilestones = createMockMilestones();

    // Render the MilestoneTimeline component with showProgress=false
    renderWithProviders(<MilestoneTimeline milestones={mockMilestones} showProgress={false} />);

    // Verify that the progress bar is not displayed
    const progressBar = screen.queryByRole('progressbar');
    expect(progressBar).not.toBeInTheDocument();
  });

  it('calls onMilestoneClick when a milestone is clicked', async () => {
    // Create mock milestone data
    const mockMilestones = createMockMilestones();

    // Create a mock click handler function
    const handleClick = vi.fn();

    // Render the MilestoneTimeline component with the mock data and click handler
    renderWithProviders(<MilestoneTimeline milestones={mockMilestones} onMilestoneClick={handleClick} />);

    // Simulate clicking on a milestone
    const milestoneElement = screen.getByText('Launch MVP').closest('div');
    await userEvent.click(milestoneElement as Element);

    // Verify that the click handler was called with the correct milestone object
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(handleClick).toHaveBeenCalledWith(mockMilestones[0]);
  });

  it('does not call onMilestoneClick when interactive is false', async () => {
    // Create mock milestone data
    const mockMilestones = createMockMilestones();

    // Create a mock click handler function
    const handleClick = vi.fn();

    // Render the MilestoneTimeline component with interactive=false
    renderWithProviders(<MilestoneTimeline milestones={mockMilestones} onMilestoneClick={handleClick} interactive={false} />);

    // Simulate clicking on a milestone
    const milestoneElement = screen.getByText('Launch MVP').closest('div');
    await userEvent.click(milestoneElement as Element);

    // Verify that the click handler was not called
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies custom className and style props', () => {
    // Create mock milestone data
    const mockMilestones = createMockMilestones();

    // Render the MilestoneTimeline component with custom className and style props
    const customClassName = 'custom-timeline';
    const customStyle = { border: '1px solid red' };
    renderWithProviders(
      <MilestoneTimeline
        milestones={mockMilestones}
        className={customClassName}
        style={customStyle}
      />
    );

    // Verify that the container has the custom className
    const timelineContainer = screen.getByRole('list');
    expect(timelineContainer).toHaveClass(customClassName);

    // Verify that the container has the custom style attributes
    expect(timelineContainer).toHaveStyle(customStyle);
  });
});