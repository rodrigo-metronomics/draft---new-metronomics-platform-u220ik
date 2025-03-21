import React, { useState, useEffect, useCallback } from 'react'; // version ^18.0.0
import styled from 'styled-components'; // ^5.3.10

import Card from '../common/Card';
import Tabs from '../common/Tabs';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import MetricForm from './MetricForm';
import MetricThresholdEditor from './MetricThresholdEditor';
import MetricValueEditor from './MetricValueEditor';
import MetricChart from './MetricChart';
import useMetrics from '../../hooks/useMetrics';
import useOrganizationContext from '../../contexts/OrganizationContext';
import {
  CreateMetricDto,
  UpdateMetricDto,
  CreateMetricThresholdDto,
  MetricType,
  ComparisonType,
  CalculationMethod,
  MetricWithRelations,
  ChartType,
  ColorScheme,
  TimeRange
} from '../../types/metric.types';

/**
 * Interface for the MetricEditor component props
 */
interface MetricEditorProps {
  initialMetric: MetricWithRelations | null;
  onSave: (metric: MetricWithRelations) => void;
  onCancel: () => void;
  isLoading: boolean;
}

/**
 * Interface for form errors
 */
interface FormErrors {
  [key: string]: string;
}

// Styled components
const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

const TabContent = styled.div`
  padding: 1.5rem;
  background-color: #ffffff;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const PreviewSection = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #f9f9f9;
  border-radius: 8px;
`;

const PreviewTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  font-size: 0.875rem;
  margin-top: 0.5rem;
`;

/**
 * Main component for creating and editing metrics
 */
const MetricEditor: React.FC<MetricEditorProps> = ({
  initialMetric,
  onSave,
  onCancel,
  isLoading
}) => {
  // State variables
  const [formData, setFormData] = useState<CreateMetricDto>(
    getInitialFormData(initialMetric, useOrganizationContext().currentOrganization?.id || '')
  );
  const [thresholds, setThresholds] = useState<CreateMetricThresholdDto[]>(initialMetric?.thresholds || []);
  const [activeTab, setActiveTab] = useState('details');
  const [errors, setErrors] = useState<FormErrors>({});

  // Get current organization from context
  const { currentOrganization } = useOrganizationContext();

  // Get createMetric and updateMetric mutations from useMetrics hook
  const { createMetric, updateMetric } = useMetrics();

  // Initialize form data from initialMetric or with defaults
  useEffect(() => {
    setFormData(getInitialFormData(initialMetric, currentOrganization?.id || ''));
    setThresholds(initialMetric?.thresholds || []);
  }, [initialMetric, currentOrganization]);

  // Handle tab changes
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, []);

  // Handle form data changes
  const handleFormChange = useCallback((newFormData: CreateMetricDto) => {
    setFormData(newFormData);
    setErrors({}); // Clear errors on form change
  }, []);

  // Handle threshold changes
  const handleThresholdsChange = useCallback((newThresholds: CreateMetricThresholdDto[]) => {
    setThresholds(newThresholds);
  }, []);

  // Handle form submission
  const handleFormSubmit = useCallback(async () => {
    // Validate form data
    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Set loading state
    isLoading = true;

    try {
      // If initialMetric exists, update the existing metric
      if (initialMetric) {
        await updateMetric.mutateAsync({ id: initialMetric.id, metricData: formData as UpdateMetricDto });
        onSave({ ...initialMetric, ...formData, thresholds: thresholds } as MetricWithRelations);
      } else {
        // Otherwise, create a new metric
        const newMetric = await createMetric.mutateAsync(formData);
        onSave(newMetric as MetricWithRelations);
      }
    } catch (error: any) {
      // Handle errors
      setErrors({ submit: error.message || 'Failed to save metric' });
    } finally {
      // Reset loading state
      isLoading = false;
    }
  }, [createMetric, updateMetric, formData, initialMetric, onSave, thresholds]);

  // Render tabs for navigating between different sections
  return (
    <EditorContainer>
      <Card title={initialMetric ? "Edit Metric" : "Create Metric"}>
        <Tabs
          items={[
            {
              label: 'Details',
              content: (
                <TabContent>
                  <MetricForm
                    initialValues={formData}
                    onSubmit={handleFormSubmit}
                    errors={errors}
                    isEditing={!!initialMetric}
                  />
                </TabContent>
              ),
            },
            {
              label: 'Thresholds',
              content: (
                <TabContent>
                  <MetricThresholdEditor
                    initialThresholds={thresholds}
                    onThresholdsChange={handleThresholdsChange}
                    metricType={formData.type as MetricType}
                    errors={errors}
                  />
                </TabContent>
              ),
            },
            {
              label: 'Values',
              disabled: !initialMetric,
              content: (
                <TabContent>
                  {initialMetric ? (
                    <MetricValueEditor
                      metricId={initialMetric.id}
                      metricType={initialMetric.type as MetricType}
                      metricUnit={initialMetric.unit}
                      onSuccess={() => {}}
                      onCancel={() => {}}
                    />
                  ) : (
                    <div>Please save the metric to add values.</div>
                  )}
                </TabContent>
              ),
            },
          ]}
          activeIndex={activeTab === 'details' ? 0 : activeTab === 'thresholds' ? 1 : 2}
          onTabChange={(index) => handleTabChange(index === 0 ? 'details' : index === 1 ? 'thresholds' : 'values')}
        />
      </Card>

      <ActionButtons>
        <Button label="Cancel" onClick={onCancel} />
        <Button label="Save" onClick={handleFormSubmit} loading={isLoading} />
      </ActionButtons>

      {errors.submit && <ErrorMessage>{errors.submit}</ErrorMessage>}
    </EditorContainer>
  );
};

/**
 * Helper function to initialize form data from an existing metric or with defaults
 */
const getInitialFormData = (
  initialMetric: MetricWithRelations | null,
  organizationId: string
): CreateMetricDto => {
  if (initialMetric) {
    return {
      name: initialMetric.name,
      description: initialMetric.description,
      type: initialMetric.type,
      unit: initialMetric.unit,
      comparisonType: initialMetric.comparisonType,
      calculationMethod: initialMetric.calculationMethod,
      formula: initialMetric.formula || '',
      organizationId: initialMetric.organizationId,
      teamId: initialMetric.teamId || null,
      thresholds: initialMetric.thresholds || [],
      goalIds: initialMetric.goals.map(goal => goal.id) || []
    };
  } else {
    return {
      name: '',
      description: '',
      type: MetricType.NUMBER,
      unit: '',
      comparisonType: ComparisonType.YEAR_TO_DATE,
      calculationMethod: CalculationMethod.MANUAL,
      formula: null,
      organizationId: organizationId,
      teamId: null,
      thresholds: [],
      goalIds: []
    };
  }
};

/**
 * Validates form data before submission
 */
const validateForm = (formData: CreateMetricDto): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!formData.name) {
    errors.name = 'Name is required';
  }

  if (!formData.description) {
    errors.description = 'Description is required';
  }

  if (!formData.type) {
    errors.type = 'Type is required';
  }

  if (!formData.unit) {
    errors.unit = 'Unit is required';
  }

  if (!formData.comparisonType) {
    errors.comparisonType = 'Comparison Type is required';
  }

  if (!formData.calculationMethod) {
    errors.calculationMethod = 'Calculation Method is required';
  }

  if (formData.calculationMethod === CalculationMethod.FORMULA && !formData.formula) {
    errors.formula = 'Formula is required when calculation method is FORMULA';
  }

  return errors;
};

export default MetricEditor;