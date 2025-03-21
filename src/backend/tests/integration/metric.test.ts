import request from 'supertest'; // version ^6.3.3
import jwt from 'jsonwebtoken'; // version ^9.0.0
import { app } from '../../src/app';
import { prismaMock, firestore } from '../mocks';
import { mockUser, mockOrganization, mockTeam, mockGoal, mockRevenueMetric, mockCustomerSatisfactionMetric, mockFormulaMetric, mockMetricValues, mockMetricThresholds, generateMockMetric, generateMockMetricValue, generateMockMetricThreshold } from '../fixtures';
import { MetricType, ComparisonType, CalculationMethod, ThresholdType } from '../../src/types/metric.types';
import { METRIC_UNITS } from '../../src/utils/constants/metricTypes';

/**
 * Helper function to create JWT tokens for testing authenticated endpoints
 * @param payload 
 * @returns JWT token
 */
const createAuthToken = (payload: any): string => {
  // Use jsonwebtoken to sign the provided payload with the test JWT secret
  // Set appropriate expiration time
  // Return the generated token string
  return jwt.sign(payload, 'test-secret', { expiresIn: '1h' });
};

/**
 * Helper function to set up common metric-related mocks
 * @param metricData 
 */
const setupMetricMocks = (metricData: any): void => {
  // Mock Prisma metric.findUnique to return the provided metric data
  // Mock Prisma metric.findMany to return an array with the provided metric data
  // Set up other common mocks needed for metric tests
  prismaMock.metric.findUnique.mockResolvedValue(metricData);
  prismaMock.metric.findMany.mockResolvedValue([metricData]);
};

describe('Metric API Integration Tests', () => {
  // Tests the metric API endpoints for creating, retrieving, updating, and deleting metrics
  it('POST /api/v1/metrics - should create a new metric successfully', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Mock Prisma organization.findUnique to return mockOrganization
    prismaMock.organization.findUnique.mockResolvedValue(mockOrganization);

    // Mock Prisma metric.create to return a new metric record
    const newMetric = generateMockMetric();
    prismaMock.metric.create.mockResolvedValue(newMetric);

    // Mock Firestore updateDoc to resolve successfully
    firestore.updateDoc.mockResolvedValue();

    // Send POST request to /api/v1/metrics with valid metric data
    const response = await request(app)
      .post('/api/v1/metrics')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'New Metric',
        description: 'A new metric for testing',
        type: MetricType.NUMBER,
        unit: METRIC_UNITS.COUNT,
        comparisonType: ComparisonType.YEAR_TO_DATE,
        calculationMethod: CalculationMethod.MANUAL,
        organizationId: mockOrganization.id,
      });

    // Assert response status is 201 Created
    expect(response.status).toBe(201);

    // Assert response contains the created metric data
    expect(response.body.data).toBeDefined();
    expect(response.body.data.name).toBe('New Metric');

    // Verify Prisma metric.create was called with correct data
    expect(prismaMock.metric.create).toHaveBeenCalledWith({
      data: {
        name: 'New Metric',
        description: 'A new metric for testing',
        type: MetricType.NUMBER,
        unit: METRIC_UNITS.COUNT,
        comparisonType: ComparisonType.YEAR_TO_DATE,
        calculationMethod: CalculationMethod.MANUAL,
        organizationId: mockOrganization.id,
      },
    });

    // Verify Firestore updateDoc was called for real-time updates
    expect(firestore.updateDoc).toHaveBeenCalled();
  });

  it('POST /api/v1/metrics - should return 400 for invalid metric data', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Send POST request to /api/v1/metrics with invalid metric data (missing required fields)
    const response = await request(app)
      .post('/api/v1/metrics')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        description: 'A new metric for testing',
        type: MetricType.NUMBER,
        unit: METRIC_UNITS.COUNT,
        comparisonType: ComparisonType.YEAR_TO_DATE,
        calculationMethod: CalculationMethod.MANUAL,
        organizationId: mockOrganization.id,
      });

    // Assert response status is 400 Bad Request
    expect(response.status).toBe(400);

    // Assert response contains validation error messages
    expect(response.body.errors).toBeDefined();
  });

  it('POST /api/v1/metrics - should return 400 for invalid formula with FORMULA calculation method', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Send POST request to /api/v1/metrics with FORMULA calculation method but invalid formula
    const response = await request(app)
      .post('/api/v1/metrics')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Invalid Formula Metric',
        description: 'A metric with an invalid formula',
        type: MetricType.NUMBER,
        unit: METRIC_UNITS.COUNT,
        comparisonType: ComparisonType.YEAR_TO_DATE,
        calculationMethod: CalculationMethod.FORMULA,
        formula: 'invalid-formula',
        organizationId: mockOrganization.id,
      });

    // Assert response status is 400 Bad Request
    expect(response.status).toBe(400);

    // Assert response contains validation error about formula
    expect(response.body.errors).toBeDefined();
    expect(response.body.errors.formula).toContain('Formula evaluation did not result in a valid number');
  });

  it('GET /api/v1/metrics/:id - should retrieve a metric by ID', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Mock Prisma metric.findUnique to return mockRevenueMetric
    prismaMock.metric.findUnique.mockResolvedValue(mockRevenueMetric);

    // Send GET request to /api/v1/metrics/:id with valid metric ID
    const response = await request(app)
      .get(`/api/v1/metrics/${mockRevenueMetric.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    // Assert response status is 200 OK
    expect(response.status).toBe(200);

    // Assert response contains the expected metric data
    expect(response.body.data).toBeDefined();
    expect(response.body.data.id).toBe(mockRevenueMetric.id);

    // Verify Prisma metric.findUnique was called with correct ID
    expect(prismaMock.metric.findUnique).toHaveBeenCalledWith({
      where: { id: mockRevenueMetric.id },
    });
  });

  it('GET /api/v1/metrics/:id - should return 404 for non-existent metric', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Mock Prisma metric.findUnique to return null
    prismaMock.metric.findUnique.mockResolvedValue(null);

    // Send GET request to /api/v1/metrics/:id with non-existent ID
    const response = await request(app)
      .get('/api/v1/metrics/non-existent-id')
      .set('Authorization', `Bearer ${authToken}`);

    // Assert response status is 404 Not Found
    expect(response.status).toBe(404);

    // Assert response contains appropriate error message
    expect(response.body.message).toBe('Metric not found');
  });

  it('GET /api/v1/organizations/:id/metrics - should retrieve metrics for an organization', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Mock Prisma metric.findMany to return array of metrics
    prismaMock.metric.findMany.mockResolvedValue([mockRevenueMetric, mockCustomerSatisfactionMetric]);

    // Mock Prisma metric.count to return the total count
    prismaMock.metric.count.mockResolvedValue(2);

    // Send GET request to /api/v1/organizations/:id/metrics
    const response = await request(app)
      .get(`/api/v1/organizations/${mockOrganization.id}/metrics`)
      .set('Authorization', `Bearer ${authToken}`);

    // Assert response status is 200 OK
    expect(response.status).toBe(200);

    // Assert response contains paginated metrics data
    expect(response.body.data).toBeDefined();
    expect(response.body.data.length).toBe(2);

    // Assert response includes pagination links and metadata
    expect(response.body.pagination).toBeDefined();
    expect(response.body.links).toBeDefined();

    // Verify Prisma metric.findMany was called with correct organization ID
    expect(prismaMock.metric.findMany).toHaveBeenCalledWith({
      where: { organizationId: mockOrganization.id },
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('GET /api/v1/teams/:id/metrics - should retrieve metrics for a team', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Mock Prisma metric.findMany to return array of team metrics
    prismaMock.metric.findMany.mockResolvedValue([mockTeamMetric]);

    // Mock Prisma metric.count to return the total count
    prismaMock.metric.count.mockResolvedValue(1);

    // Send GET request to /api/v1/teams/:id/metrics
    const response = await request(app)
      .get(`/api/v1/teams/${mockTeam.id}/metrics`)
      .set('Authorization', `Bearer ${authToken}`);

    // Assert response status is 200 OK
    expect(response.status).toBe(200);

    // Assert response contains paginated team metrics data
    expect(response.body.data).toBeDefined();
    expect(response.body.data.length).toBe(1);

    // Assert response includes pagination links and metadata
    expect(response.body.pagination).toBeDefined();
    expect(response.body.links).toBeDefined();

    // Verify Prisma metric.findMany was called with correct team ID
    expect(prismaMock.metric.findMany).toHaveBeenCalledWith({
      where: { teamId: mockTeam.id },
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('GET /api/v1/goals/:id/metrics - should retrieve metrics linked to a goal', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Mock Prisma metric.findMany to return array of goal-linked metrics
    prismaMock.metric.findMany.mockResolvedValue([mockRevenueMetric, mockCustomerSatisfactionMetric]);

    // Mock Prisma metric.count to return the total count
    prismaMock.metric.count.mockResolvedValue(2);

    // Send GET request to /api/v1/goals/:id/metrics
    const response = await request(app)
      .get(`/api/v1/goals/${mockGoal.id}/metrics`)
      .set('Authorization', `Bearer ${authToken}`);

    // Assert response status is 200 OK
    expect(response.status).toBe(200);

    // Assert response contains paginated goal-linked metrics data
    expect(response.body.data).toBeDefined();
    expect(response.body.data.length).toBe(2);

    // Assert response includes pagination links and metadata
    expect(response.body.pagination).toBeDefined();
    expect(response.body.links).toBeDefined();

    // Verify Prisma metric.findMany was called with correct goal ID
    expect(prismaMock.metric.findMany).toHaveBeenCalledWith({
      where: { goalId: mockGoal.id },
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('GET /api/v1/metrics - should retrieve metrics with filters', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Mock Prisma metric.findMany to return filtered metrics
    prismaMock.metric.findMany.mockResolvedValue([mockRevenueMetric]);

    // Mock Prisma metric.count to return the filtered total count
    prismaMock.metric.count.mockResolvedValue(1);

    // Send GET request to /api/v1/metrics with filter parameters
    const response = await request(app)
      .get('/api/v1/metrics?organizationId=org-acme&type=CURRENCY')
      .set('Authorization', `Bearer ${authToken}`);

    // Assert response status is 200 OK
    expect(response.status).toBe(200);

    // Assert response contains filtered metrics data
    expect(response.body.data).toBeDefined();
    expect(response.body.data.length).toBe(1);

    // Assert response includes pagination links and metadata
    expect(response.body.pagination).toBeDefined();
    expect(response.body.links).toBeDefined();

    // Verify Prisma metric.findMany was called with correct filter parameters
    expect(prismaMock.metric.findMany).toHaveBeenCalledWith({
      where: { organizationId: 'org-acme', type: 'CURRENCY' },
      skip: 0,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  });

  it('PUT /api/v1/metrics/:id - should update a metric successfully', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Mock Prisma metric.findUnique to return mockRevenueMetric
    prismaMock.metric.findUnique.mockResolvedValue(mockRevenueMetric);

    // Mock Prisma metric.update to return updated metric
    const updatedMetric = { ...mockRevenueMetric, name: 'Updated Revenue' };
    prismaMock.metric.update.mockResolvedValue(updatedMetric);

    // Mock Firestore updateDoc to resolve successfully
    firestore.updateDoc.mockResolvedValue();

    // Send PUT request to /api/v1/metrics/:id with valid update data
    const response = await request(app)
      .put(`/api/v1/metrics/${mockRevenueMetric.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Revenue' });

    // Assert response status is 200 OK
    expect(response.status).toBe(200);

    // Assert response contains the updated metric data
    expect(response.body.data).toBeDefined();
    expect(response.body.data.name).toBe('Updated Revenue');

    // Verify Prisma metric.update was called with correct data
    expect(prismaMock.metric.update).toHaveBeenCalledWith({
      where: { id: mockRevenueMetric.id },
      data: { name: 'Updated Revenue' },
    });

    // Verify Firestore updateDoc was called for real-time updates
    expect(firestore.updateDoc).toHaveBeenCalled();
  });

  it('PUT /api/v1/metrics/:id - should return 404 for non-existent metric', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Mock Prisma metric.findUnique to return null
    prismaMock.metric.findUnique.mockResolvedValue(null);

    // Send PUT request to /api/v1/metrics/:id with valid update data
    const response = await request(app)
      .put('/api/v1/metrics/non-existent-id')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Updated Revenue' });

    // Assert response status is 404 Not Found
    expect(response.status).toBe(404);

    // Assert response contains appropriate error message
    expect(response.body.message).toBe('Metric not found');
  });

  it('PUT /api/v1/metrics/:id - should return 400 for invalid update data', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Mock Prisma metric.findUnique to return mockRevenueMetric
    prismaMock.metric.findUnique.mockResolvedValue(mockRevenueMetric);

    // Send PUT request to /api/v1/metrics/:id with invalid update data
    const response = await request(app)
      .put(`/api/v1/metrics/${mockRevenueMetric.id}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ type: 'INVALID_TYPE' });

    // Assert response status is 400 Bad Request
    expect(response.status).toBe(400);

    // Assert response contains validation error messages
    expect(response.body.errors).toBeDefined();
  });

  it('DELETE /api/v1/metrics/:id - should delete a metric successfully', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Mock Prisma metric.findUnique to return mockRevenueMetric
    prismaMock.metric.findUnique.mockResolvedValue(mockRevenueMetric);

    // Mock Prisma metricThreshold.deleteMany to resolve successfully
    prismaMock.metricThreshold.deleteMany.mockResolvedValue();

    // Mock Prisma metric.delete to return deleted metric
    prismaMock.metric.delete.mockResolvedValue(mockRevenueMetric);

    // Send DELETE request to /api/v1/metrics/:id
    const response = await request(app)
      .delete(`/api/v1/metrics/${mockRevenueMetric.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    // Assert response status is 200 OK
    expect(response.status).toBe(200);

    // Assert response contains the deleted metric data
    expect(response.body.data).toBeDefined();
    expect(response.body.data.id).toBe(mockRevenueMetric.id);

    // Verify Prisma metricThreshold.deleteMany was called with correct metric ID
    expect(prismaMock.metricThreshold.deleteMany).toHaveBeenCalledWith({
      where: { metricId: mockRevenueMetric.id },
    });

    // Verify Prisma metric.delete was called with correct ID
    expect(prismaMock.metric.delete).toHaveBeenCalledWith({
      where: { id: mockRevenueMetric.id },
    });
  });

  it('DELETE /api/v1/metrics/:id - should return 404 for non-existent metric', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Mock Prisma metric.findUnique to return null
    prismaMock.metric.findUnique.mockResolvedValue(null);

    // Send DELETE request to /api/v1/metrics/:id
    const response = await request(app)
      .delete('/api/v1/metrics/non-existent-id')
      .set('Authorization', `Bearer ${authToken}`);

    // Assert response status is 404 Not Found
    expect(response.status).toBe(404);

    // Assert response contains appropriate error message
    expect(response.body.message).toBe('Metric not found');
  });

  it('POST /api/v1/metrics/:metricId/goals/:goalId - should link a goal to a metric', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Mock Prisma metric.update to return updated metric with goal link
    prismaMock.metric.update.mockResolvedValue(mockRevenueMetric);

    // Send POST request to /api/v1/metrics/:metricId/goals/:goalId
    const response = await request(app)
      .post(`/api/v1/metrics/${mockRevenueMetric.id}/goals/${mockGoal.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    // Assert response status is 200 OK
    expect(response.status).toBe(200);

    // Assert response contains the updated metric with goal link
    expect(response.body.data).toBeDefined();
    expect(response.body.data.id).toBe(mockRevenueMetric.id);

    // Verify Prisma metric.update was called with correct parameters
    expect(prismaMock.metric.update).toHaveBeenCalledWith({
      where: { id: mockRevenueMetric.id },
      data: { goalId: mockGoal.id },
    });
  });

  it('DELETE /api/v1/metrics/:metricId/goals/:goalId - should unlink a goal from a metric', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Mock Prisma metric.update to return updated metric without goal link
    prismaMock.metric.update.mockResolvedValue(mockRevenueMetric);

    // Send DELETE request to /api/v1/metrics/:metricId/goals/:goalId
    const response = await request(app)
      .delete(`/api/v1/metrics/${mockRevenueMetric.id}/goals/${mockGoal.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    // Assert response status is 200 OK
    expect(response.status).toBe(200);

    // Assert response contains the updated metric without goal link
    expect(response.body.data).toBeDefined();
    expect(response.body.data.id).toBe(mockRevenueMetric.id);

    // Verify Prisma metric.update was called with correct parameters
    expect(prismaMock.metric.update).toHaveBeenCalledWith({
      where: { id: mockRevenueMetric.id },
      data: { goalId: null },
    });
  });

  it('POST /api/v1/metrics/values - should create a new metric value', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Mock Prisma metric.findUnique to return mockRevenueMetric
    prismaMock.metric.findUnique.mockResolvedValue(mockRevenueMetric);

    // Mock Prisma metricValue.create to return new metric value
    const newMetricValue = generateMockMetricValue();
    prismaMock.metricValue.create.mockResolvedValue(newMetricValue);

    // Mock Prisma metricThreshold.findMany to return thresholds
    prismaMock.metricThreshold.findMany.mockResolvedValue(mockMetricThresholds);

    // Send POST request to /api/v1/metrics/values with valid value data
    const response = await request(app)
      .post('/api/v1/metrics/values')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        value: 1500000,
        timestamp: new Date(),
        metricId: mockRevenueMetric.id,
        note: 'New record revenue',
      });

    // Assert response status is 201 Created
    expect(response.status).toBe(201);

    // Assert response contains the created metric value
    expect(response.body.data).toBeDefined();
    expect(response.body.data.value).toBe(1500000);

    // Verify Prisma metricValue.create was called with correct data
    expect(prismaMock.metricValue.create).toHaveBeenCalledWith({
      data: {
        value: 1500000,
        timestamp: expect.any(Date),
        metricId: mockRevenueMetric.id,
        note: 'New record revenue',
        userId: mockUser.id,
      },
    });
  });

  it('GET /api/v1/metrics/:id/values - should retrieve values for a metric', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Mock Prisma metricValue.findMany to return array of values
    prismaMock.metricValue.findMany.mockResolvedValue(mockMetricValues);

    // Send GET request to /api/v1/metrics/:id/values
    const response = await request(app)
      .get(`/api/v1/metrics/${mockRevenueMetric.id}/values`)
      .set('Authorization', `Bearer ${authToken}`);

    // Assert response status is 200 OK
    expect(response.status).toBe(200);

    // Assert response contains the metric values
    expect(response.body.data).toBeDefined();
    expect(response.body.data.length).toBe(mockMetricValues.length);

    // Verify Prisma metricValue.findMany was called with correct metric ID
    expect(prismaMock.metricValue.findMany).toHaveBeenCalledWith({
      where: { metricId: mockRevenueMetric.id },
    });
  });

  it('GET /api/v1/metrics/:id/timeseries - should retrieve time series data for a metric', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Mock Prisma metricValue.findMany to return array of values
    prismaMock.metricValue.findMany.mockResolvedValue(mockMetricValues);

    // Send GET request to /api/v1/metrics/:id/timeseries with time parameters
    const response = await request(app)
      .get(`/api/v1/metrics/${mockRevenueMetric.id}/timeseries?startDate=2023-01-01&endDate=2023-03-31`)
      .set('Authorization', `Bearer ${authToken}`);

    // Assert response status is 200 OK
    expect(response.status).toBe(200);

    // Assert response contains the time series data points
    expect(response.body.data).toBeDefined();
    expect(response.body.data.length).toBe(mockMetricValues.length);

    // Verify Prisma metricValue.findMany was called with correct parameters
    expect(prismaMock.metricValue.findMany).toHaveBeenCalledWith({
      where: {
        metricId: mockRevenueMetric.id,
        timestamp: {
          gte: new Date('2023-01-01T00:00:00.000Z'),
          lte: new Date('2023-03-31T00:00:00.000Z'),
        },
      },
    });
  });

  it('GET /api/v1/metrics/dashboard - should retrieve dashboard data', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Mock Prisma metric.findMany to return metrics
    prismaMock.metric.findMany.mockResolvedValue([mockRevenueMetric, mockCustomerSatisfactionMetric]);

    // Mock Prisma metricValue.findMany to return values
    prismaMock.metricValue.findMany.mockResolvedValue(mockMetricValues);

    // Mock Prisma metricThreshold.findMany to return thresholds
    prismaMock.metricThreshold.findMany.mockResolvedValue(mockMetricThresholds);

    // Send GET request to /api/v1/metrics/dashboard with organization ID
    const response = await request(app)
      .get(`/api/v1/metrics/dashboard?organizationId=${mockOrganization.id}`)
      .set('Authorization', `Bearer ${authToken}`);

    // Assert response status is 200 OK
    expect(response.status).toBe(200);

    // Assert response contains dashboard data with metrics, values, and trends
    expect(response.body.data).toBeDefined();
    expect(response.body.data.metrics).toBeDefined();
    expect(response.body.data.timeRange).toBeDefined();
    expect(response.body.data.comparisonType).toBeDefined();

    // Verify Prisma metric.findMany was called with correct organization ID
    expect(prismaMock.metric.findMany).toHaveBeenCalledWith({
      where: { organizationId: mockOrganization.id },
    });
  });

  it('GET /api/v1/metrics/:id/forecast - should retrieve forecast data for a metric', async () => {
    // Create auth token for authenticated request
    const authToken = createAuthToken({ userId: mockUser.id });

    // Mock Prisma metric.findUnique to return mockRevenueMetric
    prismaMock.metric.findUnique.mockResolvedValue(mockRevenueMetric);

    // Mock Prisma metricValue.findMany to return historical values
    prismaMock.metricValue.findMany.mockResolvedValue(mockMetricValues);

    // Send GET request to /api/v1/metrics/:id/forecast
    const response = await request(app)
      .get(`/api/v1/metrics/${mockRevenueMetric.id}/forecast`)
      .set('Authorization', `Bearer ${authToken}`);

    // Assert response status is 200 OK
    expect(response.status).toBe(200);

    // Assert response contains forecast data points
    expect(response.body.data).toBeDefined();
    expect(response.body.data.length).toBeGreaterThan(0);

    // Verify Prisma metricValue.findMany was called with correct metric ID
    expect(prismaMock.metricValue.findMany).toHaveBeenCalledWith({
      where: { metricId: mockRevenueMetric.id },
    });
  });
});