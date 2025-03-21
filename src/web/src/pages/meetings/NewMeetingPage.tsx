import React, { useState, useEffect } from 'react'; // react@^18.2.0
import { useNavigate } from 'react-router-dom'; // react-router-dom@^6.3.0
import styled from 'styled-components'; // styled-components@^5.3.10
import { addMinutes } from 'date-fns'; // date-fns@^2.29.3

import { MeetingType, CreateMeetingDto } from '../../types/meeting.types';
import { CalendarProvider } from '../../types/calendar.types';
import useMeetings from '../../hooks/useMeetings';
import useCalendarSync from '../../hooks/useCalendarSync';
import useUsers from '../../hooks/useUsers';
import useForm from '../../hooks/useForm';
import { useOrganizationContext } from '../../contexts/OrganizationContext';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import FormField from '../../components/common/FormField';
import Input from '../../components/common/Input';
import TextArea from '../../components/common/TextArea';
import Select from '../../components/common/Select';
import DatePicker from '../../components/common/DatePicker';
import Spinner from '../../components/common/Spinner';
import Toast from '../../components/common/Toast';
import { ROUTES } from '../../utils/constants/routes';

/**
 * Interface defining the structure of the form values for creating a new meeting.
 * This includes title, description, meeting type, start and end times, participant and moderator IDs,
 * location, virtual meeting URL, and calendar synchronization options.
 */
interface NewMeetingFormValues {
  title: string;
  description: string;
  meetingType: MeetingType;
  startTime: Date;
  endTime: Date;
  participantIds: string[];
  moderatorIds: string[];
  location: string | null;
  virtualMeetingUrl: string | null;
  syncWithCalendar: boolean;
  calendarProvider: CalendarProvider | null;
}

/**
 * Interface defining the validation rules for the new meeting form.
 * Specifies which fields are required and any specific validation criteria (e.g., minimum length).
 */
interface ValidationRules {
  [key: string]: (value: any) => string | null;
}

/**
 * Styled component for the page container providing padding and a maximum width.
 */
const PageContainer = styled.div`
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
`;

/**
 * Styled component for the page header, including a title and back button.
 */
const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

/**
 * Styled component for the form container, providing spacing and layout.
 */
const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

/**
 * Styled component for a form section, grouping related form fields.
 */
const FormSection = styled.div`
  margin-bottom: 15px;
`;

/**
 * Styled component for a form row, arranging form fields side by side.
 */
const FormRow = styled.div`
  display: flex;
  gap: 20px;
`;

/**
 * Styled component for the button container, aligning buttons to the right.
 */
const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

/**
 * Component for creating a new meeting
 * @returns Rendered new meeting form page
 */
const NewMeetingPage: React.FC = () => {
  // Initialize navigation hook for redirecting after form submission
  const navigate = useNavigate();

  // Get current organization from context
  const { currentOrganization } = useOrganizationContext();

  // Initialize useMeetings hook to access createMeeting function
  const { createMeeting, isLoading: isMeetingsLoading } = useMeetings();

  // Initialize useCalendarSync hook to access calendar integration status
  const { calendarStatus } = useCalendarSync();

  // Initialize useUsers hook to fetch potential meeting participants
  const { users, isLoading: isUsersLoading } = useUsers();

  // Initialize state for form submission status and notifications
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);

  // Set up initial form values with default meeting properties
  const initialValues: NewMeetingFormValues = {
    title: '',
    description: '',
    meetingType: MeetingType.WEEKLY,
    startTime: addMinutes(new Date(), 60),
    endTime: addMinutes(new Date(), 120),
    participantIds: [],
    moderatorIds: [],
    location: null,
    virtualMeetingUrl: null,
    syncWithCalendar: false,
    calendarProvider: calendarStatus?.defaultProvider || null,
  };

  // Define validation rules for the meeting form fields
  const validationRules: ValidationRules = {
    title: (value: string) => (value ? null : 'Title is required'),
    startTime: (value: Date) => (value ? null : 'Start time is required'),
    endTime: (value: Date) => (value ? null : 'End time is required'),
    meetingType: (value: MeetingType) => (value ? null : 'Meeting type is required'),
  };

  // Initialize useForm hook with initial values, validation rules, and submit handler
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting,
    setFieldValue,
  } = useForm<NewMeetingFormValues>({
    initialValues,
    validationRules,
    onSubmit: async (formValues: NewMeetingFormValues) => {
      try {
        // Construct the create meeting DTO from form values
        const createMeetingDto: CreateMeetingDto = {
          title: formValues.title,
          description: formValues.description,
          meetingType: formValues.meetingType,
          startTime: formValues.startTime.toISOString(),
          endTime: formValues.endTime.toISOString(),
          organizationId: currentOrganization!.id,
          participantIds: formValues.participantIds,
          moderatorIds: formValues.moderatorIds,
          recurrenceRule: null,
          location: formValues.location,
          virtualMeetingUrl: formValues.virtualMeetingUrl,
          syncWithCalendar: formValues.syncWithCalendar,
        };

        // Call the createMeeting mutation
        await createMeeting.mutateAsync(createMeetingDto);

        // Set success state and redirect to meetings list
        setSubmissionSuccess(true);
        setTimeout(() => {
          navigate(ROUTES.MEETINGS.LIST);
        }, 2000);
      } catch (error: any) {
        // Set error state if submission fails
        setSubmissionError(error.message || 'Failed to create meeting');
      }
    },
  });

  // Implement handleCancel function to navigate back to meetings list
  const handleCancel = () => {
    navigate(ROUTES.MEETINGS.LIST);
  };

  // Implement useEffect to set default end time when start time changes
  useEffect(() => {
    if (values.startTime) {
      setFieldValue('endTime', addMinutes(values.startTime, 60));
    }
  }, [values.startTime, setFieldValue]);

  // Render form layout with Card component containing form fields
  return (
    <PageContainer>
      <Toast ref={(ref) => (window as any).toast = ref} />
      <PageHeader>
        <h2>Create New Meeting</h2>
      </PageHeader>
      <Card>
        <FormContainer onSubmit={handleSubmit}>
          <FormSection>
            <FormField
              id="title"
              name="title"
              label="Meeting Title"
              error={errors.title}
              touched={touched.title}
            >
              <Input
                id="title"
                name="title"
                value={values.title}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter meeting title"
                disabled={isSubmitting}
              />
            </FormField>
            <FormField
              id="description"
              name="description"
              label="Meeting Description"
              error={errors.description}
              touched={touched.description}
            >
              <TextArea
                id="description"
                name="description"
                value={values.description}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter meeting description"
                rows={3}
                disabled={isSubmitting}
              />
            </FormField>
            <FormField
              id="meetingType"
              name="meetingType"
              label="Meeting Type"
              error={errors.meetingType}
              touched={touched.meetingType}
            >
              <Select
                id="meetingType"
                name="meetingType"
                value={values.meetingType}
                onChange={(value) => setFieldValue('meetingType', value)}
                onBlur={handleBlur}
                options={[
                  { label: 'Daily', value: MeetingType.DAILY },
                  { label: 'Weekly', value: MeetingType.WEEKLY },
                  { label: 'Quarterly', value: MeetingType.QUARTERLY },
                ]}
                disabled={isSubmitting}
              />
            </FormField>
          </FormSection>
          <FormSection>
            <FormRow>
              <FormField
                id="startTime"
                name="startTime"
                label="Start Time"
                error={errors.startTime}
                touched={touched.startTime}
                fullWidth={false}
              >
                <DatePicker
                  id="startTime"
                  name="startTime"
                  value={values.startTime}
                  onChange={(date) => setFieldValue('startTime', date)}
                  onBlur={handleBlur}
                  showTime
                  dateFormat="MM/dd/yyyy hh:mm a"
                  disabled={isSubmitting}
                />
              </FormField>
              <FormField
                id="endTime"
                name="endTime"
                label="End Time"
                error={errors.endTime}
                touched={touched.endTime}
                fullWidth={false}
              >
                <DatePicker
                  id="endTime"
                  name="endTime"
                  value={values.endTime}
                  onChange={(date) => setFieldValue('endTime', date)}
                  onBlur={handleBlur}
                  showTime
                  dateFormat="MM/dd/yyyy hh:mm a"
                  disabled={isSubmitting}
                />
              </FormField>
            </FormRow>
          </FormSection>
          <FormSection>
            <FormField
              id="participantIds"
              name="participantIds"
              label="Participants"
              error={errors.participantIds}
              touched={touched.participantIds}
            >
              <Select
                id="participantIds"
                name="participantIds"
                value={values.participantIds}
                onChange={(value) => setFieldValue('participantIds', value)}
                onBlur={handleBlur}
                options={
                  users?.map((user) => ({
                    label: user.name,
                    value: user.id,
                  })) || []
                }
                multiple
                disabled={isSubmitting || isUsersLoading}
              />
            </FormField>
            <FormField
              id="moderatorIds"
              name="moderatorIds"
              label="Moderators"
              error={errors.moderatorIds}
              touched={touched.moderatorIds}
            >
              <Select
                id="moderatorIds"
                name="moderatorIds"
                value={values.moderatorIds}
                onChange={(value) => setFieldValue('moderatorIds', value)}
                onBlur={handleBlur}
                options={
                  users?.map((user) => ({
                    label: user.name,
                    value: user.id,
                  })) || []
                }
                multiple
                disabled={isSubmitting || isUsersLoading}
              />
            </FormField>
          </FormSection>
          <FormSection>
            <FormField
              id="location"
              name="location"
              label="Location"
              error={errors.location}
              touched={touched.location}
            >
              <Input
                id="location"
                name="location"
                value={values.location || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter meeting location"
                disabled={isSubmitting}
              />
            </FormField>
            <FormField
              id="virtualMeetingUrl"
              name="virtualMeetingUrl"
              label="Virtual Meeting URL"
              error={errors.virtualMeetingUrl}
              touched={touched.virtualMeetingUrl}
            >
              <Input
                id="virtualMeetingUrl"
                name="virtualMeetingUrl"
                value={values.virtualMeetingUrl || ''}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter virtual meeting URL"
                disabled={isSubmitting}
              />
            </FormField>
          </FormSection>
          {calendarStatus && (
            <FormSection>
              <FormField
                id="syncWithCalendar"
                name="syncWithCalendar"
                label="Sync with Calendar"
                error={errors.syncWithCalendar}
                touched={touched.syncWithCalendar}
              >
                <Checkbox
                  id="syncWithCalendar"
                  name="syncWithCalendar"
                  checked={values.syncWithCalendar}
                  onChange={(checked) => setFieldValue('syncWithCalendar', checked)}
                  disabled={isSubmitting}
                />
              </FormField>
            </FormSection>
          )}
          <ButtonContainer>
            <Button
              label="Cancel"
              onClick={handleCancel}
              disabled={isSubmitting}
              variant="secondary"
            />
            <Button
              label="Create Meeting"
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
            />
          </ButtonContainer>
        </FormContainer>
      </Card>
      {isSubmitting && <Spinner />}
      {submissionSuccess && (
        (window as any).toast.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Meeting created successfully',
          life: 3000,
        })
      )}
      {submissionError && (
        (window as any).toast.show({
          severity: 'error',
          summary: 'Error',
          detail: submissionError,
          life: 5000,
        })
      )}
    </PageContainer>
  );
};

/**
 * Styled component for the page container providing padding and a maximum width.
 */
const PageContainer = styled.div`
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
`;

/**
 * Styled component for the page header, including a title and back button.
 */
const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

/**
 * Styled component for the form container, providing spacing and layout.
 */
const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

/**
 * Styled component for a form section, grouping related form fields.
 */
const FormSection = styled.div`
  margin-bottom: 15px;
`;

/**
 * Styled component for a form row, arranging form fields side by side.
 */
const FormRow = styled.div`
  display: flex;
  gap: 20px;
`;

/**
 * Styled component for the button container, aligning buttons to the right.
 */
const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

export default NewMeetingPage;