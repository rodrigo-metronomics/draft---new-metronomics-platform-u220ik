import { useState, useCallback, useEffect } from 'react'; // v18.2.0
import { useMutation, useQuery, useQueryClient } from 'react-query'; // v3.39.3
import { 
  CalendarProvider, 
  CalendarAuthToken, 
  CalendarIntegrationStatus,
  CalendarConnectionRequest,
  CalendarDisconnectionRequest,
  SetDefaultCalendarProviderRequest
} from '../types/calendar.types';
import { getCalendarService } from '../services/calendar';
import * as api from '../services/api';
import useAuth from './useAuth';

/**
 * A custom React hook that provides functionality for calendar integration with external
 * calendar services (Google Calendar and Microsoft Outlook) in the Metronomics Platform.
 * 
 * This hook handles:
 * - Retrieving calendar integration status
 * - Authentication flows for connecting calendar services
 * - Connecting and disconnecting calendar providers
 * - Setting default calendar provider
 * - Synchronizing meetings with external calendars
 * 
 * @returns An object containing calendar integration status, loading states, and methods for
 *          managing calendar connections and synchronization
 */
export default function useCalendarSync() {
  // Get current user from auth hook
  const { state: { user } } = useAuth();
  
  // Initialize React Query's queryClient for cache management
  const queryClient = useQueryClient();
  
  // Set up loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Define query key for calendar integration status
  const calendarStatusQueryKey = ['calendarIntegration', user?.id];
  
  // Use React Query to fetch and cache calendar integration status
  const { 
    data: calendarStatus = {
      isGoogleConnected: false,
      isMicrosoftConnected: false,
      defaultProvider: null,
      lastSyncTime: null
    }, 
    isLoading: isStatusLoading, 
    isError: isStatusError, 
    refetch: refetchStatus 
  } = useQuery<CalendarIntegrationStatus, Error>(
    calendarStatusQueryKey,
    async () => {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const response = await api.get<CalendarIntegrationStatus>('/calendar/status');
      return response.data;
    },
    {
      enabled: !!user,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (err: Error) => {
        setError(err);
        setIsError(true);
      }
    }
  );
  
  /**
   * Retrieves the Google Calendar authorization URL for initiating the OAuth flow
   * @returns Promise resolving to the Google authorization URL
   */
  const getGoogleAuthUrl = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsError(false);
      
      const response = await api.get<{ url: string }>('/calendar/auth/google/url');
      return response.data.url;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get Google auth URL'));
      setIsError(true);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Retrieves the Microsoft Calendar authorization URL for initiating the OAuth flow
   * @returns Promise resolving to the Microsoft authorization URL
   */
  const getMicrosoftAuthUrl = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setIsError(false);
      
      const response = await api.get<{ url: string }>('/calendar/auth/microsoft/url');
      return response.data.url;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get Microsoft auth URL'));
      setIsError(true);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  /**
   * Mutation for connecting to Google Calendar using an authorization code
   * received from the OAuth flow
   */
  const connectGoogleCalendarMutation = useMutation<CalendarAuthToken, Error, string>(
    async (code: string) => {
      const connectionRequest: CalendarConnectionRequest = {
        provider: CalendarProvider.GOOGLE,
        code
      };
      
      const response = await api.post<CalendarAuthToken>('/calendar/connect', connectionRequest);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(calendarStatusQueryKey);
      },
      onError: (err: Error) => {
        setError(err);
        setIsError(true);
      }
    }
  );
  
  /**
   * Mutation for connecting to Microsoft Calendar using an authorization code
   * received from the OAuth flow
   */
  const connectMicrosoftCalendarMutation = useMutation<CalendarAuthToken, Error, string>(
    async (code: string) => {
      const connectionRequest: CalendarConnectionRequest = {
        provider: CalendarProvider.MICROSOFT,
        code
      };
      
      const response = await api.post<CalendarAuthToken>('/calendar/connect', connectionRequest);
      return response.data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(calendarStatusQueryKey);
      },
      onError: (err: Error) => {
        setError(err);
        setIsError(true);
      }
    }
  );
  
  /**
   * Mutation for disconnecting Google Calendar integration
   */
  const disconnectGoogleCalendarMutation = useMutation<void, Error>(
    async () => {
      const disconnectionRequest: CalendarDisconnectionRequest = {
        provider: CalendarProvider.GOOGLE
      };
      
      await api.post('/calendar/disconnect', disconnectionRequest);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(calendarStatusQueryKey);
      },
      onError: (err: Error) => {
        setError(err);
        setIsError(true);
      }
    }
  );
  
  /**
   * Mutation for disconnecting Microsoft Calendar integration
   */
  const disconnectMicrosoftCalendarMutation = useMutation<void, Error>(
    async () => {
      const disconnectionRequest: CalendarDisconnectionRequest = {
        provider: CalendarProvider.MICROSOFT
      };
      
      await api.post('/calendar/disconnect', disconnectionRequest);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(calendarStatusQueryKey);
      },
      onError: (err: Error) => {
        setError(err);
        setIsError(true);
      }
    }
  );
  
  /**
   * Mutation for setting the default calendar provider for future synchronizations
   */
  const setDefaultCalendarProviderMutation = useMutation<void, Error, CalendarProvider | null>(
    async (provider: CalendarProvider | null) => {
      const request: SetDefaultCalendarProviderRequest = {
        provider
      };
      
      await api.put('/calendar/default-provider', request);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(calendarStatusQueryKey);
      },
      onError: (err: Error) => {
        setError(err);
        setIsError(true);
      }
    }
  );
  
  /**
   * Synchronizes a meeting with the selected calendar provider or default provider
   * 
   * @param meetingId - The ID of the meeting to synchronize
   * @param provider - Optional calendar provider override (uses default if not specified)
   * @returns Promise resolving to the synchronization result
   */
  const syncMeetingWithCalendar = useCallback(async (meetingId: string, provider?: CalendarProvider) => {
    try {
      setIsLoading(true);
      setError(null);
      setIsError(false);
      
      // If provider is not specified, use the default provider from calendarStatus
      const selectedProvider = provider || calendarStatus?.defaultProvider;
      
      if (!selectedProvider) {
        throw new Error('No calendar provider selected. Please connect and set a default calendar provider.');
      }
      
      // Make API call to sync the meeting with the calendar
      const response = await api.post('/calendar/sync', {
        meetingId,
        provider: selectedProvider
      });
      
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync meeting with calendar';
      setError(new Error(errorMessage));
      setIsError(true);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [calendarStatus]);
  
  // Update the loading state based on the status of all queries and mutations
  useEffect(() => {
    const loading = 
      isStatusLoading || 
      connectGoogleCalendarMutation.isLoading || 
      connectMicrosoftCalendarMutation.isLoading || 
      disconnectGoogleCalendarMutation.isLoading || 
      disconnectMicrosoftCalendarMutation.isLoading || 
      setDefaultCalendarProviderMutation.isLoading;
    
    setIsLoading(loading);
  }, [
    isStatusLoading,
    connectGoogleCalendarMutation.isLoading,
    connectMicrosoftCalendarMutation.isLoading,
    disconnectGoogleCalendarMutation.isLoading,
    disconnectMicrosoftCalendarMutation.isLoading,
    setDefaultCalendarProviderMutation.isLoading
  ]);
  
  // Return the hook API
  return {
    calendarStatus,
    isLoading,
    isError,
    error,
    getGoogleAuthUrl,
    getMicrosoftAuthUrl,
    connectGoogleCalendar: connectGoogleCalendarMutation.mutateAsync,
    connectMicrosoftCalendar: connectMicrosoftCalendarMutation.mutateAsync,
    disconnectGoogleCalendar: disconnectGoogleCalendarMutation.mutateAsync,
    disconnectMicrosoftCalendar: disconnectMicrosoftCalendarMutation.mutateAsync,
    setDefaultCalendarProvider: setDefaultCalendarProviderMutation.mutateAsync,
    syncMeetingWithCalendar,
    refetchStatus
  };
}