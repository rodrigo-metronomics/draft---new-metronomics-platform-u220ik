import React, { useState, useEffect, useCallback } from 'react'; // react@^18.2.0
import styled from 'styled-components'; // ^5.3.10
import Dialog from 'primereact/dialog'; // ^10.0.0
import FormField from '../common/FormField';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import {
  KFFMConnection,
  KFFMNode,
  ConnectionType,
  CreateKFFMConnectionDto,
  UpdateKFFMConnectionDto,
} from '../../types/kffm.types';
import { ID } from '../../types/common.types';
import { useKFFM } from '../../hooks/useKFFM';

/**
 * Interface defining the props for the ConnectionEditor component
 */
interface ConnectionEditorProps {
  connection: KFFMConnection | null;
  kffmId: ID;
  nodes: KFFMNode[];
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  isCreating: boolean;
}

/**
 * Interface for node options in the select dropdown
 */
interface NodeOption {
  value: ID;
  label: string;
  type: string;
}

/**
 * Interface for connection type options in the select dropdown
 */
interface ConnectionTypeOption {
  value: ConnectionType;
  label: string;
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
 * Styled component for the connection type indicator
 */
const ConnectionTypeIndicator = styled.div<{ connectionType: ConnectionType }>`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  background-color: ${props => {
    switch (props.connectionType) {
      case ConnectionType.DIRECT:
        return 'green';
      case ConnectionType.SUPPORTING:
        return 'blue';
      case ConnectionType.DEPENDENT:
        return 'red';
      default:
        return 'gray';
    }
  }};
`;

/**
 * Component for creating and editing KFFM connections between nodes
 */
const ConnectionEditor: React.FC<ConnectionEditorProps> = ({
  connection,
  kffmId,
  nodes,
  isOpen,
  onClose,
  onSave,
  isCreating,
}) => {
  // Destructure props to extract connection, kffmId, nodes, isOpen, onClose, onSave, and isCreating
  // Initialize form state using useKFFMConnectionForm hook
  const {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useKFFM().useKFFMConnectionForm(
    connection
      ? {
          label: connection.label,
          type: connection.type,
          kffmId: connection.kffmId,
          sourceNodeId: connection.sourceNodeId,
          targetNodeId: connection.targetNodeId,
        }
      : {
          label: '',
          type: ConnectionType.DIRECT,
          kffmId: kffmId,
          sourceNodeId: '',
          targetNodeId: '',
        }
  );

  // Format nodes data for source and target node selection dropdowns
  const nodeOptions: NodeOption[] = nodes.map((node) => ({
    value: node.id,
    label: node.title,
    type: node.type,
  }));

  // Define connection type options for the select dropdown
  const connectionTypeOptions: ConnectionTypeOption[] = [
    { value: ConnectionType.DIRECT, label: 'Direct' },
    { value: ConnectionType.SUPPORTING, label: 'Supporting' },
    { value: ConnectionType.DEPENDENT, label: 'Dependent' },
  ];

  // Initialize createConnection and updateConnection mutations from useKFFM hook
  const { createKFFMConnection, updateKFFMConnection } = useKFFM();

  // Handle form submission
  const onSubmit = useCallback(async () => {
    if (connection) {
      // Update existing connection
      await updateKFFMConnection({
        id: connection.id,
        connectionData: {
          label: values.label,
          type: values.type,
        },
      });
    } else {
      // Create new connection
      await createKFFMConnection({
        label: values.label,
        type: values.type,
        kffmId: kffmId,
        sourceNodeId: values.sourceNodeId,
        targetNodeId: values.targetNodeId,
      });
    }
    onSave();
    onClose();
  }, [values, connection, createKFFMConnection, updateKFFMConnection, kffmId, onClose, onSave]);

  // Handle form cancellation
  const onCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  // Render Dialog component with form fields
  return (
    <Dialog
      header={connection ? 'Edit Connection' : 'Create Connection'}
      visible={isOpen}
      style={{ width: '50vw' }}
      onHide={onCancel}
      footer={
        <FormActions>
          <Button label="Cancel" onClick={onCancel} />
          <Button
            label="Save"
            onClick={handleSubmit(onSubmit)}
            loading={isSubmitting}
          />
        </FormActions>
      }
    >
      <FormContainer>
        <FormField
          id="label"
          name="label"
          label="Label"
          error={touched.label && errors.label ? errors.label : undefined}
          touched={touched.label}
          required
        >
          <Input
            id="label"
            name="label"
            value={values.label || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField
          id="type"
          name="type"
          label="Connection Type"
          error={touched.type && errors.type ? errors.type : undefined}
          touched={touched.type}
          required
        >
          <Select
            id="type"
            name="type"
            value={values.type || ''}
            options={connectionTypeOptions.map((option) => ({
              value: option.value,
              label: (
                <span>
                  <ConnectionTypeIndicator connectionType={option.value} />
                  {option.label}
                </span>
              ),
            }))}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
          />
        </FormField>
        <FormField
          id="sourceNodeId"
          name="sourceNodeId"
          label="Source Node"
          error={
            touched.sourceNodeId && errors.sourceNodeId
              ? errors.sourceNodeId
              : undefined
          }
          touched={touched.sourceNodeId}
          required
        >
          <Select
            id="sourceNodeId"
            name="sourceNodeId"
            value={values.sourceNodeId || ''}
            options={nodeOptions}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting || !isCreating}
          />
        </FormField>
        <FormField
          id="targetNodeId"
          name="targetNodeId"
          label="Target Node"
          error={
            touched.targetNodeId && errors.targetNodeId
              ? errors.targetNodeId
              : undefined
          }
          touched={touched.targetNodeId}
          required
        >
          <Select
            id="targetNodeId"
            name="targetNodeId"
            value={values.targetNodeId || ''}
            options={nodeOptions}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting || !isCreating}
          />
        </FormField>
      </FormContainer>
    </Dialog>
  );
};

export default ConnectionEditor;