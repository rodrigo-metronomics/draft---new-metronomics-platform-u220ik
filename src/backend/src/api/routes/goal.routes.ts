# src/backend/src/api/routes/goal.routes.ts
```typescript
import express from 'express'; // express v4.18.2
import { authenticate } from '../middlewares/authentication';
import { authorize, authorizeResource, Permission } from '../../utils/constants/permissions';
import { GoalController } from '../../controllers/goal.controller';
import { GoalService } from '../../services/goal/goalService';
import { MilestoneService } from '../../services/goal/milestoneService';
import { validateRequest } from '../middlewares/requestValidator';
import { goalValidation } from '../../utils/validation/goalValidation';

/**
 * Creates and configures an Express router with all goal-related routes
 * @returns Configured Express router with goal routes
 */
export function setupGoalRoutes(): express.Router {
  // 1. Create a new Express router instance
  const router = express.Router();

  // 2. Initialize GoalService and MilestoneService instances
  const goalService = new GoalService();
  const milestoneService = new MilestoneService();

  // 3. Create a GoalController instance with the services
  const goalController = new GoalController(goalService, milestoneService);

  // 4. Return the router from the controller's getRouter method
  return goalController.getRouter();
}

// Create a new Express router instance
const goalRoutes = setupGoalRoutes();

// Export the goal routes for use in the main application
export { goalRoutes };