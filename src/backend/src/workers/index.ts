# src/backend/src/workers/index.ts
```typescript
import { MetricCalculationWorker, processMetricCalculation, processBatchMetricCalculations, findDerivedMetrics, scheduleMetricCalculations } from './metricCalculationWorker';
import { NotificationWorker } from './notificationWorker';
import { CalendarSyncWorker, processSyncJob, processBatchSyncJobs, findMeetingsNeedingSync } from './syncCalendarWorker';

/**
 * Index file that exports all background worker classes and functions for the Metronomics Platform.
 * This file serves as the central export point for workers handling metric calculations, notifications, and calendar synchronization.
 */

export {
  MetricCalculationWorker,
  processMetricCalculation,
  processBatchMetricCalculations,
  findDerivedMetrics,
  scheduleMetricCalculations,
  NotificationWorker,
  CalendarSyncWorker,
  processSyncJob,
  processBatchSyncJobs,
  findMeetingsNeedingSync
};