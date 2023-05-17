const { MockModel, MockTransaction } = require('../../../common/dbHelper');
const { v4: uuidv4 } = require('uuid');

jest.mock('../../../../src/forms/common/models/tables/formSubmissionStatus', () => MockModel);
jest.mock('../../../../src/forms/common/models/tables/formSubmission', () => MockModel);

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
    expect(service._fetchSubmissionData).toHaveBeenCalledTimes(1);
    expect(service._fetchSubmissionData).toHaveBeenCalledWith('abc');
  });
});

describe('addNote', () => {
  it('should call the internal _createNote method', async () => {
    service._createNote = jest.fn().mockReturnValue({ a: 'b' });
    const res = await service.addNote('abc', { data: true }, { user: 'me' });

    expect(res).toEqual({ a: 'b' });
    expect(service._createNote).toHaveBeenCalledTimes(1);
    expect(service._createNote).toHaveBeenCalledWith('abc', { data: true }, { user: 'me' });
  });
});

describe('createStatus', () => {
  it('should perform appropriate db queries', async () => {
    const trx = {};
    service.getStatus = jest.fn().mockReturnValue({ a: 'b' });
    const res = await service.createStatus('abc', { data: true }, { user: 'me' }, trx);

    expect(res).toEqual({ a: 'b' });
    expect(MockModel.startTransaction).toHaveBeenCalledTimes(0);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith(expect.anything());
    expect(MockModel.insert).toHaveBeenCalledTimes(1);
    expect(MockModel.insert).toHaveBeenCalledWith(expect.anything());
  });
});

describe('deleteMutipleSubmissions', () => {
  it('should delete the selected submissions', async () => {
    let submissionId1 = uuidv4();
    let submissionId2 = uuidv4();
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
    const res = await service.deleteMutipleSubmissions(submissionIds, currentUser);
    expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith(expect.anything());
    expect(MockModel.patch).toHaveBeenCalledTimes(1);
    expect(MockModel.patch).toHaveBeenCalledWith({ deleted: true, updatedBy: currentUser.usernameIdp });
    expect(MockModel.whereIn).toHaveBeenCalledTimes(1);
    expect(MockModel.whereIn).toHaveBeenCalledWith('id', submissionIds);
    expect(spy).toHaveBeenCalledWith(submissionIds);
    expect(res).toEqual(returnValue);
  });
});

describe('restoreMutipleSubmissions', () => {
  it('should delete the selected submissions', async () => {
    let submissionId1 = uuidv4();
    let submissionId2 = uuidv4();
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
    const res = await service.restoreMutipleSubmissions(submissionIds, currentUser);
    expect(MockModel.startTransaction).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledTimes(1);
    expect(MockModel.query).toHaveBeenCalledWith(expect.anything());
    expect(MockModel.patch).toHaveBeenCalledTimes(1);
    expect(MockModel.patch).toHaveBeenCalledWith({ deleted: false, updatedBy: currentUser.usernameIdp });
    expect(MockModel.whereIn).toHaveBeenCalledTimes(1);
    expect(MockModel.whereIn).toHaveBeenCalledWith('id', submissionIds);
    expect(spy).toHaveBeenCalledWith(submissionIds);
    expect(res).toEqual(returnValue);
  });
});
