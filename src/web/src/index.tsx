import React from 'react'; // React library for component creation - v18.2.0
import ReactDOM from 'react-dom/client'; // React DOM client for rendering to the browser - v18.2.0
import App from './App'; // Main application component
import ErrorBoundary from './components/common/ErrorBoundary'; // Component to handle React rendering errors

/**
 * Optional function to report web vitals metrics for performance monitoring
 * @param {Object} metric - Web vitals metric object
 */
const reportWebVitals = (metric: any): void => {
  // Check if the environment is production
  if (process.env.NODE_ENV === 'production') {
    // If in production, send metrics to monitoring service (Honeycomb)
    // LD2: Honeycomb SDK is not implemented in this file
    // Honeycomb.addEvent({
    //   metricName: metric.name,
    //   metricValue: metric.value,
    //   metricDelta: metric.delta,
    //   metricId: metric.id,
    //   metricType: metric.type,
    // });
  } else {
    // Otherwise, log metrics to console in development mode
    console.log(metric);
  }
};

// Create root element using ReactDOM.createRoot with the DOM element with id 'root'
const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

// Render the App component wrapped in ErrorBoundary within React.StrictMode
root.render(
  <React.StrictMode>
    {/* LD1: ErrorBoundary component to catch and handle React rendering errors */}
    <ErrorBoundary>
      {/* LD1: App component as the root of the application */}
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Set up service worker registration for PWA capabilities if in production
if (process.env.NODE_ENV === 'production') {
  // LD2: Service worker registration is not implemented in this file
  // navigator.serviceWorker.register('/service-worker.js');
}

// Initialize web vitals reporting
// LD2: Web vitals reporting is not fully implemented in this file
// reportWebVitals(console.log);