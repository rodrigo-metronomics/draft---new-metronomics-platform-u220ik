import React, { useState, useEffect } from 'react'; // react@^18.2.0
import styled from 'styled-components'; // styled-components@^5.3.10

import Modal from '../common/Modal';
import FormField from '../common/FormField';
import Input from '../common/Input';
import Select from '../common/Select';
import DatePicker from '../common/DatePicker';
import TextArea from '../common/TextArea';
import Button from '../common/Button';
import {
  ActionItem,
  ActionItemPriority,
  CreateActionItemDto,
  UpdateActionItemDto,
} from '../../types/action-item.types';
import { User } from '../../types/user.types';
import { SelectOption } from '../../types/common.types';
import useForm from '../../hooks/useForm';
import useActionItems from '../../hooks/useActionItems';

/**
 * Interface for the props that ActionItemModal component accepts.
 */
interface ActionItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  meetingId: string;
  actionItem?: ActionItem;
  participants: User[];
  onActionItemSaved: () => void;
}

/**
 * Styled components for the ActionItemModal
 */
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

/**
 * Modal component for creating and editing action items during meetings
 */
const ActionItemModal: React.FC<ActionItemModalProps> = ({
  isOpen,
  onClose,
  meetingId,
  actionItem,
  participants,
  onActionItemSaved,
}) => {
  // Determine if we are in edit mode or create mode
  const isEditMode = !!actionItem;

  // Define validation rules for the form
  const validationRules = {
    description: { required: true },
    assigneeId: { required: true },
    priority: { required: true },
  };

  // Initialize the form using the useForm hook
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
  } = useForm({
    initialValues: {
      description: actionItem?.description || '',
      assigneeId: actionItem?.assigneeId || '',
      dueDate: actionItem?.dueDate || null,
      priority: actionItem?.priority || ActionItemPriority.MEDIUM,
      notes: actionItem?.notes || '',
    },
    validationRules,
    onSubmit: async (formValues) => {
      // Prepare action item data for submission
      const actionItemData = {
        ...formValues,
        meetingId: meetingId,
      };

      // Call the appropriate mutation based on edit/create mode
      if (isEditMode) {
        await updateActionItem.mutateAsync({
          id: actionItem.id,
          actionItemData: actionItemData as UpdateActionItemDto,
        });
      } else {
        await createActionItem.mutateAsync(actionItemData as CreateActionItemDto);
      }

      // Close the modal and refresh action items
      onClose();
      onActionItemSaved();
    },
  });

  // Transform participants array into select options
  const participantOptions: SelectOption[] = participants.map((user) => ({
    value: user.id,
    label: user.name,
  }));

  // Create priority options from ActionItemPriority enum
  const priorityOptions: SelectOption[] = Object.values(ActionItemPriority).map(
    (priority) => ({
      value: priority,
      label: priority.charAt(0).toUpperCase() + priority.slice(1), // Capitalize the first letter
    })
  );

  // Use the useActionItems hook to get the create and update action item mutations
  const { createActionItem, updateActionItem } = useActionItems();

  return (
    <Modal
      isOpen={isOpen}
      onHide={onClose}
      header={isEditMode ? 'Edit Action Item' : 'Create Action Item'}
    >
      <form onSubmit={handleSubmit}>
        <FormContainer>
          <FormField
            id="description"
            name="description"
            label="Description"
            error={errors.description}
            touched={touched.description}
            required
          >
            <Input
              id="description"
              name="description"
              value={values.description}
              onChange={handleChange}
              onBlur={handleBlur}
              fullWidth
            />
          </FormField>

          <FormField
            id="assigneeId"
            name="assigneeId"
            label="Assignee"
            error={errors.assigneeId}
            touched={touched.assigneeId}
            required
          >
            <Select
              id="assigneeId"
              name="assigneeId"
              value={values.assigneeId}
              onChange={(value) => setFieldValue('assigneeId', value)}
              onBlur={handleBlur}
              options={participantOptions}
              placeholder="Select Assignee"
              fullWidth
            />
          </FormField>

          <FormField
            id="dueDate"
            name="dueDate"
            label="Due Date"
          >
            <DatePicker
              id="dueDate"
              name="dueDate"
              value={values.dueDate}
              onChange={(date) => setFieldValue('dueDate', date)}
              onBlur={handleBlur}
              placeholder="Select Due Date"
              fullWidth
            />
          </FormField>

          <FormField
            id="priority"
            name="priority"
            label="Priority"
            error={errors.priority}
            touched={touched.priority}
            required
          >
            <Select
              id="priority"
              name="priority"
              value={values.priority}
              onChange={(value) => setFieldValue('priority', value)}
              onBlur={handleBlur}
              options={priorityOptions}
              placeholder="Select Priority"
              fullWidth
            />
          </FormField>

          <FormField
            id="notes"
            name="notes"
            label="Notes"
          >
            <TextArea
              id="notes"
              name="notes"
              value={values.notes}
              onChange={handleChange}
              onBlur={handleBlur}
              rows={3}
              fullWidth
            />
          </FormField>
        </FormContainer>

        <ButtonContainer>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Save
          </Button>
        </ButtonContainer>
      </form>
    </Modal>
  );
};

export default ActionItemModal;