import React, { useState, useEffect, useCallback } from 'react'; // react@^18.0.0
import styled from 'styled-components'; // version ^5.3.10

import Card from '../common/Card';
import MetricCard from '../metrics/MetricCard';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import TextArea from '../common/TextArea';
import { MeetingStageType } from '../../types/meeting.types';
import { MEETING_STAGES } from '../../utils/constants/meetingStages';
import { ChartType, ColorScheme } from '../../types/common.types';
import useMetrics from '../../hooks/useMetrics';
import useOrganization from '../../hooks/useOrganization';
import useResponsive from '../../hooks/useResponsive';

/**
 * Interface defining the props for the MeetingStageMetrics component
 */
interface MeetingStageMetricsProps {
  meetingId: string;
  stageId: string;
  content: string;
  isActive: boolean;
  isModerator: boolean;
  onContentChange: (newContent: string) => void;
  onComplete: () => void;
}

/**
 * Styled component for the metrics container
 */
const MetricsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
`;

/**
 * Styled component for the prompt section
 */
const PromptSection = styled.div`
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
  color: var(--text-color-secondary);
`;

/**
 * Styled component for the metrics grid
 */
const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

/**
 * Styled component for the notes section
 */
const NotesSection = styled.div`
  margin-top: 1.5rem;
  margin-bottom: 1.5rem;
`;

/**
 * Styled component for the notes label
 */
const NotesLabel = styled.div`
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

/**
 * Styled component for the action section
 */
const ActionSection = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
`;

/**
 * Styled component for the loading container
 */
const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

/**
 * Component for the metrics review stage of a meeting
 * @param props - The component props
 * @returns The rendered component
 */
const MeetingStageMetrics: React.FC<MeetingStageMetricsProps> = ({
  meetingId,
  stageId,
  content,
  isActive,
  isModerator,
  onContentChange,
  onComplete,
}) => {
  // LD1: Extract meetingId, stageId, content, isActive, isModerator, onContentChange, and onComplete from props
  // LD1: Get current organization using useOrganization hook
  const { currentOrganization } = useOrganization();
  // LD1: Get responsive breakpoints using useResponsive hook
  const { isMobileView } = useResponsive();

  // LD1: Initialize state for notes using the provided content or empty string
  const [notes, setNotes] = useState<string>(content || '');
  // LD1: Initialize state for metrics data
  const [metricsData, setMetricsData] = useState(null);

  // LD1: Use the useMetrics hook to fetch dashboard metrics
  const { getDashboardMetrics, isLoading } = useMetrics();

  // LD1: Fetch dashboard metrics when the component mounts or when organizationId changes
  useEffect(() => {
    if (currentOrganization) {
      getDashboardMetrics({ organizationId: currentOrganization.id })
        .then((data) => {
          setMetricsData(data);
        })
        .catch((error) => {
          console.error('Error fetching dashboard metrics:', error);
        });
    }
  }, [currentOrganization, getDashboardMetrics]);

  // LD1: Handle notes change and update parent component via onContentChange callback
  const handleNotesChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newNotes = event.target.value;
      setNotes(newNotes);
      onContentChange(newNotes);
    },
    [onContentChange]
  );

  // LD1: Handle stage completion via onComplete callback
  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // LD1: Render the metrics review stage with prompt from MEETING_STAGES
  // LD1: Display loading spinner while metrics are being fetched
  // LD1: Display metrics grid with MetricCard components for each metric
  // LD1: Provide text area for meeting notes related to metrics discussion
  // LD1: Render complete button for moderators to mark the stage as complete
  return (
    <MetricsContainer>
      <Card title={MEETING_STAGES[MeetingStageType.METRICS].title}>
        <PromptSection>{MEETING_STAGES[MeetingStageType.METRICS].prompt}</PromptSection>
        {isLoading || !metricsData ? (
          <LoadingContainer>
            <Spinner />
          </LoadingContainer>
        ) : (
          <>
            <MetricsGrid>
              {metricsData.metrics.map((metric) => (
                <MetricCard key={metric.id} metric={metric} />
              ))}
            </MetricsGrid>
            <NotesSection>
              <NotesLabel>Meeting Notes</NotesLabel>
              <TextArea
                rows={5}
                value={notes}
                onChange={handleNotesChange}
                placeholder="Enter your notes here..."
              />
            </NotesSection>
            {isModerator && (
              <ActionSection>
                <Button label="Complete" onClick={handleComplete} />
              </ActionSection>
            )}
          </>
        )}
      </Card>
    </MetricsContainer>
  );
};

export default MeetingStageMetrics;