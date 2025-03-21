import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'; // react@^18.0.0
import { useQueryClient } from 'react-query'; // react-query@^5.0.0

import {
  Organization,
  OrganizationWithTeams,
  Team,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  UpdateOrganizationSettingsDto,
} from '../types/organization.types';
import { ID } from '../types/common.types';
import { useOrganization } from '../hooks/useOrganization';
import { useAuthContext } from './AuthContext';
import {
  getItem,
  setItem,
  removeItem,
} from '../utils/helpers/localStorageHelper';

/**
 * @global
 * Key used for storing the current organization ID in local storage.
 */
const CURRENT_ORG_STORAGE_KEY = "metronomics_current_org";

/**
 * @interface OrganizationContextType
 * Interface defining the shape of the organization context value.
 */
interface OrganizationContextType {
  currentOrganization: Organization | null;
  organizations: Organization[];
  teams: Team[];
  loading: boolean;
  error: Error | null;
  fetchOrganizations: () => Promise<void>;
  fetchCurrentOrganization: (organizationId: ID) => Promise<void>;
  switchOrganization: (organizationId: ID) => Promise<void>;
  updateOrganization: (organizationId: ID, updateData: UpdateOrganizationDto) => Promise<void>;
  updateOrganizationSettings: (organizationId: ID, settingsData: UpdateOrganizationSettingsDto) => Promise<void>;
  fetchTeams: (organizationId: ID) => Promise<void>;
}

/**
 * @component OrganizationContext
 * React context for organization state and methods.
 */
export const OrganizationContext = createContext<OrganizationContextType | null>(null);

/**
 * @component OrganizationProvider
 * React context provider component that manages organization state and provides organization-related methods.
 */
export const OrganizationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state variables
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Get the queryClient from React Query
  const queryClient = useQueryClient();

  // Use the authentication context to check authentication status
  const { state: authState } = useAuthContext();

  // Use the organization hook to fetch organization data and perform mutations
  const {
    useGetOrganizations,
    useGetOrganizationById,
    useGetOrganizationWithTeams,
    useUpdateOrganization,
    useUpdateOrganizationSettings,
    useSwitchOrganization,
    persistCurrentOrganization,
    getPersistedOrganization,
  } = useOrganization();

  // Fetch organizations hook
  const { data: fetchedOrganizations, isLoading: isOrganizationsLoading, error: organizationsError } = useGetOrganizations(
    { organizationId: undefined, userId: undefined, coachId: undefined, status: undefined, search: undefined },
    { page: 1, pageSize: 100 }
  );

  // Update organizations state when fetchedOrganizations changes
  useEffect(() => {
    if (fetchedOrganizations) {
      setOrganizations(fetchedOrganizations);
    }
  }, [fetchedOrganizations]);

  // Fetch current organization hook
  const { mutate: switchOrg } = useSwitchOrganization();
  const { mutate: updateOrg } = useUpdateOrganization();
  const { mutate: updateOrgSettings } = useUpdateOrganizationSettings();

  /**
   * @function fetchOrganizations
   * Fetches all organizations accessible to the current user.
   */
  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (fetchedOrganizations) {
        setOrganizations(fetchedOrganizations);
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchedOrganizations]);

  /**
   * @function fetchCurrentOrganization
   * Fetches the current organization by ID.
   */
  const fetchCurrentOrganization = useCallback(async (organizationId: ID) => {
    setLoading(true);
    setError(null);
    try {
      const { data: org } = await useGetOrganizationById(organizationId).queryFn();
      setCurrentOrganization(org);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [useGetOrganizationById]);

  /**
   * @function switchOrganization
   * Switches the current active organization.
   */
  const switchOrganization = useCallback(async (organizationId: ID) => {
    setLoading(true);
    setError(null);
    try {
      await switchOrg(organizationId, {
        onSuccess: async () => {
          persistCurrentOrganization(organizationId);
          await fetchCurrentOrganization(organizationId);
          queryClient.invalidateQueries(['teams']);
        },
        onError: (err: any) => {
          setError(err);
        },
        onSettled: () => {
          setLoading(false);
        },
      });
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  }, [fetchCurrentOrganization, persistCurrentOrganization, switchOrg, queryClient]);

  /**
   * @function updateOrganization
   * Updates the details of an organization.
   */
  const updateOrganization = useCallback(async (organizationId: ID, updateData: UpdateOrganizationDto) => {
    setLoading(true);
    setError(null);
    try {
      await updateOrg({ id: organizationId, organizationData: updateData }, {
        onSuccess: async () => {
          await fetchCurrentOrganization(organizationId);
          queryClient.invalidateQueries(['organizations']);
        },
        onError: (err: any) => {
          setError(err);
        },
        onSettled: () => {
          setLoading(false);
        },
      });
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  }, [fetchCurrentOrganization, updateOrg, queryClient]);

  /**
   * @function updateOrganizationSettings
   * Updates only the settings of an organization.
   */
  const updateOrganizationSettings = useCallback(async (organizationId: ID, settingsData: UpdateOrganizationSettingsDto) => {
    setLoading(true);
    setError(null);
    try {
      await updateOrgSettings({ id: organizationId, settingsData: settingsData }, {
        onSuccess: async () => {
          await fetchCurrentOrganization(organizationId);
          queryClient.invalidateQueries(['organizations']);
        },
        onError: (err: any) => {
          setError(err);
        },
        onSettled: () => {
          setLoading(false);
        },
      });
    } catch (err: any) {
      setError(err);
      setLoading(false);
    }
  }, [fetchCurrentOrganization, updateOrgSettings, queryClient]);

  /**
   * @function fetchTeams
   * Fetches teams for the current organization.
   */
  const fetchTeams = useCallback(async (organizationId: ID) => {
    setLoading(true);
    setError(null);
    try {
      const { data: orgWithTeams } = await useGetOrganizationWithTeams(organizationId).queryFn();
      setTeams(orgWithTeams.teams);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [useGetOrganizationWithTeams]);

  /**
   * @useEffect
   * Effect hook that initializes organization data when the user is authenticated.
   */
  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchOrganizations();

      const persistedOrgId = getPersistedOrganization();
      if (persistedOrgId) {
        fetchCurrentOrganization(persistedOrgId);
      } else if (organizations.length > 0) {
        switchOrganization(organizations[0].id);
      }
    }
  }, [authState.isAuthenticated, fetchOrganizations, fetchCurrentOrganization, getPersistedOrganization, organizations, switchOrganization]);

  // Context value object with current organization state and all organization methods
  const contextValue: OrganizationContextType = {
    currentOrganization,
    organizations,
    teams,
    loading,
    error,
    fetchOrganizations,
    fetchCurrentOrganization,
    switchOrganization,
    updateOrganization,
    updateOrganizationSettings,
    fetchTeams,
  };

  // Render OrganizationContext.Provider with the context value
  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
};

/**
 * @function useOrganizationContext
 * Custom hook that provides access to the organization context.
 */
export const useOrganizationContext = (): OrganizationContextType => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider');
  }
  return context;
};