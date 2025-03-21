import { get, post, put, patch, delete } from './index';
import { ApiResponse } from '../../types/api.types';
import {
  Metric,
  MetricType,
  ComparisonType,
  CalculationMethod,
  MetricValue,
  MetricThreshold,
  ThresholdType,
  MetricWithRelations,
  MetricWithValues,
  MetricDashboardData,
  MetricFilters,
  MetricValueFilters,
  MetricListParams,
  MetricResponse,
  MetricWithRelationsResponse,
  MetricListResponse,
  MetricDashboardResponse,
  MetricValueResponse,
  MetricValuesResponse,
  CreateMetricDto,
  UpdateMetricDto,
  CreateMetricValueDto,
  CreateMetricThresholdDto,
  UpdateMetricThresholdDto,
  MetricExportOptions
} from '../../types/metric.types';

/**
 * API endpoints for metrics-related operations
 */
const METRIC_ENDPOINTS = {
  GET_METRICS: '/metrics',
  GET_METRIC: '/metrics/:id',
  CREATE_METRIC: '/metrics',
  UPDATE_METRIC: '/metrics/:id',
  DELETE_METRIC: '/metrics/:id',
  GET_METRIC_VALUES: '/metrics/:id/values',
  CREATE_METRIC_VALUE: '/metrics/:id/values',
  DELETE_METRIC_VALUE: '/metric-values/:id',
  GET_METRIC_THRESHOLDS: '/metrics/:id/thresholds',
  CREATE_METRIC_THRESHOLD: '/metrics/:id/thresholds',
  UPDATE_METRIC_THRESHOLD: '/metric-thresholds/:id',
  DELETE_METRIC_THRESHOLD: '/metric-thresholds/:id',
  GET_DASHBOARD: '/metrics/dashboard',
  EXPORT_METRICS: '/metrics/export'
};

/**
 * Fetches a paginated list of metrics with optional filtering and sorting
 * @param params - Filtering, sorting, and pagination parameters
 * @returns Promise resolving to a paginated list of metrics
 */
export const getMetrics = async (
  params: MetricListParams
): Promise<ApiResponse<MetricListResponse>> => {
  return get<MetricListResponse>(METRIC_ENDPOINTS.GET_METRICS, params);
};

/**
 * Fetches a single metric by its ID
 * @param id - Metric ID
 * @returns Promise resolving to the metric data
 */
export const getMetricById = async (
  id: string
): Promise<ApiResponse<MetricResponse>> => {
  const url = METRIC_ENDPOINTS.GET_METRIC.replace(':id', id);
  return get<MetricResponse>(url);
};

/**
 * Fetches detailed metric information including values, thresholds, and related entities
 * @param id - Metric ID
 * @returns Promise resolving to the detailed metric data
 */
export const getMetricWithRelations = async (
  id: string
): Promise<ApiResponse<MetricWithRelationsResponse>> => {
  const url = METRIC_ENDPOINTS.GET_METRIC.replace(':id', id);
  return get<MetricWithRelationsResponse>(url, { include: 'values,thresholds,team,goals' });
};

/**
 * Fetches metric dashboard data with trends and visualizations
 * @param filters - Dashboard filtering parameters
 * @returns Promise resolving to the dashboard data
 */
export const getDashboardData = async (
  filters: MetricFilters
): Promise<ApiResponse<MetricDashboardResponse>> => {
  return get<MetricDashboardResponse>(METRIC_ENDPOINTS.GET_DASHBOARD, filters);
};

/**
 * Creates a new metric
 * @param metricData - Metric data to create
 * @returns Promise resolving to the created metric data
 */
export const createMetric = async (
  metricData: CreateMetricDto
): Promise<ApiResponse<MetricResponse>> => {
  return post<MetricResponse>(METRIC_ENDPOINTS.CREATE_METRIC, metricData);
};

/**
 * Updates an existing metric
 * @param id - Metric ID
 * @param metricData - Updated metric data
 * @returns Promise resolving to the updated metric data
 */
export const updateMetric = async (
  id: string,
  metricData: UpdateMetricDto
): Promise<ApiResponse<MetricResponse>> => {
  const url = METRIC_ENDPOINTS.UPDATE_METRIC.replace(':id', id);
  return put<MetricResponse>(url, metricData);
};

/**
 * Deletes a metric
 * @param id - Metric ID
 * @returns Promise resolving to a success indicator
 */
export const deleteMetric = async (
  id: string
): Promise<ApiResponse<{ success: boolean }>> => {
  const url = METRIC_ENDPOINTS.DELETE_METRIC.replace(':id', id);
  return delete<{ success: boolean }>(url);
};

/**
 * Fetches values for a specific metric
 * @param metricId - Metric ID
 * @param filters - Optional filters for the metric values
 * @returns Promise resolving to a list of metric values
 */
export const getMetricValues = async (
  metricId: string,
  filters: MetricValueFilters
): Promise<ApiResponse<MetricValuesResponse>> => {
  const url = METRIC_ENDPOINTS.GET_METRIC_VALUES.replace(':id', metricId);
  return get<MetricValuesResponse>(url, filters);
};

/**
 * Creates a new value for a metric
 * @param metricId - Metric ID
 * @param valueData - Metric value data to create
 * @returns Promise resolving to the created value data
 */
export const createMetricValue = async (
  metricId: string,
  valueData: CreateMetricValueDto
): Promise<ApiResponse<MetricValueResponse>> => {
  const url = METRIC_ENDPOINTS.CREATE_METRIC_VALUE.replace(':id', metricId);
  return post<MetricValueResponse>(url, valueData);
};

/**
 * Deletes a metric value
 * @param valueId - Metric value ID
 * @returns Promise resolving to a success indicator
 */
export const deleteMetricValue = async (
  valueId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  const url = METRIC_ENDPOINTS.DELETE_METRIC_VALUE.replace(':id', valueId);
  return delete<{ success: boolean }>(url);
};

/**
 * Fetches thresholds for a specific metric
 * @param metricId - Metric ID
 * @returns Promise resolving to a list of metric thresholds
 */
export const getMetricThresholds = async (
  metricId: string
): Promise<ApiResponse<MetricThreshold[]>> => {
  const url = METRIC_ENDPOINTS.GET_METRIC_THRESHOLDS.replace(':id', metricId);
  return get<MetricThreshold[]>(url);
};

/**
 * Creates a new threshold for a metric
 * @param metricId - Metric ID
 * @param thresholdData - Threshold data to create
 * @returns Promise resolving to the created threshold data
 */
export const createMetricThreshold = async (
  metricId: string,
  thresholdData: CreateMetricThresholdDto
): Promise<ApiResponse<MetricThreshold>> => {
  const url = METRIC_ENDPOINTS.CREATE_METRIC_THRESHOLD.replace(':id', metricId);
  return post<MetricThreshold>(url, thresholdData);
};

/**
 * Updates an existing metric threshold
 * @param thresholdId - Threshold ID
 * @param thresholdData - Updated threshold data
 * @returns Promise resolving to the updated threshold data
 */
export const updateMetricThreshold = async (
  thresholdId: string,
  thresholdData: UpdateMetricThresholdDto
): Promise<ApiResponse<MetricThreshold>> => {
  const url = METRIC_ENDPOINTS.UPDATE_METRIC_THRESHOLD.replace(':id', thresholdId);
  return patch<MetricThreshold>(url, thresholdData);
};

/**
 * Deletes a metric threshold
 * @param thresholdId - Threshold ID
 * @returns Promise resolving to a success indicator
 */
export const deleteMetricThreshold = async (
  thresholdId: string
): Promise<ApiResponse<{ success: boolean }>> => {
  const url = METRIC_ENDPOINTS.DELETE_METRIC_THRESHOLD.replace(':id', thresholdId);
  return delete<{ success: boolean }>(url);
};

/**
 * Exports metrics data in various formats (CSV, XLSX, PDF)
 * @param options - Export options including format, filters, and data selection
 * @returns Promise resolving to a blob containing the exported data
 */
export const exportMetrics = async (
  options: MetricExportOptions
): Promise<Blob> => {
  const response = await get(METRIC_ENDPOINTS.EXPORT_METRICS, options, {
    'Accept': options.format === 'csv' ? 'text/csv' : 
              options.format === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
              'application/pdf'
  }, {
    responseType: 'blob'
  });
  
  return response.data;
};