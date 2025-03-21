import React, { useState, useEffect, useCallback } from 'react'; // React library for component creation and hooks // v18.2.0
import { useParams, useNavigate, Link } from 'react-router-dom'; // React Router hooks and components for navigation and URL parameter access // v6.10.0
import styled from 'styled-components'; // Styling the component with CSS-in-JS // v5.3.10

import DashboardLayout from '../../layouts/DashboardLayout'; // Layout wrapper for the page with navigation and authentication
import Card from '../../components/common/Card'; // Container component for sections of the page
import Badge from '../../components/common/Badge'; // Display goal status with appropriate styling
import Button from '../../components/common/Button'; // Action buttons for edit, delete, and navigation
import ProgressBar from '../../components/common/ProgressBar'; // Display goal progress visually
import Modal from '../../components/common/Modal'; // Confirmation dialog for delete action
import Spinner from '../../components/common/Spinner'; // Loading indicator while fetching goal data
import Breadcrumbs from '../../components/layout/Breadcrumbs'; // Navigation breadcrumbs for the page
import MilestoneTimeline from '../../components/strategy/MilestoneTimeline'; // Display milestones in a timeline format
import GoalCard from '../../components/strategy/GoalCard'; // Display goal summary information
import { useGoals } from '../../hooks/useGoals'; // Hook for fetching and managing goal data
import { useNotifications } from '../../hooks/useNotifications'; // Hook for displaying notification messages
import {
  GoalWithMilestonesAndMetrics,
  GoalType,
  GoalStatus,
  Milestone,
  MilestoneStatus,
} from '../../types/goal.types'; // Type definitions for goals and milestones
import { Severity } from '../../types/common.types'; // Type definition for badge severity levels
import { formatDate } from '../../utils/helpers/dateTimeHelper'; // Format date strings for display
import { ROUTES } from '../../utils/constants/routes'; // Route constants for navigation

interface BreadcrumbItem {
  label: string;
  path: string;
}

// Styled Components
const PageContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const HeaderRight = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const GoalTypeLabel = styled.span`
  font-size: 14px;
  color: #666;
  font-weight: 500;
`;

const GoalTitle = styled.h1`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
`;

const SectionTitle = styled.h2`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const GoalDescription = styled.p`
  line-height: 1.6;
  margin-bottom: 16px;
`;

const DateRange = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
`;

const ProgressContainer = styled.div`
  margin-top: 16px;
  margin-bottom: 24px;
  width: 100%;
`;

const ProgressLabel = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const Section = styled.div`
  margin-bottom: 32px;
  padding: 16px;
`;

const MetricsList = styled.ul`
  list-style: none;
  padding-left: 20px;
  margin-top: 16px;
`;

const MetricItem = styled.li`
  margin-bottom: 8px;
  display: flex;
  align-items: center;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #666;
  padding: 20px;
  font-style: italic;
`;

/**
 * Main component for displaying strategic goal details
 */
const StrategicGoalDetailPage: React.FC = () => {
  // LD1: Extract goal ID from URL parameters using useParams
  const { id } = useParams<{ id: string }>();

  // LD1: Initialize navigate function for programmatic navigation
  const navigate = useNavigate();

  // LD1: Initialize notification functions for success and error messages
  const { showSuccess, showError } = useNotifications();

  // LD1: Set up state for loading status, goal data, and delete confirmation modal
  const [isLoading, setIsLoading] = useState(true);
  const [goal, setGoal] = useState<GoalWithMilestonesAndMetrics | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // LD1: Fetch goal data with milestones and metrics using the useGoals hook
  const { getGoalWithMilestonesAndMetrics, deleteGoal } = useGoals();

  // LD1: Fetch goal data with milestones and metrics using the useGoals hook
  const getGoalTypeLabel = (type: GoalType): string => {
    switch (type) {
      case GoalType.BHAG:
        return 'Big Hairy Audacious Goal';
      case GoalType.THREE_HAG:
        return '3-Year Highly Achievable Goal';
      case GoalType.ONE_HAG:
        return '1-Year Highly Achievable Goal';
      case GoalType.QUARTERLY:
        return 'Quarterly Goal';
      default:
        return 'Goal';
    }
  };

  // LD1: Fetch goal data with milestones and metrics using the useGoals hook
  const getStatusSeverity = (status: GoalStatus): Severity => {
    switch (status) {
      case GoalStatus.COMPLETED:
        return Severity.SUCCESS;
      case GoalStatus.AT_RISK:
        return Severity.ERROR;
      case GoalStatus.ACTIVE:
        return Severity.WARNING;
      case GoalStatus.DRAFT:
        return Severity.INFO;
      case GoalStatus.ARCHIVED:
        return Severity.INFO;
      default:
        return Severity.INFO;
    }
  };

  // LD1: Fetch goal data with milestones and metrics using the useGoals hook
  const getStatusLabel = (status: GoalStatus): string => {
    switch (status) {
      case GoalStatus.COMPLETED:
        return 'Completed';
      case GoalStatus.AT_RISK:
        return 'At Risk';
      case GoalStatus.ACTIVE:
        return 'Active';
      case GoalStatus.DRAFT:
        return 'Draft';
      case GoalStatus.ARCHIVED:
        return 'Archived';
      default:
        return 'Unknown';
    }
  };

  // LD1: Use useEffect to fetch the goal data when the component mounts or the goal ID changes
  useEffect(() => {
    if (id) {
      setIsLoading(true);
      getGoalWithMilestonesAndMetrics(id)
        .then((response) => {
          if (response?.data) {
            setGoal(response.data);
          } else {
            showError('Failed to load goal');
          }
        })
        .catch((error) => {
          console.error('Error fetching goal:', error);
          showError('Failed to load goal');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [id, getGoalWithMilestonesAndMetrics, showError]);

  // LD1: Set up delete goal functionality with confirmation modal
  const handleDeleteGoal = useCallback(() => {
    if (goal?.id) {
      deleteGoal(goal.id)
        .then(() => {
          showSuccess('Goal deleted successfully');
          navigate(ROUTES.STRATEGY.ROADMAP);
        })
        .catch((error) => {
          console.error('Error deleting goal:', error);
          showError('Failed to delete goal');
        })
        .finally(() => {
          setShowDeleteModal(false);
        });
    }
  }, [goal, deleteGoal, navigate, showSuccess, showError]);

  // LD1: Render the page within DashboardLayout
  return (
    <DashboardLayout>
      <PageContainer>
        {isLoading ? (
          // LD1: Show a loading spinner while data is being fetched
          <Spinner />
        ) : goal ? (
          <>
            {/* LD1: Display breadcrumbs for navigation context */}
            <Breadcrumbs />

            {/* LD1: Render goal header with type, title, and status */}
            <HeaderContainer>
              <HeaderLeft>
                <GoalTypeLabel>{getGoalTypeLabel(goal.type)}</GoalTypeLabel>
                <GoalTitle>{goal.title}</GoalTitle>
              </HeaderLeft>
              <HeaderRight>
                {/* LD1: Display action buttons for edit and delete */}
                <Button label="Edit" onClick={() => navigate(ROUTES.STRATEGY.GOAL_EDIT.replace(':id', goal.id.toString()))} />
                <Button label="Delete" severity="danger" onClick={() => setShowDeleteModal(true)} />
              </HeaderRight>
            </HeaderContainer>

            {/* LD1: Show goal description and progress */}
            <GoalDescription>{goal.description}</GoalDescription>
            <DateRange>
              {formatDate(goal.startDate, 'MMMM d, yyyy')} - {formatDate(goal.endDate, 'MMMM d, yyyy')}
            </DateRange>
            <ProgressContainer>
              <ProgressLabel>
                <span>Progress</span>
                <span>{goal.progress}%</span>
              </ProgressLabel>
              <ProgressBar value={goal.progress} />
            </ProgressContainer>

            {/* LD1: Render milestones timeline section */}
            <Section>
              <SectionTitle>Milestones</SectionTitle>
              {goal.milestones && goal.milestones.length > 0 ? (
                <MilestoneTimeline milestones={goal.milestones} />
              ) : (
                <EmptyState>No milestones defined for this goal.</EmptyState>
              )}
            </Section>

            {/* LD1: Show linked metrics section */}
            <Section>
              <SectionTitle>Linked Metrics</SectionTitle>
              {goal.metrics && goal.metrics.length > 0 ? (
                <MetricsList>
                  {goal.metrics.map((metric) => (
                    <MetricItem key={metric.id}>
                      <Link to={ROUTES.METRICS.DETAIL.replace(':id', metric.id.toString())}>{metric.name}</Link>
                    </MetricItem>
                  ))}
                </MetricsList>
              ) : (
                <EmptyState>No metrics linked to this goal.</EmptyState>
              )}
            </Section>

            {/* LD1: Include delete confirmation modal */}
            <Modal
              visible={showDeleteModal}
              onHide={() => setShowDeleteModal(false)}
              header="Confirm Delete"
              footer={
                <>
                  <Button label="Cancel" onClick={() => setShowDeleteModal(false)} />
                  <Button label="Delete" severity="danger" onClick={handleDeleteGoal} />
                </>
              }
            >
              <p>Are you sure you want to delete this goal?</p>
            </Modal>
          </>
        ) : (
          // LD1: Handle the case where the goal is not found
          <div>Goal not found</div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
};

// LD1: Export the component for use in route definitions
export default StrategicGoalDetailPage;