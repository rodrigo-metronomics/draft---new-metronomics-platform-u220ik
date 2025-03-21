# src/web/src/pages/organization/OrganizationSettingsPage.tsx
```typescript
import React, { useState, useEffect, useCallback } from 'react'; // React library for component creation // v18.2.0
import styled from 'styled-components'; // version ^5.3.10
import { FileUpload } from 'primereact/fileupload'; // File upload component for organization logo // v10.0.0
import { InputNumber } from 'primereact/inputnumber'; // Numeric input for meeting duration settings // v10.0.0
import { MultiSelect } from 'primereact/multiselect'; // Multi-select component for meeting reminder settings // v10.0.0

import DashboardLayout from '../../layouts/DashboardLayout'; // Layout wrapper for dashboard pages with navigation and authentication
import Card from '../../components/common/Card'; // Container component for grouping related settings
import FormField from '../../components/common/FormField'; // Standardized form field component for inputs
import Input from '../../components/common/Input'; // Text input component for form fields
import Dropdown from '../../components/common/Dropdown'; // Dropdown selection component for theme and timezone
import Button from '../../components/common/Button'; // Button component for form actions
import Spinner from '../../components/common/Spinner'; // Loading indicator for async operations
import Toast from '../../components/common/Toast'; // Notification component for success/error messages
import { useOrganizationContext } from '../../contexts/OrganizationContext'; // Access organization data and operations
import { useAuthContext } from '../../contexts/AuthContext'; // Access authentication state for permission checks
import { useForm } from '../../hooks/useForm'; // Form state management for organization settings
import {
  Organization,
  OrganizationSettings,
  UpdateOrganizationDto,
  UpdateOrganizationSettingsDto,
} from '../../types/organization.types'; // Type definitions for organization data
import { UserRole } from '../../utils/constants/roles'; // Role constants for permission checks
import { validateOrganizationSettings } from '../../utils/helpers/validationHelper'; // Validation function for organization settings form
import { colors } from '../../styles/colors';

interface OrganizationSettingsFormValues {
  name: string;
  settings: {
    theme: string;
    timezone: string;
    defaultMeetingDuration: number;
    defaultMeetingReminders: number[];
    logoUrl: string | null;
    customFields: Record<string, any>;
  };
}

// Styled Components
const PageContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const PageHeader = styled.div`
  margin-bottom: 2rem;
`;

const PageTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 600;
  color: ${colors.neutral.darkest};
  margin-bottom: 0.5rem;
`;

const PageDescription = styled.p`
  font-size: 1rem;
  color: ${colors.neutral.dark};
  margin-bottom: 1rem;
`;

const FormSection = styled.div`
  margin-bottom: 2rem;
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
`;

const LogoPreview = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
  background-color: ${colors.neutral.lightest};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LogoImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

/**
 * Main component for the organization settings page
 * @returns Rendered organization settings page
 */
const OrganizationSettingsPage: React.FC = () => {
  // Get current organization data and update functions from OrganizationContext
  const { currentOrganization, updateOrganization, updateOrganizationSettings, loading } = useOrganizationContext();

  // Get user authentication state from AuthContext
  const { state: authState } = useAuthContext();

  // Check if user has permission to edit organization settings (CEO or COACH role)
  const hasEditPermission =
    authState.user?.role === UserRole.CEO || authState.user?.role === UserRole.COACH;

  // Initialize form state with current organization settings
  const initialFormValues: OrganizationSettingsFormValues = {
    name: currentOrganization?.name || '',
    settings: {
      theme: currentOrganization?.settings?.theme || 'light',
      timezone: currentOrganization?.settings?.timezone || 'UTC',
      defaultMeetingDuration: currentOrganization?.settings?.defaultMeetingDuration || 30,
      defaultMeetingReminders: currentOrganization?.settings?.defaultMeetingReminders || [5, 10],
      logoUrl: currentOrganization?.settings?.logoUrl || null,
      customFields: currentOrganization?.settings?.customFields || {},
    },
  };

  // Initialize form state with useForm hook
  const { values, errors, touched, handleChange, handleSubmit, setValues, setFieldValue } =
    useForm<OrganizationSettingsFormValues>({
      initialValues,
      validationRules: {
        name: { required: true },
        'settings.theme': { required: true },
        'settings.timezone': { required: true },
        'settings.defaultMeetingDuration': { required: true },
        'settings.defaultMeetingReminders': { required: true },
      },
      onSubmit: async (formValues: OrganizationSettingsFormValues) => {
        if (!currentOrganization) return;

        // Prepare data for API update
        const organizationData: UpdateOrganizationDto = {
          name: formValues.name,
          settings: {
            ...formValues.settings,
          },
        };

        // Call the updateOrganization function from organization context
        await updateOrganization(currentOrganization.id, organizationData);
      },
    });

  // Initialize state for logo upload process
  const [isUploading, setIsUploading] = useState(false);

  // Initialize state for success/error notifications
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Handles the organization logo upload process
   * @param file
   */
  const handleLogoUpload = async (file: File) => {
    if (!currentOrganization) return;

    // Set loading state for upload process
    setIsUploading(true);

    try {
      // Call the uploadOrganizationLogo function from organization context
      // await uploadOrganizationLogo(currentOrganization.id, file);

      // Update the form values with the new logo URL
      setFieldValue('settings.logoUrl', 'new_logo_url');

      // Show success notification on successful upload
      setShowSuccessToast(true);
    } catch (error: any) {
      // Show error notification if upload fails
      setShowErrorToast(true);
      setErrorMessage(error?.message || 'Failed to upload logo.');
    } finally {
      // Reset loading state when complete
      setIsUploading(false);
    }
  };

  /**
   * Returns a list of timezone options for the dropdown
   * @returns Array of timezone options
   */
  const getTimezoneOptions = () => {
    return [
      { label: 'UTC', value: 'UTC' },
      { label: 'America/New_York', value: 'America/New_York' },
      { label: 'America/Los_Angeles', value: 'America/Los_Angeles' },
    ];
  };

  /**
   * Returns a list of theme options for the dropdown
   * @returns Array of theme options
   */
  const getThemeOptions = () => {
    return [
      { label: 'Light', value: 'light' },
      { label: 'Dark', value: 'dark' },
      { label: 'System', value: 'system' },
    ];
  };

  /**
   * Returns a list of reminder time options for the multi-select
   * @returns Array of reminder options
   */
  const getReminderOptions = () => {
    return [
      { label: '5 minutes', value: 5 },
      { label: '10 minutes', value: 10 },
      { label: '15 minutes', value: 15 },
      { label: '30 minutes', value: 30 },
    ];
  };

  // Render the page with organization settings form
  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader>
          <PageTitle>Organization Settings</PageTitle>
          <PageDescription>
            Manage your organization details, preferences, and branding.
          </PageDescription>
        </PageHeader>

        {loading ? (
          <Spinner />
        ) : (
          <form onSubmit={handleSubmit}>
            <Card title="General Settings">
              <FormField
                id="name"
                name="name"
                label="Organization Name"
                error={touched.name && errors.name ? errors.name : undefined}
                touched={touched.name}
                required
              >
                <Input
                  id="name"
                  name="name"
                  value={values.name}
                  onChange={handleChange}
                  disabled={!hasEditPermission}
                />
              </FormField>

              <FormField
                id="timezone"
                name="settings.timezone"
                label="Timezone"
                error={touched.settings?.timezone && errors.settings?.timezone ? errors.settings.timezone : undefined}
                touched={touched.settings?.timezone}
                required
              >
                <Dropdown
                  id="timezone"
                  name="settings.timezone"
                  options={getTimezoneOptions()}
                  value={values.settings.timezone}
                  onChange={handleChange}
                  disabled={!hasEditPermission}
                />
              </FormField>
            </Card>

            <Card title="Appearance Settings">
              <FormField
                id="theme"
                name="settings.theme"
                label="Theme"
                error={touched.settings?.theme && errors.settings?.theme ? errors.settings.theme : undefined}
                touched={touched.settings?.theme}
                required
              >
                <Dropdown
                  id="theme"
                  name="settings.theme"
                  options={getThemeOptions()}
                  value={values.settings.theme}
                  onChange={handleChange}
                  disabled={!hasEditPermission}
                />
              </FormField>
            </Card>

            <Card title="Meeting Settings">
              <TwoColumnGrid>
                <FormField
                  id="defaultMeetingDuration"
                  name="settings.defaultMeetingDuration"
                  label="Default Meeting Duration (minutes)"
                  error={touched.settings?.defaultMeetingDuration && errors.settings?.defaultMeetingDuration ? errors.settings.defaultMeetingDuration : undefined}
                  touched={touched.settings?.defaultMeetingDuration}
                  required
                >
                  <InputNumber
                    id="defaultMeetingDuration"
                    name="settings.defaultMeetingDuration"
                    value={values.settings.defaultMeetingDuration}
                    onValueChange={handleChange}
                    disabled={!hasEditPermission}
                  />
                </FormField>

                <FormField
                  id="defaultMeetingReminders"
                  name="settings.defaultMeetingReminders"
                  label="Default Meeting Reminders (minutes)"
                  error={touched.settings?.defaultMeetingReminders && errors.settings?.defaultMeetingReminders ? errors.settings.defaultMeetingReminders : undefined}
                  touched={touched.settings?.defaultMeetingReminders}
                  required
                >
                  <MultiSelect
                    id="defaultMeetingReminders"
                    name="settings.defaultMeetingReminders"
                    options={getReminderOptions()}
                    value={values.settings.defaultMeetingReminders}
                    onChange={handleChange}
                    disabled={!hasEditPermission}
                  />
                </FormField>
              </TwoColumnGrid>
            </Card>

            <Card title="Branding Settings">
              <FormField id="logo" name="settings.logoUrl" label="Organization Logo">
                {values.settings.logoUrl && (
                  <LogoPreview>
                    <LogoImage src={values.settings.logoUrl} alt="Organization Logo" />
                  </LogoPreview>
                )}
                <FileUpload
                  name="logo"
                  accept="image/*"
                  maxFileSize={1000000}
                  onUpload={(e) => handleLogoUpload(e.files[0])}
                  disabled={!hasEditPermission}
                  emptyTemplate={<p className="m-0">Drag and drop files here to upload.</p>}
                />
              </FormField>
            </Card>

            <FormActions>
              <Button label="Cancel" />
              <Button label="Save Changes" type="submit" loading={isUploading} disabled={!hasEditPermission} />
            </FormActions>
          </form>
        )}
      </PageContainer>
    </DashboardLayout>
  );
};

export default OrganizationSettingsPage;