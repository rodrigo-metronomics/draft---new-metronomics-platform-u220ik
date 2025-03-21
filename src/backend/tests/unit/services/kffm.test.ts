# src/backend/tests/unit/services/kffm.test.ts
```typescript
import { KFFMService } from '../../../src/services/kffm/kffmService';
import { KFFMNodeService } from '../../../src/services/kffm/kffmNodeService';
import { KFFMConnectionService } from '../../../src/services/kffm/kffmConnectionService';
import { KFFMRepository } from '../../../src/repositories/kffmRepository';
import { FirestoreService } from '../../../src/services/realtime/firestoreService';
import { KFFM, KFFMStatus, CreateKFFMDto, UpdateKFFMDto } from '../../../src/types/kffm.types';
import { NotFoundError, ValidationError } from '../../../src/utils/errors';
import { prismaMock } from '../../mocks/prismaMock';
import { firestore } from '../../mocks/firebaseMock';
import { mockKFFMs } from '../../fixtures/kffm';
import { jest } from 'jest'; // version ^29.5.0

/**
 * Creates a mock implementation of the KFFM repository for testing
 * @returns Mock KFFM repository with jest.fn() implementations
 */
function createMockKFFMRepository() {
  return {
    findById: jest.fn(),
    findByOrganizationId: jest.fn(),
    findByStatus: jest.fn(),
    findLatestVersion: jest.fn(),
    findWithDetails: jest.fn(),
    findByQuery: jest.fn(),
    createKFFM: jest.fn(),
    updateKFFM: jest.fn(),
    publishKFFM: jest.fn(),
    archiveKFFM: jest.fn(),
    cloneKFFM: jest.fn(),
    deleteKFFMWithRelations: jest.fn()
  };
}

/**
 * Creates a mock implementation of the KFFM node service for testing
 * @returns Mock KFFM node service with jest.fn() implementations
 */
function createMockKFFMNodeService() {
  return {
    getNodesByKFFMId: jest.fn(),
    createNode: jest.fn(),
    deleteNodesByKFFMId: jest.fn()
  };
}

/**
 * Creates a mock implementation of the KFFM connection service for testing
 * @returns Mock KFFM connection service with jest.fn() implementations
 */
function createMockKFFMConnectionService() {
  return {
    getConnectionsByKFFMId: jest.fn(),
    deleteConnectionsByKFFMId: jest.fn()
  };
}

/**
 * Creates a mock implementation of the Firestore service for testing
 * @returns Mock Firestore service with jest.fn() implementations
 */
function createMockFirestoreService() {
  return {
    updateDocument: jest.fn(),
    deleteDocument: jest.fn()
  };
}

describe('KFFMService', () => {
  let kffmService: KFFMService;
  let mockKFFMRepository: ReturnType<typeof createMockKFFMRepository>;
  let mockKFFMNodeService: ReturnType<typeof createMockKFFMNodeService>;
  let mockKFFMConnectionService: ReturnType<typeof createMockKFFMConnectionService>;
  let mockFirestoreService: ReturnType<typeof createMockFirestoreService>;

  beforeEach(() => {
    mockKFFMRepository = createMockKFFMRepository();
    mockKFFMNodeService = createMockKFFMNodeService();
    mockKFFMConnectionService = createMockKFFMConnectionService();
    mockFirestoreService = createMockFirestoreService();

    kffmService = new KFFMService(
      mockKFFMRepository as unknown as KFFMRepository,
      mockKFFMNodeService as unknown as KFFMNodeService,
      mockKFFMConnectionService as unknown as KFFMConnectionService,
      mockFirestoreService as unknown as FirestoreService
    );
  });

  it('getKFFMById', async () => {
    const testKFFM = mockKFFMs[0];
    (mockKFFMRepository.findById as jest.Mock).mockResolvedValue(testKFFM);

    const kffm = await kffmService.getKFFMById(testKFFM.id);

    expect(mockKFFMRepository.findById).toHaveBeenCalledWith(testKFFM.id);
    expect(kffm).toEqual(testKFFM);
  });

  it('getKFFMById with not found', async () => {
    const testId = 'non-existent-id';
    (mockKFFMRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(kffmService.getKFFMById(testId)).rejects.toThrow(NotFoundError);
    expect(mockKFFMRepository.findById).toHaveBeenCalledWith(testId);
  });

  it('getKFFMWithDetails', async () => {
    const testKFFM = mockKFFMs[1];
    (mockKFFMRepository.findWithDetails as jest.Mock).mockResolvedValue(testKFFM);

    const kffm = await kffmService.getKFFMWithDetails(testKFFM.id);

    expect(mockKFFMRepository.findWithDetails).toHaveBeenCalledWith(testKFFM.id);
    expect(kffm).toEqual(testKFFM);
  });

  it('getKFFMsByOrganizationId', async () => {
    const testOrganizationId = 'test-org-id';
    const testKFFMs = [mockKFFMs[0], mockKFFMs[1]];
    (mockKFFMRepository.findByOrganizationId as jest.Mock).mockResolvedValue(testKFFMs);

    const kffms = await kffmService.getKFFMsByOrganizationId(testOrganizationId);

    expect(mockKFFMRepository.findByOrganizationId).toHaveBeenCalledWith(testOrganizationId);
    expect(kffms).toEqual(testKFFMs);
  });

  it('getKFFMsByStatus', async () => {
    const testStatus = KFFMStatus.PUBLISHED;
    const testKFFMs = [mockKFFMs[0]];
    (mockKFFMRepository.findByStatus as jest.Mock).mockResolvedValue(testKFFMs);

    const kffms = await kffmService.getKFFMsByStatus(testStatus);

    expect(mockKFFMRepository.findByStatus).toHaveBeenCalledWith(testStatus);
    expect(kffms).toEqual(testKFFMs);
  });

  it('getLatestKFFM', async () => {
    const testOrganizationId = 'test-org-id';
    const testKFFM = mockKFFMs[0];
    (mockKFFMRepository.findLatestVersion as jest.Mock).mockResolvedValue(testKFFM);

    const kffm = await kffmService.getLatestKFFM(testOrganizationId);

    expect(mockKFFMRepository.findLatestVersion).toHaveBeenCalledWith(testOrganizationId);
    expect(kffm).toEqual(testKFFM);
  });

  it('queryKFFMs', async () => {
    const testQueryParams = { organizationId: 'test-org-id', status: KFFMStatus.DRAFT };
    const testPagination = { page: 1, limit: 10, offset: 0 };
    const testKFFMs = [mockKFFMs[0], mockKFFMs[1]];
    const testTotal = 2;
    (mockKFFMRepository.findByQuery as jest.Mock).mockResolvedValue({ data: testKFFMs, total: testTotal });

    const result = await kffmService.queryKFFMs(testQueryParams, testPagination);

    expect(mockKFFMRepository.findByQuery).toHaveBeenCalledWith(testQueryParams, testPagination);
    expect(result).toEqual({ data: testKFFMs, total: testTotal });
  });

  it('createKFFM', async () => {
    const createKFFMDto: CreateKFFMDto = {
      title: 'New KFFM',
      description: 'A new KFFM description',
      organizationId: 'test-org-id'
    };
    const testKFFM = { ...mockKFFMs[0], ...createKFFMDto };
    (mockKFFMRepository.createKFFM as jest.Mock).mockResolvedValue(testKFFM);
    (mockFirestoreService.updateDocument as jest.Mock).mockResolvedValue(undefined);

    const kffm = await kffmService.createKFFM(createKFFMDto);

    expect(mockKFFMRepository.createKFFM).toHaveBeenCalledWith(expect.objectContaining(createKFFMDto));
    expect(mockFirestoreService.updateDocument).toHaveBeenCalled();
    expect(kffm).toEqual(testKFFM);
  });

  it('createKFFM with validation error', async () => {
    const createKFFMDto = {
      title: '', // Invalid title
      description: 'A new KFFM description',
      organizationId: 'test-org-id'
    };

    await expect(kffmService.createKFFM(createKFFMDto as any)).rejects.toThrow(ValidationError);
    expect(mockKFFMRepository.createKFFM).not.toHaveBeenCalled();
  });

  it('updateKFFM', async () => {
    const kffmId = 'test-kffm-id';
    const updateKFFMDto: UpdateKFFMDto = {
      title: 'Updated KFFM',
      description: 'An updated KFFM description',
      status: KFFMStatus.ARCHIVED
    };
    const existingKFFM = mockKFFMs[0];
    const updatedKFFM = { ...existingKFFM, ...updateKFFMDto };

    (mockKFFMRepository.findById as jest.Mock).mockResolvedValue(existingKFFM);
    (mockKFFMRepository.updateKFFM as jest.Mock).mockResolvedValue(updatedKFFM);
    (mockFirestoreService.updateDocument as jest.Mock).mockResolvedValue(undefined);

    const kffm = await kffmService.updateKFFM(kffmId, updateKFFMDto);

    expect(mockKFFMRepository.updateKFFM).toHaveBeenCalledWith(kffmId, expect.objectContaining(updateKFFMDto));
    expect(mockFirestoreService.updateDocument).toHaveBeenCalled();
    expect(kffm).toEqual(updatedKFFM);
  });

  it('publishKFFM', async () => {
    const kffmId = 'test-kffm-id';
    const existingKFFM = mockKFFMs[0];
    const publishedKFFM = { ...existingKFFM, status: KFFMStatus.PUBLISHED };

    (mockKFFMRepository.findById as jest.Mock).mockResolvedValue(existingKFFM);
    (mockKFFMRepository.publishKFFM as jest.Mock).mockResolvedValue(publishedKFFM);
    (mockFirestoreService.updateDocument as jest.Mock).mockResolvedValue(undefined);

    const kffm = await kffmService.publishKFFM(kffmId);

    expect(mockKFFMRepository.publishKFFM).toHaveBeenCalledWith(kffmId);
    expect(mockFirestoreService.updateDocument).toHaveBeenCalled();
    expect(kffm.status).toEqual(KFFMStatus.PUBLISHED);
  });

  it('archiveKFFM', async () => {
    const kffmId = 'test-kffm-id';
    const existingKFFM = mockKFFMs[0];
    const archivedKFFM = { ...existingKFFM, status: KFFMStatus.ARCHIVED };

    (mockKFFMRepository.findById as jest.Mock).mockResolvedValue(existingKFFM);
    (mockKFFMRepository.archiveKFFM as jest.Mock).mockResolvedValue(archivedKFFM);
    (mockFirestoreService.updateDocument as jest.Mock).mockResolvedValue(undefined);

    const kffm = await kffmService.archiveKFFM(kffmId);

    expect(mockKFFMRepository.archiveKFFM).toHaveBeenCalledWith(kffmId);
    expect(mockFirestoreService.updateDocument).toHaveBeenCalled();
    expect(kffm.status).toEqual(KFFMStatus.ARCHIVED);
  });

  it('cloneKFFM', async () => {
    const kffmId = 'test-kffm-id';
    const existingKFFM = mockKFFMs[0];
    const clonedKFFM = { ...existingKFFM, version: 2 };

    (mockKFFMRepository.findById as jest.Mock).mockResolvedValue(existingKFFM);
    (mockKFFMRepository.cloneKFFM as jest.Mock).mockResolvedValue(clonedKFFM);
    (mockFirestoreService.updateDocument as jest.Mock).mockResolvedValue(undefined);

    const kffm = await kffmService.cloneKFFM(kffmId);

    expect(mockKFFMRepository.cloneKFFM).toHaveBeenCalledWith(kffmId);
    expect(mockFirestoreService.updateDocument).toHaveBeenCalled();
    expect(kffm.version).toEqual(2);
  });

  it('deleteKFFM', async () => {
    const kffmId = 'test-kffm-id';
    const existingKFFM = mockKFFMs[0];

    (mockKFFMRepository.findById as jest.Mock).mockResolvedValue(existingKFFM);
    (mockKFFMRepository.deleteKFFMWithRelations as jest.Mock).mockResolvedValue(existingKFFM);
    (mockFirestoreService.deleteDocument as jest.Mock).mockResolvedValue(undefined);

    const kffm = await kffmService.deleteKFFM(kffmId);

    expect(mockKFFMRepository.deleteKFFMWithRelations).toHaveBeenCalledWith(kffmId);
    expect(mockFirestoreService.deleteDocument).toHaveBeenCalled();
    expect(kffm).toEqual(existingKFFM);
  });

  it('syncKFFMToFirestore', async () => {
    const kffmId = 'test-kffm-id';
    const testKFFM = mockKFFMs[0];

    (mockKFFMRepository.findWithDetails as jest.Mock).mockResolvedValue(testKFFM);
    (mockFirestoreService.updateDocument as jest.Mock).mockResolvedValue(undefined);

    await kffmService.syncKFFMToFirestore(kffmId);

    expect(mockKFFMRepository.findWithDetails).toHaveBeenCalledWith(kffmId);
    expect(mockFirestoreService.updateDocument).toHaveBeenCalledWith('kffm', kffmId, testKFFM);
  });

  it('syncKFFMToFirestore with error', async () => {
    const kffmId = 'test-kffm-id';
    const testKFFM = mockKFFMs[0];

    (mockKFFMRepository.findWithDetails as jest.Mock).mockResolvedValue(testKFFM);
    (mockFirestoreService.updateDocument as jest.Mock).mockRejectedValue(new Error('Firestore error'));

    await kffmService.syncKFFMToFirestore(kffmId);

    expect(mockKFFMRepository.findWithDetails).toHaveBeenCalledWith(kffmId);
    expect(mockFirestoreService.updateDocument).toHaveBeenCalledWith('kffm', kffmId, testKFFM);
  });
});