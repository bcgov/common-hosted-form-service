const { MockModel, MockTransaction } = require('../../../common/dbHelper');
const uuid = require('uuid');

jest.mock('../../../../src/forms/common/models/tables/formSubmissionStatus', () => MockModel);
jest.mock('../../../../src/forms/common/models/tables/formSubmission', () => MockModel);
jest.mock('../../../../src/forms/common/models/views/submissionMetadata', () => MockModel);
jest.mock('../../../../src/forms/common/models/tables/form', () => MockModel);
jest.mock('../../../../src/forms/common/models/tables/formVersion', () => MockModel);

const service = require('../../../../src/forms/submission/service');

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('read', () => {
  it('should call the internal _fetchSubmissionData method', async () => {
    service._fetchSubmissionData = jest.fn().mockReturnValue({ a: 'b' });
    const res = await service.read('abc');

    expect(res).toEqual({ a: 'b' });
    expect(service._fetchSubmissionData).toBeCalledTimes(1);
    expect(service._fetchSubmissionData).toBeCalledWith('abc');
  });
});

describe('addNote', () => {
  it('should call the internal _createNote method', async () => {
    service._createNote = jest.fn().mockReturnValue({ a: 'b' });
    const res = await service.addNote('abc', { data: true }, { user: 'me' });

    expect(res).toEqual({ a: 'b' });
    expect(service._createNote).toBeCalledTimes(1);
    expect(service._createNote).toBeCalledWith('abc', { data: true }, { user: 'me' });
  });
});

describe('createStatus', () => {
  it('should perform appropriate db queries', async () => {
    const trx = {};
    service.getStatus = jest.fn().mockReturnValue({ a: 'b' });
    const res = await service.createStatus('abc', { data: true }, { user: 'me' }, trx);

    expect(res).toEqual({ a: 'b' });
    expect(MockModel.startTransaction).toBeCalledTimes(0);
    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledWith(expect.anything());
    expect(MockModel.insert).toBeCalledTimes(1);
    expect(MockModel.insert).toBeCalledWith(expect.anything());
  });
});

describe('deleteMultipleSubmissions', () => {
  it('should delete the selected submissions', async () => {
    // Mock the Date object
    const mockDate = new Date('2023-05-15T10:30:00.000Z');
    const mockISOString = '2023-05-15T10:30:00.000Z';

    // Save the original Date constructor
    const OriginalDate = global.Date;

    // Replace the global Date constructor with a mock
    global.Date = jest.fn(() => mockDate);

    // Add the toISOString method to the mock
    global.Date.prototype.toISOString = jest.fn(() => mockISOString);

    // Copy any other methods you need from the original Date
    global.Date.now = OriginalDate.now;
    let submissionId1 = uuid.v4();
    let submissionId2 = uuid.v4();
    const submissionIds = [submissionId1, submissionId2];

    const returnValue = {
      submission: [
        { id: submissionId1, formVersionId: '8d8e24ce-326f-4536-9100-a0844c27d5a0', confirmationId: 'AC4EF441', draft: false, deleted: true },
        { id: submissionId2, formVersionId: '8d8e24ce-326f-4536-9100-a0844c27d5a0', confirmationId: '0715B1AC', draft: false, deleted: true },
      ],
      version: [{ id: '8d8e24ce-326f-4536-9100-a0844c27d5a0', formId: 'a9ac13d3-340d-4b73-8920-8c8776b4eeca', version: 1, schema: {}, createdBy: 'testa@idir' }],
      form: [{ id: 'a9ac13d3-340d-4b73-8920-8c8776b4eeca', name: 'FisheriesAA', description: '', active: true, labels: null }],
    };

    const currentUser = { usernameIdp: 'TEST@idir' };
    service.readSubmissionData = jest.fn().mockReturnValue(returnValue);
    const spy = jest.spyOn(service, 'readSubmissionData');
    const res = await service.deleteMultipleSubmissions(submissionIds, currentUser);
    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledWith(expect.anything());
    expect(MockModel.patch).toBeCalledTimes(1);
    expect(MockModel.patch).toBeCalledWith({ deleted: true, updatedAt: mockISOString, updatedBy: currentUser.usernameIdp });
    expect(MockModel.whereIn).toBeCalledTimes(1);
    expect(MockModel.whereIn).toBeCalledWith('id', submissionIds);
    expect(spy).toBeCalledWith(submissionIds);
    expect(res).toEqual(returnValue);
    // Then restore the original Date object when done
    global.Date = OriginalDate;
  });
});

describe('restoreMultipleSubmissions', () => {
  it('should delete the selected submissions', async () => {
    let submissionId1 = uuid.v4();
    let submissionId2 = uuid.v4();
    const submissionIds = [submissionId1, submissionId2];

    const returnValue = {
      submission: [
        { id: submissionId1, formVersionId: '8d8e24ce-326f-4536-9100-a0844c27d5a0', confirmationId: 'AC4EF441', draft: false, deleted: false },
        { id: submissionId2, formVersionId: '8d8e24ce-326f-4536-9100-a0844c27d5a0', confirmationId: '0715B1AC', draft: false, deleted: false },
      ],
      version: [{ id: '8d8e24ce-326f-4536-9100-a0844c27d5a0', formId: 'a9ac13d3-340d-4b73-8920-8c8776b4eeca', version: 1, schema: {}, createdBy: 'testa@idir' }],
      form: [{ id: 'a9ac13d3-340d-4b73-8920-8c8776b4eeca', name: 'FisheriesAA', description: '', active: true, labels: null }],
    };

    const currentUser = { usernameIdp: 'TEST@idir' };
    service.readSubmissionData = jest.fn().mockReturnValue(returnValue);
    const spy = jest.spyOn(service, 'readSubmissionData');
    const res = await service.restoreMultipleSubmissions(submissionIds, currentUser);
    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledWith(expect.anything());
    expect(MockModel.patch).toBeCalledTimes(1);
    expect(MockModel.patch).toBeCalledWith({ deleted: false, updatedBy: currentUser.usernameIdp });
    expect(MockModel.whereIn).toBeCalledTimes(1);
    expect(MockModel.whereIn).toBeCalledWith('id', submissionIds);
    expect(spy).toBeCalledWith(submissionIds);
    expect(res).toEqual(returnValue);
  });
});

describe('submitterRevision', () => {
  const submissionId = uuid.v4();
  const currentUser = { id: 'user-123', usernameIdp: 'test@idir' };

  beforeEach(() => {
    // Reset all mocks before each test
    MockModel.mockReset();
  });

  describe('checkSubmitterRevision', () => {
    it('should return canRevise true when user can revise submission', async () => {
      // Mock SubmissionMetadata.query().where().first()
      const mockMetadata = { submissionId: submissionId, formVersionId: 'version-123', formId: 'form-123' };
      const mockWhereChain = {
        first: jest.fn().mockResolvedValue(mockMetadata),
      };
      MockModel.query.mockReturnValue({
        where: jest.fn().mockReturnValue(mockWhereChain),
      });

      // Mock FormSubmission.query().findById()
      const mockSubmission = { id: submissionId, createdBy: 'test@idir' };
      const mockFormSubmissionQuery = {
        findById: jest.fn().mockResolvedValue(mockSubmission),
      };

      // Mock FormSubmissionStatus.query().modify().withGraphFetched().modify().first()
      const mockStatus = { code: 'SUBMITTED' };
      const mockStatusChain = {
        modify: jest.fn().mockReturnThis(),
        withGraphFetched: jest.fn().mockReturnThis(),
        orderDescending: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockStatus),
      };

      // Mock Form.query().findById()
      const mockForm = { id: 'form-123', enableSubmitterRevision: true };
      const mockFormQuery = {
        findById: jest.fn().mockResolvedValue(mockForm),
      };

      // Set up the mock to return different values for different calls
      MockModel.query
        .mockReturnValueOnce({ where: jest.fn().mockReturnValue(mockWhereChain) }) // SubmissionMetadata
        .mockReturnValueOnce(mockFormSubmissionQuery) // FormSubmission
        .mockReturnValueOnce(mockStatusChain) // FormSubmissionStatus
        .mockReturnValueOnce(mockFormQuery); // Form

      const result = await service.checkSubmitterRevision(submissionId, currentUser);

      expect(result).toBe(true);
    });

    it('should return canRevise false when form does not have enableSubmitterRevision', async () => {
      // Mock SubmissionMetadata.query().where().first()
      const mockMetadata = { submissionId: submissionId, formVersionId: 'version-123', formId: 'form-123' };
      const mockWhereChain = {
        first: jest.fn().mockResolvedValue(mockMetadata),
      };

      // Mock FormSubmission.query().findById()
      const mockSubmission = { id: submissionId, createdBy: 'test@idir' };
      const mockFormSubmissionQuery = {
        findById: jest.fn().mockResolvedValue(mockSubmission),
      };

      // Mock FormSubmissionStatus.query().modify().withGraphFetched().modify().first()
      const mockStatus = { code: 'SUBMITTED' };
      const mockStatusChain = {
        modify: jest.fn().mockReturnThis(),
        withGraphFetched: jest.fn().mockReturnThis(),
        orderDescending: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockStatus),
      };

      // Mock Form.query().findById()
      const mockForm = { id: 'form-123', enableSubmitterRevision: false };
      const mockFormQuery = {
        findById: jest.fn().mockResolvedValue(mockForm),
      };

      // Set up the mock to return different values for different calls
      MockModel.query
        .mockReturnValueOnce({ where: jest.fn().mockReturnValue(mockWhereChain) }) // SubmissionMetadata
        .mockReturnValueOnce(mockFormSubmissionQuery) // FormSubmission
        .mockReturnValueOnce(mockStatusChain) // FormSubmissionStatus
        .mockReturnValueOnce(mockFormQuery); // Form

      const result = await service.checkSubmitterRevision(submissionId, currentUser);

      expect(result).toBe(false);
    });

    it('should return canRevise false when submission status is not SUBMITTED', async () => {
      // Mock SubmissionMetadata.query().where().first()
      const mockMetadata = { submissionId: submissionId, formVersionId: 'version-123', formId: 'form-123' };
      const mockWhereChain = {
        first: jest.fn().mockResolvedValue(mockMetadata),
      };

      // Mock FormSubmission.query().findById()
      const mockSubmission = { id: submissionId, createdBy: 'test@idir' };
      const mockFormSubmissionQuery = {
        findById: jest.fn().mockResolvedValue(mockSubmission),
      };

      // Mock FormSubmissionStatus.query().modify().withGraphFetched().modify().first()
      const mockStatus = { code: 'DRAFT' };
      const mockStatusChain = {
        modify: jest.fn().mockReturnThis(),
        withGraphFetched: jest.fn().mockReturnThis(),
        orderDescending: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockStatus),
      };

      // Mock Form.query().findById()
      const mockForm = { id: 'form-123', enableSubmitterRevision: true };
      const mockFormQuery = {
        findById: jest.fn().mockResolvedValue(mockForm),
      };

      // Set up the mock to return different values for different calls
      MockModel.query
        .mockReturnValueOnce({ where: jest.fn().mockReturnValue(mockWhereChain) }) // SubmissionMetadata
        .mockReturnValueOnce(mockFormSubmissionQuery) // FormSubmission
        .mockReturnValueOnce(mockStatusChain) // FormSubmissionStatus
        .mockReturnValueOnce(mockFormQuery); // Form

      const result = await service.checkSubmitterRevision(submissionId, currentUser);

      expect(result).toBe(false);
    });

    it('should return canRevise false when user is not the creator', async () => {
      // Mock SubmissionMetadata.query().where().first()
      const mockMetadata = { submissionId: submissionId, formVersionId: 'version-123', formId: 'form-123' };
      const mockWhereChain = {
        first: jest.fn().mockResolvedValue(mockMetadata),
      };

      // Mock FormSubmission.query().findById()
      const mockSubmission = { id: submissionId, createdBy: 'other@idir' };
      const mockFormSubmissionQuery = {
        findById: jest.fn().mockResolvedValue(mockSubmission),
      };

      // Mock FormSubmissionStatus.query().modify().withGraphFetched().modify().first()
      const mockStatus = { code: 'SUBMITTED' };
      const mockStatusChain = {
        modify: jest.fn().mockReturnThis(),
        withGraphFetched: jest.fn().mockReturnThis(),
        orderDescending: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockStatus),
      };

      // Mock Form.query().findById()
      const mockForm = { id: 'form-123', enableSubmitterRevision: true };
      const mockFormQuery = {
        findById: jest.fn().mockResolvedValue(mockForm),
      };

      // Set up the mock to return different values for different calls
      MockModel.query
        .mockReturnValueOnce({ where: jest.fn().mockReturnValue(mockWhereChain) }) // SubmissionMetadata
        .mockReturnValueOnce(mockFormSubmissionQuery) // FormSubmission
        .mockReturnValueOnce(mockStatusChain) // FormSubmissionStatus
        .mockReturnValueOnce(mockFormQuery); // Form

      const result = await service.checkSubmitterRevision(submissionId, currentUser);

      expect(result).toBe(false);
    });

    it('should return false when submission metadata is not found', async () => {
      // Mock SubmissionMetadata.query().where().first() to return null
      const mockWhereChain = {
        first: jest.fn().mockResolvedValue(null),
      };
      MockModel.query.mockReturnValue({
        where: jest.fn().mockReturnValue(mockWhereChain),
      });

      const result = await service.checkSubmitterRevision(submissionId, currentUser);

      expect(result).toBe(false);
    });
  });

  describe('performSubmitterRevision', () => {
    it('should successfully perform revision when all conditions are met', async () => {
      // Mock checkSubmitterRevision to return true
      service.checkSubmitterRevision = jest.fn().mockResolvedValue(true);

      // Mock changeStatusState to return success
      const mockStatusResult = [{ id: 1, code: 'REVISING' }];
      service.changeStatusState = jest.fn().mockResolvedValue(mockStatusResult);

      const checkSpy = jest.spyOn(service, 'checkSubmitterRevision');
      const changeStatusSpy = jest.spyOn(service, 'changeStatusState');

      const result = await service.performSubmitterRevision(submissionId, currentUser);

      expect(checkSpy).toBeCalledWith(submissionId, currentUser);
      expect(changeStatusSpy).toBeCalledWith(submissionId, { code: 'REVISING' }, currentUser);
      expect(result).toEqual(mockStatusResult);
    });

    it('should return false when checkSubmitterRevision returns false', async () => {
      // Mock checkSubmitterRevision to return false
      service.checkSubmitterRevision = jest.fn().mockResolvedValue(false);

      const checkSpy = jest.spyOn(service, 'checkSubmitterRevision');

      const result = await service.performSubmitterRevision(submissionId, currentUser);

      expect(checkSpy).toBeCalledWith(submissionId, currentUser);
      expect(result).toBe(false);
    });

    it('should throw error when changeStatusState fails', async () => {
      // Mock checkSubmitterRevision to return true
      service.checkSubmitterRevision = jest.fn().mockResolvedValue(true);

      // Mock changeStatusState to throw error
      service.changeStatusState = jest.fn().mockRejectedValue(new Error('Status change failed'));

      await expect(service.performSubmitterRevision(submissionId, currentUser)).rejects.toThrow('Status change failed');
    });
  });
});
