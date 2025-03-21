import React, { useState, useEffect, useCallback } from 'react'; // ^18.2.0
import styled from 'styled-components'; // ^5.3.10

import FormField from '../common/FormField';
import Input from '../common/Input';
import Select from '../common/Select';
import TextArea from '../common/TextArea';
import {
  METRIC_TYPES,
  COMPARISON_TYPES,
  CALCULATION_METHODS,
  METRIC_UNITS,
} from '../../utils/constants/metricTypes';
import {
  validateRequired,
  validateMinLength,
  validateMaxLength,
} from '../../utils/helpers/validationHelper';
import useForm from '../../hooks/useForm';
import useTeams from '../../hooks/useTeams';
import useGoals from '../../hooks/useGoals';
import {
  CreateMetricFormData,
  MetricType,
  ComparisonType,
  CalculationMethod,
} from '../../types/metric.types';

// Define styled components for layout and styling
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
`;

const FormRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1rem;
  width: 100%;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const FormColumn = styled.div`
  flex: 1;
  min-width: 0;
`;

/**
 * Interface for the MetricForm component props
 */
interface MetricFormProps {
  initialValues: CreateMetricFormData;
  onSubmit: (values: CreateMetricFormData) => void;
  errors: Record<string, string>;
  isEditing: boolean;
}

/**
 * Form component for creating and editing metrics
 */
const MetricForm: React.FC<MetricFormProps> = ({
  initialValues,
  onSubmit,
  errors: propErrors,
  isEditing,
}) => {
  // Define form validation rules
  const validationRules = {
    name: {
      required: true,
      minLength: 3,
      maxLength: 255,
    },
    description: {
      required: false,
      maxLength: 1000,
    },
    type: {
      required: true,
    },
    unit: {
      required: true,
    },
    comparisonType: {
      required: true,
    },
    calculationMethod: {
      required: true,
    },
    formula: {
      required: () =>
        values.calculationMethod === CalculationMethod.FORMULA
          ? 'Formula is required when calculation method is FORMULA'
          : undefined,
    },
  };

  // Initialize form state using useForm hook
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
  } = useForm<CreateMetricFormData>({
    initialValues,
    validationRules,
    onSubmit,
  });

  // Fetch teams data using useTeams hook
  const { teamSummaries } = useTeams();

  // Fetch goals data using useGoals hook
  const { goals } = useGoals();

  // Local state for managing formula visibility
  const [showFormula, setShowFormula] = useState(
    values.calculationMethod === CalculationMethod.FORMULA
  );

  // Local state for managing available units based on metric type
  const [availableUnits, setAvailableUnits] = useState(
    getUnitOptions(values.type as MetricType)
  );

  // Create options arrays for dropdown selects
  const metricTypeOptions = getMetricTypeOptions();
  const comparisonTypeOptions = getComparisonTypeOptions();
  const calculationMethodOptions = getCalculationMethodOptions();
  const teamOptions = teamSummaries?.map((team) => ({
    value: team.id,
    label: team.name,
  }));
  const goalOptions = goals?.map((goal) => ({
    value: goal.id,
    label: goal.title,
  }));

  // Handle calculation method change
  const handleCalculationMethodChange = useCallback(
    (value: string) => {
      setFieldValue('calculationMethod', value);
      setShowFormula(value === CalculationMethod.FORMULA);
    },
    [setFieldValue]
  );

  // Handle metric type change
  const handleMetricTypeChange = useCallback(
    (value: string) => {
      setFieldValue('type', value);
      setAvailableUnits(getUnitOptions(value as MetricType));
    },
    [setFieldValue]
  );

  // Helper function to convert metric types to dropdown options
  const getMetricTypeOptions = () => {
    return Object.entries(METRIC_TYPES).map(([key, value]) => ({
      value: value,
      label: key,
    }));
  };

  // Helper function to convert comparison types to dropdown options
  const getComparisonTypeOptions = () => {
    return Object.entries(COMPARISON_TYPES).map(([key, value]) => ({
      value: value,
      label: key,
    }));
  };

  // Helper function to convert calculation methods to dropdown options
  const getCalculationMethodOptions = () => {
    return Object.entries(CALCULATION_METHODS).map(([key, value]) => ({
      value: value,
      label: key,
    }));
  };

  // Helper function to get unit options based on metric type
  const getUnitOptions = (metricType: MetricType) => {
    return Object.entries(METRIC_UNITS)
      .filter(([key, value]) => key.startsWith(metricType.toUpperCase()))
      .map(([key, value]) => ({
        value: value,
        label: key,
      }));
  };

  return (
    <FormContainer>
      <FormField
        id="name"
        name="name"
        label="Name"
        error={errors.name}
        touched={touched.name}
        required
      >
        <Input
          id="name"
          name="name"
          value={values.name || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter metric name"
          fullWidth
        />
      </FormField>

      <FormField
        id="description"
        name="description"
        label="Description"
        error={errors.description}
        touched={touched.description}
      >
        <TextArea
          id="description"
          name="description"
          value={values.description || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter metric description"
          rows={3}
          fullWidth
        />
      </FormField>

      <FormRow>
        <FormColumn>
          <FormField
            id="type"
            name="type"
            label="Type"
            error={errors.type}
            touched={touched.type}
            required
          >
            <Select
              id="type"
              name="type"
              value={values.type || ''}
              onChange={(value) => handleMetricTypeChange(value)}
              onBlur={handleBlur}
              options={metricTypeOptions}
              placeholder="Select metric type"
              fullWidth
            />
          </FormField>
        </FormColumn>

        <FormColumn>
          <FormField
            id="unit"
            name="unit"
            label="Unit"
            error={errors.unit}
            touched={touched.unit}
            required
          >
            <Select
              id="unit"
              name="unit"
              value={values.unit || ''}
              onChange={handleChange}
              onBlur={handleBlur}
              options={availableUnits}
              placeholder="Select unit"
              fullWidth
            />
          </FormField>
        </FormColumn>
      </FormRow>

      <FormField
        id="comparisonType"
        name="comparisonType"
        label="Comparison Type"
        error={errors.comparisonType}
        touched={touched.comparisonType}
        required
      >
        <Select
          id="comparisonType"
          name="comparisonType"
          value={values.comparisonType || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          options={comparisonTypeOptions}
          placeholder="Select comparison type"
          fullWidth
        />
      </FormField>

      <FormField
        id="calculationMethod"
        name="calculationMethod"
        label="Calculation Method"
        error={errors.calculationMethod}
        touched={touched.calculationMethod}
        required
      >
        <Select
          id="calculationMethod"
          name="calculationMethod"
          value={values.calculationMethod || ''}
          onChange={(value) => handleCalculationMethodChange(value)}
          onBlur={handleBlur}
          options={calculationMethodOptions}
          placeholder="Select calculation method"
          fullWidth
        />
      </FormField>

      {showFormula && (
        <FormField
          id="formula"
          name="formula"
          label="Formula"
          error={errors.formula}
          touched={touched.formula}
          required={showFormula}
        >
          <Input
            id="formula"
            name="formula"
            value={values.formula || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Enter formula"
            fullWidth
          />
        </FormField>
      )}

      {teamOptions && teamOptions.length > 0 && (
        <FormField
          id="teamId"
          name="teamId"
          label="Team"
          error={errors.teamId}
          touched={touched.teamId}
        >
          <Select
            id="teamId"
            name="teamId"
            value={values.teamId || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            options={teamOptions}
            placeholder="Select team"
            fullWidth
          />
        </FormField>
      )}

      {goalOptions && goalOptions.length > 0 && (
        <FormField
          id="goalId"
          name="goalId"
          label="Goal"
          error={errors.goalId}
          touched={touched.goalId}
        >
          <Select
            id="goalId"
            name="goalId"
            value={values.goalId || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            options={goalOptions}
            placeholder="Select goal"
            fullWidth
          />
        </FormField>
      )}

      <button type="submit" onClick={handleSubmit}>
        {isEditing ? 'Update Metric' : 'Create Metric'}
      </button>
    </FormContainer>
  );
};

// Export the MetricForm component
export default MetricForm;