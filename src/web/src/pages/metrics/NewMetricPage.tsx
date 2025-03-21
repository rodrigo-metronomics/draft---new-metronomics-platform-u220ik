import React, { useState, useEffect } from 'react'; // React library for building user interfaces // v18.2.0
import { useNavigate } from 'react-router-dom'; // React Router for navigation // v6.10.0
import styled from 'styled-components'; // Styled Components for CSS-in-JS // v5.3.10

import DashboardLayout from '../../layouts/DashboardLayout'; // Layout component for dashboard structure
import Card from '../../components/common/Card'; // Reusable card component
import Button from '../../components/common/Button'; // Reusable button component
import Breadcrumbs from '../../components/layout/Breadcrumbs'; // Navigation breadcrumbs
import MetricForm from '../../components/metrics/MetricForm'; // Form for creating/editing metrics
import MetricThresholdEditor from '../../components/metrics/MetricThresholdEditor'; // Editor for metric thresholds
import Toast from '../../components/common/Toast'; // Notification component
import Spinner from '../../components/common/Spinner'; // Loading spinner component
import useMetrics from '../../hooks/useMetrics'; // Custom hook for metric operations
import { useOrganizationContext } from '../../contexts/OrganizationContext'; // Hook for organization context
import { ROUTES } from '../../utils/constants/routes'; // Route constants for navigation
import { CreateMetricDto, CreateMetricThresholdDto } from '../../types/metric.types'; // Type definitions for metric creation

// Styled components for layout and styling
const PageContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 1rem;
`;

/**
 * Page component for creating a new metric
 */
const NewMetricPage: React.FC = () => {
  // LD1: Initialize navigate function from useNavigate hook
  const navigate = useNavigate();

  // LD1: Get current organization from useOrganizationContext hook
  const { currentOrganization } = useOrganizationContext();

  // LD1: Initialize state for form errors, loading state, and thresholds
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [thresholds, setThresholds] = useState<CreateMetricThresholdDto[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);
  const [showErrorToast, setShowErrorToast] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // LD1: Initialize useMetrics hook to access createMetric mutation
  const { createMetric } = useMetrics();

  // LD1: Define initial form values with organization ID from context
  const initialValues: CreateMetricDto = {
    name: '',
    description: '',
    type: 'number',
    unit: '',
    comparisonType: 'ytd',
    calculationMethod: 'manual',
    formula: null,
    organizationId: currentOrganization?.id || '',
    teamId: null,
    thresholds: [],
    goalIds: []
  };

  // LD1: Define handleSubmit function to create a new metric
  const handleSubmit = async (values: CreateMetricDto) => {
    setIsSubmitting(true);
    setErrors({});
    try {
      // LD1: Call createMetric mutation with form values and thresholds
      await createMetric({
        ...values,
        organizationId: currentOrganization?.id || '',
        thresholds: thresholds,
      });

      // LD1: Show success toast and navigate to metrics dashboard
      setShowSuccessToast(true);
      setTimeout(() => {
        navigate(ROUTES.METRICS.DASHBOARD);
      }, 1500);
    } catch (error: any) {
      // LD1: Handle errors and set error message for toast
      console.error('Failed to create metric:', error);
      setShowErrorToast(true);
      setErrorMessage(error.message || 'Failed to create metric');
      setErrors(error.errors || {});
    } finally {
      // LD1: Reset loading state
      setIsSubmitting(false);
    }
  };

  // LD1: Define handleThresholdsChange function to update thresholds state
  const handleThresholdsChange = (newThresholds: CreateMetricThresholdDto[]) => {
    setThresholds(newThresholds);
  };

  // LD1: Define breadcrumb items for navigation context
  const breadcrumbItems = [
    { label: 'Metrics', to: ROUTES.METRICS.DASHBOARD },
    { label: 'New Metric' },
  ];

  // LD1: Render the page with DashboardLayout, Breadcrumbs, Card, MetricForm, MetricThresholdEditor, and action buttons
  return (
    <DashboardLayout showBreadcrumbs>
      <PageContainer>
        <Breadcrumbs items={breadcrumbItems} />
        <Card title="New Metric">
          <FormContainer>
            <MetricForm
              initialValues={initialValues}
              onSubmit={handleSubmit}
              errors={errors}
              isEditing={false}
            />

            <SectionTitle>Thresholds</SectionTitle>
            <MetricThresholdEditor
              initialThresholds={thresholds}
              onThresholdsChange={handleThresholdsChange}
              metricType={initialValues.type}
              errors={errors}
            />

            <ButtonContainer>
              <Button
                label="Cancel"
                variant="secondary"
                onClick={() => navigate(ROUTES.METRICS.DASHBOARD)}
              />
              <Button
                label="Create Metric"
                onClick={handleSubmit}
                disabled={isSubmitting}
              />
            </ButtonContainer>
          </FormContainer>
        </Card>
      </PageContainer>

      {/* LD1: Show loading spinner when submitting */}
      {isSubmitting && <Spinner />}

      {/* LD1: Show toast notifications for success or error states */}
      {showSuccessToast && (
        <Toast
          severity="success"
          summary="Success"
          detail="Metric created successfully"
          life={3000}
        />
      )}
      {showErrorToast && (
        <Toast
          severity="error"
          summary="Error"
          detail={errorMessage}
          life={5000}
        />
      )}
    </DashboardLayout>
  );
};

// Export the NewMetricPage component
export default NewMetricPage;

// Define types for local state
interface FormErrors {
  [string: string]: string;
}