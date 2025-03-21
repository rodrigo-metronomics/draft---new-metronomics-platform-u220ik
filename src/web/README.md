# Metronomics Platform Frontend

Frontend web application for the Metronomics Platform - a comprehensive solution for implementing the Metronomics framework for business growth and team alignment.

## Technology Stack

- React 18 with TypeScript
- PrimeReact and PrimeFlex for UI components and responsive layouts
- React Router for client-side routing
- React Query for data fetching and caching
- Firebase for authentication and real-time collaboration
- Chart.js for data visualization
- React DnD for drag-and-drop functionality in the KFFM editor
- Vite for fast development and optimized builds
- Jest and React Testing Library for unit and integration testing
- Cypress for end-to-end testing

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Git

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/organization/metronomics-platform.git
   cd metronomics-platform/src/web
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.development.example .env.development.local
   ```
   Edit `.env.development.local` with your local configuration values.

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at http://localhost:5173 by default.

## Project Structure

```
src/
├── assets/            # Static assets (images, icons, fonts)
├── components/        # Reusable UI components
│   ├── common/        # Generic UI components
│   ├── auth/          # Authentication-related components
│   ├── dashboard/     # Dashboard widgets and components
│   ├── kffm/          # Key Function Flow Map components
│   ├── layout/        # Layout components (header, sidebar, etc.)
│   ├── meetings/      # Meeting-related components
│   ├── metrics/       # Metrics and charts components
│   ├── notifications/ # Notification components
│   ├── strategy/      # Strategic planning components
│   └── users/         # User management components
├── contexts/          # React context providers
├── hooks/             # Custom React hooks
├── layouts/           # Page layout templates
├── pages/             # Page components
│   ├── auth/          # Authentication pages
│   ├── dashboard/     # Dashboard pages
│   ├── errors/        # Error pages
│   ├── kffm/          # KFFM editor and viewer pages
│   ├── meetings/      # Meeting-related pages
│   ├── metrics/       # Metrics dashboard and detail pages
│   ├── organization/  # Organization settings pages
│   ├── strategy/      # Strategic planning pages
│   └── users/         # User management pages
├── routes/            # Routing configuration
├── services/          # API and external service integrations
│   ├── api/           # Backend API client
│   ├── calendar/      # Calendar integration services
│   ├── firebase/      # Firebase services
│   └── realtime/      # Real-time collaboration services
├── styles/            # Global styles and theme configuration
├── types/             # TypeScript type definitions
└── utils/             # Utility functions and constants
    ├── constants/     # Application constants
    └── helpers/       # Helper functions
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check for code issues
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code with Prettier
- `npm run test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run test:e2e` - Run Cypress end-to-end tests
- `npm run test:e2e:open` - Open Cypress test runner
- `npm run clean` - Clean build artifacts and coverage reports

## Testing

The application uses a comprehensive testing strategy:

- **Unit Tests**: Jest and React Testing Library for component and utility testing
- **Integration Tests**: Testing component interactions and API integrations
- **End-to-End Tests**: Cypress for testing complete user flows

### Running Tests

```bash
# Run all unit and integration tests
npm run test

# Run tests in watch mode during development
npm run test:watch

# Generate test coverage report
npm run test:coverage

# Run end-to-end tests
npm run test:e2e

# Open Cypress test runner for interactive testing
npm run test:e2e:open
```

## Building for Production

To build the application for production:

```bash
npm run build
```

The built files will be in the `dist/` directory, ready for deployment.

To preview the production build locally:

```bash
npm run preview
```

## Key Features

- **Dynamic Meeting Moderator**: Interactive meeting facilitation with real-time collaboration
- **Strategic Roadmap Visualization**: Tools for managing 1HAG, 3HAG, and BHAG goals
- **Metrics Dashboard**: Custom metrics tracking with visualizations and comparisons
- **Key Function Flow Map (KFFM)**: Interactive editor for organizational function mapping
- **Real-time Collaboration**: Synchronous updates for all participants
- **Calendar Integration**: Two-way sync with Google Calendar and Microsoft Outlook
- **Role-Based Access Control**: Different permission levels based on user roles

## Code Style and Conventions

The project follows strict coding standards enforced by ESLint and Prettier:

- TypeScript for type safety
- Functional components with React Hooks
- Context API for global state management
- React Query for server state management
- Component-based architecture with clear separation of concerns
- Consistent naming conventions and file organization

To ensure code quality:

```bash
# Check for linting issues
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code with Prettier
npm run format
```

## Browser Compatibility

The application supports the following browsers:

- Chrome 83+
- Firefox 78+
- Safari 14+
- Edge 83+

Mobile browsers:
- iOS Safari
- Android Chrome

## Contributing

1. Create a feature branch from `develop`
2. Implement your changes with appropriate tests
3. Ensure all tests pass and code meets quality standards
4. Submit a pull request with a clear description of the changes

Refer to the project's contribution guidelines for more details.

## Environment Variables

The following environment variables can be configured:

```
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Feature Flags
VITE_ENABLE_CALENDAR_SYNC=true
VITE_ENABLE_NOTIFICATIONS=true
```

## Deployment

The application is configured for deployment to AWS using the CI/CD pipeline defined in `.github/workflows/`.

For manual deployment:

1. Build the application
   ```bash
   npm run build
   ```

2. Deploy the contents of the `dist/` directory to your hosting service

The application is configured as a Progressive Web App (PWA) and can be installed on supported devices.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.