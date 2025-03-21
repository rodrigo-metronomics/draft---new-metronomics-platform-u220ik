import React from 'react'; // React library for component creation - v18.2.0
import { QueryClient, QueryClientProvider } from 'react-query'; // React Query for data fetching/caching - v5.x
import { PrimeReact } from 'primereact/api'; // PrimeReact component library configuration - v10.x

// Internal imports
import AppRoutes from './routes'; // Main routing component that defines the application's routing structure
import { AuthProvider } from './contexts/AuthContext'; // Authentication context provider for user authentication state
import { ThemeProvider } from './contexts/ThemeContext'; // Theme context provider for application theming
import { NotificationProvider } from './contexts/NotificationContext'; // Notification context provider for handling notifications
import { OrganizationProvider } from './contexts/OrganizationContext'; // Organization context provider for organization management
import { SettingsProvider } from './contexts/SettingsContext'; // Settings context provider for application settings
import { RealtimeProvider } from './contexts/RealtimeContext'; // Realtime context provider for real-time data synchronization
import { MetricsProvider } from './contexts/MetricsContext'; // Metrics context provider for metrics management
import GlobalStyles from './styles/GlobalStyles'; // Global CSS styles for the application

// Define a global QueryClient instance for React Query
const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60 * 1000, retry: 1, refetchOnWindowFocus: false } } });

/**
 * Root component of the application that sets up providers and routing
 *
 * @returns {JSX.Element} The rendered application with all providers and routes
 */
const App: React.FC = () => {
  // LD1: Configure PrimeReact with ripple effect enabled
  PrimeReact.ripple = true;

  // LD1: Return the component tree with nested context providers
  return (
    // LD1: QueryClientProvider as the outermost provider for React Query
    <QueryClientProvider client={queryClient}>
      {/* LD1: SettingsProvider for application settings */}
      <SettingsProvider>
        {/* LD1: AuthProvider for user authentication */}
        <AuthProvider>
          {/* LD1: OrganizationProvider for organization management */}
          <OrganizationProvider>
            {/* LD1: ThemeProvider for application theming */}
            <ThemeProvider>
              {/* LD1: RealtimeProvider for real-time data synchronization */}
              <RealtimeProvider>
                {/* LD1: NotificationProvider for handling notifications */}
                <NotificationProvider>
                  {/* LD1: MetricsProvider for metrics management */}
                  <MetricsProvider>
                    {/* LD1: Include GlobalStyles component for application-wide styling */}
                    <GlobalStyles />
                    {/* LD1: Render AppRoutes component for application routing */}
                    <AppRoutes />
                  </MetricsProvider>
                </NotificationProvider>
              </RealtimeProvider>
            </ThemeProvider>
          </OrganizationProvider>
        </AuthProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
};

// LD1: Default export of the App component for use as the application entry point
export default App;