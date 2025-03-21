import React, { useState, useCallback, useEffect, useRef } from 'react'; // React v18.2.0
import styled, { css } from 'styled-components'; // styled-components v5.3.10
import { UserPlus, UserMinus, Crown, Edit2 } from 'react-feather'; // react-feather v2.0.10
import { Dialog } from 'primereact/dialog'; // primereact/dialog v10.0.0
import { Dropdown } from 'primereact/dropdown'; // primereact/dropdown v10.0.0
import { Toast } from 'primereact/toast'; // primereact/toast v10.0.0
import { Avatar } from 'primereact/avatar'; // primereact/avatar v10.0.0

import {
  MeetingParticipant,
  ParticipantRole,
  AttendanceStatus,
  User,
  MeetingParticipantsProps,
  UpdateMeetingParticipantDto,
} from '../../types/meeting.types';
import Badge from '../common/Badge';
import IconButton from '../common/IconButton';
import useMeetings from '../../hooks/useMeetings';
import { usePresenceTracking } from '../../hooks/useRealtime';
import useAuth from '../../hooks/useAuth';

/**
 * Interface for a participant with presence information
 */
interface ParticipantWithPresence {
  participant: MeetingParticipant;
  isOnline: boolean;
  isTyping: boolean;
  lastActivity: string;
}

/**
 * Interface for the edit participant form values
 */
interface EditParticipantForm {
  role: ParticipantRole;
  attendanceStatus: AttendanceStatus;
}

/**
 * Styled component for the participant list container
 */
const ParticipantContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
`;

/**
 * Styled component for an individual participant item
 */
const ParticipantItem = styled.div<{ isCurrentUser: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 4px;
  background-color: ${props => props.isCurrentUser ? 'rgba(0, 123, 255, 0.1)' : 'transparent'};
  margin-bottom: 0.25rem;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
  }
`;

/**
 * Styled component for participant information
 */
const ParticipantInfo = styled.div`
  display: flex;
  flex-direction: column;
  margin-left: 0.75rem;
  flex: 1;
`;

/**
 * Styled component for the participant name
 */
const ParticipantName = styled.div`
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

/**
 * Styled component for the participant role
 */
const ParticipantRole = styled.div`
  font-size: 0.75rem;
  color: #666;
`;

/**
 * Styled component for the participant status
 */
const ParticipantStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

/**
 * Styled component for participant actions
 */
const ParticipantActions = styled.div`
  display: flex;
  gap: 0.25rem;
`;

/**
 * Styled component for the status indicator
 */
const StatusIndicator = styled.div<{ isOnline: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${props => props.isOnline ? '#4caf50' : '#9e9e9e'};
  margin-right: 0.5rem;
`;

/**
 * Styled component for the add participant button
 */
const AddParticipantButton = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
`;

/**
 * Styled component for the form group
 */
const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

/**
 * Styled component for the form label
 */
const FormLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

/**
 * Styled component for the dialog footer
 */
const DialogFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
`;

/**
 * Component that displays and manages meeting participants
 */
const MeetingParticipants: React.FC<MeetingParticipantsProps> = ({
  participants,
  meetingId,
  organizationId,
  isModerator,
  onParticipantUpdate,
  className
}) => {
  // Get current user information from useAuth hook
  const { state: authState } = useAuth();
  const currentUser = authState.user;

  // Initialize state for selected participant, dialog visibility, and form values
  const [selectedParticipant, setSelectedParticipant] = useState<MeetingParticipant | null>(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editFormValues, setEditFormValues] = useState<EditParticipantForm>({
    role: ParticipantRole.PARTICIPANT,
    attendanceStatus: AttendanceStatus.PENDING
  });

  // Use usePresenceTracking hook to get real-time participant presence data
  const { participants: presenceParticipants } = usePresenceTracking(meetingId, currentUser?.id || '');

  // Use useMeetings hook to access participant management functions
  const { updateParticipant, addParticipants, removeParticipant } = useMeetings();

  // Create a toast reference
  const toast = useRef<Toast>(null);

  /**
   * Function to show a toast notification
   * @param severity Severity level of the toast
   * @param summary Summary message of the toast
   * @param detail Detailed message of the toast
   */
  const showToast = (severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string) => {
    toast.current?.show({ severity: severity, summary: summary, detail: detail, life: 3000 });
  };

  /**
   * Function to merge participant data with presence data
   * @param participants List of meeting participants
   * @param presenceParticipants List of participants with presence data
   * @returns Merged list of participants with presence data
   */
  const mergeParticipantsWithPresence = useCallback((
    participants: MeetingParticipant[],
    presenceParticipants: MeetingParticipant[]
  ): ParticipantWithPresence[] => {
    return participants.map(participant => {
      const presence = presenceParticipants.find(p => p.userId === participant.userId);
      return {
        participant: participant,
        isOnline: presence?.isOnline || false,
        isTyping: presence?.isTyping || false,
        lastActivity: presence?.lastActivity || ''
      };
    });
  }, []);

  // Create a memoized merged list of participants with presence data
  const mergedParticipants = React.useMemo(() => {
    return mergeParticipantsWithPresence(participants, presenceParticipants);
  }, [participants, presenceParticipants, mergeParticipantsWithPresence]);

  /**
   * Function to handle adding a new participant
   */
  const handleAddParticipant = () => {
    // TODO: Implement add participant functionality
    console.log('Add participant');
  };

  /**
   * Function to handle removing a participant
   * @param userId ID of the user to remove
   */
  const handleRemoveParticipant = async (userId: string) => {
    try {
      await removeParticipant.mutateAsync({ id: meetingId, participantsData: { userIds: [userId] } });
      showToast('success', 'Participant Removed', 'Participant removed from the meeting successfully.');
    } catch (error: any) {
      showToast('error', 'Error Removing Participant', error?.message || 'Failed to remove participant.');
    }
  };

  /**
   * Function to handle updating a participant's role
   * @param userId ID of the user to update
   * @param role New role for the user
   */
  const handleUpdateRole = async (userId: string, role: ParticipantRole) => {
    try {
      await updateParticipant.mutateAsync({ meetingId: meetingId, userId: userId, participantData: { role: role } });
      showToast('success', 'Role Updated', 'Participant role updated successfully.');
    } catch (error: any) {
      showToast('error', 'Error Updating Role', error?.message || 'Failed to update participant role.');
    }
  };

  /**
   * Function to handle updating a participant's attendance status
   * @param userId ID of the user to update
   * @param attendanceStatus New attendance status for the user
   */
  const handleUpdateAttendance = async (userId: string, attendanceStatus: AttendanceStatus) => {
    try {
      await updateParticipant.mutateAsync({ meetingId: meetingId, userId: userId, participantData: { attendanceStatus: attendanceStatus } });
      showToast('success', 'Attendance Updated', 'Participant attendance updated successfully.');
    } catch (error: any) {
      showToast('error', 'Error Updating Attendance', error?.message || 'Failed to update participant attendance.');
    }
  };

  /**
   * Function to open the edit dialog
   * @param participant Participant to edit
   */
  const openEditDialog = (participant: MeetingParticipant) => {
    setSelectedParticipant(participant);
    setEditFormValues({ role: participant.role, attendanceStatus: participant.attendanceStatus });
    setEditDialogVisible(true);
  };

  /**
   * Function to close the edit dialog
   */
  const closeEditDialog = () => {
    setEditDialogVisible(false);
    setSelectedParticipant(null);
  };

  return (
    <div className={className}>
      <Toast ref={toast} />
      <ParticipantContainer>
        {mergedParticipants.map(({ participant, isOnline }) => {
          const isCurrentUser = currentUser?.id === participant.userId;
          return (
            <ParticipantItem key={participant.id} isCurrentUser={isCurrentUser}>
              <Avatar 
                icon="pi pi-user" 
                size="large" 
                shape="circle" 
                image={participant.user?.photoURL || undefined}
              />
              <ParticipantInfo>
                <ParticipantName>
                  {participant.user?.name}
                  <StatusIndicator isOnline={isOnline} />
                </ParticipantName>
                <ParticipantRole>{participant.role}</ParticipantRole>
                <ParticipantStatus>
                  {/* TODO: Add status indicator and last activity */}
                </ParticipantStatus>
              </ParticipantInfo>
              <ParticipantActions>
                {isModerator && !isCurrentUser && (
                  <>
                    <IconButton
                      icon={<Edit2 size={16} />}
                      rounded
                      tooltip="Edit Participant"
                      ariaLabel="Edit Participant"
                      onClick={() => openEditDialog(participant)}
                    />
                    <IconButton
                      icon={<UserMinus size={16} />}
                      rounded
                      severity="danger"
                      tooltip="Remove Participant"
                      ariaLabel="Remove Participant"
                      onClick={() => handleRemoveParticipant(participant.userId)}
                    />
                  </>
                )}
                {isCurrentUser && participant.role === ParticipantRole.MODERATOR && (
                  <Badge value="Moderator" severity="info" />
                )}
              </ParticipantActions>
            </ParticipantItem>
          );
        })}
      </ParticipantContainer>
      {isModerator && (
        <AddParticipantButton>
          <IconButton
            icon={<UserPlus size={16} />}
            rounded
            tooltip="Add Participant"
            ariaLabel="Add Participant"
            onClick={handleAddParticipant}
          />
        </AddParticipantButton>
      )}

      <Dialog
        header="Edit Participant"
        visible={editDialogVisible}
        style={{ width: '50vw' }}
        onHide={closeEditDialog}
        footer={
          <DialogFooter>
            <IconButton label="Cancel" onClick={closeEditDialog} text />
            <IconButton label="Save" onClick={() => {
              if (selectedParticipant) {
                handleUpdateRole(selectedParticipant.userId, editFormValues.role);
                handleUpdateAttendance(selectedParticipant.userId, editFormValues.attendanceStatus);
                closeEditDialog();
              }
            }} />
          </DialogFooter>
        }
      >
        {selectedParticipant && (
          <>
            <FormGroup>
              <FormLabel htmlFor="role">Role</FormLabel>
              <Dropdown
                id="role"
                value={editFormValues.role}
                options={Object.values(ParticipantRole).map(role => ({ label: role, value: role }))}
                onChange={(e) => setEditFormValues({ ...editFormValues, role: e.value })}
                placeholder="Select a Role"
              />
            </FormGroup>
            <FormGroup>
              <FormLabel htmlFor="attendanceStatus">Attendance Status</FormLabel>
              <Dropdown
                id="attendanceStatus"
                value={editFormValues.attendanceStatus}
                options={Object.values(AttendanceStatus).map(status => ({ label: status, value: status }))}
                onChange={(e) => setEditFormValues({ ...editFormValues, attendanceStatus: e.value })}
                placeholder="Select Attendance Status"
              />
            </FormGroup>
          </>
        )}
      </Dialog>
    </div>
  );
};

export default MeetingParticipants;