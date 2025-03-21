# src/backend/src/api/routes/meeting.routes.ts
```typescript
import express from 'express'; // express v4.18.2
import { authenticate } from '../middlewares/authentication';
import { authorize } from '../middlewares/authorization';
import { validateBody, validateParams, validateQuery } from '../middlewares/requestValidator';
import { Permission } from '../../utils/constants/permissions';
import {
  createMeetingSchema,
  updateMeetingSchema,
  meetingFiltersSchema,
  addParticipantSchema,
  updateParticipantSchema
} from '../../utils/validation/meetingValidation';
import { meetingController } from '../../controllers/meeting.controller';
import { logger } from '../../utils/helpers/logger';

const meetingRouter = express.Router();

/**
 * Configures and returns the Express router with all meeting-related routes
 * @returns Configured Express router with meeting routes
 */
const setupMeetingRoutes = () => {
  // 1. Create a new Express router instance
  logger.info('Setting up meeting routes');
  const router = express.Router();

  // 2. Apply authentication middleware to all routes
  router.use(authenticate);

  // 3. Define routes for listing meetings with filters
  router.get('/', validateQuery(meetingFiltersSchema), meetingController.getMeetings);

  // 4. Define routes for upcoming and active meetings
  router.get('/upcoming', meetingController.getUpcomingMeetings);
  router.get('/active', meetingController.getActiveMeetings);

  // 5. Define routes for user's meetings
  router.get('/user/:userId', meetingController.getUserMeetings);

  // 6. Define routes for getting meeting details
  router.get('/:id', validateParams(meetingFiltersSchema), meetingController.getMeetingById);
  router.get('/:id/participants', meetingController.getMeetingWithParticipants);
  router.get('/:id/stages', meetingController.getMeetingStages);
  router.get('/:id/current-stage', meetingController.getCurrentStage);
  router.get('/:id/progress', meetingController.getStageProgress);
  router.get('/:id/action-items', meetingController.getMeetingActionItems);
  router.get('/:id/active-participants', meetingController.getActiveMeetingParticipants);

  // 7. Define routes for meeting summary
  router.get('/:id/summary', meetingController.getMeetingSummary);

  // 8. Define routes for creating and updating meetings
  router.post('/', authorize(Permission.CREATE_MEETING), validateBody(createMeetingSchema), meetingController.createMeeting);
  router.put('/:id', authorize(Permission.UPDATE_MEETING), validateParams(meetingFiltersSchema), validateBody(updateMeetingSchema), meetingController.updateMeeting);

  // 9. Define routes for meeting lifecycle management (start, complete, cancel)
  router.post('/:id/start', authorize(Permission.MODERATE_MEETING), validateParams(meetingFiltersSchema), meetingController.startMeeting);
  router.post('/:id/complete', authorize(Permission.MODERATE_MEETING), validateParams(meetingFiltersSchema), meetingController.completeMeeting);
  router.delete('/:id', authorize(Permission.DELETE_MEETING), validateParams(meetingFiltersSchema), meetingController.cancelMeeting);

  // 10. Define routes for participant management
  router.post('/:id/participants', authorize(Permission.MANAGE_MEETING_PARTICIPANTS), validateParams(meetingFiltersSchema), validateBody(addParticipantSchema), meetingController.addParticipant);
  router.put('/:id/participants/:participantId', authorize(Permission.MANAGE_MEETING_PARTICIPANTS), validateParams(meetingFiltersSchema), validateBody(updateParticipantSchema), meetingController.updateParticipant);
  router.delete('/:id/participants/:participantId', authorize(Permission.MANAGE_MEETING_PARTICIPANTS), validateParams(meetingFiltersSchema), meetingController.removeParticipant);

  // 11. Define routes for meeting stage navigation
  router.post('/:id/stages/next', authorize(Permission.MODERATE_MEETING), validateParams(meetingFiltersSchema), meetingController.moveToNextStage);
  router.post('/:id/stages/previous', authorize(Permission.MODERATE_MEETING), validateParams(meetingFiltersSchema), meetingController.moveToPreviousStage);
  router.post('/:id/stages/:stageId/jump', authorize(Permission.MODERATE_MEETING), validateParams(meetingFiltersSchema), meetingController.jumpToStage);

  // 12. Define routes for action item creation
  router.post('/:id/action-items', authorize(Permission.CREATE_ACTION_ITEM), validateParams(meetingFiltersSchema), meetingController.createActionItem);

  // 13. Define routes for calendar synchronization
  router.post('/:id/sync-calendar', authorize(Permission.UPDATE_MEETING), validateParams(meetingFiltersSchema), meetingController.syncWithCalendar);

  // 14. Log successful router initialization
  logger.info('Meeting routes setup complete');

  // 15. Return the configured router
  return router;
};

// Export the setupMeetingRoutes function as the default export
export default setupMeetingRoutes();