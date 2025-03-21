import React, { useState, useEffect, useCallback } from 'react'; // version ^18.2.0
import styled from 'styled-components'; // version ^5.3.10

import Card from '../common/Card';
import Button from '../common/Button';
import FormField from '../common/FormField';
import Input from '../common/Input';
import Select from '../common/Select';
import Toast from '../common/Toast';
import { useUsers } from '../../hooks/useUsers';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from '../../hooks/useForm';
import {
  UserProfileResponse,
  UpdateUserDto,
  UpdateUserPreferencesDto,
} from '../../types/user.types';
import { validationHelper } from '../../utils/helpers/validationHelper';

/**
 * Interface defining the props for the UserProfile component
 */
interface UserProfileProps {
  userId: string;
  editable?: boolean;
  onUpdate?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Component for displaying and editing user profile information
 */
export const UserProfile: React.FC<UserProfileProps> = ({
  userId,
  editable = false,
  onUpdate,
  className,
  style,
}) => {
  // State variables for managing edit mode, loading states, and notifications
  const [isEditMode, setIsEditMode] = useState(editable);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [toastMessage, setToastMessage] useState<string | null>(null);

  // Access authentication state using the useAuth hook
  const { state: authState } = useAuth();

  // Access user data and update methods using the useUsers hook
  const { getCurrentUser, updateUser, uploadProfileImage, updateUserPreferences } = useUsers();

  // Access form state and validation methods using the useForm hook
  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setValues,
    handleSubmit: handleFormSubmit,
  } = useForm<UpdateUserDto>({
    initialValues: {
      firstName: '',
      lastName: '',
      role: '',
      photoURL: '',
      status: 'active',
    },
    validationRules: {
      firstName: { required: true },
      lastName: { required: true },
    },
    onSubmit: async (values) => {
      await handleSubmit(values);
    },
  });

  // Create a ref to the Toast component
  const toastRef = React.useRef<any>(null);

  // Fetch user profile data when the component mounts
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userProfile = await getCurrentUser().then(res => res?.firstName ? res : null);
        if (userProfile) {
          setValues({
            firstName: userProfile.firstName,
            lastName: userProfile.lastName,
            role: userProfile.role,
            photoURL: userProfile.photoURL || '',
            status: 'active',
          });
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        setToastMessage('Failed to load user profile.');
      }
    };

    fetchUserProfile();
  }, [getCurrentUser, setValues]);

  /**
   * Handles the submission of the profile edit form
   * @param values - The form values to submit
   */
  const handleSubmit = async (values: any) => {
    setIsEditMode(false);
    try {
      // Prepare update data object from form values
      const updateData: UpdateUserDto = {
        firstName: values.firstName,
        lastName: values.lastName,
        role: values.role,
        photoURL: values.photoURL,
        status: values.status,
      };

      // Call updateUser function from useUsers hook
      await updateUser().mutateAsync({ id: userId, userData: updateData });

      // Show success notification on successful update
      toastRef.current.success('Profile updated successfully!');

      // Exit edit mode after successful update
      setIsEditMode(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error: any) {
      // Handle any errors with error notification
      toastRef.current.error('Failed to update profile.');
    }
  };

  /**
   * Handles the upload of a new profile image
   * @param event - The file input change event
   */
  const handleProfileImageUpload = async (event: any) => {
    event.preventDefault();
    const file = event.target.files[0];

    if (!file) {
      toastRef.current.warn('No file selected.');
      return;
    }

    if (file.size > 5000000) {
      toastRef.current.error('File size exceeds 5MB.');
      return;
    }

    setIsImageLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await uploadProfileImage().mutateAsync(formData);

      setValues({ ...values, photoURL: response.photoURL });
      toastRef.current.success('Profile image uploaded successfully!');
    } catch (error: any) {
      toastRef.current.error('Failed to upload profile image.');
    } finally {
      setIsImageLoading(false);
    }
  };

  /**
   * Handles updates to user preferences
   * @param preferenceName - The name of the preference to update
   * @param value - The new value for the preference
   */
  const handlePreferenceUpdate = async (preferenceName: string, value: any) => {
    try {
      // Prepare preference update data object
      const preferences: UpdateUserPreferencesDto = {
        preferences: {
          [preferenceName]: value,
        },
      };

      // Call updateUserPreferences function from useUsers hook
      await updateUserPreferences().mutateAsync(preferences);

      // Show success notification on successful update
      toastRef.current.success('Preferences updated successfully!');
    } catch (error: any) {
      // Handle any errors with error notification
      toastRef.current.error('Failed to update preferences.');
    }
  };

  return (
    <ProfileContainer className={className} style={style}>
      <Toast ref={toastRef} />
      <Card>
        <ProfileHeader>
          <ProfileImageSection>
            <img
              src={values.photoURL || 'https://www.primefaces.org/wp-content/uploads/2023/02/avatar-jesse.png'}
              alt="Profile"
              width="120"
              height="120"
              style={{ borderRadius: '50%', objectFit: 'cover' }}
            />
            {isEditMode && (
              <ProfileImageUpload>
                <label htmlFor="profileImage">
                  <i className="pi pi-camera" style={{ cursor: 'pointer' }} />
                </label>
                <HiddenInput
                  type="file"
                  id="profileImage"
                  accept="image/*"
                  onChange={handleProfileImageUpload}
                />
              </ProfileImageUpload>
            )}
          </ProfileImageSection>
          <ProfileInfo>
            {isEditMode ? (
              <>
                <FormField
                  id="firstName"
                  name="firstName"
                  label="First Name"
                  error={errors.firstName}
                  touched={touched.firstName}
                >
                  <Input
                    id="firstName"
                    name="firstName"
                    value={values.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </FormField>
                <FormField
                  id="lastName"
                  name="lastName"
                  label="Last Name"
                  error={errors.lastName}
                  touched={touched.lastName}
                >
                  <Input
                    id="lastName"
                    name="lastName"
                    value={values.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                  />
                </FormField>
              </>
            ) : (
              <>
                <ProfileName>{values.firstName} {values.lastName}</ProfileName>
                <ProfileRole>Role: {values.role}</ProfileRole>
                <ProfileEmail>Email: {authState?.user?.email}</ProfileEmail>
              </>
            )}
          </ProfileInfo>
        </ProfileHeader>
      </Card>

      <Card title="Account Information">
        <FormGrid>
          <FormField label="Role" name="role">
            <Select
              id="role"
              name="role"
              value={values.role}
              onChange={handleChange}
              options={[
                { label: 'Coach', value: 'coach' },
                { label: 'CEO', value: 'ceo' },
                { label: 'Leadership', value: 'leadership' },
                { label: 'Team Member', value: 'teamMember' },
                { label: 'Viewer', value: 'viewer' },
              ]}
              disabled={!isEditMode}
            />
          </FormField>
        </FormGrid>
      </Card>

      <Card title="Preferences">
        {/* Add preference settings here */}
      </Card>

      <ActionButtons>
        {isEditMode ? (
          <>
            <Button label="Save" onClick={handleFormSubmit} />
            <Button label="Cancel" onClick={() => setIsEditMode(false)} />
          </>
        ) : (
          <Button label="Edit Profile" onClick={() => setIsEditMode(true)} />
        )}
      </ActionButtons>
    </ProfileContainer>
  );
};

// Styled components for the UserProfile component
const ProfileContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
`;

const ProfileSection = styled.div`
  margin-bottom: 1.5rem;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;

  @media (max-width: 576px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ProfileImageSection = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
`;

const ProfileImageUpload = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  background: white;
  border-radius: 50%;
  padding: 0.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
`;

const ProfileInfo = styled.div`
  flex: 1;
  min-width: 200px;
`;

const ProfileName = styled.h2`
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
`;

const ProfileRole = styled.div`
  font-size: 1rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
`;

const ProfileEmail = styled.div`
  font-size: 0.875rem;
  color: #374151;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const HiddenInput = styled.input`
  display: none;
`;