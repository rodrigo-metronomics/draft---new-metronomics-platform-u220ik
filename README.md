# Metronomics Platform

A responsive web application designed to operationalize Shannon Susko's Metronomics framework for business growth and team alignment. This system addresses the critical challenge many organizations face: effectively balancing strategic planning, execution, and team cohesion within a single integrated platform.

## Key Features

- **Dynamic Meeting Facilitation**: Interactive meeting facilitation tool with guided prompts for daily, weekly, and quarterly meetings
- **Strategic Roadmap Visualization**: Tools to create, visualize, and manage 1HAG, 3HAG, and BHAG strategic goals with milestone timelines
- **Metrics Dashboard**: Visual dashboard displaying key metrics with charts, comparisons, and forecasting tools
- **Key Function Flow Map (KFFM)**: Interactive editor for visualizing departmental ownership and accountability
- **Real-Time Collaboration**: Synchronous updates for all meeting participants
- **Calendar Integration**: Two-way synchronization with Google Calendar and Microsoft Outlook

## Technology Stack

### Frontend
- React 19.x with TypeScript
- React Router 7.x
- React Query 5.x
- PrimeReact 10.x with TypeScript
- PrimeFlex 4.x
- Chart.js 4.x
- Firebase Firestore Client 4.x

### Backend
- Node.js 22.x LTS with TypeScript
- Express.js 4.x
- Prisma 4.x ORM
- PostgreSQL 15.x
- Firebase Admin SDK 4.x
- Redis 7.x

### Infrastructure
- Docker for containerization
- AWS (ECS, RDS, S3, CloudFront)
- Terraform for infrastructure as code
- GitHub Actions for CI/CD

## Project Structure

```
├── src/
│   ├── backend/         # Node.js backend application
│   │   ├── src/         # Source code
│   │   ├── prisma/      # Database schema and migrations
│   │   └── tests/       # Backend tests
│   └── web/             # React frontend application
│       ├── src/         # Source code
│       └── tests/       # Frontend tests
├── infrastructure/      # Infrastructure as code
│   ├── terraform/       # Terraform configurations
│   ├── docker/          # Docker configurations
│   └── scripts/         # Deployment and maintenance scripts
└── .github/             # GitHub workflows and templates
```

## Getting Started

### Prerequisites

- Node.js 22.x LTS
- Docker and Docker Compose
- PostgreSQL 15.x (or Docker container)
- Firebase account
- AWS account (for production deployment)

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/metronomics-platform.git
   cd metronomics-platform
   ```

2. Set up environment variables:
   ```bash
   cp src/backend/.env.example src/backend/.env
   cp src/web/.env.development src/web/.env
   ```
   Edit the `.env` files with your configuration.

3. Start the development environment:
   ```bash
   docker-compose -f infrastructure/docker/docker-compose.yml up
   ```

4. Alternatively, run the services individually:
   
   Backend:
   ```bash
   cd src/backend
   npm install
   npm run dev
   ```

   Frontend:
   ```bash
   cd src/web
   npm install
   npm run dev
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## Testing

### Backend Tests

```bash
cd src/backend
npm test                 # Run all tests
npm run test:unit        # Run unit tests only
npm run test:integration # Run integration tests only
```

### Frontend Tests

```bash
cd src/web
npm test                 # Run all tests
npm run test:unit        # Run unit tests only
npm run test:e2e         # Run end-to-end tests with Cypress
```

## Deployment

### Development Environment

```bash
# Deploy to development environment
cd infrastructure/terraform
terraform init -backend-config=environments/dev/backend.tfvars
terraform apply -var-file=environments/dev/terraform.tfvars
```

### Production Environment

Production deployments are handled through GitHub Actions CI/CD pipeline. Push to the `main` branch will trigger the deployment process.

See `.github/workflows/cd.yml` for deployment configuration details.

## Architecture Overview

The Metronomics Platform employs a multi-tier architecture with a clear separation of concerns:

- **Frontend**: React SPA with PrimeReact components
- **Backend API**: Node.js/Express RESTful API
- **Real-time Layer**: Firebase Firestore for collaborative features
- **Database**: PostgreSQL for persistent storage
- **Caching**: Redis for performance optimization

The system is designed around these key principles:
- Event-driven real-time collaboration
- Domain-driven design
- API-first development
- Responsive progressive web application

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

Please follow our coding standards and include appropriate tests.

## License

This project is licensed under the terms of the license included in the repository.

## Contact

For questions or support, please contact the project maintainers.