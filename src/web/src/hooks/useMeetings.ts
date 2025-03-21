# src/web/src/hooks/useMeetings.ts
```typescript
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from 'react-query'; // react-query@^3.39.3
import { useState, useCallback, useEffect } from 'react'; // react@^18.2.0

import {
  Meeting,
  MeetingWithRelations,
  MeetingType,
  MeetingStatus,
  MeetingStageType,
  MeetingParticipant,
  ParticipantRole,
  AttendanceStatus,
  MeetingStage,
  MeetingNote,
  MeetingFilters,
  MeetingListParams,
  MeetingSort,
  CreateMeetingDto,
  UpdateMeetingDto,
  UpdateMeetingStageDto,
  AddParticipantsDto,
  RemoveParticipantsDto,
  UpdateMeetingParticipantDto
} from '../types/meeting.types';
import { ID, PaginationParams } from '../types/common.types';
import { CalendarProvider } from '../types/calendar.types';
import { meetingApi } from '../services/api/meetingApi';
import useOrganization from './useOrganization';
import useAuth from './useAuth';
import { useMeetingRealtime, useMeetingStagesRealtime } from './useRealtime';

/**
 * Custom hook for managing meetings data and operations
 * @param options 
 * @returns Meeting data and operations including queries, mutations, and utility functions
 */
export const useMeetings = (options?: UseQueryOptions<Meeting[]>) => {
  // Initialize React Query client for cache management
  const queryClient = useQueryClient();

  // Get current organization ID from useOrganization hook
  const { getPersistedOrganization } = useOrganization();
  const persistedOrgId = getPersistedOrganization();

  // Get current user information from useAuth hook
  const { state: authState } = useAuth();

  // Initialize state for filters, pagination, and sorting
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState<MeetingFilters>({
    organizationId: persistedOrgId || '',
  });
  const [sort, setSort] = useState<MeetingSort>(MeetingSort.START_TIME);

  // Define query key factory functions for consistent cache management
  const meetingQueryKeys = {
    all: () => ['meetings'] as const,
    lists: (filters: MeetingFilters, pagination: PaginationParams) =>
      [...meetingQueryKeys.all(), 'list', filters, pagination] as const,
    details: () => [...meetingQueryKeys.all(), 'detail'] as const,
    detail: (id: ID) => [...meetingQueryKeys.details(), id] as const,
  };

  // Implement useGetMeetings query for fetching meetings with filters, pagination, and sorting
  const useGetMeetings = (queryOptions?: UseQueryOptions<Meeting[]>) => {
    return useQuery<Meeting[]>(
      meetingQueryKeys.lists(filters, { page, pageSize }),
      () => meetingApi.getMeetings({ ...filters, page, pageSize, sortBy: sort }).then(res => res.data.items),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetMeetingById query for fetching a single meeting by ID
  const useGetMeetingById = (id: ID, queryOptions?: UseQueryOptions<Meeting>) => {
    return useQuery<Meeting>(
      meetingQueryKeys.detail(id),
      () => meetingApi.getMeetingById(id).then(res => res.data),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetMeetingWithParticipants query for fetching a meeting with its participants
  const useGetMeetingWithParticipants = (id: ID, queryOptions?: UseQueryOptions<MeetingWithRelations>) => {
    return useQuery<MeetingWithRelations>(
      meetingQueryKeys.detail(id),
      () => meetingApi.getMeetingDetail(id).then(res => res.data),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetMeetingWithStages query for fetching a meeting with its stages
  const useGetMeetingWithStages = (id: ID, queryOptions?: UseQueryOptions<MeetingWithRelations>) => {
    return useQuery<MeetingWithRelations>(
      meetingQueryKeys.detail(id),
      () => meetingApi.getMeetingDetail(id).then(res => res.data),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetMeetingSummary query for fetching a comprehensive meeting summary
  const useGetMeetingSummary = (id: ID, queryOptions?: UseQueryOptions<MeetingWithRelations>) => {
    return useQuery<MeetingWithRelations>(
      meetingQueryKeys.detail(id),
      () => meetingApi.getMeetingDetail(id).then(res => res.data),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetUpcomingMeetings query for fetching upcoming meetings
  const useGetUpcomingMeetings = (queryOptions?: UseQueryOptions<Meeting[]>) => {
    return useQuery<Meeting[]>(
      ['upcomingMeetings'],
      () => meetingApi.getUpcomingMeetings().then(res => res.data),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetMeetingsByType query for fetching meeting statistics by type
  const useGetMeetingsByType = (type: MeetingType, queryOptions?: UseQueryOptions<Meeting[]>) => {
    return useQuery<Meeting[]>(
      ['meetingsByType', type],
      () => meetingApi.getMeetingsByType(type).then(res => res.data),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useGetMeetingsByStatus query for fetching meeting statistics by status
  const useGetMeetingsByStatus = (status: MeetingStatus, queryOptions?: UseQueryOptions<Meeting[]>) => {
    return useQuery<Meeting[]>(
      ['meetingsByStatus', status],
      () => meetingApi.getMeetingsByStatus(status).then(res => res.data),
      {
        ...options,
        ...queryOptions,
      }
    );
  };

  // Implement useCreateMeeting mutation for creating new meetings
  const useCreateMeeting = () => {
    return useMutation(
      (meetingData: CreateMeetingDto) => meetingApi.createMeeting(meetingData).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(meetingQueryKeys.all());
        },
      }
    );
  };

  // Implement useUpdateMeeting mutation for updating existing meetings
  const useUpdateMeeting = () => {
    return useMutation(
      ({ id, meetingData }: { id: ID, meetingData: UpdateMeetingDto }) =>
        meetingApi.updateMeeting(id, meetingData).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(meetingQueryKeys.all());
        },
      }
    );
  };

  // Implement useUpdateMeetingStatus mutation for updating only the status of a meeting
  const useUpdateMeetingStatus = () => {
    return useMutation(
      ({ id, status }: { id: ID, status: MeetingStatus }) =>
        meetingApi.updateMeetingStatus(id, status).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(meetingQueryKeys.all());
        },
      }
    );
  };

  // Implement useUpdateCurrentStage mutation for updating the current stage of a meeting
  const useUpdateCurrentStage = () => {
    return useMutation(
      ({ id, stageType }: { id: ID, stageType: MeetingStageType }) =>
        meetingApi.updateCurrentStage(id, stageType).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(meetingQueryKeys.all());
        },
      }
    );
  };

  // Implement useDeleteMeeting mutation for deleting meetings
  const useDeleteMeeting = () => {
    return useMutation(
      (id: ID) => meetingApi.deleteMeeting(id).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(meetingQueryKeys.all());
        },
      }
    );
  };

  // Implement useAddParticipants mutation for adding participants to a meeting
  const useAddParticipants = () => {
    return useMutation(
      ({ id, participantsData }: { id: ID, participantsData: AddParticipantsDto }) =>
        meetingApi.addParticipants(id, participantsData).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(meetingQueryKeys.all());
        },
      }
    );
  };

  // Implement useRemoveParticipant mutation for removing a participant from a meeting
  const useRemoveParticipant = () => {
    return useMutation(
      ({ id, participantsData }: { id: ID, participantsData: RemoveParticipantsDto }) =>
        meetingApi.removeParticipants(id, participantsData).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(meetingQueryKeys.all());
        },
      }
    );
  };

  // Implement useUpdateParticipant mutation for updating a participant's role or status
   const useUpdateParticipant = () => {
    return useMutation(
      ({ meetingId, userId, participantData }: { meetingId: ID, userId: ID, participantData: UpdateMeetingParticipantDto }) =>
        meetingApi.updateParticipant(meetingId, userId, participantData).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(meetingQueryKeys.all());
        },
      }
    );
  };

  // Implement useStartMeeting mutation for starting a meeting and initializing real-time collaboration
  const useStartMeeting = () => {
    return useMutation(
      (id: ID) => meetingApi.startMeeting(id).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(meetingQueryKeys.all());
        },
      }
    );
  };

  // Implement useEndMeeting mutation for ending a meeting and finalizing all data
  const useEndMeeting = () => {
    return useMutation(
      (id: ID) => meetingApi.endMeeting(id, true).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(meetingQueryKeys.all());
        },
      }
    );
  };

  // Implement useSyncWithCalendar mutation for synchronizing a meeting with a calendar provider
  const useSyncWithCalendar = () => {
    return useMutation(
      ({ id, provider }: { id: ID, provider: CalendarProvider }) => meetingApi.syncWithCalendar(id, provider).then(res => res.data),
      {
        onSuccess: () => {
          queryClient.invalidateQueries(meetingQueryKeys.all());
        },
      }
    );
  };

  // Implement filter, pagination, and sorting state management functions
  const setPageHandler = (newPage: number) => {
    setPage(newPage);
  };

  const setPageSizeHandler = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // Reset to first page when page size changes
  };

  const setFiltersHandler = (newFilters: MeetingFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const setSortHandler = (newSort: MeetingSort) => {
    setSort(newSort);
    setPage(1); // Reset to first page when sort changes
  };

  // Return all queries, mutations, and utility functions
  return {
    meetings: useGetMeetings(),
    isLoading: useGetMeetings().isLoading,
    isError: useGetMeetings().isError,
    error: useGetMeetings().error,
    totalItems: useGetMeetings().data?.length || 0, // TODO: Replace with actual total from API
    totalPages: Math.ceil((useGetMeetings().data?.length || 0) / pageSize), // TODO: Replace with actual total from API
    page,
    pageSize,
    filters,
    sort,
    setPage: setPageHandler,
    setPageSize: setPageSizeHandler,
    setFilters: setFiltersHandler,
    setSort: setSortHandler,
    refetch: useGetMeetings().refetch,
    getMeetingById: useGetMeetingById,
    getMeetingWithParticipants: useGetMeetingWithParticipants,
    getMeetingWithStages: useGetMeetingWithStages,
    getMeetingSummary: useGetMeetingSummary,
    getUpcomingMeetings: useGetUpcomingMeetings,
    getMeetingsByType: useGetMeetingsByType,
    getMeetingsByStatus: useGetMeetingsByStatus,
    createMeeting: useCreateMeeting,
    updateMeeting: useUpdateMeeting,
    updateMeetingStatus: useUpdateMeetingStatus,
    updateCurrentStage: useUpdateCurrentStage,
    deleteMeeting: useDeleteMeeting,
    getParticipants: useAddParticipants,
    addParticipants: useAddParticipants,
    removeParticipant: useRemoveParticipant,
    updateParticipant: useUpdateParticipant,
    startMeeting: useStartMeeting,
    endMeeting: useEndMeeting,
    syncWithCalendar: useSyncWithCalendar,
  };
};

/**
 * Custom hook for managing an active meeting with real-time updates
 * @param meetingId 
 * @param organizationId 
 * @returns Active meeting data and operations with real-time updates
 */
export const useActiveMeeting = (meetingId: string, organizationId: string) => {
  // Use useMeetingRealtime hook to subscribe to real-time meeting updates
  const {
    meeting,
    loading: meetingLoading,
    error: meetingError,
    updateMeeting
  } = useMeetingRealtime(meetingId, organizationId);

  // Use useMeetingStagesRealtime hook to subscribe to real-time meeting stage updates
  const {
    stages,
    loading: stagesLoading,
    error: stagesError,
    updateStage: updateStageContent,
    createStage
  } = useMeetingStagesRealtime(meetingId);

  /**
   * Implement startMeeting function to initiate the meeting
   */
  const startMeeting = useCallback(async () => {
    if (!meeting) {
      console.error('Meeting not found');
      return;
    }

    try {
      await updateMeeting({ status: MeetingStatus.IN_PROGRESS });
    } catch (err) {
      console.error('Error starting meeting:', err);
      throw err;
    }
  }, [meeting, updateMeeting]);

  /**
   * Implement endMeeting function to conclude the meeting
   */
  const endMeeting = useCallback(async () => {
    if (!meeting) {
      console.error('Meeting not found');
      return;
    }

    try {
      await updateMeeting({ status: MeetingStatus.COMPLETED });
    } catch (err) {
      console.error('Error ending meeting:', err);
      throw err;
    }
  }, [meeting, updateMeeting]);

  /**
   * Implement updateCurrentStage function to change the active meeting stage
   */
  const updateCurrentStage = useCallback(async (stageType: MeetingStageType) => {
    if (!meeting) {
      console.error('Meeting not found');
      return;
    }

    try {
      await updateMeeting({ currentStage: stageType });
    } catch (err) {
      console.error('Error updating current stage:', err);
      throw err;
    }
  }, [meeting, updateMeeting]);

  return {
    meeting,
    stages,
    isLoading: meetingLoading || stagesLoading,
    isError: meetingError || stagesError,
    error: meetingError || stagesError,
    startMeeting,
    endMeeting,
    updateCurrentStage,
    updateStageContent
  };
};