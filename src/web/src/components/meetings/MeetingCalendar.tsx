import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.10
import { useNavigate } from 'react-router-dom'; // version ^6.8.0
import { Calendar } from 'primereact/calendar'; // version ^9.6.0
import { addDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, isSameMonth } from 'date-fns'; // version ^2.30.0

import { Meeting, MeetingType, MeetingStatus, MeetingFilters } from '../../types/meeting.types';
import { CalendarProvider } from '../../types/calendar.types';
import MeetingCard from './MeetingCard';
import Button from '../common/Button';
import Tooltip from '../common/Tooltip';
import Modal from '../common/Modal';
import useMeetings from '../../hooks/useMeetings';
import useCalendarSync from '../../hooks/useCalendarSync';
import useOrganization from '../../hooks/useOrganization';
import useResponsive from '../../hooks/useResponsive';
import { formatDate, formatTime, isSameDay } from '../../utils/helpers/dateTimeHelper';
import { ROUTES } from '../../utils/constants/routes';

/**
 * Interface defining the props for the MeetingCalendar component
 */
interface MeetingCalendarProps {
  initialView?: string;
  onMeetingClick?: (meeting: Meeting) => void;
  onCreateMeeting?: (date: Date) => void;
  onJoinMeeting?: (meeting: Meeting) => void;
  showControls?: boolean;
  allowCreation?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface CalendarViewType {
  MONTH: string;
  WEEK: string;
  DAY: string;
}

const CalendarContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  background-color: white;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
`;

const HeaderTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
`;

const HeaderControls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const ViewControls = styled.div`
  display: flex;
  gap: 5px;
  margin-right: 10px;
`;

const NavigationControls = styled.div`
  display: flex;
  gap: 5px;
`;

interface CalendarGridProps {
  viewType: string;
}

const CalendarGrid = styled.div<CalendarGridProps>`
  display: grid;
  grid-template-columns: ${props =>
    props.viewType === 'MONTH'
      ? 'repeat(7, 1fr)'
      : props.viewType === 'WEEK'
      ? 'repeat(7, 1fr)'
      : '1fr'};
  grid-template-rows: ${props =>
    props.viewType === 'MONTH' ? 'repeat(6, 1fr)' : '1fr'};
  flex-grow: 1;
  overflow: auto;
`;

interface CalendarCellProps {
  isToday: boolean;
  isCurrentMonth: boolean;
  isWeekend: boolean;
}

const CalendarCell = styled.div<CalendarCellProps>`
  border: 1px solid #e0e0e0;
  padding: 8px;
  min-height: 100px;
  background-color: ${props => {
    if (props.isToday) return '#e6f7ff';
    if (!props.isCurrentMonth) return '#f9f9f9';
    return 'white';
  }};
  position: relative;
  cursor: pointer;
`;

const CellHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
`;

interface CellDateProps {
  isToday: boolean;
}

const CellDate = styled.span<CellDateProps>`
  font-weight: ${props => (props.isToday ? 'bold' : 'normal')};
  border-radius: ${props => (props.isToday ? '50%' : '0')};
  background-color: ${props => (props.isToday ? '#1890ff' : 'transparent')};
  color: ${props => (props.isToday ? 'white' : 'inherit')};
  padding: ${props => (props.isToday ? '3px' : '0')};
`;

const MeetingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-height: 150px;
  overflow-y: auto;
`;

const CreateButton = styled.div`
  position: absolute;
  bottom: 5px;
  right: 5px;
  z-index: 1;
`;

/**
 * A calendar component that displays meetings in a monthly, weekly, or daily view
 */
const MeetingCalendar: React.FC<MeetingCalendarProps> = ({
  initialView = 'MONTH',
  onMeetingClick,
  onCreateMeeting,
  onJoinMeeting,
  showControls = true,
  allowCreation = true,
  className,
  style,
}) => {
  const [date, setDate] = useState(new Date());
  const [viewType, setViewType] = useState<string>(initialView);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);

  const { meetings, isLoading } = useMeetings();
  const { calendarStatus, syncMeetingWithCalendar } = useCalendarSync();
  const { currentOrganization } = useOrganization();
  const { isMobile } = useResponsive();
  const navigate = useNavigate();

  const headerFormat = viewType === 'MONTH' ? 'MMMM yyyy' : viewType === 'WEEK' ? 'MMMM d, y' : 'MMMM d, y';

  const startDate = useMemo(() => {
    if (viewType === 'MONTH') return startOfMonth(date);
    if (viewType === 'WEEK') return startOfWeek(date);
    return date;
  }, [date, viewType]);

  const endDate = useMemo(() => {
    if (viewType === 'MONTH') return endOfMonth(date);
    if (viewType === 'WEEK') return endOfWeek(date);
    return date;
  }, [date, viewType]);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [startDate, endDate]);

  const filteredMeetings = useMemo(() => {
    return meetings?.filter(meeting => {
      const meetingStart = new Date(meeting.startTime);
      return meetingStart >= startDate && meetingStart <= endDate;
    });
  }, [meetings, startDate, endDate]);

  const groupedMeetings = useMemo(() => {
    return groupMeetingsByDate(filteredMeetings || []);
  }, [filteredMeetings]);

  const prevMonth = () => {
    setDate(prevDate => {
      if (viewType === 'MONTH') return addDays(subtractTimeFromDate(startOfMonth(prevDate), 1, 'days') || new Date(), 1);
      if (viewType === 'WEEK') return addDays(subtractTimeFromDate(startOfWeek(prevDate), 1, 'days') || new Date(), 1);
      return addDays(subtractTimeFromDate(prevDate, 1, 'days') || new Date(), 1);
    });
  };

  const nextMonth = () => {
    setDate(prevDate => {
      if (viewType === 'MONTH') return addDays(addTimeToDate(endOfMonth(prevDate), 1, 'days') || new Date(), 1);
      if (viewType === 'WEEK') return addDays(addTimeToDate(endOfWeek(prevDate), 1, 'days') || new Date(), 1);
      return addDays(addTimeToDate(prevDate, 1, 'days') || new Date(), 1);
    });
  };

  const today = () => {
    setDate(new Date());
  };

  const handleMeetingClick = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    onMeetingClick?.(meeting);
  };

  const handleCreateMeeting = (day: Date) => {
    onCreateMeeting?.(day);
  };

  const handleSyncMeeting = async (meeting: Meeting) => {
    try {
      await syncMeetingWithCalendar(meeting.id);
      console.log(`Meeting ${meeting.id} synced with calendar`);
    } catch (error) {
      console.error(`Failed to sync meeting ${meeting.id} with calendar`, error);
    }
  };

  const getCalendarCellClass = (date: Date, currentMonth: Date): string => {
    let classNames = '';
    if (isToday(date)) classNames += ' today';
    if (isSameMonth(date, currentMonth)) {
      classNames += ' current-month';
    } else {
      classNames += ' other-month';
    }
    if (date.getDay() === 0 || date.getDay() === 6) classNames += ' weekend';
    return classNames;
  };

  const groupMeetingsByDate = (meetings: Meeting[]): Record<string, Meeting[]> => {
    return meetings.reduce((groups: Record<string, Meeting[]>, meeting: Meeting) => {
      const date = format(new Date(meeting.startTime), 'yyyy-MM-dd');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(meeting);
      return groups;
    }, {});
  };

  return (
    <CalendarContainer className={className} style={style}>
      {showControls && (
        <CalendarHeader>
          <HeaderTitle>{format(date, headerFormat)}</HeaderTitle>
          <HeaderControls>
            <ViewControls>
              <Button label="Month" outlined={viewType !== 'MONTH'} onClick={() => setViewType('MONTH')} />
              <Button label="Week" outlined={viewType !== 'WEEK'} onClick={() => setViewType('WEEK')} />
            </ViewControls>
            <NavigationControls>
              <Button icon="pi pi-chevron-left" onClick={prevMonth} rounded text />
              <Button label="Today" onClick={today} outlined />
              <Button icon="pi pi-chevron-right" onClick={nextMonth} rounded text />
            </NavigationControls>
          </HeaderControls>
        </CalendarHeader>
      )}
      <CalendarGrid viewType={viewType}>
        {days.map(day => (
          <CalendarCell
            key={day.toISOString()}
            isToday={isToday(day)}
            isCurrentMonth={isSameMonth(day, date)}
            isWeekend={day.getDay() === 0 || day.getDay() === 6}
            className={getCalendarCellClass(day, date)}
          >
            <CellHeader>
              <CellDate isToday={isToday(day)}>{format(day, 'd')}</CellDate>
            </CellHeader>
            <MeetingsContainer>
              {groupedMeetings[format(day, 'yyyy-MM-dd')]?.map(meeting => (
                <Tooltip key={meeting.id} content={meeting.title} position="top">
                  <MeetingCard meeting={meeting} compact onView={handleMeetingClick} />
                </Tooltip>
              ))}
            </MeetingsContainer>
            {allowCreation && (
              <CreateButton>
                <Button icon="pi pi-plus" rounded text onClick={() => handleCreateMeeting(day)} />
              </CreateButton>
            )}
          </CalendarCell>
        ))}
      </CalendarGrid>
    </CalendarContainer>
  );
};

export default MeetingCalendar;