import { renderHook, act, waitFor } from '@testing-library/react-hooks'; // @testing-library/react-hooks ^8.0.0
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'; // vitest ^0.34.0

import { useRealtime, useMeetingRealtime, useMeetingStagesRealtime, useActionItemsRealtime, usePresenceTracking } from '../../hooks/useRealtime';
import { renderHookWithProviders, createMockAuthUser } from '../../../tests/testUtils';
import { mockFirebase, setMockDocumentData, triggerMockSnapshot, resetMockFirebase } from '../../../tests/mocks/firebaseMocks';
import { FirestoreCollections } from '../../types/firebase.types';
import { RealtimeMeeting, MeetingStageType, ParticipantStatus } from '../../types/meeting.types';
import { ActionItemStatus } from '../../types/action-item.types';

describe('useRealtime', () => {
  beforeEach(() => {
    // Set up mock data and reset Firebase mocks before each test
    setMockDocumentData(FirestoreCollections.ACTIVE_MEETINGS, {
      'test-meeting-id': { title: 'Test Meeting', status: 'scheduled' },
    });
    resetMockFirebase();
  });

  it('should return initial loading state', () => {
    const { result } = renderHookWithProviders(() =>
      useRealtime({ collectionName: FirestoreCollections.ACTIVE_MEETINGS, documentId: 'test-meeting-id' })
    );
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should return data when available', async () => {
    const { result } = renderHookWithProviders(() =>
      useRealtime({ collectionName: FirestoreCollections.ACTIVE_MEETINGS, documentId: 'test-meeting-id' })
    );

    // Trigger snapshot with mock data
    act(() => {
      triggerMockSnapshot(FirestoreCollections.ACTIVE_MEETINGS, 'test-meeting-id', { title: 'Updated Meeting' });
    });

    // Wait for data to load
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ title: 'Updated Meeting' });
    expect(result.current.error).toBeNull();
  });

  it('should handle errors properly', async () => {
    const { result } = renderHookWithProviders(() =>
      useRealtime({ collectionName: FirestoreCollections.ACTIVE_MEETINGS, documentId: 'test-meeting-id' })
    );

    // Mock Firebase to throw an error
    mockFirebase.firestore.collection().doc().onSnapshot.mockImplementationOnce((success, error) => {
      error(new Error('Test error'));
      return () => {};
    });

    // Wait for error to be set
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(new Error('Test error'));
  });

  it('should updateData function updates Firestore documents', async () => {
    const { result } = renderHookWithProviders(() =>
      useRealtime({ collectionName: FirestoreCollections.ACTIVE_MEETINGS, documentId: 'test-meeting-id' })
    );

    // Mock updateData function
    mockFirebase.firestore.collection().doc().update.mockResolvedValue(undefined);

    // Call updateData function
    await act(async () => {
      await result.current.updateData('test-meeting-id', { title: 'New Title' });
    });

    // Assert that update function was called with correct parameters
    expect(mockFirebase.firestore.collection().doc().update).toHaveBeenCalledWith({ title: 'New Title' });
  });

  it('should createData function creates Firestore documents', async () => {
    const { result } = renderHookWithProviders(() =>
      useRealtime({ collectionName: FirestoreCollections.ACTIVE_MEETINGS })
    );

    // Mock createData function
    mockFirebase.firestore.collection().add.mockResolvedValue({ id: 'new-doc-id' });

    // Call createData function
    let newDocId: string = '';
    await act(async () => {
       newDocId = await result.current.createData({ title: 'New Doc' });
    });

    // Assert that add function was called with correct parameters
    expect(mockFirebase.firestore.collection().add).toHaveBeenCalledWith({ title: 'New Doc' });
    expect(newDocId).toEqual('new-doc-id');
  });

  it('should deleteData function deletes Firestore documents', async () => {
    const { result } = renderHookWithProviders(() =>
      useRealtime({ collectionName: FirestoreCollections.ACTIVE_MEETINGS, documentId: 'test-meeting-id' })
    );

    // Mock deleteData function
    mockFirebase.firestore.collection().doc().delete.mockResolvedValue(undefined);

    // Call deleteData function
    await act(async () => {
      await result.current.deleteData('test-meeting-id');
    });

    // Assert that delete function was called with correct parameters
    expect(mockFirebase.firestore.collection().doc().delete).toHaveBeenCalled();
  });

  it('should unsubscribe when component unmounts', () => {
    const { result, unmount } = renderHookWithProviders(() =>
      useRealtime({ collectionName: FirestoreCollections.ACTIVE_MEETINGS, documentId: 'test-meeting-id' })
    );

    // Call unmount function
    unmount();

    // Assert that unsubscribe function was called
    expect(mockFirebase.firestore.collection().doc().onSnapshot).toHaveBeenCalledTimes(1);
  });

  it('should resubscribe when options change', async () => {
    const { result, rerender } = renderHookWithProviders(
      (props: { collectionName: string; documentId: string }) => useRealtime(props),
      {
        initialProps: { collectionName: FirestoreCollections.ACTIVE_MEETINGS, documentId: 'test-meeting-id' },
      }
    );

    // Rerender with new options
    rerender({ collectionName: FirestoreCollections.ACTIVE_MEETINGS, documentId: 'new-meeting-id' });

    // Wait for resubscription
    await waitFor(() => {
      expect(mockFirebase.firestore.collection().doc().onSnapshot).toHaveBeenCalledTimes(2);
    });
  });
});

describe('useMeetingRealtime', () => {
  beforeEach(() => {
    // Set up mock meeting data and reset Firebase mocks before each test
    setMockDocumentData(FirestoreCollections.ACTIVE_MEETINGS, {
      'test-meeting-id': { title: 'Test Meeting', status: 'scheduled' },
    });
    resetMockFirebase();
  });

  it('should return initial loading state', () => {
    const { result } = renderHookWithProviders(() => useMeetingRealtime('test-meeting-id', 'test-org-id'));
    expect(result.current.loading).toBe(true);
    expect(result.current.meeting).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should return meeting data when available', async () => {
    const { result } = renderHookWithProviders(() => useMeetingRealtime('test-meeting-id', 'test-org-id'));

    // Trigger snapshot with mock data
    act(() => {
      triggerMockSnapshot(FirestoreCollections.ACTIVE_MEETINGS, 'test-meeting-id', { title: 'Updated Meeting' });
    });

    // Wait for data to load
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.meeting).toEqual({ title: 'Updated Meeting' });
    expect(result.current.error).toBeNull();
  });

  it('should handle errors properly', async () => {
    const { result } = renderHookWithProviders(() => useMeetingRealtime('test-meeting-id', 'test-org-id'));

    // Mock Firebase to throw an error
    mockFirebase.firestore.collection().doc().onSnapshot.mockImplementationOnce((success, error) => {
      error(new Error('Test error'));
      return () => {};
    });

    // Wait for error to be set
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(new Error('Test error'));
  });

  it('should updateMeeting function updates meeting properties', async () => {
    const { result } = renderHookWithProviders(() => useMeetingRealtime('test-meeting-id', 'test-org-id'));

    // Mock updateMeeting function
    mockFirebase.firestore.collection().doc().update.mockResolvedValue(undefined);

    // Call updateMeeting function
    await act(async () => {
      await result.current.updateMeeting({ title: 'New Title' });
    });

    // Assert that update function was called with correct parameters
    expect(mockFirebase.firestore.collection().doc().update).toHaveBeenCalledWith({ title: 'New Title', updatedAt: expect.any(Date) });
  });

  it('should useMeetingRealtime unsubscribes when component unmounts', () => {
    const { result, unmount } = renderHookWithProviders(() => useMeetingRealtime('test-meeting-id', 'test-org-id'));

    // Call unmount function
    unmount();

    // Assert that unsubscribe function was called
    expect(mockFirebase.firestore.collection().doc().onSnapshot).toHaveBeenCalledTimes(1);
  });
});

describe('useMeetingStagesRealtime', () => {
  beforeEach(() => {
    // Set up mock meeting stages data and reset Firebase mocks before each test
    setMockDocumentData(FirestoreCollections.MEETING_STAGES, {
      'test-stage-id-1': { meetingId: 'test-meeting-id', stageType: 'goodNews', content: 'Good news 1', sequence: 1 },
      'test-stage-id-2': { meetingId: 'test-meeting-id', stageType: 'previousActions', content: 'Previous actions 1', sequence: 2 },
    });
    resetMockFirebase();
  });

  it('should return initial loading state', () => {
    const { result } = renderHookWithProviders(() => useMeetingStagesRealtime('test-meeting-id'));
    expect(result.current.loading).toBe(true);
    expect(result.current.stages).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should return stages data when available', async () => {
    const { result } = renderHookWithProviders(() => useMeetingStagesRealtime('test-meeting-id'));

    // Trigger snapshot with mock data
    act(() => {
      triggerMockSnapshot(FirestoreCollections.MEETING_STAGES, 'test-stage-id-1', { content: 'Updated content' });
    });

    // Wait for data to load
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stages).toEqual(expect.arrayContaining([expect.objectContaining({ content: 'Updated content' })]));
    expect(result.current.error).toBeNull();
  });

  it('should handle errors properly', async () => {
    const { result } = renderHookWithProviders(() => useMeetingStagesRealtime('test-meeting-id'));

    // Mock Firebase to throw an error
    mockFirebase.firestore.collection().where().onSnapshot.mockImplementationOnce((success, error) => {
      error(new Error('Test error'));
      return () => {};
    });

    // Wait for error to be set
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(new Error('Test error'));
  });

  it("should updateStage function updates a specific stage's content", async () => {
    const { result } = renderHookWithProviders(() => useMeetingStagesRealtime('test-meeting-id'));

    // Mock updateStage function
    mockFirebase.firestore.collection().doc().update.mockResolvedValue(undefined);

    // Call updateStage function
    await act(async () => {
      await result.current.updateStage('test-stage-id-1', 'New content');
    });

    // Assert that update function was called with correct parameters
    expect(mockFirebase.firestore.collection().doc().update).toHaveBeenCalledWith({ content: 'New content', updatedAt: expect.any(Date), updatedBy: undefined });
  });

  it('should createStage function creates a new meeting stage', async () => {
    const { result } = renderHookWithProviders(() => useMeetingStagesRealtime('test-meeting-id'));

    // Mock createStage function
    mockFirebase.firestore.collection().add.mockResolvedValue({ id: 'new-stage-id' });

    // Call createStage function
    let newStageId: string = '';
    await act(async () => {
      newStageId = await result.current.createStage(MeetingStageType.GOOD_NEWS, 3);
    });

    // Assert that add function was called with correct parameters
    expect(mockFirebase.firestore.collection().add).toHaveBeenCalledWith({
      meetingId: 'test-meeting-id',
      stageType: MeetingStageType.GOOD_NEWS,
      content: '',
      sequence: 3,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      createdBy: undefined
    });
    expect(newStageId).toEqual('new-stage-id');
  });

  it('should useMeetingStagesRealtime unsubscribes when component unmounts', () => {
    const { result, unmount } = renderHookWithProviders(() => useMeetingStagesRealtime('test-meeting-id'));

    // Call unmount function
    unmount();

    // Assert that unsubscribe function was called
    expect(mockFirebase.firestore.collection().where().onSnapshot).toHaveBeenCalledTimes(1);
  });
});

describe('useActionItemsRealtime', () => {
  beforeEach(() => {
    // Set up mock action items data and reset Firebase mocks before each test
    setMockDocumentData(FirestoreCollections.ACTION_ITEMS, {
      'test-action-item-id-1': { meetingId: 'test-meeting-id', description: 'Action item 1', status: 'pending' },
      'test-action-item-id-2': { meetingId: 'test-meeting-id', description: 'Action item 2', status: 'completed' },
    });
    resetMockFirebase();
  });

  it('should return initial loading state', () => {
    const { result } = renderHookWithProviders(() => useActionItemsRealtime('test-meeting-id'));
    expect(result.current.loading).toBe(true);
    expect(result.current.actionItems).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should return action items data when available', async () => {
    const { result } = renderHookWithProviders(() => useActionItemsRealtime('test-meeting-id'));

    // Trigger snapshot with mock data
    act(() => {
      triggerMockSnapshot(FirestoreCollections.ACTION_ITEMS, 'test-action-item-id-1', { description: 'Updated description' });
    });

    // Wait for data to load
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.actionItems).toEqual(expect.arrayContaining([expect.objectContaining({ description: 'Updated description' })]));
    expect(result.current.error).toBeNull();
  });

  it('should handle errors properly', async () => {
    const { result } = renderHookWithProviders(() => useActionItemsRealtime('test-meeting-id'));

    // Mock Firebase to throw an error
    mockFirebase.firestore.collection().where().onSnapshot.mockImplementationOnce((success, error) => {
      error(new Error('Test error'));
      return () => {};
    });

    // Wait for error to be set
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(new Error('Test error'));
  });

  it('should updateActionItem function updates a specific action item', async () => {
    const { result } = renderHookWithProviders(() => useActionItemsRealtime('test-meeting-id'));

    // Mock updateActionItem function
    mockFirebase.firestore.collection().doc().update.mockResolvedValue(undefined);

    // Call updateActionItem function
    await act(async () => {
      await result.current.updateActionItem('test-action-item-id-1', { status: ActionItemStatus.COMPLETED });
    });

    // Assert that update function was called with correct parameters
    expect(mockFirebase.firestore.collection().doc().update).toHaveBeenCalledWith({ status: ActionItemStatus.COMPLETED, updatedAt: expect.any(Date), updatedBy: undefined });
  });

  it('should createActionItem function creates a new action item', async () => {
    const { result } = renderHookWithProviders(() => useActionItemsRealtime('test-meeting-id'));

    // Mock createActionItem function
    mockFirebase.firestore.collection().add.mockResolvedValue({ id: 'new-action-item-id' });

    // Call createActionItem function
    let newActionItemId: string = '';
    await act(async () => {
      newActionItemId = await result.current.createActionItem({ description: 'New action item' });
    });

    // Assert that add function was called with correct parameters
    expect(mockFirebase.firestore.collection().add).toHaveBeenCalledWith({
      description: 'New action item',
      meetingId: 'test-meeting-id',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
      createdBy: undefined
    });
    expect(newActionItemId).toEqual('new-action-item-id');
  });

  it('should deleteActionItem function deletes an action item', async () => {
    const { result } = renderHookWithProviders(() => useActionItemsRealtime('test-meeting-id'));

    // Mock deleteActionItem function
    mockFirebase.firestore.collection().doc().delete.mockResolvedValue(undefined);

    // Call deleteActionItem function
    await act(async () => {
      await result.current.deleteActionItem('test-action-item-id-1');
    });

    // Assert that delete function was called with correct parameters
    expect(mockFirebase.firestore.collection().doc().delete).toHaveBeenCalled();
  });

  it('should useActionItemsRealtime unsubscribes when component unmounts', () => {
    const { result, unmount } = renderHookWithProviders(() => useActionItemsRealtime('test-meeting-id'));

    // Call unmount function
    unmount();

    // Assert that unsubscribe function was called
    expect(mockFirebase.firestore.collection().where().onSnapshot).toHaveBeenCalledTimes(1);
  });
});

describe('usePresenceTracking', () => {
  beforeEach(() => {
    // Set up mock presence data and reset Firebase mocks before each test
    setMockDocumentData(FirestoreCollections.USER_PRESENCE, {
      'test-meeting-id_test-user-id': { meetingId: 'test-meeting-id', userId: 'test-user-id', status: 'online' },
    });
    resetMockFirebase();
  });

  it('should return initial loading state', () => {
    const { result } = renderHookWithProviders(() => usePresenceTracking('test-meeting-id', 'test-user-id'));
    expect(result.current.loading).toBe(true);
    expect(result.current.participants).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should return participants data when available', async () => {
    const { result } = renderHookWithProviders(() => usePresenceTracking('test-meeting-id', 'test-user-id'));

    // Trigger snapshot with mock data
    act(() => {
      triggerMockSnapshot(FirestoreCollections.USER_PRESENCE, 'test-meeting-id_test-user-id', { status: 'away' });
    });

    // Wait for data to load
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.participants).toEqual(expect.arrayContaining([expect.objectContaining({ userId: 'test-user-id', isOnline: false })]));
    expect(result.current.error).toBeNull();
  });

  it('should handle errors properly', async () => {
    const { result } = renderHookWithProviders(() => usePresenceTracking('test-meeting-id', 'test-user-id'));

    // Mock Firebase to throw an error
    mockFirebase.firestore.collection().where().onSnapshot.mockImplementationOnce((success, error) => {
      error(new Error('Test error'));
      return () => {};
    });

    // Wait for error to be set
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toEqual(new Error('Test error'));
  });

  it("should updatePresence function updates user's presence status", async () => {
    const { result } = renderHookWithProviders(() => usePresenceTracking('test-meeting-id', 'test-user-id'));

    // Mock updatePresence function
    mockFirebase.firestore.collection().doc().update.mockResolvedValue(undefined);

    // Call updatePresence function
    await act(async () => {
      await result.current.updatePresence(ParticipantStatus.AWAY);
    });

    // Assert that update function was called with correct parameters
    expect(mockFirebase.firestore.collection().doc().update).toHaveBeenCalledWith({
      meetingId: 'test-meeting-id',
      userId: 'test-user-id',
      status: ParticipantStatus.AWAY,
      isTyping: false,
      lastActive: expect.any(Date)
    });
  });

  it("should setTypingStatus function updates user's typing status", async () => {
    const { result } = renderHookWithProviders(() => usePresenceTracking('test-meeting-id', 'test-user-id'));

    // Mock setTypingStatus function
    mockFirebase.firestore.collection().doc().update.mockResolvedValue(undefined);

    // Call setTypingStatus function
    await act(async () => {
      await result.current.setTypingStatus(true);
    });

    // Assert that update function was called with correct parameters
    expect(mockFirebase.firestore.collection().doc().update).toHaveBeenCalledWith({
      meetingId: 'test-meeting-id',
      userId: 'test-user-id',
      status: 'online',
      isTyping: true,
      lastActive: expect.any(Date)
    });
  });

  it('should usePresenceTracking joins meeting when component mounts', async () => {
    const { result } = renderHookWithProviders(() => usePresenceTracking('test-meeting-id', 'test-user-id'));

    // Mock joinMeeting function
    mockFirebase.firestore.collection().doc().set.mockResolvedValue(undefined);

    // Wait for joinMeeting to be called
    await waitFor(() => {
      expect(mockFirebase.firestore.collection().doc().set).toHaveBeenCalled();
    });

    // Assert that set function was called with correct parameters
    expect(mockFirebase.firestore.collection().doc().set).toHaveBeenCalledWith({
      meetingId: 'test-meeting-id',
      userId: 'test-user-id',
      status: 'online',
      lastActive: expect.any(Date)
    });
  });

  it('should usePresenceTracking leaves meeting when component unmounts', async () => {
    const { result, unmount } = renderHookWithProviders(() => usePresenceTracking('test-meeting-id', 'test-user-id'));

    // Mock leaveMeeting function
    mockFirebase.firestore.collection().doc().update.mockResolvedValue(undefined);

    // Call unmount function
    unmount();

    // Wait for leaveMeeting to be called
    await waitFor(() => {
      expect(mockFirebase.firestore.collection().doc().update).toHaveBeenCalled();
    });

    // Assert that update function was called with correct parameters
    expect(mockFirebase.firestore.collection().doc().update).toHaveBeenCalledWith({
      status: 'offline',
      lastActive: expect.any(Date)
    });
  });
});