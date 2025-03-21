import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { ColorPicker } from 'primereact/colorpicker'; // ^10.0.0
import { Slider } from 'primereact/slider'; // ^10.0.0

import FormField from '../common/FormField';
import Input from '../common/Input';
import Card from '../common/Card';
import Button from '../common/Button';

import { 
  THRESHOLD_TYPES, 
  DEFAULT_THRESHOLDS 
} from '../../utils/constants/metricTypes';
import { 
  validateRequired, 
  validateNumber, 
  validateMinValue, 
  validateMaxValue 
} from '../../utils/helpers/validationHelper';
import { 
  MetricThreshold, 
  CreateMetricThresholdDto, 
  ThresholdType, 
  MetricType 
} from '../../types/metric.types';

// Interfaces
interface MetricThresholdEditorProps {
  initialThresholds: CreateMetricThresholdDto[];
  onThresholdsChange: (thresholds: CreateMetricThresholdDto[]) => void;
  metricType: MetricType;
  errors: Record<string, string>;
}

interface ThresholdValidationRules {
  value: Record<string, (value: any) => string | null>;
}

// Styled components
const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
`;

const ThresholdGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
  width: 100%;
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ThresholdHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ThresholdTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
`;

const ThresholdContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ColorPickerContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ColorPreview = styled.div<{ color: string }>`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background-color: ${props => props.color};
  border: 1px solid #ddd;
`;

const ThresholdPreview = styled.div`
  margin-top: 1.5rem;
  padding: 1.5rem;
  background-color: #f9f9f9;
  border-radius: 8px;
`;

const PreviewScale = styled.div`
  position: relative;
  height: 8px;
  background: linear-gradient(to right, #e0e0e0, #e0e0e0);
  border-radius: 4px;
  margin: 2rem 0;
`;

const ThresholdMarker = styled.div<{ position: number; color: string }>`
  position: absolute;
  left: ${props => props.position}%;
  transform: translateX(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: ${props => props.color};
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  top: -2px;
`;

const ThresholdLabel = styled.div<{ position: number }>`
  position: absolute;
  left: ${props => props.position}%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: #666;
  top: -20px;
  white-space: nowrap;
`;

const AddThresholdButton = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
`;

/**
 * Helper function to get available threshold types not yet defined
 * 
 * @param currentThresholds - Array of currently defined thresholds
 * @returns Array of available threshold type options
 */
const getThresholdTypeOptions = (currentThresholds: CreateMetricThresholdDto[]) => {
  // Get all threshold types
  const allThresholdTypes = Object.values(THRESHOLD_TYPES);
  
  // Filter out types that are already defined
  const definedTypes = currentThresholds.map(t => t.type);
  const availableTypes = allThresholdTypes.filter(type => !definedTypes.includes(type as ThresholdType));
  
  // Convert to options format
  return availableTypes.map(type => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1)
  }));
};

/**
 * Helper function to get default value for a threshold type
 * 
 * @param thresholdType - The type of threshold
 * @param metricType - The type of metric
 * @returns Default threshold value
 */
const getDefaultThresholdValue = (thresholdType: ThresholdType, metricType: MetricType): number => {
  // For percentage metrics, ensure values are between 0-100
  if (metricType === MetricType.PERCENTAGE) {
    switch (thresholdType) {
      case ThresholdType.TARGET:
        return 100; // Target is 100% by default for percentage metrics
      case ThresholdType.WARNING:
        return 80;  // Warning at 80% by default
      case ThresholdType.CRITICAL:
        return 60;  // Critical at 60% by default
    }
  }
  
  // For other metric types, use the default values from constants
  return DEFAULT_THRESHOLDS[thresholdType].value;
};

/**
 * Helper function to get default color for a threshold type
 * 
 * @param thresholdType - The type of threshold
 * @returns Default color hex code
 */
const getDefaultThresholdColor = (thresholdType: ThresholdType): string => {
  return DEFAULT_THRESHOLDS[thresholdType].color;
};

/**
 * Component for editing metric thresholds
 * 
 * Allows users to define target, warning, and critical thresholds with custom values and colors
 * for visual representation in dashboards and charts.
 */
const MetricThresholdEditor: React.FC<MetricThresholdEditorProps> = ({
  initialThresholds,
  onThresholdsChange,
  metricType,
  errors
}) => {
  // State for thresholds
  const [thresholds, setThresholds] = useState<CreateMetricThresholdDto[]>(
    initialThresholds?.length > 0 
      ? initialThresholds 
      : [
          {
            type: ThresholdType.TARGET,
            value: getDefaultThresholdValue(ThresholdType.TARGET, metricType),
            color: getDefaultThresholdColor(ThresholdType.TARGET)
          }
        ]
  );

  // Set up validation rules based on metric type
  const getValidationRules = useCallback(() => {
    return {
      value: {
        required: (value: any) => validateRequired(value, 'Value'),
        number: (value: any) => validateNumber(value, 'Value'),
        range: (value: any) => {
          if (metricType === MetricType.PERCENTAGE) {
            const minError = validateMinValue(value, 0, 'Value');
            if (minError) return minError;
            
            const maxError = validateMaxValue(value, 100, 'Value');
            if (maxError) return maxError;
          }
          return null;
        }
      }
    };
  }, [metricType]);

  const [validationRules, setValidationRules] = useState<ThresholdValidationRules>(getValidationRules());

  // Update validation rules when metric type changes
  useEffect(() => {
    setValidationRules(getValidationRules());
  }, [metricType, getValidationRules]);

  // Update parent component when thresholds change
  useEffect(() => {
    onThresholdsChange(thresholds);
  }, [thresholds, onThresholdsChange]);

  // Handle threshold value change
  const handleValueChange = (index: number, value: string) => {
    const newThresholds = [...thresholds];
    newThresholds[index].value = Number(value);
    setThresholds(newThresholds);
  };

  // Handle threshold color change
  const handleColorChange = (index: number, hexValue: string) => {
    const newThresholds = [...thresholds];
    // Ensure the color has a '#' prefix
    const color = hexValue.startsWith('#') ? hexValue : `#${hexValue}`;
    newThresholds[index].color = color;
    setThresholds(newThresholds);
  };

  // Add a new threshold
  const handleAddThreshold = () => {
    // Get next available threshold type
    const availableTypes = getThresholdTypeOptions(thresholds);
    if (availableTypes.length > 0) {
      const nextType = availableTypes[0].value as ThresholdType;
      const newThreshold: CreateMetricThresholdDto = {
        type: nextType,
        value: getDefaultThresholdValue(nextType, metricType),
        color: getDefaultThresholdColor(nextType)
      };
      setThresholds([...thresholds, newThreshold]);
    }
  };

  // Remove a threshold
  const handleRemoveThreshold = (index: number) => {
    const newThresholds = [...thresholds];
    newThresholds.splice(index, 1);
    setThresholds(newThresholds);
  };

  // Calculate position for a threshold marker in the preview
  const calculateThresholdPosition = (value: number): number => {
    if (metricType === MetricType.PERCENTAGE) {
      // For percentage metrics, directly use the percentage value (0-100 scale)
      return value;
    } else {
      // For other metrics, calculate relative to the highest threshold value
      const maxValue = Math.max(...thresholds.map(t => t.value), 1); // Avoid division by zero
      return (value / maxValue) * 100;
    }
  };

  // Sort thresholds for display in the preview
  const sortedThresholds = [...thresholds].sort((a, b) => b.value - a.value);

  return (
    <EditorContainer>
      <ThresholdGrid>
        {thresholds.map((threshold, index) => (
          <Card
            key={`${threshold.type}-${index}`}
            title={threshold.type.charAt(0).toUpperCase() + threshold.type.slice(1)} 
            actions={
              thresholds.length > 1 && (
                <Button 
                  variant="tertiary" 
                  onClick={() => handleRemoveThreshold(index)}
                  aria-label={`Remove ${threshold.type} threshold`}
                  icon={<span>×</span>}
                  size="small"
                />
              )
            }
          >
            <ThresholdContent>
              <FormField
                id={`threshold-${index}-value`}
                name={`thresholds[${index}].value`}
                label="Value"
                error={errors?.[`thresholds[${index}].value`]}
                touched={true}
                required
              >
                <Input
                  id={`threshold-${index}-value`}
                  name={`thresholds[${index}].value`}
                  type="number"
                  value={threshold.value}
                  onChange={(e) => handleValueChange(index, e.target.value)}
                  hasError={!!errors?.[`thresholds[${index}].value`]}
                  fullWidth
                />
              </FormField>

              <FormField
                id={`threshold-${index}-color`}
                name={`thresholds[${index}].color`}
                label="Color"
                touched={true}
                required
              >
                <ColorPickerContainer>
                  <ColorPreview color={threshold.color} />
                  <ColorPicker
                    id={`threshold-${index}-color`}
                    value={threshold.color.replace('#', '')}
                    onChange={(e) => handleColorChange(index, e.value)}
                    format="hex"
                  />
                </ColorPickerContainer>
              </FormField>
            </ThresholdContent>
          </Card>
        ))}
      </ThresholdGrid>

      {thresholds.length < Object.keys(THRESHOLD_TYPES).length && (
        <AddThresholdButton>
          <Button
            label="Add Threshold"
            icon={<span>+</span>}
            onClick={handleAddThreshold}
            variant="secondary"
          />
        </AddThresholdButton>
      )}

      {thresholds.length > 0 && (
        <ThresholdPreview>
          <h4>Threshold Preview</h4>
          <PreviewScale>
            {sortedThresholds.map((threshold, index) => (
              <React.Fragment key={`marker-${threshold.type}`}>
                <ThresholdLabel position={calculateThresholdPosition(threshold.value)}>
                  {threshold.value}{metricType === MetricType.PERCENTAGE ? '%' : ''}
                </ThresholdLabel>
                <ThresholdMarker
                  position={calculateThresholdPosition(threshold.value)}
                  color={threshold.color}
                />
              </React.Fragment>
            ))}
          </PreviewScale>
        </ThresholdPreview>
      )}
    </EditorContainer>
  );
};

export default MetricThresholdEditor;