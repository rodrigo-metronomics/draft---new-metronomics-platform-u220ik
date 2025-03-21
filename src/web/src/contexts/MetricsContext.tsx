import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useRef,
} from 'react'; // react@^18.0.0
import { useQuery, useMutation, useQueryClient } from 'react-query'; // react-query@^5.0.0

import {
  Metric,
  MetricWithValues,
  MetricValue,
  MetricThreshold,
  CreateMetricDto,
  UpdateMetricDto,
  CreateMetricValueDto,
  CreateMetricThresholdDto,
  UpdateMetricThresholdDto,
  MetricFilters,
  MetricValueFilters,
  MetricExportOptions,
  MetricDashboardData,
  ComparisonType,
  DateRange,
} from '../types/metric.types';
import { ID } from '../types/common.types';
import { metricApi } from '../services/api/metricApi';
import { useAuthContext } from './AuthContext';
import { useOrganizationContext } from './OrganizationContext';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from '../services/firebase/firebaseFirestore';

/**
 * @global
 * Collection name for metric values in Firebase Firestore
 */
const METRIC_VALUES_COLLECTION = 'metricValues';

/**
 * @global
 * Collection name for metric thresholds in Firebase Firestore
 */
const METRIC_THRESHOLDS_COLLECTION = 'metricThresholds';

/**
 * @interface MetricsContextType
 * Interface defining the shape of the metrics context value.
 */
interface MetricsContextType {
  metrics: Metric[];
  dashboardMetrics: MetricWithValues[];
  selectedMetric: MetricWithValues | null;
  metricValues: MetricValue[];
  loading: boolean;
  error: Error | null;
  dashboardTimeRange: DateRange;
  comparisonType: ComparisonType;
  fetchMetrics: (filters?: MetricFilters) => Promise<void>;
  fetchMetricById: (id: ID) => Promise<void>;
  fetchMetricWithValues: (id: ID) => Promise<void>;
  createMetric: (metricData: CreateMetricDto) => Promise<void>;
  updateMetric: (id: ID, metricData: UpdateMetricDto) => Promise<void>;
  deleteMetric: (id: ID) => Promise<void>;
  recordMetricValue: (metricId: ID, valueData: CreateMetricValueDto) => Promise<void>;
  fetchMetricValues: (metricId: ID, filters: MetricValueFilters) => Promise<void>;
  deleteMetricValue: (valueId: ID) => Promise<void>;
  createMetricThreshold: (metricId: ID, thresholdData: CreateMetricThresholdDto) => Promise<void>;
  updateMetricThreshold: (thresholdId: ID, thresholdData: UpdateMetricThresholdDto) => Promise<void>;
  deleteMetricThreshold: (thresholdId: ID) => Promise<void>;
  fetchDashboardMetrics: () => Promise<void>;
  exportMetrics: (options: MetricExportOptions) => Promise<Blob>;
	fetchMetricsByGoal: (goalId: ID) => Promise<void>;
	fetchMetricsByTeam: (teamId: ID) => Promise<void>;
  setDashboardTimeRange: (timeRange: DateRange) => void;
  setComparisonType: (comparisonType: ComparisonType) => void;
  setSelectedMetric: (metric: MetricWithValues | null) => void;
}

/**
 * @function initialMetricsState
 * Initial state for the metrics context
 */
const initialMetricsState = () => ({
  metrics: [],
  dashboardMetrics: [],
  selectedMetric: null,
  metricValues: [],
  loading: true,
  error: null,
  dashboardTimeRange: {
    startDate: new Date(),
    endDate: new Date(),
  },
  comparisonType: ComparisonType.YEAR_TO_DATE,
});

/**
 * @component MetricsContext
 * React context for metrics state and methods
 */
export const MetricsContext = createContext<MetricsContextType | null>(null);

/**
 * @component MetricsProvider
 * Context provider component that manages metrics state and provides metrics methods to children
 */
export const MetricsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state using useState with initialMetricsState
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<MetricWithValues[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<MetricWithValues | null>(null);
  const [metricValues, setMetricValues] = useState<MetricValue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [dashboardTimeRange, setDashboardTimeRange] = useState<DateRange>({
    startDate: new Date(),
    endDate: new Date(),
  });
  const [comparisonType, setComparisonTypeState] = useState<ComparisonType>(ComparisonType.YEAR_TO_DATE);

  // Get authentication context using useAuthContext
  const { state: authState } = useAuthContext();

  // Get organization context using useOrganizationContext
  const { currentOrganization } = useOrganizationContext();

  // Get query client using useQueryClient for cache invalidation
  const queryClient = useQueryClient();

  // Set up Firestore instance using getFirestore()
  const firestore = useRef(getFirestore()).current;

  /**
   * @function fetchMetrics
   * Implement fetchMetrics function to retrieve metrics with filters
   */
  const fetchMetrics = useCallback(async (filters?: MetricFilters) => {
    setLoading(true);
    setError(null);
    try {
      if (!currentOrganization) {
        return;
      }
      const orgId = currentOrganization.id;
      const response = await metricApi.getMetrics({
        organizationId: orgId,
        teamId: filters?.teamId || null,
        type: filters?.type || null,
        goalId: filters?.goalId || null,
        search: filters?.search || null,
        dateRange: filters?.dateRange || null,
        page: 1,
        pageSize: 100,
        sortBy: 'name',
      });
      if (response.success) {
        setMetrics(response.data.items);
      } else {
        setError(new Error(response.message || 'Failed to fetch metrics'));
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization]);

  /**
   * @function fetchMetricById
   * Implement fetchMetricById function to retrieve a single metric by ID
   */
  const fetchMetricById = useCallback(async (id: ID) => {
    setLoading(true);
    setError(null);
    try {
      const response = await metricApi.getMetricById(String(id));
      if (response.success) {
        setSelectedMetric(response.data.data as any);
      } else {
        setError(new Error(response.message || 'Failed to fetch metric by ID'));
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * @function fetchMetricWithValues
   * Implement fetchMetricWithValues function to retrieve a metric with its historical values
   */
  const fetchMetricWithValues = useCallback(async (id: ID) => {
    setLoading(true);
    setError(null);
    try {
      const response = await metricApi.getMetricWithRelations(String(id));
      if (response.success) {
        setSelectedMetric(response.data.data);
      } else {
        setError(new Error(response.message || 'Failed to fetch metric with values'));
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * @function createMetric
   * Implement createMetric function to create a new metric
   */
  const createMetric = useCallback(async (metricData: CreateMetricDto) => {
    setLoading(true);
    setError(null);
    try {
      await metricApi.createMetric(metricData);
      await fetchMetrics();
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchMetrics]);

  /**
   * @function updateMetric
   * Implement updateMetric function to update an existing metric
   */
  const updateMetric = useCallback(async (id: ID, metricData: UpdateMetricDto) => {
    setLoading(true);
    setError(null);
    try {
      await metricApi.updateMetric(String(id), metricData);
      await fetchMetrics();
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchMetrics]);

  /**
   * @function deleteMetric
   * Implement deleteMetric function to delete a metric
   */
  const deleteMetric = useCallback(async (id: ID) => {
    setLoading(true);
    setError(null);
    try {
      await metricApi.deleteMetric(String(id));
      await fetchMetrics();
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchMetrics]);

  /**
   * @function recordMetricValue
   * Implement recordMetricValue function to record a new metric value
   */
  const recordMetricValue = useCallback(async (metricId: ID, valueData: CreateMetricValueDto) => {
    setLoading(true);
    setError(null);
    try {
      await metricApi.recordMetricValue(String(metricId), valueData);
      await fetchMetricWithValues(metricId);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchMetricWithValues]);

  /**
   * @function fetchMetricValues
   * Implement fetchMetricValues function to retrieve historical values for a metric
   */
  const fetchMetricValues = useCallback(async (metricId: ID, filters: MetricValueFilters) => {
    setLoading(true);
    setError(null);
    try {
      const response = await metricApi.getMetricValues(String(metricId), filters);
      if (response.success) {
        setMetricValues(response.data);
      } else {
        setError(new Error(response.message || 'Failed to fetch metric values'));
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * @function deleteMetricValue
   * Implement deleteMetricValue function to delete a metric value
   */
  const deleteMetricValue = useCallback(async (valueId: ID) => {
    setLoading(true);
    setError(null);
    try {
      await metricApi.deleteMetricValue(String(valueId));
      // Invalidate cache for the metric values
      queryClient.invalidateQueries(['metricValues']);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  /**
   * @function createMetricThreshold
   * Implement createMetricThreshold function to create a new threshold
   */
  const createMetricThreshold = useCallback(async (metricId: ID, thresholdData: CreateMetricThresholdDto) => {
    setLoading(true);
    setError(null);
    try {
      await metricApi.createMetricThreshold(String(metricId), thresholdData);
      await fetchMetricWithValues(metricId);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [fetchMetricWithValues]);

  /**
   * @function updateMetricThreshold
   * Implement updateMetricThreshold function to update an existing threshold
   */
  const updateMetricThreshold = useCallback(async (thresholdId: ID, thresholdData: UpdateMetricThresholdDto) => {
    setLoading(true);
    setError(null);
    try {
      await metricApi.updateMetricThreshold(String(thresholdId), thresholdData);
      // Invalidate cache for the metric
      queryClient.invalidateQueries(['metric']);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  /**
   * @function deleteMetricThreshold
   * Implement deleteMetricThreshold function to delete a threshold
   */
  const deleteMetricThreshold = useCallback(async (thresholdId: ID) => {
    setLoading(true);
    setError(null);
    try {
      await metricApi.deleteMetricThreshold(String(thresholdId));
      // Invalidate cache for the metric
      queryClient.invalidateQueries(['metric']);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [queryClient]);

  /**
   * @function fetchDashboardMetrics
   * Implement fetchDashboardMetrics function to retrieve metrics for dashboard display
   */
  const fetchDashboardMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!currentOrganization) {
        return;
      }
      const orgId = currentOrganization.id;
      const response = await metricApi.getDashboardMetrics({
        organizationId: orgId,
        teamId: null,
        type: null,
        goalId: null,
        search: null,
        dateRange: dashboardTimeRange,
      });
      if (response.success) {
        setDashboardMetrics(response.data);
      } else {
        setError(new Error(response.message || 'Failed to fetch dashboard metrics'));
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization, dashboardTimeRange]);

  /**
   * @function exportMetrics
   * Implement exportMetrics function to export metrics data
   */
  const exportMetrics = useCallback(async (options: MetricExportOptions) => {
    setLoading(true);
    setError(null);
    try {
      const exportedData = await metricApi.exportMetrics(options);
      return exportedData;
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  /**
   * @function fetchMetricsByGoal
   * Implement fetchMetricsByGoal function to retrieve metrics associated with a goal
   */
  const fetchMetricsByGoal = useCallback(async (goalId: ID) => {
		setLoading(true);
		setError(null);
		try {
			const response = await metricApi.getMetricsByGoal(goalId);
			if (response.success) {
				setMetrics(response.data.items);
			} else {
				setError(new Error(response.message || 'Failed to fetch metrics by goal'));
			}
		} catch (err: any) {
			setError(err);
		} finally {
			setLoading(false);
		}
	}, []);

	/**
   * @function fetchMetricsByTeam
   * Implement fetchMetricsByTeam function to retrieve metrics associated with a team
   */
	const fetchMetricsByTeam = useCallback(async (teamId: ID) => {
		setLoading(true);
		setError(null);
		try {
			const response = await metricApi.getMetricsByTeam(teamId);
			if (response.success) {
				setMetrics(response.data.items);
			} else {
				setError(new Error(response.message || 'Failed to fetch metrics by team'));
			}
		} catch (err: any) {
			setError(err);
		} finally {
			setLoading(false);
		}
	}, []);

  /**
   * @function setDashboardTimeRange
   * Implement setDashboardTimeRange function to update the dashboard time range
   */
  const setDashboardTimeRangeState = useCallback((timeRange: DateRange) => {
    setDashboardTimeRange(timeRange);
  }, []);

  /**
   * @function setComparisonType
   * Implement setComparisonType function to update the comparison type
   */
  const setComparisonTypeState = useCallback((comparisonType: ComparisonType) => {
    setComparisonTypeState(comparisonType);
  }, []);

  /**
   * @function setSelectedMetric
   * Implement setSelectedMetric function to update the selected metric
   */
  const setSelectedMetricState = useCallback((metric: MetricWithValues | null) => {
    setSelectedMetric(metric);
  }, []);

  /**
   * @useEffect
   * Set up useEffect to subscribe to real-time metric value updates when user is authenticated
   */
  useEffect(() => {
    if (authState.isAuthenticated && currentOrganization) {
      const unsubscribe = subscribeToCollection(
        METRIC_VALUES_COLLECTION,
        [{ field: 'organizationId', operator: '==', value: currentOrganization.id }],
        (newData) => {
          setMetricValues(newData as MetricValue[]);
        },
        (error) => {
          console.error('Error subscribing to metric values:', error);
          setError(error);
        }
      );
      return () => unsubscribe();
    }
  }, [authState.isAuthenticated, currentOrganization, firestore]);

  /**
   * @useEffect
   * Set up useEffect to fetch metrics when organization changes
   */
  useEffect(() => {
    if (currentOrganization) {
      fetchMetrics();
      fetchDashboardMetrics();
    }
  }, [currentOrganization, fetchMetrics, fetchDashboardMetrics]);

  /**
   * @function setComparisonType
   * Implement setComparisonType function to update the comparison type
   */
  const setComparisonType = useCallback((comparisonType: ComparisonType) => {
    setComparisonTypeState(comparisonType);
    // Invalidate cache for dashboard metrics
    queryClient.invalidateQueries(['dashboardMetrics']);
  }, [queryClient]);

  /**
   * @useEffect
   * Set up useEffect to fetch dashboard metrics when organization, time range, or comparison type changes
   */
  useEffect(() => {
    if (currentOrganization) {
      fetchDashboardMetrics();
    }
  }, [currentOrganization, dashboardTimeRange, comparisonType, fetchDashboardMetrics]);

  // Create context value object with state and all metrics methods
  const contextValue: MetricsContextType = {
    metrics,
    dashboardMetrics,
    selectedMetric,
    metricValues,
    loading,
    error,
    dashboardTimeRange,
    comparisonType,
    fetchMetrics,
    fetchMetricById,
    fetchMetricWithValues,
    createMetric,
    updateMetric,
    deleteMetric,
    recordMetricValue,
    fetchMetricValues,
    deleteMetricValue,
    createMetricThreshold,
    updateMetricThreshold,
    deleteMetricThreshold,
    fetchDashboardMetrics,
    exportMetrics,
		fetchMetricsByGoal,
		fetchMetricsByTeam,
    setDashboardTimeRange: setDashboardTimeRangeState,
    setComparisonType,
    setSelectedMetric: setSelectedMetricState,
  };

  // Return MetricsContext.Provider with the context value and children
  return (
    <MetricsContext.Provider value={contextValue}>
      {children}
    </MetricsContext.Provider>
  );
};

/**
 * @function useMetricsContext
 * Custom hook for accessing the MetricsContext within the provider
 */
export const useMetricsContext = (): MetricsContextType => {
  // Get context value using useContext(MetricsContext)
  const context = useContext(MetricsContext);

  // Throw error if hook is used outside of MetricsProvider
  if (!context) {
    throw new Error('useMetricsContext must be used within a MetricsProvider');
  }

  // Return the context value
  return context;
};