import React, { useState, useEffect, useCallback, useRef } from 'react'; // React library for component creation and state management // v18.2.0
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // Hooks for accessing URL parameters, navigation, and location // v6.14.0
import styled from 'styled-components'; // Styling the component with CSS-in-JS // v5.3.10
import { Toast } from 'primereact/toast'; // Toast notifications for success/error messages // v10.0.0
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog'; // Confirmation dialogs for destructive actions // v10.0.0

import DashboardLayout from '../../layouts/DashboardLayout'; // Layout wrapper for dashboard pages with navigation and authentication
import GoalEditor from '../../components/strategy/GoalEditor'; // Form component for editing goal details
import MilestoneEditor from '../../components/strategy/MilestoneEditor'; // Form component for creating and editing milestones
import MilestoneTimeline from '../../components/strategy/MilestoneTimeline'; // Component for visualizing milestones on a timeline
import Card from '../../components/common/Card'; // Container component for content sections
import Button from '../../components/common/Button'; // Button component for actions
import Tabs from '../../components/common/Tabs'; // Tab navigation between goal details and milestones
import Modal from '../../components/common/Modal'; // Modal dialog for milestone creation/editing
import Spinner from '../../components/common/Spinner'; // Loading indicator for async operations
import useGoals, {  } from '../../hooks/useGoals'; // Hook for managing strategic goals and milestones
import { ROUTES } from '../../utils/constants/routes'; // Route constants for navigation
import { GoalWithMilestonesAndMetrics, Milestone } from '../../types/goal.types'; // Type definitions for goals and milestones

// Styled components for layout and styling
const PageContainer = styled.div`
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0;
`;

const TabContent = styled.div`
  padding: 1rem 0;
`;

const MilestonesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const MilestonesTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 500;
  margin: 0;
`;

const MilestonesContainer = styled.div`
  margin-top: 1.5rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 0.5rem;
`;

const EmptyStateText = styled.p`
  margin-bottom: 1.5rem;
  color: #666;
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

interface MilestoneModalState {
  isOpen: boolean;
  isEdit: boolean;
  milestoneId: string;
}

/**
 * Page component for creating or editing strategic goals and their milestones
 */
const StrategicGoalEditPage: React.FC = () => {
  // Extract goalId from URL parameters using useParams hook
  const { id: goalId } = useParams<{ id: string }>();

  // Initialize navigate function for programmatic navigation
  const navigate = useNavigate();

  // Initialize state for active tab, loading status, goal data, and modal visibility
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [milestoneModal, setMilestoneModal] = useState<MilestoneModalState>({ isOpen: false, isEdit: false, milestoneId: '' });

  // Get goal management functions from useGoals hook
  const { getGoalWithMilestonesAndMetrics, createMilestone, updateMilestone, deleteMilestone } = useGoals();

  // Initialize toast reference for notifications
  const toast = useRef<Toast>(null);

  // Create state for selected milestone when editing
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  // Fetch goal data if goalId is provided (edit mode)
  useEffect(() => {
    if (goalId) {
      setLoading(true);
      getGoalWithMilestonesAndMetrics(goalId)
        .finally(() => setLoading(false));
    }
  }, [goalId, getGoalWithMilestonesAndMetrics]);

  // Handle tab change between 'details' and 'milestones'
  const handleTabChange = (index: number) => {
    setActiveTab(index);
  };

  // Define success handler for goal creation/update
  const handleGoalSuccess = useCallback(() => {
    navigate(ROUTES.STRATEGY.ROADMAP);
  }, [navigate]);

  // Define cancel handler to navigate back to goals list
  const handleCancel = useCallback(() => {
    navigate(ROUTES.STRATEGY.ROADMAP);
  }, [navigate]);

  // Define handlers for milestone operations (add, edit, delete)
  const handleAddMilestone = () => {
    setMilestoneModal({ isOpen: true, isEdit: false, milestoneId: '' });
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setMilestoneModal({ isOpen: true, isEdit: true, milestoneId: milestone.id });
  };

  const handleDeleteMilestone = (milestoneId: string) => {
    confirmDialog({
      message: 'Are you sure you want to delete this milestone?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        setLoading(true);
        deleteMilestone.mutate(milestoneId, {
          onSuccess: () => {
            toast.current?.show({ severity: 'success', summary: 'Milestone Deleted', detail: 'Milestone deleted successfully', life: 3000 });
            setLoading(false);
          },
          onError: (error: any) => {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message || 'Failed to delete milestone', life: 3000 });
            setLoading(false);
          },
        });
      },
    });
  };

  // Define milestone selection handler for editing
  const handleMilestoneSelect = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
  };

  // Define modal close handler
  const handleModalClose = () => {
    setMilestoneModal({ isOpen: false, isEdit: false, milestoneId: '' });
    setSelectedMilestone(null);
  };

  // Render page with DashboardLayout wrapper
  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader>
          <PageTitle>{goalId ? 'Edit Strategic Goal' : 'Create Strategic Goal'}</PageTitle>
        </PageHeader>

        {/* Render tabs for 'Goal Details' and 'Milestones' (milestones tab disabled in create mode) */}
        <Tabs activeIndex={activeTab} onTabChange={(index) => handleTabChange(index)} >
          <TabContent>
            <GoalEditor goalId={goalId} isEdit={!!goalId} onSuccess={handleGoalSuccess} onCancel={handleCancel} />
          </TabContent>
          <TabContent>
            <MilestonesHeader>
              <MilestonesTitle>Milestones</MilestonesTitle>
              <ActionButtonsContainer>
                <Button label="Add Milestone" onClick={handleAddMilestone} />
              </ActionButtonsContainer>
            </MilestonesHeader>
            <MilestonesContainer>
              {/* Render milestones section with timeline and actions in milestones tab */}
              {goalId && (
                <MilestoneTimeline
                  milestones={[]}
                  onMilestoneClick={handleEditMilestone}
                />
              )}
            </MilestonesContainer>
          </TabContent>
        </Tabs>

        {/* Render MilestoneEditor in modal when adding/editing milestones */}
        <Modal
          visible={milestoneModal.isOpen}
          onHide={handleModalClose}
          header={milestoneModal.isEdit ? 'Edit Milestone' : 'Create Milestone'}
        >
          <MilestoneEditor
            goalId={goalId || ''}
            milestoneId={milestoneModal.milestoneId}
            isEdit={milestoneModal.isEdit}
            onSuccess={handleModalClose}
            onCancel={handleModalClose}
          />
        </Modal>

        {/* Render Toast component for notifications */}
        <Toast ref={toast} />

        {/* Render ConfirmDialog component for delete confirmations */}
        <ConfirmDialog />
      </PageContainer>
    </DashboardLayout>
  );
};

export default StrategicGoalEditPage;