import * as metricApi from '../metricApi';
import { get, post, put, patch, delete as del } from '../index';
import { MetricType, ComparisonType, CalculationMethod, ThresholdType } from '../../../types/metric.types';
import { ApiErrorType } from '../../../types/api.types';

// Mock the API functions
jest.mock('../index', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn()
}));

// Mock data for tests
const mockMetric = {
  id: 'metric-123',
  name: 'Revenue',
  description: 'Monthly revenue in USD',
  type: 'CURRENCY',
  unit: 'USD',
  comparisonType: 'MONTH_TO_MONTH',
  calculationMethod: 'MANUAL',
  formula: null,
  organizationId: 'org-123',
  teamId: 'team-123',
  createdAt: '2023-06-10T12:00:00Z',
  updatedAt: '2023-06-10T12:00:00Z'
};

const mockMetricWithRelations = {
  id: 'metric-123',
  name: 'Revenue',
  description: 'Monthly revenue in USD',
  type: 'CURRENCY',
  unit: 'USD',
  comparisonType: 'MONTH_TO_MONTH',
  calculationMethod: 'MANUAL',
  formula: null,
  organizationId: 'org-123',
  teamId: 'team-123',
  team: { id: 'team-123', name: 'Sales' },
  values: [
    {
      id: 'value-123',
      value: 10000,
      timestamp: '2023-06-01T00:00:00Z',
      note: null,
      metricId: 'metric-123',
      userId: 'user-123',
      createdAt: '2023-06-01T12:00:00Z'
    }
  ],
  thresholds: [
    {
      id: 'threshold-123',
      type: 'TARGET',
      value: 12000,
      color: '#00FF00',
      metricId: 'metric-123',
      createdAt: '2023-06-10T12:00:00Z',
      updatedAt: '2023-06-10T12:00:00Z'
    }
  ],
  goals: [
    { id: 'goal-123', name: 'Increase Revenue', type: 'YEARLY' }
  ],
  createdAt: '2023-06-10T12:00:00Z',
  updatedAt: '2023-06-10T12:00:00Z'
};

const mockMetricValue = {
  id: 'value-123',
  value: 10000,
  timestamp: '2023-06-01T00:00:00Z',
  note: null,
  metricId: 'metric-123',
  userId: 'user-123',
  createdAt: '2023-06-01T12:00:00Z'
};

const mockMetricThreshold = {
  id: 'threshold-123',
  type: 'TARGET',
  value: 12000,
  color: '#00FF00',
  metricId: 'metric-123',
  createdAt: '2023-06-10T12:00:00Z',
  updatedAt: '2023-06-10T12:00:00Z'
};

const mockMetricListResponse = {
  items: [mockMetric],
  total: 1,
  page: 1,
  pageSize: 10,
  totalPages: 1
};

const mockDashboardData = {
  metrics: [
    {
      id: 'metric-123',
      name: 'Revenue',
      description: 'Monthly revenue in USD',
      type: 'CURRENCY',
      unit: 'USD',
      comparisonType: 'MONTH_TO_MONTH',
      calculationMethod: 'MANUAL',
      currentValue: 10000,
      previousValue: 9000,
      changePercentage: 11.11,
      trend: 'UP',
      thresholds: [mockMetricThreshold],
      values: [
        { timestamp: '2023-05-01T00:00:00Z', value: 9000 },
        { timestamp: '2023-06-01T00:00:00Z', value: 10000 }
      ],
      teamId: 'team-123',
      team: { id: 'team-123', name: 'Sales' }
    }
  ],
  timeRange: {
    startDate: '2023-05-01T00:00:00Z',
    endDate: '2023-06-30T23:59:59Z'
  },
  comparisonType: 'MONTH_TO_MONTH',
  categories: {
    Financial: [
      {
        id: 'metric-123',
        name: 'Revenue',
        description: 'Monthly revenue in USD',
        type: 'CURRENCY',
        unit: 'USD',
        comparisonType: 'MONTH_TO_MONTH',
        calculationMethod: 'MANUAL',
        currentValue: 10000,
        previousValue: 9000,
        changePercentage: 11.11,
        trend: 'UP',
        thresholds: [mockMetricThreshold],
        values: [
          { timestamp: '2023-05-01T00:00:00Z', value: 9000 },
          { timestamp: '2023-06-01T00:00:00Z', value: 10000 }
        ],
        teamId: 'team-123',
        team: { id: 'team-123', name: 'Sales' }
      }
    ]
  }
};

const mockApiResponse = {
  success: true,
  message: null,
  data: {}
};

const mockErrorResponse = {
  success: false,
  message: 'An error occurred',
  errors: null,
  statusCode: 500
};

// Set up mocks before each test
const setupMocks = () => {
  jest.clearAllMocks();
  (get as jest.Mock).mockResolvedValue({ ...mockApiResponse, data: {} });
  (post as jest.Mock).mockResolvedValue({ ...mockApiResponse, data: {} });
  (put as jest.Mock).mockResolvedValue({ ...mockApiResponse, data: {} });
  (patch as jest.Mock).mockResolvedValue({ ...mockApiResponse, data: {} });
  (del as jest.Mock).mockResolvedValue({ ...mockApiResponse, data: {} });
};

// Test getMetrics function
describe('getMetrics', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should retrieve a list of metrics', async () => {
    (get as jest.Mock).mockResolvedValueOnce({
      ...mockApiResponse,
      data: mockMetricListResponse
    });

    const params = { page: 1, pageSize: 10, organizationId: 'org-123' };
    const result = await metricApi.getMetrics(params);

    expect(get).toHaveBeenCalledWith('/metrics', params);
    expect(result.data).toEqual(mockMetricListResponse);
    expect(result.success).toBeTruthy();
  });

  it('should retrieve metrics with filters', async () => {
    (get as jest.Mock).mockResolvedValueOnce({
      ...mockApiResponse,
      data: mockMetricListResponse
    });

    const params = {
      page: 1,
      pageSize: 10,
      organizationId: 'org-123',
      teamId: 'team-123',
      type: MetricType.CURRENCY,
      search: 'revenue'
    };
    
    const result = await metricApi.getMetrics(params);

    expect(get).toHaveBeenCalledWith('/metrics', params);
    expect(result.data).toEqual(mockMetricListResponse);
  });

  it('should handle API errors', async () => {
    const errorResponse = {
      ...mockErrorResponse,
      message: 'Failed to fetch metrics'
    };
    
    (get as jest.Mock).mockRejectedValueOnce(errorResponse);

    try {
      await metricApi.getMetrics({ page: 1, pageSize: 10, organizationId: 'org-123' });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(errorResponse);
    }
  });
});

// Test getMetricById function
describe('getMetricById', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should retrieve a metric by ID', async () => {
    (get as jest.Mock).mockResolvedValueOnce({
      ...mockApiResponse,
      data: mockMetric
    });

    const result = await metricApi.getMetricById('metric-123');

    expect(get).toHaveBeenCalledWith('/metrics/metric-123');
    expect(result.data).toEqual(mockMetric);
    expect(result.success).toBeTruthy();
  });

  it('should handle non-existent metric', async () => {
    const notFoundError = {
      type: ApiErrorType.RESOURCE_NOT_FOUND,
      message: 'Metric not found',
      statusCode: 404,
      errors: null,
      originalError: null
    };
    
    (get as jest.Mock).mockRejectedValueOnce(notFoundError);

    try {
      await metricApi.getMetricById('non-existent-id');
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(notFoundError);
    }
  });

  it('should handle API errors', async () => {
    const errorResponse = {
      ...mockErrorResponse,
      message: 'Failed to fetch metric'
    };
    
    (get as jest.Mock).mockRejectedValueOnce(errorResponse);

    try {
      await metricApi.getMetricById('metric-123');
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(errorResponse);
    }
  });
});

// Test getMetricWithRelations function
describe('getMetricWithRelations', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should retrieve a metric with its relations', async () => {
    (get as jest.Mock).mockResolvedValueOnce({
      ...mockApiResponse,
      data: mockMetricWithRelations
    });

    const result = await metricApi.getMetricWithRelations('metric-123');

    expect(get).toHaveBeenCalledWith('/metrics/metric-123', { include: 'values,thresholds,team,goals' });
    expect(result.data).toEqual(mockMetricWithRelations);
    expect(result.success).toBeTruthy();
  });

  it('should handle non-existent metric', async () => {
    const notFoundError = {
      type: ApiErrorType.RESOURCE_NOT_FOUND,
      message: 'Metric not found',
      statusCode: 404,
      errors: null,
      originalError: null
    };
    
    (get as jest.Mock).mockRejectedValueOnce(notFoundError);

    try {
      await metricApi.getMetricWithRelations('non-existent-id');
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(notFoundError);
    }
  });

  it('should handle API errors', async () => {
    const errorResponse = {
      ...mockErrorResponse,
      message: 'Failed to fetch metric with relations'
    };
    
    (get as jest.Mock).mockRejectedValueOnce(errorResponse);

    try {
      await metricApi.getMetricWithRelations('metric-123');
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(errorResponse);
    }
  });
});

// Test getDashboardData function
describe('getDashboardData', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should retrieve dashboard data', async () => {
    (get as jest.Mock).mockResolvedValueOnce({
      ...mockApiResponse,
      data: mockDashboardData
    });

    const filters = {
      organizationId: 'org-123',
      startDate: '2023-05-01T00:00:00Z',
      endDate: '2023-06-30T23:59:59Z',
      comparisonType: ComparisonType.MONTH_TO_MONTH
    };
    
    const result = await metricApi.getDashboardData(filters);

    expect(get).toHaveBeenCalledWith('/metrics/dashboard', filters);
    expect(result.data).toEqual(mockDashboardData);
    expect(result.success).toBeTruthy();
  });

  it('should retrieve dashboard data with additional filters', async () => {
    (get as jest.Mock).mockResolvedValueOnce({
      ...mockApiResponse,
      data: mockDashboardData
    });

    const filters = {
      organizationId: 'org-123',
      teamId: 'team-123',
      type: MetricType.CURRENCY,
      startDate: '2023-05-01T00:00:00Z',
      endDate: '2023-06-30T23:59:59Z',
      comparisonType: ComparisonType.MONTH_TO_MONTH
    };
    
    const result = await metricApi.getDashboardData(filters);

    expect(get).toHaveBeenCalledWith('/metrics/dashboard', filters);
    expect(result.data).toEqual(mockDashboardData);
  });

  it('should handle API errors', async () => {
    const errorResponse = {
      ...mockErrorResponse,
      message: 'Failed to fetch dashboard data'
    };
    
    (get as jest.Mock).mockRejectedValueOnce(errorResponse);

    try {
      await metricApi.getDashboardData({
        organizationId: 'org-123',
        startDate: '2023-05-01T00:00:00Z',
        endDate: '2023-06-30T23:59:59Z',
        comparisonType: ComparisonType.MONTH_TO_MONTH
      });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(errorResponse);
    }
  });
});

// Test createMetric function
describe('createMetric', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should create a new metric', async () => {
    (post as jest.Mock).mockResolvedValueOnce({
      ...mockApiResponse,
      data: mockMetric
    });

    const metricData = {
      name: 'Revenue',
      description: 'Monthly revenue in USD',
      type: MetricType.CURRENCY,
      unit: 'USD',
      comparisonType: ComparisonType.MONTH_TO_MONTH,
      calculationMethod: CalculationMethod.MANUAL,
      formula: null,
      organizationId: 'org-123',
      teamId: 'team-123',
      thresholds: [],
      goalIds: []
    };
    
    const result = await metricApi.createMetric(metricData);

    expect(post).toHaveBeenCalledWith('/metrics', metricData);
    expect(result.data).toEqual(mockMetric);
    expect(result.success).toBeTruthy();
  });

  it('should handle validation errors', async () => {
    const validationError = {
      type: ApiErrorType.VALIDATION_ERROR,
      message: 'Validation failed',
      statusCode: 400,
      errors: [{ field: 'name', message: 'Name is required', code: 'required' }],
      originalError: null
    };
    
    (post as jest.Mock).mockRejectedValueOnce(validationError);

    try {
      await metricApi.createMetric({
        name: '',
        description: 'Monthly revenue in USD',
        type: MetricType.CURRENCY,
        unit: 'USD',
        comparisonType: ComparisonType.MONTH_TO_MONTH,
        calculationMethod: CalculationMethod.MANUAL,
        formula: null,
        organizationId: 'org-123',
        teamId: 'team-123',
        thresholds: [],
        goalIds: []
      });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(validationError);
    }
  });

  it('should handle API errors', async () => {
    const errorResponse = {
      ...mockErrorResponse,
      message: 'Failed to create metric'
    };
    
    (post as jest.Mock).mockRejectedValueOnce(errorResponse);

    try {
      await metricApi.createMetric({
        name: 'Revenue',
        description: 'Monthly revenue in USD',
        type: MetricType.CURRENCY,
        unit: 'USD',
        comparisonType: ComparisonType.MONTH_TO_MONTH,
        calculationMethod: CalculationMethod.MANUAL,
        formula: null,
        organizationId: 'org-123',
        teamId: 'team-123',
        thresholds: [],
        goalIds: []
      });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(errorResponse);
    }
  });
});

// Test updateMetric function
describe('updateMetric', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should update an existing metric', async () => {
    (put as jest.Mock).mockResolvedValueOnce({
      ...mockApiResponse,
      data: mockMetric
    });

    const metricData = {
      name: 'Revenue',
      description: 'Updated monthly revenue in USD',
      type: MetricType.CURRENCY,
      unit: 'USD',
      comparisonType: ComparisonType.MONTH_TO_MONTH,
      calculationMethod: CalculationMethod.MANUAL,
      formula: null,
      teamId: 'team-123',
      goalIds: []
    };
    
    const result = await metricApi.updateMetric('metric-123', metricData);

    expect(put).toHaveBeenCalledWith('/metrics/metric-123', metricData);
    expect(result.data).toEqual(mockMetric);
    expect(result.success).toBeTruthy();
  });

  it('should handle non-existent metric', async () => {
    const notFoundError = {
      type: ApiErrorType.RESOURCE_NOT_FOUND,
      message: 'Metric not found',
      statusCode: 404,
      errors: null,
      originalError: null
    };
    
    (put as jest.Mock).mockRejectedValueOnce(notFoundError);

    try {
      await metricApi.updateMetric('non-existent-id', {
        name: 'Revenue',
        description: 'Updated monthly revenue in USD',
        type: MetricType.CURRENCY,
        unit: 'USD',
        comparisonType: ComparisonType.MONTH_TO_MONTH,
        calculationMethod: CalculationMethod.MANUAL,
        formula: null,
        teamId: 'team-123',
        goalIds: []
      });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(notFoundError);
    }
  });

  it('should handle validation errors', async () => {
    const validationError = {
      type: ApiErrorType.VALIDATION_ERROR,
      message: 'Validation failed',
      statusCode: 400,
      errors: [{ field: 'name', message: 'Name is required', code: 'required' }],
      originalError: null
    };
    
    (put as jest.Mock).mockRejectedValueOnce(validationError);

    try {
      await metricApi.updateMetric('metric-123', {
        name: '',
        description: 'Updated monthly revenue in USD',
        type: MetricType.CURRENCY,
        unit: 'USD',
        comparisonType: ComparisonType.MONTH_TO_MONTH,
        calculationMethod: CalculationMethod.MANUAL,
        formula: null,
        teamId: 'team-123',
        goalIds: []
      });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(validationError);
    }
  });

  it('should handle API errors', async () => {
    const errorResponse = {
      ...mockErrorResponse,
      message: 'Failed to update metric'
    };
    
    (put as jest.Mock).mockRejectedValueOnce(errorResponse);

    try {
      await metricApi.updateMetric('metric-123', {
        name: 'Revenue',
        description: 'Updated monthly revenue in USD',
        type: MetricType.CURRENCY,
        unit: 'USD',
        comparisonType: ComparisonType.MONTH_TO_MONTH,
        calculationMethod: CalculationMethod.MANUAL,
        formula: null,
        teamId: 'team-123',
        goalIds: []
      });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(errorResponse);
    }
  });
});

// Test deleteMetric function
describe('deleteMetric', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should delete a metric', async () => {
    (del as jest.Mock).mockResolvedValueOnce({
      ...mockApiResponse,
      data: { success: true }
    });

    const result = await metricApi.deleteMetric('metric-123');

    expect(del).toHaveBeenCalledWith('/metrics/metric-123');
    expect(result.data).toEqual({ success: true });
    expect(result.success).toBeTruthy();
  });

  it('should handle non-existent metric', async () => {
    const notFoundError = {
      type: ApiErrorType.RESOURCE_NOT_FOUND,
      message: 'Metric not found',
      statusCode: 404,
      errors: null,
      originalError: null
    };
    
    (del as jest.Mock).mockRejectedValueOnce(notFoundError);

    try {
      await metricApi.deleteMetric('non-existent-id');
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(notFoundError);
    }
  });

  it('should handle API errors', async () => {
    const errorResponse = {
      ...mockErrorResponse,
      message: 'Failed to delete metric'
    };
    
    (del as jest.Mock).mockRejectedValueOnce(errorResponse);

    try {
      await metricApi.deleteMetric('metric-123');
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(errorResponse);
    }
  });
});

// Test getMetricValues function
describe('getMetricValues', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should retrieve metric values', async () => {
    (get as jest.Mock).mockResolvedValueOnce({
      ...mockApiResponse,
      data: [mockMetricValue]
    });

    const filters = {
      metricId: 'metric-123',
      startDate: null,
      endDate: null
    };
    
    const result = await metricApi.getMetricValues('metric-123', filters);

    expect(get).toHaveBeenCalledWith('/metrics/metric-123/values', filters);
    expect(result.data).toEqual([mockMetricValue]);
    expect(result.success).toBeTruthy();
  });

  it('should retrieve metric values with date filters', async () => {
    (get as jest.Mock).mockResolvedValueOnce({
      ...mockApiResponse,
      data: [mockMetricValue]
    });

    const filters = {
      metricId: 'metric-123',
      startDate: '2023-05-01T00:00:00Z',
      endDate: '2023-06-30T23:59:59Z'
    };
    
    const result = await metricApi.getMetricValues('metric-123', filters);

    expect(get).toHaveBeenCalledWith('/metrics/metric-123/values', filters);
    expect(result.data).toEqual([mockMetricValue]);
  });

  it('should handle non-existent metric', async () => {
    const notFoundError = {
      type: ApiErrorType.RESOURCE_NOT_FOUND,
      message: 'Metric not found',
      statusCode: 404,
      errors: null,
      originalError: null
    };
    
    (get as jest.Mock).mockRejectedValueOnce(notFoundError);

    try {
      await metricApi.getMetricValues('non-existent-id', {
        metricId: 'non-existent-id',
        startDate: null,
        endDate: null
      });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(notFoundError);
    }
  });

  it('should handle API errors', async () => {
    const errorResponse = {
      ...mockErrorResponse,
      message: 'Failed to fetch metric values'
    };
    
    (get as jest.Mock).mockRejectedValueOnce(errorResponse);

    try {
      await metricApi.getMetricValues('metric-123', {
        metricId: 'metric-123',
        startDate: null,
        endDate: null
      });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(errorResponse);
    }
  });
});

// Test createMetricValue function
describe('createMetricValue', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should create a new metric value', async () => {
    (post as jest.Mock).mockResolvedValueOnce({
      ...mockApiResponse,
      data: mockMetricValue
    });

    const valueData = {
      value: 10000,
      timestamp: '2023-06-01T00:00:00Z',
      metricId: 'metric-123',
      note: null
    };
    
    const result = await metricApi.createMetricValue('metric-123', valueData);

    expect(post).toHaveBeenCalledWith('/metrics/metric-123/values', valueData);
    expect(result.data).toEqual(mockMetricValue);
    expect(result.success).toBeTruthy();
  });

  it('should handle validation errors', async () => {
    const validationError = {
      type: ApiErrorType.VALIDATION_ERROR,
      message: 'Validation failed',
      statusCode: 400,
      errors: [{ field: 'value', message: 'Value is required', code: 'required' }],
      originalError: null
    };
    
    (post as jest.Mock).mockRejectedValueOnce(validationError);

    try {
      await metricApi.createMetricValue('metric-123', {
        value: null as any,
        timestamp: '2023-06-01T00:00:00Z',
        metricId: 'metric-123',
        note: null
      });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(validationError);
    }
  });

  it('should handle non-existent metric', async () => {
    const notFoundError = {
      type: ApiErrorType.RESOURCE_NOT_FOUND,
      message: 'Metric not found',
      statusCode: 404,
      errors: null,
      originalError: null
    };
    
    (post as jest.Mock).mockRejectedValueOnce(notFoundError);

    try {
      await metricApi.createMetricValue('non-existent-id', {
        value: 10000,
        timestamp: '2023-06-01T00:00:00Z',
        metricId: 'non-existent-id',
        note: null
      });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(notFoundError);
    }
  });

  it('should handle API errors', async () => {
    const errorResponse = {
      ...mockErrorResponse,
      message: 'Failed to create metric value'
    };
    
    (post as jest.Mock).mockRejectedValueOnce(errorResponse);

    try {
      await metricApi.createMetricValue('metric-123', {
        value: 10000,
        timestamp: '2023-06-01T00:00:00Z',
        metricId: 'metric-123',
        note: null
      });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(errorResponse);
    }
  });
});

// Test deleteMetricValue function
describe('deleteMetricValue', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should delete a metric value', async () => {
    (del as jest.Mock).mockResolvedValueOnce({
      ...mockApiResponse,
      data: { success: true }
    });

    const result = await metricApi.deleteMetricValue('value-123');

    expect(del).toHaveBeenCalledWith('/metric-values/value-123');
    expect(result.data).toEqual({ success: true });
    expect(result.success).toBeTruthy();
  });

  it('should handle non-existent value', async () => {
    const notFoundError = {
      type: ApiErrorType.RESOURCE_NOT_FOUND,
      message: 'Metric value not found',
      statusCode: 404,
      errors: null,
      originalError: null
    };
    
    (del as jest.Mock).mockRejectedValueOnce(notFoundError);

    try {
      await metricApi.deleteMetricValue('non-existent-id');
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(notFoundError);
    }
  });

  it('should handle API errors', async () => {
    const errorResponse = {
      ...mockErrorResponse,
      message: 'Failed to delete metric value'
    };
    
    (del as jest.Mock).mockRejectedValueOnce(errorResponse);

    try {
      await metricApi.deleteMetricValue('value-123');
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(errorResponse);
    }
  });
});

// Test getMetricThresholds function
describe('getMetricThresholds', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should retrieve metric thresholds', async () => {
    (get as jest.Mock).mockResolvedValueOnce({
      ...mockApiResponse,
      data: [mockMetricThreshold]
    });

    const result = await metricApi.getMetricThresholds('metric-123');

    expect(get).toHaveBeenCalledWith('/metrics/metric-123/thresholds');
    expect(result.data).toEqual([mockMetricThreshold]);
    expect(result.success).toBeTruthy();
  });

  it('should handle non-existent metric', async () => {
    const notFoundError = {
      type: ApiErrorType.RESOURCE_NOT_FOUND,
      message: 'Metric not found',
      statusCode: 404,
      errors: null,
      originalError: null
    };
    
    (get as jest.Mock).mockRejectedValueOnce(notFoundError);

    try {
      await metricApi.getMetricThresholds('non-existent-id');
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(notFoundError);
    }
  });

  it('should handle API errors', async () => {
    const errorResponse = {
      ...mockErrorResponse,
      message: 'Failed to fetch metric thresholds'
    };
    
    (get as jest.Mock).mockRejectedValueOnce(errorResponse);

    try {
      await metricApi.getMetricThresholds('metric-123');
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(errorResponse);
    }
  });
});

// Test createMetricThreshold function
describe('createMetricThreshold', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should create a new metric threshold', async () => {
    (post as jest.Mock).mockResolvedValueOnce({
      ...mockApiResponse,
      data: mockMetricThreshold
    });

    const thresholdData = {
      type: ThresholdType.TARGET,
      value: 12000,
      color: '#00FF00'
    };
    
    const result = await metricApi.createMetricThreshold('metric-123', thresholdData);

    expect(post).toHaveBeenCalledWith('/metrics/metric-123/thresholds', thresholdData);
    expect(result.data).toEqual(mockMetricThreshold);
    expect(result.success).toBeTruthy();
  });

  it('should handle validation errors', async () => {
    const validationError = {
      type: ApiErrorType.VALIDATION_ERROR,
      message: 'Validation failed',
      statusCode: 400,
      errors: [{ field: 'value', message: 'Value is required', code: 'required' }],
      originalError: null
    };
    
    (post as jest.Mock).mockRejectedValueOnce(validationError);

    try {
      await metricApi.createMetricThreshold('metric-123', {
        type: ThresholdType.TARGET,
        value: null as any,
        color: '#00FF00'
      });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(validationError);
    }
  });

  it('should handle non-existent metric', async () => {
    const notFoundError = {
      type: ApiErrorType.RESOURCE_NOT_FOUND,
      message: 'Metric not found',
      statusCode: 404,
      errors: null,
      originalError: null
    };
    
    (post as jest.Mock).mockRejectedValueOnce(notFoundError);

    try {
      await metricApi.createMetricThreshold('non-existent-id', {
        type: ThresholdType.TARGET,
        value: 12000,
        color: '#00FF00'
      });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(notFoundError);
    }
  });

  it('should handle API errors', async () => {
    const errorResponse = {
      ...mockErrorResponse,
      message: 'Failed to create metric threshold'
    };
    
    (post as jest.Mock).mockRejectedValueOnce(errorResponse);

    try {
      await metricApi.createMetricThreshold('metric-123', {
        type: ThresholdType.TARGET,
        value: 12000,
        color: '#00FF00'
      });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(errorResponse);
    }
  });
});

// Test updateMetricThreshold function
describe('updateMetricThreshold', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should update a metric threshold', async () => {
    (patch as jest.Mock).mockResolvedValueOnce({
      ...mockApiResponse,
      data: mockMetricThreshold
    });

    const thresholdData = {
      value: 12000,
      color: '#00FF00'
    };
    
    const result = await metricApi.updateMetricThreshold('threshold-123', thresholdData);

    expect(patch).toHaveBeenCalledWith('/metric-thresholds/threshold-123', thresholdData);
    expect(result.data).toEqual(mockMetricThreshold);
    expect(result.success).toBeTruthy();
  });

  it('should handle non-existent threshold', async () => {
    const notFoundError = {
      type: ApiErrorType.RESOURCE_NOT_FOUND,
      message: 'Threshold not found',
      statusCode: 404,
      errors: null,
      originalError: null
    };
    
    (patch as jest.Mock).mockRejectedValueOnce(notFoundError);

    try {
      await metricApi.updateMetricThreshold('non-existent-id', {
        value: 12000,
        color: '#00FF00'
      });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(notFoundError);
    }
  });

  it('should handle validation errors', async () => {
    const validationError = {
      type: ApiErrorType.VALIDATION_ERROR,
      message: 'Validation failed',
      statusCode: 400,
      errors: [{ field: 'value', message: 'Value is required', code: 'required' }],
      originalError: null
    };
    
    (patch as jest.Mock).mockRejectedValueOnce(validationError);

    try {
      await metricApi.updateMetricThreshold('threshold-123', {
        value: null as any,
        color: '#00FF00'
      });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(validationError);
    }
  });

  it('should handle API errors', async () => {
    const errorResponse = {
      ...mockErrorResponse,
      message: 'Failed to update metric threshold'
    };
    
    (patch as jest.Mock).mockRejectedValueOnce(errorResponse);

    try {
      await metricApi.updateMetricThreshold('threshold-123', {
        value: 12000,
        color: '#00FF00'
      });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(errorResponse);
    }
  });
});

// Test deleteMetricThreshold function
describe('deleteMetricThreshold', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should delete a metric threshold', async () => {
    (del as jest.Mock).mockResolvedValueOnce({
      ...mockApiResponse,
      data: { success: true }
    });

    const result = await metricApi.deleteMetricThreshold('threshold-123');

    expect(del).toHaveBeenCalledWith('/metric-thresholds/threshold-123');
    expect(result.data).toEqual({ success: true });
    expect(result.success).toBeTruthy();
  });

  it('should handle non-existent threshold', async () => {
    const notFoundError = {
      type: ApiErrorType.RESOURCE_NOT_FOUND,
      message: 'Threshold not found',
      statusCode: 404,
      errors: null,
      originalError: null
    };
    
    (del as jest.Mock).mockRejectedValueOnce(notFoundError);

    try {
      await metricApi.deleteMetricThreshold('non-existent-id');
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(notFoundError);
    }
  });

  it('should handle API errors', async () => {
    const errorResponse = {
      ...mockErrorResponse,
      message: 'Failed to delete metric threshold'
    };
    
    (del as jest.Mock).mockRejectedValueOnce(errorResponse);

    try {
      await metricApi.deleteMetricThreshold('threshold-123');
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(errorResponse);
    }
  });
});

// Test exportMetrics function
describe('exportMetrics', () => {
  beforeEach(() => {
    setupMocks();
  });

  it('should export metrics in CSV format', async () => {
    const mockBlob = new Blob(['csv data'], { type: 'text/csv' });
    (get as jest.Mock).mockResolvedValueOnce({
      data: mockBlob
    });

    const options = {
      format: 'csv' as const,
      includeValues: true,
      dateRange: {
        startDate: '2023-01-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z'
      },
      filters: {
        organizationId: 'org-123',
        teamId: null,
        type: null,
        goalId: null,
        search: null,
        dateRange: null
      }
    };
    
    const result = await metricApi.exportMetrics(options);

    expect(get).toHaveBeenCalledWith('/metrics/export', options, {
      'Accept': 'text/csv'
    }, {
      responseType: 'blob'
    });
    expect(result).toEqual(mockBlob);
  });

  it('should export metrics in XLSX format', async () => {
    const mockBlob = new Blob(['xlsx data'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    (get as jest.Mock).mockResolvedValueOnce({
      data: mockBlob
    });

    const options = {
      format: 'xlsx' as const,
      includeValues: true,
      dateRange: {
        startDate: '2023-01-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z'
      },
      filters: null
    };
    
    const result = await metricApi.exportMetrics(options);

    expect(get).toHaveBeenCalledWith('/metrics/export', options, {
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }, {
      responseType: 'blob'
    });
    expect(result).toEqual(mockBlob);
  });

  it('should export metrics in PDF format', async () => {
    const mockBlob = new Blob(['pdf data'], { type: 'application/pdf' });
    (get as jest.Mock).mockResolvedValueOnce({
      data: mockBlob
    });

    const options = {
      format: 'pdf' as const,
      includeValues: false,
      dateRange: null,
      filters: null
    };
    
    const result = await metricApi.exportMetrics(options);

    expect(get).toHaveBeenCalledWith('/metrics/export', options, {
      'Accept': 'application/pdf'
    }, {
      responseType: 'blob'
    });
    expect(result).toEqual(mockBlob);
  });

  it('should export metrics with custom filters', async () => {
    const mockBlob = new Blob(['csv data'], { type: 'text/csv' });
    (get as jest.Mock).mockResolvedValueOnce({
      data: mockBlob
    });

    const options = {
      format: 'csv' as const,
      includeValues: true,
      dateRange: {
        startDate: '2023-01-01T00:00:00Z',
        endDate: '2023-12-31T23:59:59Z'
      },
      filters: {
        organizationId: 'org-123',
        teamId: 'team-123',
        type: MetricType.CURRENCY,
        goalId: 'goal-123',
        search: 'revenue',
        dateRange: null
      }
    };
    
    const result = await metricApi.exportMetrics(options);

    expect(get).toHaveBeenCalledWith('/metrics/export', options, {
      'Accept': 'text/csv'
    }, {
      responseType: 'blob'
    });
    expect(result).toEqual(mockBlob);
  });

  it('should handle API errors', async () => {
    const errorResponse = {
      ...mockErrorResponse,
      message: 'Failed to export metrics'
    };
    
    (get as jest.Mock).mockRejectedValueOnce(errorResponse);

    try {
      await metricApi.exportMetrics({
        format: 'csv',
        includeValues: true,
        dateRange: null,
        filters: null
      });
      fail('Expected an error to be thrown');
    } catch (error) {
      expect(error).toEqual(errorResponse);
    }
  });
});