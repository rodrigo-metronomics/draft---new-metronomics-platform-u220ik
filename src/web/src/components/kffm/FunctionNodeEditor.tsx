import React, { useState, useEffect, useCallback } from 'react'; // ^18.2.0
import styled, { css } from 'styled-components'; // ^5.3.10
import { MultiSelect } from 'primereact/multiselect'; // ^10.0.0
import { Dialog } from 'primereact/dialog'; // ^10.0.0

import FormField from '../common/FormField';
import Input from '../common/Input';
import TextArea from '../common/TextArea';
import Select from '../common/Select';
import Button from '../common/Button';
import {
  KFFMNode,
  NodeType,
  CreateKFFMNodeDto,
  UpdateKFFMNodeDto,
} from '../../types/kffm.types';
import { ID } from '../../types/common.types';
import { UserReference } from '../../types/user.types';
import { MetricReference } from '../../types/metric.types';
import { useKFFM } from '../../hooks/useKFFM';
import { useUsers } from '../../hooks/useUsers';
import { useMetrics } from '../../hooks/useMetrics';
import { useOrganizationContext } from '../../contexts/OrganizationContext';

/**
 * Interface for the props of the FunctionNodeEditor component
 */
interface FunctionNodeEditorProps {
  node: KFFMNode | null;
  kffmId: ID;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  isCreating: boolean;
}

/**
 * Interface for select options
 */
interface SelectOption {
  value: string | number;
  label: string;
}

/**
 * Interface for metric options
 */
interface MetricOption {
  value: ID;
  label: string;
  type: string;
}

/**
 * Styled component for the form container
 */
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

/**
 * Styled component for the form actions
 */
const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
`;

/**
 * Styled component for the MultiSelect component
 */
const StyledMultiSelect = styled(MultiSelect)<{ hasError?: boolean }>`
  width: 100%;
  ${(props) =>
    props.hasError &&
    css`
      border-color: red;
    `}
`;

/**
 * Component for creating and editing KFFM function nodes
 */
export const FunctionNodeEditor: React.FC<FunctionNodeEditorProps> = ({
  node,
  kffmId,
  isOpen,
  onClose,
  onSave,
  isCreating,
}) => {
  // Determine if we are creating or updating a node
  const isUpdate = !!node && !isCreating;

  // Define initial form values based on whether we are creating or updating
  const initialFormValues: CreateKFFMNodeDto | UpdateKFFMNodeDto = isCreating
    ? {
        title: '',
        description: '',
        type: NodeType.FUNCTION,
        kffmId: kffmId,
        ownerId: '',
        positionX: 0,
        positionY: 0,
        metricIds: [],
      }
    : {
        title: node?.title || '',
        description: node?.description || '',
        type: node?.type || NodeType.FUNCTION,
        ownerId: node?.ownerId || '',
        positionX: node?.positionX || 0,
        positionY: node?.positionY || 0,
        metricIds: node?.metrics?.map((m) => m.id) || [],
      };

  // Use the appropriate hook based on whether we are creating or updating
  const { useKFFMNodeForm } = useKFFM();
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
  } = useKFFMNodeForm(initialFormValues as CreateKFFMNodeDto);

  // Fetch users for owner selection
  const { users, isLoading: isUsersLoading } = useUsers();

  // Fetch metrics for metric selection
  const { metrics, isLoading: isMetricsLoading } = useMetrics();

  // Get current organization from context
  const { currentOrganization } = useOrganizationContext();

  // Get createKFFMNode and updateKFFMNode mutations from useKFFM hook
  const { createKFFMNode, updateKFFMNode } = useKFFM();

  // Format users for select component
  const userOptions: SelectOption[] = users?.map((user) => ({
    value: user.id,
    label: user.name,
  })) || [];

  // Format metrics for multi-select component
  const metricOptions: MetricOption[] = metrics?.map((metric) => ({
    value: metric.id,
    label: metric.name,
    type: metric.type,
  })) || [];

  // Handle form submission
  const handleSave = useCallback(() => {
    handleSubmit(async () => {
      if (currentOrganization) {
        const nodeData = {
          ...values,
          kffmId: kffmId,
          metricIds: values.metricIds || [],
        };

        if (isCreating) {
          await createKFFMNode(nodeData as CreateKFFMNodeDto);
        } else if (node) {
          await updateKFFMNode({ id: node.id, nodeData: nodeData as UpdateKFFMNodeDto });
        }

        onSave();
        onClose();
      }
    });
  }, [handleSubmit, currentOrganization, values, kffmId, createKFFMNode, updateKFFMNode, node, isCreating, onSave, onClose]);

  // Handle form cancellation
  const handleCancel = () => {
    onClose();
    resetForm();
  };

  // Define footer for the dialog
  const dialogFooter = (
    <FormActions>
      <Button label="Cancel" onClick={handleCancel} />
      <Button
        label="Save"
        onClick={handleSave}
        loading={isSubmitting}
      />
    </FormActions>
  );

  return (
    <Dialog
      header={isCreating ? 'Create Function Node' : 'Edit Function Node'}
      visible={isOpen}
      style={{ width: '50vw' }}
      onHide={onClose}
      footer={dialogFooter}
    >
      <FormContainer>
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
            rows={3}
            fullWidth
          />
        </FormField>

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
            onChange={handleChange}
            onBlur={handleBlur}
            options={[
              { label: 'Department', value: NodeType.DEPARTMENT },
              { label: 'Function', value: NodeType.FUNCTION },
              { label: 'Process', value: NodeType.PROCESS },
            ]}
            fullWidth
          />
        </FormField>

        <FormField
          id="ownerId"
          name="ownerId"
          label="Owner"
          error={errors.ownerId}
          touched={touched.ownerId}
          required
        >
          <Select
            id="ownerId"
            name="ownerId"
            value={values.ownerId || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            options={userOptions}
            placeholder="Select Owner"
            fullWidth
          />
        </FormField>

        <FormField
          id="metricIds"
          name="metricIds"
          label="Metrics"
        >
          <StyledMultiSelect
            id="metricIds"
            name="metricIds"
            value={values.metricIds || []}
            options={metricOptions}
            onChange={(e) => handleChange({ target: { name: 'metricIds', value: e.value } } as any)}
            placeholder="Select Metrics"
            display="chip"
            style={{ width: '100%' }}
          />
        </FormField>
      </FormContainer>
    </Dialog>
  );
};