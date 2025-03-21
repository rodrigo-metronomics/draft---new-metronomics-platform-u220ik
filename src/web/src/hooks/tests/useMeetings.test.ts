import { renderHook, act, waitFor } from '@testing-library/react-hooks'; // @testing-library/react-hooks@^8.0.0
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'; // vitest@^0.34.0
import MockAdapter from 'axios-mock-adapter'; // axios-mock-adapter@^1.21.4
import axios from 'axios'; // axios@^1.4.0

import { useMeetings, useActiveMeeting } from '../useMeetings';
import { renderHookWithProviders } from '../../tests/testUtils';
import { setupMeetingMocks, mockMeeting } from '../../tests/mocks/apiMocks';
import { createMockMeetingsQueryResult } from '../../tests/mocks/reactQueryMock';
import { MeetingType, MeetingStatus, MeetingStageType, CreateMeetingDto, UpdateMeetingDto } from '../../types/meeting.types';
import meetingApi from '../../services/api/meetingApi';

describe('useMeetings', () => {
  let mockAdapter: MockAdapter;

  beforeEach(() => {
    mockAdapter = new MockAdapter(axios);
    setupMeetingMocks(mockAdapter);
  });

  afterEach(() => {
    mockAdapter.restore();
  });

  it('should fetch meetings list', async () => {
    const { result } = renderHookWithProviders(() => useMeetings());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.meetings).toBeDefined();
    expect(result.current.isError).toBe(false);
  });

  it('should handle filtering meetings', async () => {
    const { result } = renderHookWithProviders(() => useMeetings());

    act(() => {
      result.current.setFilters({ meetingType: MeetingType.DAILY });
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockMeetingApi.getMeetings).toHaveBeenCalledWith(expect.objectContaining({ meetingType: MeetingType.DAILY }));
  });

  it('should handle pagination', async () => {
    const { result } = renderHookWithProviders(() => useMeetings());

    act(() => {
      result.current.setPage(2);
      result.current.setPageSize(5);
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockMeetingApi.getMeetings).toHaveBeenCalledWith(expect.objectContaining({ page: 2, pageSize: 5 }));
  });

  it('should handle sorting', async () => {
    const { result } = renderHookWithProviders(() => useMeetings());

    act(() => {
      result.current.setSort('title');
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockMeetingApi.getMeetings).toHaveBeenCalledWith(expect.objectContaining({ sortBy: 'title' }));
  });

  it('should fetch a single meeting by ID', async () => {
    const { result } = renderHookWithProviders(() => useMeetings());

    const meeting = await result.current.getMeetingById('1');

    expect(mockMeetingApi.getMeetingById).toHaveBeenCalledWith('1');
    expect(meeting).toBeDefined();
  });

  it('should create a new meeting', async () => {
    const { result } = renderHookWithProviders(() => useMeetings());

    const newMeetingDto: CreateMeetingDto = {
      title: 'New Meeting',
      description: 'Test Description',
      meetingType: MeetingType.WEEKLY,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      organizationId: 'test-org-id',
      participantIds: [],
      moderatorIds: [],
      recurrenceRule: null,
      location: null,
      virtualMeetingUrl: null,
      syncWithCalendar: false,
    };

    await result.current.createMeeting.mutateAsync(newMeetingDto);

    expect(mockMeetingApi.createMeeting).toHaveBeenCalledWith(newMeetingDto);
    expect(mockMeetingApi.getMeetings).toHaveBeenCalled();
  });

  it('should update an existing meeting', async () => {
    const { result } = renderHookWithProviders(() => useMeetings());

    const updateMeetingDto: UpdateMeetingDto = {
      title: 'Updated Meeting Title',
      description: 'Updated Description',
    };

    await result.current.updateMeeting.mutateAsync({ id: '1', meetingData: updateMeetingDto });

    expect(mockMeetingApi.updateMeeting).toHaveBeenCalledWith('1', updateMeetingDto);
    expect(mockMeetingApi.getMeetings).toHaveBeenCalled();
  });

  it('should delete a meeting', async () => {
    const { result } = renderHookWithProviders(() => useMeetings());

    await result.current.deleteMeeting.mutateAsync('1');

    expect(mockMeetingApi.deleteMeeting).toHaveBeenCalledWith('1');
    expect(mockMeetingApi.getMeetings).toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    mockAdapter.onGet('/meetings').reply(500, { message: 'Test error' });

    const { result } = renderHookWithProviders(() => useMeetings());

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(Error);
    expect((result.current.error as Error).message).toBe('Test error');
  });
});

describe('useActiveMeeting', () => {
  let mockAdapter: MockAdapter;

  beforeEach(() => {
    mockAdapter = new MockAdapter(axios);
    setupMeetingMocks(mockAdapter);
  });

  afterEach(() => {
    mockAdapter.restore();
  });

  it('should start a meeting', async () => {
    const { result } = renderHookWithProviders(() => useActiveMeeting('1', 'test-org-id'));

    await act(() => result.current.startMeeting());

    expect(mockMeetingApi.startMeeting).toHaveBeenCalledWith('1');
  });

  it('should end a meeting', async () => {
    const { result } = renderHookWithProviders(() => useActiveMeeting('1', 'test-org-id'));

    await act(() => result.current.endMeeting());

    expect(mockMeetingApi.endMeeting).toHaveBeenCalledWith('1', true);
  });

  it('should update current stage', async () => {
    const { result } = renderHookWithProviders(() => useActiveMeeting('1', 'test-org-id'));

    await act(() => result.current.updateCurrentStage(MeetingStageType.METRICS));

    expect(mockMeetingApi.changeStage).toHaveBeenCalledWith('1', MeetingStageType.METRICS);
  });

  it('should update stage content', async () => {
    const { result } = renderHookWithProviders(() => useActiveMeeting('1', 'test-org-id'));

    await act(() => result.current.updateStageContent('stage-1', 'New Content'));

  });

  it('should receive real-time updates', async () => {
    const { result } = renderHookWithProviders(() => useActiveMeeting('1', 'test-org-id'));

  });
});