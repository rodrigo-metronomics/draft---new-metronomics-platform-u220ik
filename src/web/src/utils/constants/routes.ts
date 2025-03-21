/**
 * Routes Constants
 * 
 * This file centralizes all route paths used throughout the Metronomics Platform.
 * Using these constants instead of hardcoded strings ensures consistency and
 * simplifies route management across the application.
 * 
 * Routes are organized into logical sections based on feature areas:
 * - Authentication (login, registration)
 * - Dashboard (main application dashboard)
 * - Meetings (meeting management and moderation)
 * - Strategy (strategic planning, goals, roadmaps)
 * - Metrics (KPIs, dashboards, measurements)
 * - KFFM (Key Function Flow Map visualization and editing)
 * - Users (user management and profiles)
 * - Organization (organization settings and teams)
 * - Errors (error pages)
 * 
 * These routes support the navigation structure and authentication flows defined
 * in the technical specifications, and provide a foundation for implementing
 * role-based access control throughout the application.
 */

// Centralized routes object containing all application routes
export const ROUTES = {
  /** Root path of the application */
  ROOT: '/',

  /** Authentication-related routes */
  AUTH: {
    /** Authentication section root */
    ROOT: '/auth',
    /** Login page */
    LOGIN: '/auth/login',
    /** Registration page */
    REGISTER: '/auth/register',
    /** Forgot password page */
    FORGOT_PASSWORD: '/auth/forgot-password',
    /** Reset password page */
    RESET_PASSWORD: '/auth/reset-password',
  },

  /** Dashboard-related routes */
  DASHBOARD: {
    /** Dashboard section root */
    ROOT: '/dashboard',
    /** Main dashboard home page */
    HOME: '/dashboard',
  },

  /** Meeting-related routes */
  MEETINGS: {
    /** Meetings section root */
    ROOT: '/meetings',
    /** Meetings list page */
    LIST: '/meetings',
    /** Create new meeting page */
    NEW: '/meetings/new',
    /** Meeting details page with dynamic ID parameter */
    DETAIL: '/meetings/:id',
    /** Meeting moderation page with dynamic ID parameter */
    MODERATOR: '/meetings/:id/moderate',
  },

  /** Strategic planning routes */
  STRATEGY: {
    /** Strategy section root */
    ROOT: '/strategy',
    /** Strategic roadmap visualization */
    ROADMAP: '/strategy/roadmap',
    /** One-page plan view */
    ONE_PAGE_PLAN: '/strategy/one-page-plan',
    /** Goal details page with dynamic ID parameter */
    GOAL_DETAIL: '/strategy/goals/:id',
    /** Goal editing page with dynamic ID parameter */
    GOAL_EDIT: '/strategy/goals/:id/edit',
    /** Create new goal page */
    GOAL_NEW: '/strategy/goals/new',
  },

  /** Metrics and KPI routes */
  METRICS: {
    /** Metrics section root */
    ROOT: '/metrics',
    /** Metrics dashboard page */
    DASHBOARD: '/metrics',
    /** Metric details page with dynamic ID parameter */
    DETAIL: '/metrics/:id',
    /** Create new metric page */
    NEW: '/metrics/new',
    /** Shared dashboard view with dynamic share ID parameter */
    SHARED: '/metrics/shared/:shareId',
  },

  /** Key Function Flow Map routes */
  KFFM: {
    /** KFFM section root */
    ROOT: '/kffm',
    /** KFFM view page with dynamic ID parameter */
    VIEW: '/kffm/:id',
    /** KFFM editing page with dynamic ID parameter */
    EDIT: '/kffm/:id/edit',
    /** Create new KFFM page */
    NEW: '/kffm/new',
  },

  /** User management routes */
  USERS: {
    /** Users section root */
    ROOT: '/users',
    /** Users list page */
    LIST: '/users',
    /** User details page with dynamic ID parameter */
    DETAIL: '/users/:id',
    /** Current user profile page */
    PROFILE: '/users/profile',
    /** User invitation page */
    INVITE: '/users/invite',
  },

  /** Organization management routes */
  ORGANIZATION: {
    /** Organization section root */
    ROOT: '/organization',
    /** Organization settings page */
    SETTINGS: '/organization/settings',
    /** Teams list page */
    TEAMS: '/organization/teams',
    /** Team details page with dynamic ID parameter */
    TEAM_DETAIL: '/organization/teams/:id',
  },

  /** Error page routes */
  ERRORS: {
    /** 404 Not Found error page */
    NOT_FOUND: '/404',
    /** 403 Access Denied error page */
    ACCESS_DENIED: '/403',
    /** 500 Server Error page */
    SERVER_ERROR: '/500',
  },
} as const;