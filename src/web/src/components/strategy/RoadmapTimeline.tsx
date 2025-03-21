import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { GoalTimelineItem, GoalType, GoalStatus, MilestoneStatus } from '../../types/goal.types';
import Badge from '../common/Badge';
import ProgressBar from '../common/ProgressBar';
import Tooltip from '../common/Tooltip';
import { formatDate } from '../../utils/helpers/dateTimeHelper';
import { Severity } from '../../types/common.types';

// Props interface for the component
interface RoadmapTimelineProps {
  timelineItems: GoalTimelineItem[];
  onItemClick?: (item: GoalTimelineItem) => void;
  showLabels?: boolean;
  interactive?: boolean;
  showProgress?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

// Maps goal or milestone status to appropriate severity level for the Badge component
const getStatusSeverity = (status: GoalStatus | MilestoneStatus, itemType: string): Severity => {
  if (itemType === 'MILESTONE') {
    switch (status) {
      case MilestoneStatus.COMPLETED:
        return Severity.SUCCESS;
      case MilestoneStatus.MISSED:
        return Severity.ERROR;
      case MilestoneStatus.IN_PROGRESS:
        return Severity.WARNING;
      case MilestoneStatus.PENDING:
        return Severity.INFO;
      default:
        return Severity.INFO;
    }
  } else {
    switch (status) {
      case GoalStatus.COMPLETED:
        return Severity.SUCCESS;
      case GoalStatus.AT_RISK:
        return Severity.ERROR;
      case GoalStatus.ACTIVE:
        return Severity.WARNING;
      case GoalStatus.DRAFT:
        return Severity.INFO;
      case GoalStatus.ARCHIVED:
        return Severity.INFO;
      default:
        return Severity.INFO;
    }
  }
};

// Converts status enum value to a human-readable label
const getStatusLabel = (status: GoalStatus | MilestoneStatus, itemType: string): string => {
  if (itemType === 'MILESTONE') {
    switch (status) {
      case MilestoneStatus.COMPLETED:
        return 'Completed';
      case MilestoneStatus.MISSED:
        return 'Missed';
      case MilestoneStatus.IN_PROGRESS:
        return 'In Progress';
      case MilestoneStatus.PENDING:
        return 'Pending';
      default:
        return status as string;
    }
  } else {
    switch (status) {
      case GoalStatus.COMPLETED:
        return 'Completed';
      case GoalStatus.AT_RISK:
        return 'At Risk';
      case GoalStatus.ACTIVE:
        return 'Active';
      case GoalStatus.DRAFT:
        return 'Draft';
      case GoalStatus.ARCHIVED:
        return 'Archived';
      default:
        return status as string;
    }
  }
};

// Converts goal type enum value to a human-readable label
const getGoalTypeLabel = (type: GoalType | 'MILESTONE'): string => {
  switch (type) {
    case GoalType.BHAG:
      return 'BHAG';
    case GoalType.THREE_HAG:
      return '3HAG';
    case GoalType.ONE_HAG:
      return '1HAG';
    case GoalType.QUARTERLY:
      return 'Quarterly';
    case 'MILESTONE':
      return 'Milestone';
    default:
      return type as string;
  }
};

// Determines the color for a timeline item based on its type and status
const getTimelineItemColor = (type: GoalType | 'MILESTONE', status: GoalStatus | MilestoneStatus): string => {
  let baseColor;
  let statusModifier = 1; // Modifier for status (darker for completed, lighter for draft/pending)

  // Determine base color by type
  switch (type) {
    case GoalType.BHAG:
      baseColor = 'rgba(24, 144, 255, 0.8)'; // Blue
      break;
    case GoalType.THREE_HAG:
      baseColor = 'rgba(16, 185, 129, 0.8)'; // Green
      break;
    case GoalType.ONE_HAG:
      baseColor = 'rgba(139, 92, 246, 0.8)'; // Purple
      break;
    case GoalType.QUARTERLY:
      baseColor = 'rgba(245, 158, 11, 0.8)'; // Orange
      break;
    case 'MILESTONE':
      baseColor = 'rgba(156, 163, 175, 0.8)'; // Gray
      break;
    default:
      baseColor = 'rgba(107, 114, 128, 0.8)'; // Default gray
  }

  // Adjust color based on status
  if (type === 'MILESTONE') {
    if (status === MilestoneStatus.COMPLETED) {
      statusModifier = 1.2; // Darker for completed
    } else if (status === MilestoneStatus.PENDING) {
      statusModifier = 0.8; // Lighter for pending
    }
  } else {
    if (status === GoalStatus.COMPLETED) {
      statusModifier = 1.2; // Darker for completed
    } else if (status === GoalStatus.DRAFT) {
      statusModifier = 0.8; // Lighter for draft
    }
  }

  // Apply status modifier (simplistic approach for this component)
  // In a real implementation, you might use color manipulation libraries
  return baseColor;
};

// Calculates the scale and positioning for timeline items based on date ranges
const calculateTimelineScale = (items: GoalTimelineItem[]) => {
  if (!items || items.length === 0) {
    return {
      earliestDate: new Date(),
      latestDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      scaleFactor: 100, // Default scale factor
    };
  }

  // Find earliest start date and latest end date
  const dates = items.flatMap(item => [new Date(item.startDate), new Date(item.endDate)]);
  const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));

  // Calculate the total time span in days
  const timeSpanDays = (latestDate.getTime() - earliestDate.getTime()) / (24 * 60 * 60 * 1000);
  
  // Add padding (10% on each side)
  const paddingDays = timeSpanDays * 0.1;
  const paddedEarliestDate = new Date(earliestDate.getTime() - paddingDays * 24 * 60 * 60 * 1000);
  const paddedLatestDate = new Date(latestDate.getTime() + paddingDays * 24 * 60 * 60 * 1000);
  
  // Calculate scale factor (width in pixels per day)
  // A higher value means a more zoomed-in view
  const scaleFactor = 100 / (timeSpanDays + paddingDays * 2);

  return {
    earliestDate: paddedEarliestDate,
    latestDate: paddedLatestDate,
    scaleFactor,
  };
};

// Styled components for the timeline
const TimelineContainer = styled.div`
  position: relative;
  width: 100%;
  min-height: 400px;
  background-color: var(--surface-card);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  overflow-x: auto;
`;

const TimelineControls = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  z-index: 10;
`;

const TimelineContent = styled.div`
  position: relative;
  width: 100%;
  min-height: 300px;
  padding-top: 2rem;
`;

const TimelineTrack = styled.div`
  position: relative;
  width: 100%;
  height: 80px;
  margin-bottom: 1.5rem;
  border-bottom: 1px dashed var(--surface-border);
`;

const TimelineTrackLabel = styled.div`
  position: absolute;
  left: 0;
  top: -20px;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
`;

const TimelineItem = styled.div<{
  interactive: boolean;
  selected: boolean;
  itemColor: string;
}>`
  position: absolute;
  height: 60px;
  background-color: ${props => props.itemColor || 'var(--primary-color)'};
  border-radius: 4px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: ${props => props.interactive ? 'pointer' : 'default'};
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: ${props => props.selected ? 'var(--focused-shadow)' : 'var(--card-shadow)'};
  transform: ${props => props.selected ? 'translateY(-2px)' : 'none'};
  z-index: ${props => props.selected ? 2 : 1};
  &:hover { 
    transform: ${props => props.interactive ? 'translateY(-2px)' : 'none'}; 
    box-shadow: ${props => props.interactive ? 'var(--focused-shadow)' : 'var(--card-shadow)'} 
  }
`;

const TimelineItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const TimelineItemTitle = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80%;
`;

const TimelineItemDates = styled.div`
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
`;

const TimelineItemFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
`;

const TimelineAxis = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30px;
  border-top: 1px solid var(--surface-border);
  display: flex;
  justify-content: space-between;
  padding: 0 1rem;
`;

const TimelineAxisMarker = styled.div`
  position: absolute;
  bottom: 30px;
  width: 1px;
  height: 10px;
  background-color: var(--surface-border);
`;

const TimelineAxisLabel = styled.div`
  position: absolute;
  bottom: 5px;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  white-space: nowrap;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  width: 100%;
  color: var(--text-color-secondary);
  font-style: italic;
`;

const MilestoneMarker = styled.div<{
  markerColor: string;
  interactive: boolean;
  selected: boolean;
}>`
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.markerColor || 'var(--primary-color)'};
  border: 2px solid white;
  cursor: ${props => props.interactive ? 'pointer' : 'default'};
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: ${props => props.selected ? 'var(--focused-shadow)' : 'none'};
  transform: ${props => props.selected ? 'scale(1.2)' : 'none'};
  z-index: ${props => props.selected ? 2 : 1};
  &:hover { 
    transform: ${props => props.interactive ? 'scale(1.2)' : 'none'}; 
    box-shadow: ${props => props.interactive ? 'var(--focused-shadow)' : 'none'} 
  }
`;

// Main component that displays strategic goals and milestones on an interactive timeline
const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({
  timelineItems = [],
  onItemClick,
  showLabels = true,
  interactive = true,
  showProgress = true,
  className,
  style
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Calculate the timeline scale based on the date range of items
  const timelineScale = useMemo(() => {
    return calculateTimelineScale(timelineItems);
  }, [timelineItems]);
  
  // Organize items by type for visual grouping
  const itemsByType = useMemo(() => {
    const result: Record<string, GoalTimelineItem[]> = {
      BHAG: [],
      THREE_HAG: [],
      ONE_HAG: [],
      QUARTERLY: [],
      MILESTONE: []
    };
    
    timelineItems.forEach(item => {
      if (item.type === 'MILESTONE') {
        result.MILESTONE.push(item);
      } else {
        result[item.type].push(item);
      }
    });
    
    return result;
  }, [timelineItems]);
  
  // Handle item click events
  const handleItemClick = useCallback((item: GoalTimelineItem) => {
    if (!interactive) return;
    
    setSelectedItemId(selectedItemId === item.id ? null : item.id);
    if (onItemClick) {
      onItemClick(item);
    }
  }, [interactive, onItemClick, selectedItemId]);
  
  // Handle zoom controls
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    setZoomLevel(prev => {
      const newZoom = direction === 'in' ? prev * 1.2 : prev / 1.2;
      // Limit zoom between 0.5 and 5
      return Math.max(0.5, Math.min(5, newZoom));
    });
  }, []);
  
  // Position items on the timeline based on their dates and the current scale
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const containerWidth = container.clientWidth - 40; // Account for padding
    const { earliestDate, latestDate, scaleFactor } = timelineScale;
    const totalTimespan = latestDate.getTime() - earliestDate.getTime();
    const pixelsPerMs = containerWidth / totalTimespan;
    
    // Apply the zoom level to the timeline items
    const itemElements = container.querySelectorAll<HTMLElement>('[data-timeline-item]');
    itemElements.forEach(element => {
      const startDate = new Date(element.dataset.startDate || '').getTime();
      const endDate = new Date(element.dataset.endDate || '').getTime();
      
      // Calculate position and width
      const left = (startDate - earliestDate.getTime()) * pixelsPerMs * zoomLevel;
      const width = Math.max(
        100, // Minimum width for visibility
        (endDate - startDate) * pixelsPerMs * zoomLevel
      );
      
      // Apply position and width
      element.style.left = `${left}px`;
      element.style.width = `${width}px`;
    });
    
    // Position milestone markers
    const milestoneElements = container.querySelectorAll<HTMLElement>('[data-milestone-marker]');
    milestoneElements.forEach(element => {
      const date = new Date(element.dataset.date || '').getTime();
      
      // Calculate position
      const left = (date - earliestDate.getTime()) * pixelsPerMs * zoomLevel;
      
      // Apply position
      element.style.left = `${left}px`;
    });
    
    // Update the timeline axis markers and labels
    const axis = container.querySelector<HTMLElement>('.timeline-axis');
    if (axis) {
      // Clear existing markers and labels
      while (axis.firstChild) {
        axis.removeChild(axis.firstChild);
      }
      
      // Create markers and labels for each month or quarter depending on the zoom level
      const markerCount = Math.min(12, Math.max(4, Math.floor(containerWidth / 100)));
      const markerInterval = totalTimespan / markerCount;
      
      for (let i = 0; i <= markerCount; i++) {
        const date = new Date(earliestDate.getTime() + i * markerInterval);
        const left = i * (containerWidth / markerCount);
        
        // Create marker
        const marker = document.createElement('div');
        marker.className = 'timeline-axis-marker';
        marker.style.left = `${left}px`;
        axis.appendChild(marker);
        
        // Create label
        const label = document.createElement('div');
        label.className = 'timeline-axis-label';
        label.textContent = formatDate(date, 'MMM yyyy');
        label.style.left = `${left}px`;
        axis.appendChild(label);
      }
    }
  }, [timelineScale, zoomLevel, timelineItems]);
  
  // Render empty state if no items
  if (!timelineItems.length) {
    return (
      <TimelineContainer className={className} style={style} ref={containerRef}>
        <EmptyState>
          No strategic goals or milestones to display.
        </EmptyState>
      </TimelineContainer>
    );
  }
  
  return (
    <TimelineContainer className={className} style={style} ref={containerRef}>
      <TimelineControls>
        <button 
          className="p-button p-button-text p-button-sm" 
          onClick={() => handleZoom('in')}
          aria-label="Zoom in"
        >
          <i className="pi pi-plus" />
        </button>
        <button 
          className="p-button p-button-text p-button-sm" 
          onClick={() => handleZoom('out')}
          aria-label="Zoom out"
        >
          <i className="pi pi-minus" />
        </button>
      </TimelineControls>
      
      <TimelineContent>
        {/* BHAG Track */}
        <TimelineTrack>
          <TimelineTrackLabel>BHAG</TimelineTrackLabel>
          {itemsByType.BHAG.map(item => (
            <TimelineItem
              key={item.id}
              data-timeline-item
              data-start-date={item.startDate}
              data-end-date={item.endDate}
              itemColor={getTimelineItemColor(item.type, item.status)}
              interactive={interactive}
              selected={selectedItemId === item.id}
              onClick={() => handleItemClick(item)}
              aria-label={`${item.title} - ${getStatusLabel(item.status, 'GOAL')}`}
            >
              <TimelineItemHeader>
                <TimelineItemTitle>{item.title}</TimelineItemTitle>
                <Badge value={getStatusLabel(item.status, 'GOAL')} severity={getStatusSeverity(item.status, 'GOAL')} />
              </TimelineItemHeader>
              
              <TimelineItemDates>
                {formatDate(item.startDate, 'MMM yyyy')} - {formatDate(item.endDate, 'MMM yyyy')}
              </TimelineItemDates>
              
              {showProgress && (
                <TimelineItemFooter>
                  <ProgressBar 
                    value={item.progress} 
                    style={{ height: '6px', width: '100%' }} 
                    showValue={false}
                  />
                </TimelineItemFooter>
              )}
            </TimelineItem>
          ))}
        </TimelineTrack>
        
        {/* 3HAG Track */}
        <TimelineTrack>
          <TimelineTrackLabel>3HAG</TimelineTrackLabel>
          {itemsByType.THREE_HAG.map(item => (
            <TimelineItem
              key={item.id}
              data-timeline-item
              data-start-date={item.startDate}
              data-end-date={item.endDate}
              itemColor={getTimelineItemColor(item.type, item.status)}
              interactive={interactive}
              selected={selectedItemId === item.id}
              onClick={() => handleItemClick(item)}
              aria-label={`${item.title} - ${getStatusLabel(item.status, 'GOAL')}`}
            >
              <TimelineItemHeader>
                <TimelineItemTitle>{item.title}</TimelineItemTitle>
                <Badge value={getStatusLabel(item.status, 'GOAL')} severity={getStatusSeverity(item.status, 'GOAL')} />
              </TimelineItemHeader>
              
              <TimelineItemDates>
                {formatDate(item.startDate, 'MMM yyyy')} - {formatDate(item.endDate, 'MMM yyyy')}
              </TimelineItemDates>
              
              {showProgress && (
                <TimelineItemFooter>
                  <ProgressBar 
                    value={item.progress} 
                    style={{ height: '6px', width: '100%' }} 
                    showValue={false}
                  />
                </TimelineItemFooter>
              )}
            </TimelineItem>
          ))}
        </TimelineTrack>
        
        {/* 1HAG Track */}
        <TimelineTrack>
          <TimelineTrackLabel>1HAG</TimelineTrackLabel>
          {itemsByType.ONE_HAG.map(item => (
            <TimelineItem
              key={item.id}
              data-timeline-item
              data-start-date={item.startDate}
              data-end-date={item.endDate}
              itemColor={getTimelineItemColor(item.type, item.status)}
              interactive={interactive}
              selected={selectedItemId === item.id}
              onClick={() => handleItemClick(item)}
              aria-label={`${item.title} - ${getStatusLabel(item.status, 'GOAL')}`}
            >
              <TimelineItemHeader>
                <TimelineItemTitle>{item.title}</TimelineItemTitle>
                <Badge value={getStatusLabel(item.status, 'GOAL')} severity={getStatusSeverity(item.status, 'GOAL')} />
              </TimelineItemHeader>
              
              <TimelineItemDates>
                {formatDate(item.startDate, 'MMM yyyy')} - {formatDate(item.endDate, 'MMM yyyy')}
              </TimelineItemDates>
              
              {showProgress && (
                <TimelineItemFooter>
                  <ProgressBar 
                    value={item.progress} 
                    style={{ height: '6px', width: '100%' }} 
                    showValue={false}
                  />
                </TimelineItemFooter>
              )}
            </TimelineItem>
          ))}
        </TimelineTrack>
        
        {/* Quarterly Track */}
        <TimelineTrack>
          <TimelineTrackLabel>Quarterly</TimelineTrackLabel>
          {itemsByType.QUARTERLY.map(item => (
            <TimelineItem
              key={item.id}
              data-timeline-item
              data-start-date={item.startDate}
              data-end-date={item.endDate}
              itemColor={getTimelineItemColor(item.type, item.status)}
              interactive={interactive}
              selected={selectedItemId === item.id}
              onClick={() => handleItemClick(item)}
              aria-label={`${item.title} - ${getStatusLabel(item.status, 'GOAL')}`}
            >
              <TimelineItemHeader>
                <TimelineItemTitle>{item.title}</TimelineItemTitle>
                <Badge value={getStatusLabel(item.status, 'GOAL')} severity={getStatusSeverity(item.status, 'GOAL')} />
              </TimelineItemHeader>
              
              <TimelineItemDates>
                {formatDate(item.startDate, 'MMM yyyy')} - {formatDate(item.endDate, 'MMM yyyy')}
              </TimelineItemDates>
              
              {showProgress && (
                <TimelineItemFooter>
                  <ProgressBar 
                    value={item.progress} 
                    style={{ height: '6px', width: '100%' }} 
                    showValue={false}
                  />
                </TimelineItemFooter>
              )}
            </TimelineItem>
          ))}
        </TimelineTrack>
        
        {/* Milestones Track */}
        <TimelineTrack>
          <TimelineTrackLabel>Milestones</TimelineTrackLabel>
          {itemsByType.MILESTONE.map(item => (
            <Tooltip
              key={item.id}
              content={`${item.title} - ${getStatusLabel(item.status, 'MILESTONE')}`}
            >
              <MilestoneMarker
                data-milestone-marker
                data-date={item.startDate}
                markerColor={getTimelineItemColor('MILESTONE', item.status)}
                interactive={interactive}
                selected={selectedItemId === item.id}
                onClick={() => handleItemClick(item)}
                aria-label={`${item.title} - ${getStatusLabel(item.status, 'MILESTONE')}`}
              />
            </Tooltip>
          ))}
        </TimelineTrack>
        
        {/* Timeline Axis */}
        <TimelineAxis className="timeline-axis" />
      </TimelineContent>
    </TimelineContainer>
  );
};

export default RoadmapTimeline;