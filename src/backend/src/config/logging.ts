import winston from 'winston'; // winston v3.8.2
import DailyRotateFile from 'winston-daily-rotate-file'; // winston-daily-rotate-file v4.7.1

/**
 * Determines the appropriate log level based on environment and configuration
 * @returns The log level to use (error, warn, info, debug)
 */
const getLogLevel = (): string => {
  // Use LOG_LEVEL from environment if explicitly set
  if (process.env.LOG_LEVEL) {
    return process.env.LOG_LEVEL;
  }

  // Default log levels based on environment
  switch (process.env.NODE_ENV) {
    case 'production':
      return 'info';
    case 'test':
      return 'error';
    case 'development':
    default:
      return 'debug';
  }
};

/**
 * Configures Winston transports based on environment
 * @returns Array of configured Winston transports
 */
const configureTransports = (): winston.transport[] => {
  const transports: winston.transport[] = [
    // Console transport for all environments
    new winston.transports.Console({
      handleExceptions: true,
    }),
  ];

  // Add file transports in production
  if (process.env.NODE_ENV === 'production') {
    // Error log with daily rotation
    transports.push(
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true,
      })
    );

    // Combined log with daily rotation
    transports.push(
      new DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        zippedArchive: true,
      })
    );
  }

  return transports;
};

/**
 * Configures Winston log format based on environment
 * @returns Winston format configuration
 */
const configureFormat = (): winston.Logform.Format => {
  // Base format with timestamp and structured JSON
  const baseFormat = winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss.SSS',
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  );

  // Enhanced format for development
  if (process.env.NODE_ENV === 'development') {
    return winston.format.combine(
      baseFormat,
      winston.format.colorize({ all: true }),
      winston.format.printf(({ timestamp, level, message, ...rest }) => {
        const meta = Object.keys(rest).length ? JSON.stringify(rest, null, 2) : '';
        return `${timestamp} ${level}: ${message} ${meta}`;
      })
    );
  }

  // Production format - pure JSON for better parsing
  return baseFormat;
};

/**
 * Winston logger configuration
 */
export const loggingConfig = {
  level: getLogLevel(),
  format: configureFormat(),
  transports: configureTransports(),
  exitOnError: false,
  silent: process.env.NODE_ENV === 'test' && process.env.LOG_ENABLED !== 'true',
};

/**
 * Honeycomb configuration for distributed tracing and observability
 */
export const honeycombConfig = {
  serviceName: 'metronomics-platform',
  apiKey: process.env.HONEYCOMB_API_KEY || '',
  dataset: process.env.HONEYCOMB_DATASET || 'metronomics',
  environment: process.env.NODE_ENV || 'development',
  samplingRate: process.env.NODE_ENV === 'production' ? 10 : 1, // Sample 10% in production, 100% in development
  enabled: Boolean(process.env.HONEYCOMB_API_KEY) && process.env.NODE_ENV !== 'test',
};