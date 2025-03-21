# Metronomics Platform Backend

Backend service for the Metronomics Platform - a comprehensive web application for strategic planning, execution tracking, and team alignment based on Shannon Susko's Metronomics framework.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Testing](#testing)
- [Deployment](#deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Overview

The Metronomics Platform backend is built with Node.js and TypeScript, providing a robust API for the frontend application. It implements the business logic for managing strategic planning, meeting facilitation, metrics tracking, and team alignment features of the Metronomics framework.

## Architecture

### Core Technologies

- **Node.js**: Runtime environment
- **TypeScript**: Programming language
- **Express**: Web framework
- **Prisma**: ORM for database access
- **Firebase**: Authentication and real-time features
- **Redis**: Caching and session management

### Key Components

- **API Layer**: RESTful endpoints for all platform functionality
- **Service Layer**: Business logic implementation
- **Repository Layer**: Data access through Prisma ORM
- **Real-time Services**: Firebase integration for collaborative features
- **Background Workers**: Scheduled jobs and asynchronous processing

### Directory Structure

```
src/
├── api/                # API routes and middleware
│   ├── middlewares/    # Express middleware
│   └── routes/         # API route definitions
├── config/             # Configuration management
├── controllers/        # Request handlers
├── jobs/               # Scheduled jobs
├── repositories/       # Data access layer
├── services/           # Business logic
│   ├── auth/           # Authentication services
│   ├── calendar/       # Calendar integration
│   ├── goal/           # Strategic goal management
│   ├── kffm/           # Key Function Flow Map
│   ├── meeting/        # Meeting management
│   ├── metric/         # Metrics and analytics
│   ├── notification/   # Notification delivery
│   ├── organization/   # Organization management
│   ├── realtime/       # Real-time collaboration
│   └── user/           # User management
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
│   ├── constants/      # Constant values
│   ├── errors/         # Error handling
│   ├── helpers/        # Helper functions
│   └── validation/     # Input validation
├── workers/            # Background workers
├── app.ts              # Express application setup
└── server.ts           # Server entry point
```

## Getting Started

### Prerequisites

- Node.js (v18.0.0 or higher)
- npm (v8.0.0 or higher)
- PostgreSQL (v15.x)
- Redis (v7.x)
- Firebase project with Authentication and Firestore enabled

### Environment Setup

1. Clone the repository
2. Navigate to the backend directory: `cd src/backend`
3. Copy the example environment file: `cp .env.example .env`
4. Update the `.env` file with your configuration values
5. Install dependencies: `npm install`

### Environment Variables

```
# Application
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/metronomics

# Redis
REDIS_URL=redis://localhost:6379

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=1h

# External APIs
GOOGLE_CALENDAR_API_KEY=your-google-api-key
MICROSOFT_GRAPH_CLIENT_ID=your-microsoft-client-id
MICROSOFT_GRAPH_CLIENT_SECRET=your-microsoft-client-secret

# Logging
LOG_LEVEL=info
```

### Database Setup

1. Create a PostgreSQL database for the application
2. Run database migrations: `npm run prisma:migrate`
3. Seed the database with initial data: `npm run seed`
4. (Optional) Explore the database schema: `npm run prisma:studio`

## Development Workflow

### Starting the Development Server

```bash
npm run dev
```

This will start the server in development mode with hot reloading enabled.

### Building for Production

```bash
npm run build
```

This will compile TypeScript to JavaScript in the `dist` directory.

### Running in Production Mode

```bash
npm start
```

### Code Quality

- **Linting**: `npm run lint`
- **Formatting**: `npm run format`
- **Type Checking**: Automatically performed during build and development

### Database Management

- **Generate Prisma Client**: `npm run prisma:generate`
- **Create Migration**: `npm run prisma:migrate`
- **Deploy Migrations**: `npm run prisma:deploy`
- **Explore Database**: `npm run prisma:studio`

## API Documentation

The Metronomics Platform API follows RESTful principles with resource-oriented endpoints.

### Authentication

- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/refresh` - Refresh authentication token
- `POST /api/auth/logout` - Logout user

### Users

- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Organizations

- `GET /api/organizations` - List organizations
- `POST /api/organizations` - Create organization
- `GET /api/organizations/:id` - Get organization details
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization

### Teams

- `GET /api/organizations/:id/teams` - List teams
- `POST /api/organizations/:id/teams` - Create team
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/members` - Add team member

### Meetings

- `GET /api/meetings` - List meetings
- `POST /api/meetings` - Create meeting
- `GET /api/meetings/:id` - Get meeting details
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting
- `GET /api/meetings/:id/participants` - List meeting participants
- `POST /api/meetings/:id/participants` - Add meeting participant
- `GET /api/meetings/:id/action-items` - List meeting action items
- `POST /api/meetings/:id/action-items` - Create action item

### Goals

- `GET /api/goals` - List goals
- `POST /api/goals` - Create goal
- `GET /api/goals/:id` - Get goal details
- `PUT /api/goals/:id` - Update goal
- `DELETE /api/goals/:id` - Delete goal
- `GET /api/goals/:id/milestones` - List goal milestones
- `POST /api/goals/:id/milestones` - Create milestone

### Metrics

- `GET /api/metrics` - List metrics
- `POST /api/metrics` - Create metric
- `GET /api/metrics/:id` - Get metric details
- `PUT /api/metrics/:id` - Update metric
- `DELETE /api/metrics/:id` - Delete metric
- `GET /api/metrics/:id/values` - List metric values
- `POST /api/metrics/:id/values` - Record metric value

### KFFM (Key Function Flow Map)

- `GET /api/kffm` - List KFFMs
- `POST /api/kffm` - Create KFFM
- `GET /api/kffm/:id` - Get KFFM details
- `PUT /api/kffm/:id` - Update KFFM
- `DELETE /api/kffm/:id` - Delete KFFM
- `GET /api/kffm/:id/nodes` - List KFFM nodes
- `POST /api/kffm/:id/nodes` - Create KFFM node

### Authentication and Authorization

All API endpoints (except authentication endpoints) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Access to resources is controlled by role-based permissions:

- **Coach**: Access to multiple organizations
- **CEO**: Full access to own organization
- **Leadership**: Department/team scope access
- **Team Member**: Personal + team scope access
- **Viewer**: Read-only access to configured resources

## Database

The Metronomics Platform uses PostgreSQL with Prisma ORM for data persistence.

### Key Models

- **User**: User accounts with authentication details
- **Organization**: Multi-tenant organization structure
- **Team**: Teams within organizations
- **Meeting**: Meeting records with stages and participants
- **Goal**: Strategic goals (BHAG, 3HAG, 1HAG, Quarterly)
- **Metric**: Performance indicators with historical values
- **KFFM**: Key Function Flow Maps for organizational structure

### Schema Management

The database schema is defined in `prisma/schema.prisma` and managed through Prisma migrations.

### Data Relationships

The schema implements complex relationships between entities:

- Organizations have many users, teams, meetings, goals, and metrics
- Users belong to organizations and teams
- Meetings have participants, stages, and action items
- Goals have milestones and linked metrics
- KFFM has nodes and connections between nodes

### Multi-tenancy

The database schema is designed for multi-tenant isolation, with organization IDs used to partition data across all relevant tables.

## Testing

### Test Structure

Tests are organized in the `tests` directory:

```
tests/
├── fixtures/       # Test data
├── mocks/          # Mock implementations
├── unit/           # Unit tests
│   └── services/   # Service tests
├── integration/    # Integration tests
└── setup.ts        # Test setup
```

### Running Tests

- **All Tests**: `npm test`
- **Watch Mode**: `npm run test:watch`
- **Coverage Report**: `npm run test:coverage`
- **Integration Tests**: `npm run test:integration`

### Test Utilities

- **Fixtures**: Predefined test data in `tests/fixtures`
- **Mocks**: Mock implementations for external services in `tests/mocks`
- **Test Database**: Tests use an in-memory database or test container

### Continuous Integration

Tests are automatically run in the CI pipeline for all pull requests and merges to the main branch.

## Deployment

### Containerization

The backend is containerized using Docker. The Dockerfile is located in `infrastructure/docker/Dockerfile.backend`.

### Deployment Environments

- **Development**: For ongoing development work
- **Staging**: For pre-production testing
- **Production**: Live environment

### Deployment Process

1. Build the Docker image
2. Run database migrations
3. Deploy the container to the target environment
4. Verify deployment with health checks

### Infrastructure

The backend is deployed on AWS ECS with the following components:

- **ECS Service**: Container orchestration
- **RDS PostgreSQL**: Database
- **ElastiCache Redis**: Caching and session storage
- **Application Load Balancer**: Request routing
- **CloudWatch**: Monitoring and logging

## Monitoring

### Logging

The application uses Winston for structured logging. Logs are sent to:

- Console (development)
- CloudWatch (production)

Log levels are configurable through the `LOG_LEVEL` environment variable.

### Metrics

Application metrics are collected and monitored through:

- **Honeycomb**: Distributed tracing and observability
- **CloudWatch**: Infrastructure metrics

### Health Checks

The application exposes health check endpoints:

- `GET /health` - Basic liveness check
- `GET /health/ready` - Readiness check including dependencies

### Alerts

Alerts are configured for critical conditions:

- High error rates
- Elevated response times
- Database connection issues
- Memory/CPU utilization thresholds

## Troubleshooting

### Common Issues

#### Database Connection Errors

- Verify database credentials in `.env`
- Check network connectivity to the database
- Ensure database migrations are up to date

#### Authentication Issues

- Verify Firebase configuration
- Check JWT secret and expiration settings
- Ensure user has appropriate permissions

#### Performance Problems

- Check database query performance
- Monitor Redis cache hit rates
- Review API endpoint response times

### Debugging

- Set `LOG_LEVEL=debug` for detailed logging
- Use the `--inspect` flag with Node.js for debugging
- Check application logs for error details

### Support

For additional support, contact the development team or refer to the internal documentation.