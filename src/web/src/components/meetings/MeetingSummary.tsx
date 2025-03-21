import React, { useEffect } from 'react'; // React, { useState, useEffect }@^18.2.0
import styled from 'styled-components'; // styled-components@^5.3.10
import { useParams, useNavigate } from 'react-router-dom'; // react-router-dom@^6.10.0
import { FiDownload, FiShare2, FiPrinter } from 'react-icons/fi'; // react-icons/fi@^4.8.0

import Card from '../common/Card';
import Badge from '../common/Badge';
import ActionItemList from './ActionItemList';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import {
  MeetingType,
  MeetingSummaryResponse,
} from '../../types/meeting.types';
import {
  ActionItemStatus,
  ActionItemPriority,
} from '../../types/action-item.types';
import useMeetings from '../../hooks/useMeetings';
import { formatDate, formatDuration } from '../../utils/helpers/dateTimeHelper';

/**
 * Interface for the MeetingSummary component props
 */
interface MeetingSummaryProps {
  meetingId?: string;
  showActions?: boolean;
  showHeader?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Styled component for the main container of the meeting summary
 */
const SummaryContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

/**
 * Styled component for the meeting summary header
 */
const SummaryHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

/**
 * Styled component for the meeting summary title
 */
const SummaryTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-color-primary);
  margin: 0;
`;

/**
 * Styled component for the meeting summary metadata (date, time, duration)
 */
const SummaryMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
`;

/**
 * Styled component for the meeting statistics container
 */
const SummaryStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
`;

/**
 * Styled component for an individual meeting statistic card
 */
const StatCard = styled.div`
  background-color: var(--surface-card);
  border-radius: 8px;
  padding: 1rem;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

/**
 * Styled component for the meeting statistic value
 */
const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
`;

/**
 * Styled component for the meeting statistic label
 */
const StatLabel = styled.div`
  font-size: 0.9rem;
  color: var(--text-color-secondary);
`;

/**
 * Styled component for the key points section
 */
const KeyPointsSection = styled.div`
  margin-bottom: 1.5rem;
`;

/**
 * Styled component for the key points list
 */
const KeyPointsList = styled.ul`
  list-style-type: disc;
  padding-left: 1.5rem;
  margin-top: 0.5rem;
`;

/**
 * Styled component for an individual key point item
 */
const KeyPoint = styled.li`
  margin-bottom: 0.5rem;
  line-height: 1.5;
`;

/**
 * Styled component for the action items section
 */
const ActionItemsSection = styled.div`
  margin-bottom: 1.5rem;
`;

/**
 * Styled component for the actions container
 */
const ActionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
`;

/**
 * Styled component for the error container
 */
const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--red-500);
`;

/**
 * Styled component for the loading container
 */
const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
`;

/**
 * Component that displays a comprehensive summary of a completed meeting
 */
const MeetingSummary: React.FC<MeetingSummaryProps> = ({
  meetingId: propMeetingId,
  showActions = true,
  showHeader = true,
  className,
  style,
}) => {
  // Extract meetingId from props or URL parameters if not provided directly
  const { meetingId: urlMeetingId } = useParams();
  const meetingId = propMeetingId || urlMeetingId || '';
  const navigate = useNavigate();

  // Use useMeetings hook to get the getMeetingSummary function
  const { getMeetingSummary } = useMeetings();

  // Fetch meeting summary data using the getMeetingSummary function
  const { data: summary, isLoading, isError, error } = getMeetingSummary(meetingId);

  // Handle loading state with a spinner
  if (isLoading) {
    return (
      <LoadingContainer>
        <Spinner size="medium" />
      </LoadingContainer>
    );
  }

  // Handle error state with an error message
  if (isError || !summary) {
    return (
      <ErrorContainer>
        <h1>Error</h1>
        <p>{error?.message || 'Failed to load meeting summary.'}</p>
      </ErrorContainer>
    );
  }

  /**
   * Renders a badge with appropriate styling for the meeting type
   */
  const renderMeetingTypeBadge = (type: MeetingType): JSX.Element => {
    let badgeColor = 'primary';
    switch (type) {
      case MeetingType.DAILY:
        badgeColor = 'info';
        break;
      case MeetingType.WEEKLY:
        badgeColor = 'success';
        break;
      case MeetingType.QUARTERLY:
        badgeColor = 'warning';
        break;
      default:
        badgeColor = 'primary';
    }
    return <Badge value={type} severity={badgeColor} />;
  };

  /**
   * Exports the meeting summary as a PDF document
   */
  const exportSummaryAsPDF = (summary: MeetingSummaryResponse): void => {
    // Format summary data for PDF export
    // Generate PDF document with appropriate styling
    // Trigger download of the generated PDF
    console.log('Exporting summary as PDF', summary);
  };

  /**
   * Exports the action items from the meeting as a CSV file
   */
  const exportSummaryAsCSV = (summary: MeetingSummaryResponse): void => {
    // Format action items data for CSV export
    // Generate CSV content with headers and data rows
    // Trigger download of the generated CSV file
    console.log('Exporting summary as CSV', summary);
  };

  /**
   * Opens a print dialog to print the meeting summary
   */
  const printSummary = (): void => {
    // Create a print-friendly version of the summary
    // Open browser print dialog
    // Return to normal view after printing
    console.log('Printing summary');
  };

  /**
   * Shares the meeting summary via email or generates a shareable link
   */
  const shareSummary = (summary: MeetingSummaryResponse): void => {
    // Generate a shareable link to the summary
    // Copy link to clipboard or open email client
    // Show confirmation message to user
    console.log('Sharing summary', summary);
  };

  return (
    <SummaryContainer className={className} style={style}>
      {showHeader && (
        <SummaryHeader>
          <SummaryTitle>{summary.title}</SummaryTitle>
          <SummaryMeta>
            <span>{renderMeetingTypeBadge(summary.meetingType)}</span>
            <span>{formatDate(summary.date, 'MMMM d, yyyy')}</span>
            <span>{formatDuration(summary.duration)}</span>
          </SummaryMeta>
        </SummaryHeader>
      )}

      <SummaryStats>
        <StatCard>
          <StatValue>{summary.participantCount}</StatValue>
          <StatLabel>Participants</StatLabel>
        </StatCard>
        {/* Add more stats as needed */}
      </SummaryStats>

      <KeyPointsSection>
        <Card title="Key Points">
          <KeyPointsList>
            {summary.keyPoints.map((point, index) => (
              <KeyPoint key={index}>{point}</KeyPoint>
            ))}
          </KeyPointsList>
        </Card>
      </KeyPointsSection>

      <ActionItemsSection>
        <Card title="Action Items">
          <ActionItemList meetingId={summary.id} onActionItemCreated={() => {}} onActionItemUpdated={() => {}} onActionItemDeleted={() => {}} />
        </Card>
      </ActionItemsSection>

      {showActions && (
        <ActionsContainer>
          <Button icon={<FiDownload />} label="Export" onClick={() => exportSummaryAsPDF(summary)} />
          <Button icon={<FiShare2 />} label="Share" onClick={() => shareSummary(summary)} />
          <Button icon={<FiPrinter />} label="Print" onClick={printSummary} />
        </ActionsContainer>
      )}
    </SummaryContainer>
  );
};

export default MeetingSummary;