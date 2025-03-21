import React from 'react'; // React library for component creation // v18.2.0
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'; // React Router components for defining routes // v6.10.0

import ProtectedRoute from './ProtectedRoute'; // Route wrapper that restricts access to authenticated users
import RoleBasedRoute from './RoleBasedRoute'; // Route wrapper that restricts access based on user roles
import DashboardLayout from '../layouts/DashboardLayout'; // Layout component for dashboard pages
import MeetingLayout from '../layouts/MeetingLayout'; // Layout component for meeting pages

import DashboardPage from '../pages/dashboard/DashboardPage'; // Main dashboard page component
import MeetingListPage from '../pages/meetings/MeetingListPage'; // Page for listing meetings
import NewMeetingPage from '../pages/meetings/NewMeetingPage'; // Page for creating new meetings
import MeetingDetailPage from '../pages/meetings/MeetingDetailPage'; // Page for viewing meeting details
import MeetingModeratorPage from '../pages/meetings/MeetingModeratorPage'; // Page for moderating meetings

import StrategicRoadmapPage from '../pages/strategy/StrategicRoadmapPage'; // Page for strategic roadmap visualization
import OnePagePlanPage from '../pages/strategy/OnePagePlanPage'; // Page for one-page plan view
import StrategicGoalDetailPage from '../pages/strategy/StrategicGoalDetailPage'; // Page for viewing strategic goal details
import StrategicGoalEditPage from '../pages/strategy/StrategicGoalEditPage'; // Page for editing strategic goals

import MetricsDashboardPage from '../pages/metrics/MetricsDashboardPage'; // Page for metrics dashboard
import MetricDetailPage from '../pages/metrics/MetricDetailPage'; // Page for viewing metric details
import NewMetricPage from '../pages/metrics/NewMetricPage'; // Page for creating new metrics
import SharedDashboardPage from '../pages/metrics/SharedDashboardPage'; // Page for shared metrics dashboards

import KFFMViewPage from '../pages/kffm/KFFMViewPage'; // Page for viewing KFFM
import KFFMEditorPage from '../pages/kffm/KFFMEditorPage'; // Page for editing KFFM

import UserListPage from '../pages/users/UserListPage'; // Page for listing users
import UserDetailPage from '../pages/users/UserDetailPage'; // Page for viewing user details
import UserProfilePage from '../pages/users/UserProfilePage'; // Page for viewing and editing user profile

import TeamListPage from '../pages/organization/TeamListPage'; // Page for listing teams
import TeamDetailsPage from '../pages/organization/TeamDetailsPage'; // Page for viewing team details
import OrganizationSettingsPage from '../pages/organization/OrganizationSettingsPage'; // Page for organization settings

import AccessDeniedPage from '../pages/errors/AccessDeniedPage'; // Error page for access denied
import ServerErrorPage from '../pages/errors/ServerErrorPage'; // Error page for server errors

import { ROUTES } from '../utils/constants/routes'; // Route constants for defining paths
import { UserRole } from '../utils/constants/roles'; // User role constants for role-based access control

/**
 * Component that defines all protected routes for the application
 * @returns Routes component containing all protected application routes
 */
const DashboardRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Wrap all routes with ProtectedRoute to ensure authentication */}
      <Route element={<ProtectedRoute />}>
        {/* Define route for dashboard home page */}
        <Route path={ROUTES.DASHBOARD.HOME} element={<DashboardPage />} />

        {/* Define routes for meetings (list, new, detail, moderator) */}
        <Route path={ROUTES.MEETINGS.ROOT} element={<MeetingLayout />} >
          <Route index element={<MeetingListPage />} />
          <Route path={ROUTES.MEETINGS.NEW} element={<NewMeetingPage />} />
          <Route path={ROUTES.MEETINGS.DETAIL} element={<MeetingDetailPage />} />
          <Route path={ROUTES.MEETINGS.MODERATOR} element={<MeetingModeratorPage />} />
        </Route>

        {/* Define routes for strategy (roadmap, one-page plan, goal detail, goal edit) */}
        <Route path={ROUTES.STRATEGY.ROOT} element={<DashboardLayout />}>
          <Route index element={<Navigate to={ROUTES.STRATEGY.ROADMAP} replace />} />
          <Route path={ROUTES.STRATEGY.ROADMAP} element={<StrategicRoadmapPage />} />
          <Route path={ROUTES.STRATEGY.ONE_PAGE_PLAN} element={<OnePagePlanPage />} />
          <Route path={ROUTES.STRATEGY.GOAL_DETAIL} element={<StrategicGoalDetailPage />} />
          <Route path={ROUTES.STRATEGY.GOAL_EDIT} element={<StrategicGoalEditPage />} />
        </Route>

        {/* Define routes for metrics (dashboard, detail, new, shared) */}
        <Route path={ROUTES.METRICS.ROOT} element={<DashboardLayout />}>
          <Route index element={<Navigate to={ROUTES.METRICS.DASHBOARD} replace />} />
          <Route path={ROUTES.METRICS.DASHBOARD} element={<MetricsDashboardPage />} />
          <Route path={ROUTES.METRICS.DETAIL} element={<MetricDetailPage />} />
          <Route path={ROUTES.METRICS.NEW} element={<NewMetricPage />} />
          <Route path={ROUTES.METRICS.SHARED} element={<SharedDashboardPage />} />
        </Route>

        {/* Define routes for KFFM (view, edit) */}
        <Route path={ROUTES.KFFM.ROOT} element={<DashboardLayout />}>
          <Route index element={<Navigate to={ROUTES.KFFM.VIEW} replace />} />
          <Route path={ROUTES.KFFM.VIEW} element={<KFFMViewPage />} />
          <Route path={ROUTES.KFFM.EDIT} element={<KFFMEditorPage />} />
        </Route>

        {/* Define routes for users (list, detail, profile) */}
        <Route path={ROUTES.USERS.ROOT} element={<DashboardLayout />}>
          <Route index element={<Navigate to={ROUTES.USERS.LIST} replace />} />
          <Route path={ROUTES.USERS.LIST} element={<RoleBasedRoute requiredRole={UserRole.LEADERSHIP}><UserListPage /></RoleBasedRoute>} />
          <Route path={ROUTES.USERS.DETAIL} element={<RoleBasedRoute requiredRole={UserRole.LEADERSHIP}><UserDetailPage /></RoleBasedRoute>} />
          <Route path={ROUTES.USERS.PROFILE} element={<UserProfilePage />} />
        </Route>

        {/* Define routes for organization (teams, team details, settings) */}
        <Route path={ROUTES.ORGANIZATION.ROOT} element={<DashboardLayout />}>
          <Route index element={<Navigate to={ROUTES.ORGANIZATION.SETTINGS} replace />} />
          <Route path={ROUTES.ORGANIZATION.SETTINGS} element={<RoleBasedRoute requiredRole={UserRole.CEO}><OrganizationSettingsPage /></RoleBasedRoute>} />
          <Route path={ROUTES.ORGANIZATION.TEAMS} element={<RoleBasedRoute requiredRole={UserRole.CEO}><TeamListPage /></RoleBasedRoute>} />
          <Route path={ROUTES.ORGANIZATION.TEAM_DETAIL} element={<RoleBasedRoute requiredRole={UserRole.CEO}><TeamDetailsPage /></RoleBasedRoute>} />
        </Route>
      </Route>

      {/* Include error routes for access denied and server error */}
      <Route path={ROUTES.ERRORS.ACCESS_DENIED} element={<AccessDeniedPage />} />
      <Route path={ROUTES.ERRORS.SERVER_ERROR} element={<ServerErrorPage />} />
    </Routes>
  );
};

export default DashboardRoutes;