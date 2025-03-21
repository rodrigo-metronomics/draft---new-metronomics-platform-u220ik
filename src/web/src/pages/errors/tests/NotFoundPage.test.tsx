import React from 'react'; // version ^18.2.0
import { screen, waitFor } from '@testing-library/react'; // version ^14.0.0
import userEvent from '@testing-library/user-event'; // version ^14.0.0

import NotFoundPage from '../NotFoundPage'; // Import the NotFoundPage component to be tested
import { renderWithRouter } from '../../../tests/testUtils'; // Utility function to render components with router context for testing
import { ROUTES } from '../../../utils/constants/routes'; // Import route constants to verify navigation functionality

/**
 * Test suite for the NotFoundPage component
 */
describe('NotFoundPage', () => {
  /**
   * Group related tests for the NotFoundPage component
   */

  /**
   * Test that the component renders correctly
   */
  it('renders correctly', () => {
    /**
     * Render the NotFoundPage component using renderWithRouter
     */
    renderWithRouter(<NotFoundPage />, []);

    /**
     * Check that the component is in the document
     */
    expect(screen.getByText('404')).toBeInTheDocument();

    /**
     * Verify that the error code '404' is displayed
     */
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();

    /**
     * Verify that the error title 'Page Not Found' is displayed
     */
    expect(screen.getByText(/The page you are looking for does not exist/i)).toBeInTheDocument();

    /**
     * Verify that an error description is present
     */
    expect(screen.getByRole('button', { name: 'Go to Dashboard' })).toBeInTheDocument();
    /**
     * Verify that the 'Go to Dashboard' button is rendered
     */
  });

  /**
   * Test that clicking the button navigates to the dashboard
   */
  it('navigates to dashboard when button is clicked', async () => {
    /**
     * Set up a mock user event
     */
    const user = userEvent.setup();

    /**
     * Render the NotFoundPage component using renderWithRouter
     */
    const { history } = renderWithRouter(<NotFoundPage />, []);

    /**
     * Find the 'Go to Dashboard' button
     */
    const dashboardButton = screen.getByRole('button', { name: 'Go to Dashboard' });

    /**
     * Simulate a user clicking the button
     */
    await user.click(dashboardButton);

    /**
     * Verify that navigation to the dashboard route occurs
     */
    await waitFor(() => {
      expect(history.location.pathname).toBe(ROUTES.DASHBOARD.HOME);
    });
    /**
     * Wait for any asynchronous operations to complete
     */
  });
});