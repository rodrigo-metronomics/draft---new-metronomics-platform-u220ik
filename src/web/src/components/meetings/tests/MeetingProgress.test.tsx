import React from 'react'; // version ^18.2.0
import { render, screen, fireEvent } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0

import MeetingProgress from '../MeetingProgress';
import { MeetingType, MeetingStageType } from '../../types/meeting.types';
import { DEFAULT_MEETING_STAGES } from '../../utils/constants/meetingStages';
import { renderWithProviders } from '../../../tests/testUtils';

describe('MeetingProgress', () => {
  it('should render with daily meeting stages', () => {
    const mockStages = DEFAULT_MEETING_STAGES[MeetingType.DAILY].map(stage => ({
      id: stage.stageType,
      stageType: stage.stageType,
      isCompleted: false,
    }));

    renderWithProviders(<MeetingProgress
      meetingType={MeetingType.DAILY}
      currentStage={MeetingStageType.GOOD_NEWS}
      stages={mockStages}
      onStageChange={() => {}}
      isModerator={true}
    />);

    const stageIndicators = screen.getAllByRole('button');
    expect(stageIndicators).toHaveLength(DEFAULT_MEETING_STAGES[MeetingType.DAILY].length);

    expect(screen.getByText('Good News')).toBeInTheDocument();
    expect(screen.getByText('Previous Actions')).toBeInTheDocument();
    expect(screen.getByText("Today's Priorities")).toBeInTheDocument();
    expect(screen.getByText('Blockers')).toBeInTheDocument();
    expect(screen.getByText('New Actions')).toBeInTheDocument();
    expect(screen.getByText('Meeting Summary')).toBeInTheDocument();
  });

  it('should render with weekly meeting stages', () => {
    const mockStages = DEFAULT_MEETING_STAGES[MeetingType.WEEKLY].map(stage => ({
      id: stage.stageType,
      stageType: stage.stageType,
      isCompleted: false,
    }));

    renderWithProviders(<MeetingProgress
      meetingType={MeetingType.WEEKLY}
      currentStage={MeetingStageType.GOOD_NEWS}
      stages={mockStages}
      onStageChange={() => {}}
      isModerator={true}
    />);

    const stageIndicators = screen.getAllByRole('button');
    expect(stageIndicators).toHaveLength(DEFAULT_MEETING_STAGES[MeetingType.WEEKLY].length);

    expect(screen.getByText('Good News')).toBeInTheDocument();
    expect(screen.getByText('Previous Actions')).toBeInTheDocument();
    expect(screen.getByText('Metrics Review')).toBeInTheDocument();
    expect(screen.getByText("Today's Priorities")).toBeInTheDocument();
    expect(screen.getByText('Blockers')).toBeInTheDocument();
    expect(screen.getByText('New Actions')).toBeInTheDocument();
    expect(screen.getByText('Meeting Summary')).toBeInTheDocument();
  });

  it('should render with quarterly meeting stages', () => {
    const mockStages = DEFAULT_MEETING_STAGES[MeetingType.QUARTERLY].map(stage => ({
      id: stage.stageType,
      stageType: stage.stageType,
      isCompleted: false,
    }));

    renderWithProviders(<MeetingProgress
      meetingType={MeetingType.QUARTERLY}
      currentStage={MeetingStageType.GOOD_NEWS}
      stages={mockStages}
      onStageChange={() => {}}
      isModerator={true}
    />);

    const stageIndicators = screen.getAllByRole('button');
    expect(stageIndicators).toHaveLength(DEFAULT_MEETING_STAGES[MeetingType.QUARTERLY].length);

    expect(screen.getByText('Good News')).toBeInTheDocument();
    expect(screen.getByText('Previous Actions')).toBeInTheDocument();
    expect(screen.getByText('Metrics Review')).toBeInTheDocument();
    expect(screen.getByText("Today's Priorities")).toBeInTheDocument();
    expect(screen.getByText('Blockers')).toBeInTheDocument();
    expect(screen.getByText('New Actions')).toBeInTheDocument();
    expect(screen.getByText('Meeting Summary')).toBeInTheDocument();
  });

  it('should highlight the current stage', () => {
    const mockStages = DEFAULT_MEETING_STAGES[MeetingType.DAILY].map(stage => ({
      id: stage.stageType,
      stageType: stage.stageType,
      isCompleted: false,
    }));

    renderWithProviders(<MeetingProgress
      meetingType={MeetingType.DAILY}
      currentStage={MeetingStageType.PRIORITIES}
      stages={mockStages}
      onStageChange={() => {}}
      isModerator={true}
    />);

    const currentStageIndicator = screen.getByRole('button', { name: "Today's Priorities (current stage) " });
    expect(currentStageIndicator).toHaveStyle('opacity: 1');

    const otherStageIndicators = screen.getAllByRole('button').filter(el => el !== currentStageIndicator);
    otherStageIndicators.forEach(indicator => {
      expect(indicator).not.toHaveStyle('opacity: 1');
    });
  });

  it('should show completed stages', () => {
    const mockStages = DEFAULT_MEETING_STAGES[MeetingType.DAILY].map(stage => ({
      id: stage.stageType,
      stageType: stage.stageType,
      isCompleted: stage.sequence < 3,
    }));

    renderWithProviders(<MeetingProgress
      meetingType={MeetingType.DAILY}
      currentStage={MeetingStageType.PRIORITIES}
      stages={mockStages}
      onStageChange={() => {}}
      isModerator={true}
    />);

    const completedStageIndicators = screen.getAllByRole('button').filter(el => mockStages.find(s => s.stageType === el.id)?.isCompleted);
    completedStageIndicators.forEach(indicator => {
      expect(indicator.querySelector('div')).toHaveStyle('background-color: var(--green-500)');
    });

    const incompleteStageIndicators = screen.getAllByRole('button').filter(el => !mockStages.find(s => s.stageType === el.id)?.isCompleted);
    incompleteStageIndicators.forEach(indicator => {
      expect(indicator.querySelector('div')).not.toHaveStyle('background-color: var(--green-500)');
    });
  });

  it('should calculate progress percentage correctly', () => {
    const mockStages = DEFAULT_MEETING_STAGES[MeetingType.DAILY].map(stage => ({
      id: stage.stageType,
      stageType: stage.stageType,
      isCompleted: false,
    }));

    renderWithProviders(<MeetingProgress
      meetingType={MeetingType.DAILY}
      currentStage={MeetingStageType.PRIORITIES}
      stages={mockStages}
      onStageChange={() => {}}
      isModerator={true}
    />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
  });

  it('should call onStageChange when a stage is clicked by moderator', () => {
    const onStageChange = vi.fn();
    const mockStages = DEFAULT_MEETING_STAGES[MeetingType.DAILY].map(stage => ({
      id: stage.stageType,
      stageType: stage.stageType,
      isCompleted: false,
    }));

    renderWithProviders(<MeetingProgress
      meetingType={MeetingType.DAILY}
      currentStage={MeetingStageType.GOOD_NEWS}
      stages={mockStages}
      onStageChange={onStageChange}
      isModerator={true}
    />);

    const stageIndicator = screen.getByRole('button', { name: "Today's Priorities  " });
    fireEvent.click(stageIndicator);

    expect(onStageChange).toHaveBeenCalledWith(MeetingStageType.PRIORITIES);
  });

  it('should not call onStageChange when a stage is clicked by non-moderator', () => {
    const onStageChange = vi.fn();
    const mockStages = DEFAULT_MEETING_STAGES[MeetingType.DAILY].map(stage => ({
      id: stage.stageType,
      stageType: stage.stageType,
      isCompleted: false,
    }));

    renderWithProviders(<MeetingProgress
      meetingType={MeetingType.DAILY}
      currentStage={MeetingStageType.GOOD_NEWS}
      stages={mockStages}
      onStageChange={onStageChange}
      isModerator={false}
    />);

    const stageIndicator = screen.getByRole('presentation', { name: "Today's Priorities  " });
    fireEvent.click(stageIndicator);

    expect(onStageChange).not.toHaveBeenCalled();
  });

  it('should navigate to previous stage when previous button is clicked', () => {
    const onStageChange = vi.fn();
    const mockStages = DEFAULT_MEETING_STAGES[MeetingType.DAILY].map(stage => ({
      id: stage.stageType,
      stageType: stage.stageType,
      isCompleted: false,
    }));

    renderWithProviders(<MeetingProgress
      meetingType={MeetingType.DAILY}
      currentStage={MeetingStageType.PREVIOUS_ACTIONS}
      stages={mockStages}
      onStageChange={onStageChange}
      isModerator={true}
    />);

    const previousButton = screen.getByRole('button', { name: 'Previous' });
    fireEvent.click(previousButton);

    expect(onStageChange).toHaveBeenCalledWith(MeetingStageType.GOOD_NEWS);
  });

  it('should navigate to next stage when next button is clicked', () => {
    const onStageChange = vi.fn();
    const mockStages = DEFAULT_MEETING_STAGES[MeetingType.DAILY].map(stage => ({
      id: stage.stageType,
      stageType: stage.stageType,
      isCompleted: false,
    }));

    renderWithProviders(<MeetingProgress
      meetingType={MeetingType.DAILY}
      currentStage={MeetingStageType.PREVIOUS_ACTIONS}
      stages={mockStages}
      onStageChange={onStageChange}
      isModerator={true}
    />);

    const nextButton = screen.getByRole('button', { name: 'Next Stage' });
    fireEvent.click(nextButton);

    expect(onStageChange).toHaveBeenCalledWith(MeetingStageType.METRICS);
  });

  it('should disable previous button on first stage', () => {
    const mockStages = DEFAULT_MEETING_STAGES[MeetingType.DAILY].map(stage => ({
      id: stage.stageType,
      stageType: stage.stageType,
      isCompleted: false,
    }));

    renderWithProviders(<MeetingProgress
      meetingType={MeetingType.DAILY}
      currentStage={MeetingStageType.GOOD_NEWS}
      stages={mockStages}
      onStageChange={() => {}}
      isModerator={true}
    />);

    const previousButton = screen.getByRole('button', { name: 'Previous' });
    expect(previousButton).toBeDisabled();
  });

  it('should disable next button on last stage', () => {
    const mockStages = DEFAULT_MEETING_STAGES[MeetingType.DAILY].map(stage => ({
      id: stage.stageType,
      stageType: stage.stageType,
      isCompleted: false,
    }));

    renderWithProviders(<MeetingProgress
      meetingType={MeetingType.DAILY}
      currentStage={MeetingStageType.SUMMARY}
      stages={mockStages}
      onStageChange={() => {}}
      isModerator={true}
    />);

    const nextButton = screen.getByRole('button', { name: 'Next Stage' });
    expect(nextButton).toBeDisabled();
  });

  it('should not render navigation buttons for non-moderators', () => {
    const mockStages = DEFAULT_MEETING_STAGES[MeetingType.DAILY].map(stage => ({
      id: stage.stageType,
      stageType: stage.stageType,
      isCompleted: false,
    }));

    renderWithProviders(<MeetingProgress
      meetingType={MeetingType.DAILY}
      currentStage={MeetingStageType.GOOD_NEWS}
      stages={mockStages}
      onStageChange={() => {}}
      isModerator={false}
    />);

    const previousButton = screen.queryByRole('button', { name: 'Previous' });
    const nextButton = screen.queryByRole('button', { name: 'Next Stage' });

    expect(previousButton).not.toBeInTheDocument();
    expect(nextButton).not.toBeInTheDocument();
  });

  it('should apply custom className and style', () => {
    const mockStages = DEFAULT_MEETING_STAGES[MeetingType.DAILY].map(stage => ({
      id: stage.stageType,
      stageType: stage.stageType,
      isCompleted: false,
    }));

    const customClassName = 'custom-class';
    const customStyle = { backgroundColor: 'red' };

    const { container } = renderWithProviders(<MeetingProgress
      meetingType={MeetingType.DAILY}
      currentStage={MeetingStageType.GOOD_NEWS}
      stages={mockStages}
      onStageChange={() => {}}
      isModerator={true}
      className={customClassName}
      style={customStyle}
    />);

    expect(container.firstChild).toHaveClass(customClassName);
    expect(container.firstChild).toHaveStyle(customStyle);
  });
});