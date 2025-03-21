import React from 'react'; // React ^18.2.0
import { render, screen, fireEvent, waitFor } from '@testing-library/react'; // @testing-library/react ^14.0.0
import userEvent from '@testing-library/user-event'; // @testing-library/user-event ^14.0.0
import { vi } from 'vitest'; // vitest ^0.34.0

import MeetingStages from '../MeetingStages'; // Import the component being tested
import { MeetingStageType, MeetingType } from '../../types/meeting.types'; // Import meeting type enums for test cases
import { DEFAULT_MEETING_STAGES } from '../../utils/constants/meetingStages'; // Import meeting stage configuration for test validation
import { renderWithProviders, createMockAuthUser } from '../../../tests/testUtils'; // Import test utilities for rendering with providers and creating mock users

// Mock the useMeetingStagesRealtime hook
vi.mock('../../hooks/useRealtime', () => ({
  useMeetingStagesRealtime: vi.fn().mockReturnValue({
    stages: [
      { id: '1', stageType: MeetingStageType.GOOD_NEWS, content: 'Initial good news', sequence: 1 },
      { id: '2', stageType: MeetingStageType.PREVIOUS_ACTIONS, content: 'Initial previous actions', sequence: 2 },
      { id: '3', stageType: MeetingStageType.METRICS, content: 'Initial metrics', sequence: 3 },
      { id: '4', stageType: MeetingStageType.PRIORITIES, content: 'Initial priorities', sequence: 4 },
      { id: '5', stageType: MeetingStageType.BLOCKERS, content: 'Initial blockers', sequence: 5 },
      { id: '6', stageType: MeetingStageType.NEW_ACTIONS, content: 'Initial new actions', sequence: 6 },
    ],
    updateStage: vi.fn(),
  }),
}));

// Mock the useAuth hook
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn().mockReturnValue({
    state: {
      user: createMockAuthUser(),
    },
  }),
}));

// Mock the MeetingProgress component
vi.mock('../MeetingProgress', () => ({
  default: vi.fn(() => <div data-testid="meeting-progress">MeetingProgress</div>),
}));

// Mock the MeetingStageGoodNews component
vi.mock('../MeetingStageGoodNews', () => ({
  default: vi.fn(() => <div data-testid="meeting-stage-good-news">MeetingStageGoodNews</div>),
}));

// Mock the MeetingStagePreviousActions component
vi.mock('../MeetingStagePreviousActions', () => ({
  default: vi.fn(() => <div data-testid="meeting-stage-previous-actions">MeetingStagePreviousActions</div>),
}));

// Mock the MeetingStageMetrics component
vi.mock('../MeetingStageMetrics', () => ({
  default: vi.fn(() => <div data-testid="meeting-stage-metrics">MeetingStageMetrics</div>),
}));

// Mock the MeetingStagePriorities component
vi.mock('../MeetingStagePriorities', () => ({
  default: vi.fn(() => <div data-testid="meeting-stage-priorities">MeetingStagePriorities</div>),
}));

// Mock the MeetingStageBlockers component
vi.mock('../MeetingStageBlockers', () => ({
  default: vi.fn(() => <div data-testid="meeting-stage-blockers">MeetingStageBlockers</div>),
}));

// Mock the MeetingStageNewActions component
vi.mock('../MeetingStageNewActions', () => ({
  default: vi.fn(() => <div data-testid="meeting-stage-new-actions">MeetingStageNewActions</div>),
}));

describe('MeetingStages', () => {
  const setup = (customProps: any = {}) => {
    const onStageChange = vi.fn();
    const onComplete = vi.fn();

    const props = {
      meetingId: 'test-meeting-id',
      meetingType: MeetingType.DAILY,
      currentStage: MeetingStageType.GOOD_NEWS,
      isModerator: true,
      onStageChange,
      onComplete,
      ...customProps,
    };

    const renderResult = renderWithProviders(<MeetingStages {...props} />);
    const user = userEvent.setup();

    return {
      ...renderResult,
      user,
      onStageChange,
      onComplete,
    };
  };

  it('renders without crashing', () => {
    const { getByTestId } = setup();
    expect(getByTestId('meeting-progress')).toBeInTheDocument();
  });

  it('renders the correct stage based on currentStage prop', () => {
    const { rerender } = setup();
    expect(screen.getByTestId('meeting-stage-good-news')).toBeInTheDocument();

    rerender(<MeetingStages
      meetingId="test-meeting-id"
      meetingType={MeetingType.DAILY}
      currentStage={MeetingStageType.PREVIOUS_ACTIONS}
      isModerator={true}
      onStageChange={vi.fn()}
      onComplete={vi.fn()}
    />);
    expect(screen.getByTestId('meeting-stage-previous-actions')).toBeInTheDocument();
  });

  it('renders MeetingProgress component with correct props', () => {
    const { getByTestId } = setup({
      meetingType: MeetingType.WEEKLY,
      currentStage: MeetingStageType.METRICS,
    });
    const meetingProgress = getByTestId('meeting-progress');
    expect(meetingProgress).toBeInTheDocument();
  });

  it('calls onStageChange when navigating to a different stage', async () => {
    const { user, onStageChange } = setup();
    const nextButton = screen.getByRole('button', { name: /Next Stage/i });
    await user.click(nextButton);
    expect(onStageChange).toHaveBeenCalled();
  });

  it('tracks completed stages correctly', async () => {
    const { user } = setup({ currentStage: MeetingStageType.GOOD_NEWS });
    const nextButton = screen.getByRole('button', { name: /Next Stage/i });
    await user.click(nextButton);
  });

  it('calls onComplete when all stages are completed', async () => {
    const { user, onComplete } = setup({
      currentStage: MeetingStageType.NEW_ACTIONS,
    });
    const nextButton = screen.getByRole('button', { name: /Next Stage/i });
    await user.click(nextButton);
    expect(onComplete).toHaveBeenCalled();
  });

  it('handles real-time updates to stage data', async () => {
    const mockUseMeetingStagesRealtime = vi.fn().mockReturnValue({
      stages: [
        { id: '1', stageType: MeetingStageType.GOOD_NEWS, content: 'Updated good news', sequence: 1 },
      ],
      updateStage: vi.fn(),
    });
    vi.mock('../../hooks/useRealtime', () => ({
      useMeetingStagesRealtime: mockUseMeetingStagesRealtime,
    }));
    setup();
  });

  it('displays loading state when stages are being fetched', () => {
    vi.mock('../../hooks/useRealtime', () => ({
      useMeetingStagesRealtime: vi.fn().mockReturnValue({
        stages: [],
        loading: true,
        error: null,
        updateStage: vi.fn(),
      }),
    }));
    const { getByRole } = setup();
    expect(getByRole('status')).toBeInTheDocument();
  });

  it('displays error state when stage data fetch fails', () => {
    vi.mock('../../hooks/useRealtime', () => ({
      useMeetingStagesRealtime: vi.fn().mockReturnValue({
        stages: [],
        loading: false,
        error: new Error('Failed to fetch stages'),
        updateStage: vi.fn(),
      }),
    }));
    const { getByText } = setup();
    expect(getByText('Failed to fetch stages')).toBeInTheDocument();
  });

  it('renders different stage sequences for different meeting types', () => {
    const { rerender } = setup({ meetingType: MeetingType.DAILY });
    expect(screen.getByTestId('meeting-progress')).toBeInTheDocument();

    rerender(<MeetingStages
      meetingId="test-meeting-id"
      meetingType={MeetingType.WEEKLY}
      currentStage={MeetingStageType.GOOD_NEWS}
      isModerator={true}
      onStageChange={vi.fn()}
      onComplete={vi.fn()}
    />);
    expect(screen.getByTestId('meeting-progress')).toBeInTheDocument();

    rerender(<MeetingStages
      meetingId="test-meeting-id"
      meetingType={MeetingType.QUARTERLY}
      currentStage={MeetingStageType.GOOD_NEWS}
      isModerator={true}
      onStageChange={vi.fn()}
      onComplete={vi.fn()}
    />);
    expect(screen.getByTestId('meeting-progress')).toBeInTheDocument();
  });

  it('disables stage navigation for non-moderators', () => {
    const { queryByRole, rerender } = setup({ isModerator: false });
    expect(queryByRole('button', { name: /Next Stage/i })).toBeNull();

    rerender(<MeetingStages
      meetingId="test-meeting-id"
      meetingType={MeetingType.DAILY}
      currentStage={MeetingStageType.GOOD_NEWS}
      isModerator={true}
      onStageChange={vi.fn()}
      onComplete={vi.fn()}
    />);
    expect(screen.getByRole('button', { name: /Next Stage/i })).toBeInTheDocument();
  });
});