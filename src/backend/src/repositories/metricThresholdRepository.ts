import { Prisma } from '@prisma/client'; // ^4.15.0
import { BaseRepository } from './baseRepository';
import { prisma } from '../config/database';
import { 
  MetricThreshold, 
  CreateMetricThresholdDto, 
  UpdateMetricThresholdDto,
  ThresholdType
} from '../types/metric.types';
import { logger } from '../utils/helpers/logger';
import { ValidationError } from '../utils/errors';

/**
 * Repository class for metric threshold data access operations in the Metronomics Platform.
 * Extends the BaseRepository to provide specialized methods for retrieving, creating,
 * updating, and deleting metric thresholds, as well as managing relationships with metrics.
 */
export class MetricThresholdRepository extends BaseRepository<MetricThreshold> {
  /**
   * Initializes the metric threshold repository with the MetricThreshold model
   */
  constructor() {
    super('metricThreshold');
  }

  /**
   * Finds all thresholds for a specific metric
   * 
   * @param metricId - The ID of the metric to find thresholds for
   * @returns Array of thresholds for the metric
   * @throws ValidationError if metricId is invalid
   */
  async findByMetricId(metricId: string): Promise<MetricThreshold[]> {
    try {
      if (!metricId) {
        throw ValidationError.requiredField('metricId');
      }

      logger.debug(`MetricThresholdRepository.findByMetricId`, { metricId });

      const thresholds = await this.findMany({ metricId }, { page: 1, limit: 100, offset: 0 }, {});
      return thresholds.data;
    } catch (error) {
      logger.error(`Error in MetricThresholdRepository.findByMetricId`, { metricId, error });
      throw error;
    }
  }

  /**
   * Finds a threshold for a specific metric and threshold type
   * 
   * @param metricId - The ID of the metric to find the threshold for
   * @param thresholdType - The type of threshold to find
   * @returns The threshold or null if not found
   * @throws ValidationError if metricId or thresholdType is invalid
   */
  async findByMetricIdAndType(metricId: string, thresholdType: ThresholdType): Promise<MetricThreshold | null> {
    try {
      if (!metricId) {
        throw ValidationError.requiredField('metricId');
      }

      if (!thresholdType) {
        throw ValidationError.requiredField('thresholdType');
      }

      logger.debug(`MetricThresholdRepository.findByMetricIdAndType`, { metricId, thresholdType });

      return await this.findFirst({ metricId, type: thresholdType });
    } catch (error) {
      logger.error(`Error in MetricThresholdRepository.findByMetricIdAndType`, { metricId, thresholdType, error });
      throw error;
    }
  }

  /**
   * Creates a new threshold for a specific metric
   * 
   * @param metricId - The ID of the metric to create a threshold for
   * @param thresholdData - The threshold data to create
   * @returns The created threshold
   * @throws ValidationError if metricId is invalid or a threshold of the same type already exists
   */
  async createForMetric(metricId: string, thresholdData: CreateMetricThresholdDto): Promise<MetricThreshold> {
    try {
      if (!metricId) {
        throw ValidationError.requiredField('metricId');
      }

      if (!thresholdData || !thresholdData.type || typeof thresholdData.value !== 'number') {
        throw ValidationError.requiredField('thresholdData');
      }

      logger.debug(`MetricThresholdRepository.createForMetric`, { metricId, thresholdData });

      // Check if a threshold of the same type already exists for this metric
      const existingThreshold = await this.findByMetricIdAndType(metricId, thresholdData.type);
      if (existingThreshold) {
        throw new ValidationError(
          `A threshold of type ${thresholdData.type} already exists for metric ${metricId}`, 
          { thresholdId: existingThreshold.id }
        );
      }

      // Create the threshold
      return await this.create({
        ...thresholdData,
        metricId
      });
    } catch (error) {
      logger.error(`Error in MetricThresholdRepository.createForMetric`, { metricId, thresholdData, error });
      throw error;
    }
  }

  /**
   * Updates an existing threshold for a specific metric
   * 
   * @param thresholdId - The ID of the threshold to update
   * @param metricId - The ID of the metric the threshold belongs to
   * @param thresholdData - The threshold data to update
   * @returns The updated threshold
   * @throws ValidationError if thresholdId or metricId is invalid or the threshold doesn't belong to the metric
   */
  async updateForMetric(
    thresholdId: string, 
    metricId: string, 
    thresholdData: UpdateMetricThresholdDto
  ): Promise<MetricThreshold> {
    try {
      if (!thresholdId) {
        throw ValidationError.requiredField('thresholdId');
      }

      if (!metricId) {
        throw ValidationError.requiredField('metricId');
      }

      if (!thresholdData || (typeof thresholdData.value !== 'number' && !thresholdData.color)) {
        throw ValidationError.requiredField('thresholdData');
      }

      logger.debug(`MetricThresholdRepository.updateForMetric`, { thresholdId, metricId, thresholdData });

      // Verify the threshold belongs to the specified metric
      const threshold = await this.findByIdOrThrow(thresholdId);
      if (threshold.metricId !== metricId) {
        throw new ValidationError(
          `Threshold ${thresholdId} does not belong to metric ${metricId}`,
          { thresholdMetricId: threshold.metricId }
        );
      }

      // Update the threshold
      return await this.update(thresholdId, thresholdData);
    } catch (error) {
      logger.error(`Error in MetricThresholdRepository.updateForMetric`, { thresholdId, metricId, thresholdData, error });
      throw error;
    }
  }

  /**
   * Deletes a threshold for a specific metric
   * 
   * @param thresholdId - The ID of the threshold to delete
   * @param metricId - The ID of the metric the threshold belongs to
   * @returns The deleted threshold
   * @throws ValidationError if thresholdId or metricId is invalid or the threshold doesn't belong to the metric
   */
  async deleteForMetric(thresholdId: string, metricId: string): Promise<MetricThreshold> {
    try {
      if (!thresholdId) {
        throw ValidationError.requiredField('thresholdId');
      }

      if (!metricId) {
        throw ValidationError.requiredField('metricId');
      }

      logger.debug(`MetricThresholdRepository.deleteForMetric`, { thresholdId, metricId });

      // Verify the threshold belongs to the specified metric
      const threshold = await this.findByIdOrThrow(thresholdId);
      if (threshold.metricId !== metricId) {
        throw new ValidationError(
          `Threshold ${thresholdId} does not belong to metric ${metricId}`,
          { thresholdMetricId: threshold.metricId }
        );
      }

      // Delete the threshold
      return await this.delete(thresholdId);
    } catch (error) {
      logger.error(`Error in MetricThresholdRepository.deleteForMetric`, { thresholdId, metricId, error });
      throw error;
    }
  }

  /**
   * Creates multiple thresholds for a specific metric
   * 
   * @param metricId - The ID of the metric to create thresholds for
   * @param thresholdsData - Array of threshold data to create
   * @returns Array of created thresholds
   * @throws ValidationError if metricId is invalid or if thresholds of the same types already exist
   */
  async bulkCreateForMetric(
    metricId: string, 
    thresholdsData: CreateMetricThresholdDto[]
  ): Promise<MetricThreshold[]> {
    try {
      if (!metricId) {
        throw ValidationError.requiredField('metricId');
      }

      if (!thresholdsData || !Array.isArray(thresholdsData) || thresholdsData.length === 0) {
        throw ValidationError.requiredField('thresholdsData');
      }

      logger.debug(`MetricThresholdRepository.bulkCreateForMetric`, { 
        metricId, 
        thresholdCount: thresholdsData.length 
      });

      // Check for duplicate threshold types in the input array
      const thresholdTypes = thresholdsData.map(t => t.type);
      const uniqueTypes = new Set(thresholdTypes);
      if (uniqueTypes.size !== thresholdTypes.length) {
        throw new ValidationError('Duplicate threshold types in input array');
      }

      // Use a transaction to ensure all thresholds are created or none
      return await this.transaction(async (tx) => {
        // Check if any thresholds of these types already exist for this metric
        const existingThresholds = await tx.metricThreshold.findMany({
          where: {
            metricId,
            type: { in: thresholdTypes }
          }
        });

        if (existingThresholds.length > 0) {
          throw new ValidationError(
            `Thresholds already exist for some types for metric ${metricId}`,
            { 
              existingTypes: existingThresholds.map(t => t.type),
              metricId 
            }
          );
        }

        // Create all thresholds
        const createdThresholds = await Promise.all(
          thresholdsData.map(data => 
            tx.metricThreshold.create({
              data: {
                ...data,
                metricId
              }
            })
          )
        );

        return createdThresholds;
      });
    } catch (error) {
      logger.error(`Error in MetricThresholdRepository.bulkCreateForMetric`, { 
        metricId, 
        thresholdCount: thresholdsData?.length, 
        error 
      });
      throw error;
    }
  }

  /**
   * Deletes all thresholds for a specific metric
   * 
   * @param metricId - The ID of the metric to delete thresholds for
   * @returns The number of deleted thresholds
   * @throws ValidationError if metricId is invalid
   */
  async deleteAllForMetric(metricId: string): Promise<number> {
    try {
      if (!metricId) {
        throw ValidationError.requiredField('metricId');
      }

      logger.debug(`MetricThresholdRepository.deleteAllForMetric`, { metricId });

      // Delete all thresholds for the metric
      const result = await this.model.deleteMany({
        where: { metricId }
      });

      return result.count;
    } catch (error) {
      logger.error(`Error in MetricThresholdRepository.deleteAllForMetric`, { metricId, error });
      throw error;
    }
  }

  /**
   * Checks if a metric value crosses any thresholds
   * 
   * @param metricId - The ID of the metric to check thresholds for
   * @param value - The value to check against thresholds
   * @returns Array of threshold crossing information
   * @throws ValidationError if metricId or value is invalid
   */
  async checkThresholdCrossing(
    metricId: string, 
    value: number
  ): Promise<{ thresholdId: string; type: ThresholdType; value: number; crossed: boolean }[]> {
    try {
      if (!metricId) {
        throw ValidationError.requiredField('metricId');
      }

      if (typeof value !== 'number') {
        throw ValidationError.requiredField('value');
      }

      logger.debug(`MetricThresholdRepository.checkThresholdCrossing`, { metricId, value });

      // Get all thresholds for the metric
      const thresholds = await this.findByMetricId(metricId);

      // Check each threshold to see if the value crosses it
      return thresholds.map(threshold => {
        let crossed = false;

        // Determine if the threshold is crossed based on the threshold type
        // For TARGET, we want to know if we've met or exceeded the target
        // For WARNING and CRITICAL, we want to know if we've exceeded the threshold
        switch (threshold.type) {
          case ThresholdType.TARGET:
            crossed = value >= threshold.value;
            break;
          case ThresholdType.WARNING:
          case ThresholdType.CRITICAL:
            crossed = value >= threshold.value;
            break;
          default:
            crossed = false;
        }

        return {
          thresholdId: threshold.id,
          type: threshold.type,
          value: threshold.value,
          crossed
        };
      });
    } catch (error) {
      logger.error(`Error in MetricThresholdRepository.checkThresholdCrossing`, { metricId, value, error });
      throw error;
    }
  }
}