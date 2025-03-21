import React, { useState, useEffect, useCallback } from 'react'; // react@^18.0.0
import styled from 'styled-components'; // ^5.3.10

import FormField from '../common/FormField';
import Input from '../common/Input';
import DatePicker from '../common/DatePicker';
import TextArea from '../common/TextArea';
import Button from '../common/Button';
import { CreateMetricValueDto, MetricType } from '../../types/metric.types';
import useMetrics from '../../hooks/useMetrics';
import { validateRequired, validateNumber, validatePositiveNumber } from '../../utils/helpers/validationHelper';
import { formatMetricValue } from '../../utils/helpers/formatHelper';
import useForm from '../../hooks/useForm';
import { Size } from '../../types/common.types';

/**
 * Interface for the props of the MetricValueEditor component
 */
interface MetricValueEditorProps {
  metricId: string;
  metricType: MetricType;
  metricUnit: string;
  onSuccess: () => void;
  onCancel: () => void;
  initialValue?: Partial<CreateMetricValueDto>;
}

/**
 * Interface for the form data of the MetricValueEditor component
 */
interface MetricValueFormData {
  value: string;
  timestamp: Date;
  note: string | null;
}

/**
 * Styled component for the form container
 */
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

/**
 * Styled component for a row in the form
 */
const FormRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

/**
 * Styled component for a column in the form
 */
const FormColumn = styled.div`
  flex: 1;
  min-width: 0;
`;

/**
 * Styled component for the button container
 */
const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

/**
 * Component for adding or editing metric values
 */
const MetricValueEditor: React.FC<MetricValueEditorProps> = ({
  metricId,
  metricType,
  metricUnit,
  onSuccess,
  onCancel,
  initialValue,
}) => {
  // Get initial form values
  const initialValues = getInitialValues(initialValue);

  // Get validation rules based on metric type
  const validationRules = getValidationRules(metricType);

  // Use the useForm hook to manage form state and validation
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldTouched,
  } = useForm<MetricValueFormData>({
    initialValues,
    validationRules,
    onSubmit: async (formData: MetricValueFormData) => {
      try {
        // Create a new metric value
        await recordMetricValue.mutateAsync({
          metricId: metricId,
          valueData: {
            value: parseFloat(formData.value),
            timestamp: formData.timestamp.toISOString(),
            metricId: metricId,
            note: formData.note,
          },
        });

        // Call the onSuccess callback
        onSuccess();
      } catch (error) {
        console.error('Failed to record metric value', error);
      }
    },
  });

  // Get the recordMetricValue mutation from the useMetrics hook
  const { recordMetricValue } = useMetrics();

  // Format the displayed value according to the metric type
  const formattedValue = formatMetricValue(
    values.value,
    metricType,
    metricUnit
  );

  return (
    <form onSubmit={handleSubmit}>
      <FormContainer>
        <FormRow>
          <FormColumn>
            <FormField
              id="value"
              name="value"
              label="Value"
              error={errors.value}
              touched={touched.value}
              required
            >
              <Input
                type="text"
                id="value"
                name="value"
                value={values.value}
                placeholder={`Enter ${metricType.toLowerCase()} value`}
                onChange={handleChange}
                onBlur={handleBlur}
                hasError={!!errors.value}
                disabled={isSubmitting}
              />
            </FormField>
          </FormColumn>
          <FormColumn>
            <FormField
              id="timestamp"
              name="timestamp"
              label="Timestamp"
              error={errors.timestamp}
              touched={touched.timestamp}
              required
            >
              <DatePicker
                id="timestamp"
                name="timestamp"
                value={values.timestamp}
                onChange={(date) => {
                  setFieldValue('timestamp', date);
                  setFieldTouched('timestamp', true);
                }}
                onBlur={handleBlur}
                dateFormat="mm/dd/yy"
                showTime
                disabled={isSubmitting}
                fullWidth
              />
            </FormField>
          </FormColumn>
        </FormRow>
        <FormField
          id="note"
          name="note"
          label="Note"
          error={errors.note}
          touched={touched.note}
        >
          <TextArea
            id="note"
            name="note"
            value={values.note || ''}
            placeholder="Add a note (optional)"
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            rows={3}
          />
        </FormField>
        <ButtonContainer>
          <Button
            label="Cancel"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          />
          <Button
            label="Save"
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
          />
        </ButtonContainer>
      </FormContainer>
    </form>
  );
};

/**
 * Helper function to get initial form values
 */
const getInitialValues = (initialValue?: Partial<CreateMetricValueDto>): MetricValueFormData => {
  return {
    value: initialValue?.value?.toString() || '',
    timestamp: initialValue?.timestamp ? new Date(initialValue.timestamp) : new Date(),
    note: initialValue?.note || null,
  };
};

/**
 * Helper function to get validation rules based on metric type
 */
const getValidationRules = (metricType: MetricType) => {
  const rules = {
    value: {
      required: true,
    },
    timestamp: {
      required: true,
    },
  };

  if (
    metricType === MetricType.NUMBER ||
    metricType === MetricType.PERCENTAGE ||
    metricType === MetricType.CURRENCY
  ) {
    rules.value = {
      ...rules.value,
      required: true,
      custom: (value: any) => {
        if (!/^-?\d*\.?\d+$/.test(value)) {
          return 'Value must be a valid number.';
        }
        return null;
      },
    };
  }

  if (metricType === MetricType.PERCENTAGE) {
    rules.value = {
      ...rules.value,
      custom: (value: any) => {
        const numValue = parseFloat(value);
        if (numValue < 0 || numValue > 100) {
          return 'Value must be between 0 and 100.';
        }
        return null;
      },
    };
  }

  if (metricType === MetricType.BOOLEAN) {
    rules.value = {
      ...rules.value,
      custom: (value: any) => {
        if (value !== '0' && value !== '1') {
          return 'Value must be 0 or 1.';
        }
        return null;
      },
    };
  }

  return rules;
};

export default MetricValueEditor;