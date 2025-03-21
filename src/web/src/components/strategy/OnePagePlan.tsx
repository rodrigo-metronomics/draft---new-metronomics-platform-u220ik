# src/web/src/components/strategy/OnePagePlan.tsx
```typescript
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'; // react@^18.2.0
import styled from 'styled-components'; // version ^5.3.10
import { Button } from 'primereact/button'; // version ^10.0.0
import { Divider } from 'primereact/divider'; // version ^10.0.0

import Card from '../common/Card';
import MetricCard from '../metrics/MetricCard';
import GoalCard from './GoalCard';
import MilestoneTimeline from './MilestoneTimeline';
import useGoals from '../../hooks/useGoals';
import useMetrics from '../../hooks/useMetrics';
import { useOrganizationContext } from '../../contexts/OrganizationContext';
import {
  GoalType,
  GoalStatus,
  Goal,
  GoalWithMilestonesAndMetrics,
  Milestone
} from '../../types/goal.types';
import { MetricWithValues, MetricDashboardData } from '../../types/metric.types';

/**
 * Interface defining the properties for the OnePagePlan component
 */
interface OnePagePlanProps {
  editable: boolean;
  printable: boolean;
  onEdit: () => void;
  onPrint: () => void;
  onExport: () => void;
}

/**
 * Interface defining the methods exposed through the component's ref
 */
interface OnePagePlanRef {
  exportToPdf: () => void;
  print: () => void;
}

// Styled components using styled-components library
const PlanContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  @media print {
    padding: 0;
    margin: 0;
    width: 100%;
  }
`;

const PlanHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  @media print {
    margin-bottom: 0.5rem;
  }
`;

const PlanTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  @media print {
    font-size: 1.5rem;
  }
`;

const PlanActions = styled.div`
  display: flex;
  gap: 0.5rem;
  @media print {
    display: none;
  }
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 1rem;
  @media (max-width: 992px) {
    grid-template-columns: repeat(6, 1fr);
  }
  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
  @media print {
    gap: 0.5rem;
  }
`;

const GoalSection = styled.div`
  grid-column: span 4;
  @media (max-width: 992px) {
    grid-column: span 6;
  }
  @media (max-width: 576px) {
    grid-column: span 1;
  }
`;

const MetricsSection = styled.div`
  grid-column: span 12;
  margin-top: 1rem;
  @media print {
    margin-top: 0.5rem;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  @media print {
    gap: 0.5rem;
    grid-template-columns: repeat(3, 1fr);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  width: 100%;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 200px;
  width: 100%;
  color: var(--red-500);
  text-align: center;
`;

const PrintModeContainer = styled.div`
  display: none;
  @media print {
    display: block;
  }
  page-break-inside: avoid;
`;

/**
 * Component that renders a consolidated view of strategic goals, priorities, and metrics
 */
const OnePagePlan: React.FC<OnePagePlanProps> = forwardRef<OnePagePlanRef, OnePagePlanProps>(({ editable, printable, onEdit, onPrint, onExport }, ref) => {
  // Destructure props to access editable, printable, and handler functions
  // Get current organization from context
  const { currentOrganization } = useOrganizationContext();

  // Initialize state for goals (BHAG, 3HAG, 1HAG) and metrics
  const [bhag, setBhag] = useState<Goal | null>(null);
  const [threeHag, setThreeHag] = useState<Goal | null>(null);
  const [oneHag, setOneHag] = useState<Goal | null>(null);
  const [metrics, setMetrics] = useState<MetricWithValues[]>([]);

  // Initialize loading and error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize ref for the component to be used for export functionality
  const componentRef = useRef<HTMLDivElement>(null);

  // Use useGoals hook to fetch strategic goals
  const { getGoalsByType } = useGoals();

  // Use useMetrics hook to fetch dashboard metrics
  const { getDashboardMetrics } = useMetrics();

  // Fetch BHAG, 3HAG, and 1HAG goals when component mounts
  useEffect(() => {
    const fetchGoals = async () => {
      if (!currentOrganization) return;
      setIsLoading(true);
      setError(null);
      try {
        const bhagResponse = await getGoalsByType(GoalType.BHAG);
        setBhag(bhagResponse.data[0] || null);

        const threeHagResponse = await getGoalsByType(GoalType.THREE_HAG);
        setThreeHag(threeHagResponse.data[0] || null);

        const oneHagResponse = await getGoalsByType(GoalType.ONE_HAG);
        setOneHag(oneHagResponse.data[0] || null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch goals');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoals();
  }, [currentOrganization, getGoalsByType]);

  // Fetch key metrics for the dashboard when component mounts
  useEffect(() => {
    const fetchMetrics = async () => {
      if (!currentOrganization) return;
      setIsLoading(true);
      setError(null);
      try {
        const filters = { organizationId: currentOrganization.id, search: '', type: null, goalId: null, teamId: null, dateRange: null };
        const metricsResponse = await getDashboardMetrics(filters);
        setMetrics(metricsResponse.metrics || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch metrics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [currentOrganization, getDashboardMetrics]);

  // Expose the component ref using useImperativeHandle
  useImperativeHandle(ref, () => ({
    exportToPdf: () => {
      if (onExport) {
        onExport();
      }
    },
    print: () => {
      if (onPrint) {
        onPrint();
      }
    },
  }));

  // Render loading state if data is being fetched
  if (isLoading) {
    return (
      <PlanContainer>
        <LoadingContainer>Loading...</LoadingContainer>
      </PlanContainer>
    );
  }

  // Render error state if data fetching fails
  if (error) {
    return (
      <PlanContainer>
        <ErrorContainer>Error: {error}</ErrorContainer>
      </PlanContainer>
    );
  }

  // Render the One-Page Plan layout with sections for BHAG, 3HAG, 1HAG, and metrics
  return (
    <PlanContainer ref={componentRef}>
      <PlanHeader>
        <PlanTitle>One-Page Plan</PlanTitle>
        {/* Render action buttons if not in print mode */}
        {!printable && (
          <PlanActions>
            {editable && <Button label="Edit" icon="pi pi-pencil" onClick={onEdit} />}
            <Button label="Print" icon="pi pi-print" onClick={onPrint} />
            <Button label="Export" icon="pi pi-file-pdf" onClick={onExport} />
          </PlanActions>
        )}
      </PlanHeader>

      <SectionGrid>
        {/* BHAG Section */}
        <GoalSection>
          <Card title="BHAG">
            {bhag ? (
              <GoalCard goal={bhag} interactive={false} />
            ) : (
              <div>No BHAG set</div>
            )}
          </Card>
        </GoalSection>

        {/* 3HAG Section */}
        <GoalSection>
          <Card title="3HAG">
            {threeHag ? (
              <GoalCard goal={threeHag} interactive={false} />
            ) : (
              <div>No 3HAG set</div>
            )}
          </Card>
        </GoalSection>

        {/* 1HAG Section */}
        <GoalSection>
          <Card title="1HAG">
            {oneHag ? (
              <GoalCard goal={oneHag} interactive={false} />
            ) : (
              <div>No 1HAG set</div>
            )}
          </Card>
        </GoalSection>
      </SectionGrid>

      <Divider />

      {/* Metrics Section */}
      <MetricsSection>
        <Card title="Key Metrics">
          <MetricsGrid>
            {metrics.map(metric => (
              <MetricCard key={metric.id} metric={metric} showChart={true} />
            ))}
          </MetricsGrid>
        </Card>
      </MetricsSection>

      {/* Apply print-specific styling when in print mode */}
      {printable && (
        <PrintModeContainer>
          {/* Add content that should only be visible in print mode */}
        </PrintModeContainer>
      )}
    </PlanContainer>
  );
});

export default OnePagePlan;