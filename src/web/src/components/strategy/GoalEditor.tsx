import React, { useState, useEffect, useCallback, useRef } from 'react'; // react@^18.2.0
import styled from 'styled-components'; // styled-components@^5.3.10
import { Toast } from 'primereact/toast'; // primereact/toast@^10.0.0
import { MultiSelect } from 'primereact/multiselect'; // primereact/multiselect@^10.0.0

import {
  Goal,
  GoalType,
  GoalStatus,
  CreateGoalFormData,
  UpdateGoalFormData,
} from '../../types/goal.types';
import { ID } from '../../types/common.types';
import useGoals from '../../hooks/useGoals';
import useMetrics from '../../hooks/useMetrics';
import useForm from '../../hooks/useForm';
import useOrganizationContext from '../../contexts/OrganizationContext';
import FormField from '../common/FormField';
import Button from '../common/Button';
import Card from '../common/Card';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import Select from '../common/Select';
import DatePicker from '../common/DatePicker';
import {
  validateRequired,
  validateDate,
  validateMinLength,
  formatDate,
  parseDate,
} from '../../utils/helpers/validationHelper';

// Styled components for layout and styling
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const FormRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FormColumn = styled.div`
  flex: 1;
  min-width: 250px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
`;

/**
 * Interface for the GoalEditor component props
 */
interface GoalEditorProps {
  goalId?: ID;
  isEdit?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Component for creating and editing strategic goals
 */
const GoalEditor: React.FC<GoalEditorProps> = ({ goalId, isEdit = false, onSuccess, onCancel }) => {
  // Extract goalId, isEdit, and onSuccess from props
  // Get goal management functions from useGoals hook
  const { getGoal, createGoal, updateGoal } = useGoals();
  // Get metrics functions from useMetrics hook
  const { metrics } = useMetrics();
  // Get current organization from useOrganizationContext
  const { currentOrganization } = useOrganizationContext();
  // Initialize toast reference for notifications
  const toast = useRef<Toast>(null);
  // Initialize state for loading goal data and available metrics
  const [loading, setLoading] = useState(false);
  const [availableMetrics, setAvailableMetrics] = useState([]);

  // Define validation rules for goal form fields
  const validationRules = {
    title: { required: true, minLength: 3 },
    description: { required: true, minLength: 10 },
    type: { required: true },
    startDate: { required: true, isDate: true },
    endDate: { required: true, isDate: true },
    status: { required: true },
  };

  // Initialize form state using useForm hook with initial values and validation rules
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldTouched,
  } = useForm<CreateGoalFormData | UpdateGoalFormData>({
    initialValues: isEdit
      ? { title: '', description: '', startDate: '', endDate: '', status: '', metricIds: [] }
      : { title: '', description: '', type: '', startDate: '', endDate: '', organizationId: currentOrganization?.id || '', metricIds: [] },
    validationRules,
    onSubmit: async (formData) => {
      try {
        setLoading(true);
        if (isEdit && goalId) {
          // Update existing goal
          await updateGoal.mutateAsync({ id: goalId, data: formData as UpdateGoalFormData });
          toast.current?.show({ severity: 'success', summary: 'Goal Updated', detail: 'Strategic goal updated successfully', life: 3000 });
        } else {
          // Create new goal
          await createGoal.mutateAsync(formData as CreateGoalFormData);
          toast.current?.show({ severity: 'success', summary: 'Goal Created', detail: 'Strategic goal created successfully', life: 3000 });
        }
        onSuccess?.();
      } catch (error: any) {
        toast.current?.show({ severity: 'error', summary: 'Error', detail: error.message || 'Failed to save goal', life: 3000 });
      } finally {
        setLoading(false);
      }
    },
  });

  // Fetch goal data if in edit mode
  useEffect(() => {
    if (isEdit && goalId) {
      setLoading(true);
      getGoal.getGoal({ id: goalId })
        .then((response) => {
          if (response?.data) {
            const goal = response.data;
            setFieldValue('title', goal.title);
            setFieldValue('description', goal.description);
            setFieldValue('startDate', formatDate(goal.startDate, 'yyyy-MM-dd'));
            setFieldValue('endDate', formatDate(goal.endDate, 'yyyy-MM-dd'));
            setFieldValue('status', goal.status);
          }
        })
        .catch((error) => {
          toast.current?.show({ severity: 'error', summary: 'Error', detail: 'Failed to load goal data', life: 3000 });
        })
        .finally(() => setLoading(false));
    }
  }, [goalId, isEdit, getGoal, setFieldValue]);

  // Fetch available metrics for the organization
  useEffect(() => {
    if (currentOrganization) {
      setAvailableMetrics(
        metrics.map((metric) => ({
          label: metric.name,
          value: metric.id,
        }))
      );
    }
  }, [currentOrganization, metrics]);

  // Define form submission handler
  const onSubmit = async () => {
    handleSubmit({ preventDefault: () => { } } as React.FormEvent<HTMLFormElement>);
  };

  // Render form with appropriate fields based on isEdit flag
  return (
    <Card title={isEdit ? "Edit Goal" : "Create Goal"}>
      <Toast ref={toast} />
      <FormContainer>
        <FormSection>
          <FormField
            id="title"
            name="title"
            label="Title"
            error={errors.title}
            touched={touched.title}
            required
          >
            <Input
              id="title"
              name="title"
              value={values.title || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading}
            />
          </FormField>
          <FormField
            id="description"
            name="description"
            label="Description"
            error={errors.description}
            touched={touched.description}
            required
          >
            <TextArea
              id="description"
              name="description"
              value={values.description || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={5}
              disabled={loading}
            />
          </FormField>
          {!isEdit && (
            <FormField
              id="type"
              name="type"
              label="Goal Type"
              error={errors.type}
              touched={touched.type}
              required
            >
              <Select
                id="type"
                name="type"
                value={values.type || ''}
                onChange={(e) => setFieldValue('type', e)}
                onBlur={handleBlur}
                options={[
                  { label: 'BHAG', value: GoalType.BHAG },
                  { label: '3HAG', value: GoalType.THREE_HAG },
                  { label: '1HAG', value: GoalType.ONE_HAG },
                  { label: 'Quarterly', value: GoalType.QUARTERLY },
                ]}
                disabled={loading}
              />
            </FormField>
          )}
          {isEdit && (
            <FormField
              id="status"
              name="status"
              label="Status"
              error={errors.status}
              touched={touched.status}
              required
            >
              <Select
                id="status"
                name="status"
                value={values.status || ''}
                onChange={(e) => setFieldValue('status', e)}
                onBlur={handleBlur}
                options={[
                  { label: 'Draft', value: GoalStatus.DRAFT },
                  { label: 'Active', value: GoalStatus.ACTIVE },
                  { label: 'At Risk', value: GoalStatus.AT_RISK },
                  { label: 'Completed', value: GoalStatus.COMPLETED },
                  { label: 'Archived', value: GoalStatus.ARCHIVED },
                ]}
                disabled={loading}
              />
            </FormField>
          )}
        </FormSection>
        <FormRow>
          <FormColumn>
            <FormField
              id="startDate"
              name="startDate"
              label="Start Date"
              error={errors.startDate}
              touched={touched.startDate}
              required
            >
              <DatePicker
                id="startDate"
                name="startDate"
                value={values.startDate ? parseDate(values.startDate, 'yyyy-MM-dd') : null}
                onChange={(date) => setFieldValue('startDate', formatDate(date, 'yyyy-MM-dd'))}
                onBlur={handleBlur}
                dateFormat="mm/dd/yy"
                disabled={loading}
                fullWidth
              />
            </FormField>
          </FormColumn>
          <FormColumn>
            <FormField
              id="endDate"
              name="endDate"
              label="End Date"
              error={errors.endDate}
              touched={touched.endDate}
              required
            >
              <DatePicker
                id="endDate"
                name="endDate"
                value={values.endDate ? parseDate(values.endDate, 'yyyy-MM-dd') : null}
                onChange={(date) => setFieldValue('endDate', formatDate(date, 'yyyy-MM-dd'))}
                onBlur={handleBlur}
                dateFormat="mm/dd/yy"
                disabled={loading}
                fullWidth
              />
            </FormField>
          </FormColumn>
        </FormRow>
        <FormField
          id="metricIds"
          name="metricIds"
          label="Linked Metrics"
        >
          <MultiSelect
            id="metricIds"
            name="metricIds"
            value={values.metricIds || []}
            options={availableMetrics}
            onChange={(e) => setFieldValue('metricIds', e.value)}
            style={{ width: '100%' }}
            disabled={loading}
          />
        </FormField>
        <ButtonContainer>
          <Button label="Cancel" onClick={onCancel} disabled={loading} />
          <Button label={isEdit ? "Update" : "Create"} onClick={onSubmit} loading={loading} />
        </ButtonContainer>
      </FormContainer>
    </Card>
  );
};

export default GoalEditor;