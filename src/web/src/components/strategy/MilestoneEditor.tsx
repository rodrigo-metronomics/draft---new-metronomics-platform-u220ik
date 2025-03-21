import React, { useState, useEffect, useCallback, useRef } from 'react'; // react@^18.2.0
import styled from 'styled-components'; // styled-components@^5.3.10
import { Toast } from 'primereact/toast'; // primereact/toast@^10.0.0

import {
  Milestone,
  MilestoneStatus,
  CreateMilestoneFormData,
  UpdateMilestoneFormData,
} from '../../types/goal.types';
import { ID } from '../../types/common.types';
import useGoals from '../../hooks/useGoals';
import useForm from '../../hooks/useForm';
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
} from '../../utils/helpers/validationHelper';
import { formatDate, parseDate } from '../../utils/helpers/dateTimeHelper';

/**
 * Interface for the MilestoneEditor component props
 */
interface MilestoneEditorProps {
  milestoneId?: ID;
  goalId: ID;
  isEdit?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Styled components for layout and styling
 */
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 600px;
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
 * Component for creating and editing milestones associated with strategic goals
 */
const MilestoneEditor: React.FC<MilestoneEditorProps> = ({
  milestoneId,
  goalId,
  isEdit = false,
  onSuccess = () => {},
  onCancel = () => {},
}) => {
  // Get milestone management functions from useGoals hook
  const { createMilestone, updateMilestone, getMilestone } = useGoals();

  // Initialize toast reference for notifications
  const toast = useRef<Toast>(null);

  // Initialize state for loading milestone data
  const [loading, setLoading] = useState(false);

  // Define validation rules for milestone form fields
  const validationRules = {
    title: { required: true, minLength: 3 },
    description: { required: true, minLength: 10 },
    dueDate: { required: true, isDate: true },
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
  } = useForm<CreateMilestoneFormData | UpdateMilestoneFormData>({
    initialValues: {
      title: '',
      description: '',
      dueDate: '',
      goalId: goalId,
    },
    validationRules,
    onSubmit: async (formData) => {
      try {
        setLoading(true);
        if (isEdit && milestoneId) {
          // Update existing milestone
          await updateMilestone.mutateAsync({
            id: milestoneId,
            data: formData as UpdateMilestoneFormData,
          });
          toast.current?.show({
            severity: 'success',
            summary: 'Milestone Updated',
            detail: 'Milestone updated successfully',
            life: 3000,
          });
        } else {
          // Create new milestone
          await createMilestone.mutateAsync(formData as CreateMilestoneFormData);
          toast.current?.show({
            severity: 'success',
            summary: 'Milestone Created',
            detail: 'Milestone created successfully',
            life: 3000,
          });
        }
        onSuccess();
      } catch (error: any) {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: error.message || 'Failed to save milestone',
          life: 3000,
        });
      } finally {
        setLoading(false);
      }
    },
  });

  // Fetch milestone data if in edit mode
  useEffect(() => {
    if (isEdit && milestoneId) {
      setLoading(true);
      getMilestone
        .getMilestone(milestoneId)
        .then((response) => {
          if (response.data) {
            const milestone = response.data;
            setFieldValue('title', milestone.title);
            setFieldValue('description', milestone.description);
            setFieldValue('dueDate', formatDate(milestone.dueDate, 'MM/dd/yyyy'));
            if ('status' in milestone) {
              setFieldValue('status', milestone.status);
            }
          }
        })
        .catch((error) => {
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to load milestone',
            life: 3000,
          });
        })
        .finally(() => setLoading(false));
    }
  }, [isEdit, milestoneId, getMilestone, setFieldValue]);

  // Define form submission handler
  const onSubmit = () => {
    handleSubmit({} as React.FormEvent);
  };

  // Render form with appropriate fields based on isEdit flag
  return (
    <Card title={isEdit ? 'Edit Milestone' : 'Create Milestone'}>
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

          <FormField
            id="dueDate"
            name="dueDate"
            label="Due Date"
            error={errors.dueDate}
            touched={touched.dueDate}
            required
          >
            <DatePicker
              id="dueDate"
              name="dueDate"
              value={parseDate(values.dueDate, 'MM/dd/yyyy') || null}
              onChange={(date) => {
                setFieldValue('dueDate', formatDate(date, 'MM/dd/yyyy'));
              }}
              onBlur={handleBlur}
              dateFormat="MM/dd/yyyy"
              disabled={loading}
            />
          </FormField>

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
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                options={[
                  { label: 'Pending', value: MilestoneStatus.PENDING },
                  { label: 'In Progress', value: MilestoneStatus.IN_PROGRESS },
                  { label: 'Completed', value: MilestoneStatus.COMPLETED },
                  { label: 'Missed', value: MilestoneStatus.MISSED },
                ]}
              />
            </FormField>
          )}
        </FormSection>

        <ButtonContainer>
          <Button
            label="Cancel"
            onClick={onCancel}
            disabled={loading}
            variant="tertiary"
          />
          <Button
            label={isEdit ? 'Update' : 'Create'}
            onClick={onSubmit}
            loading={loading}
          />
        </ButtonContainer>
      </FormContainer>
    </Card>
  );
};

export default MilestoneEditor;