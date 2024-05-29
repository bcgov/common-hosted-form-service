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
    expect(MockModel.startTransaction).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledTimes(1);
    expect(MockModel.query).toBeCalledWith(expect.anything());
    expect(MockModel.patch).toBeCalledTimes(1);
    expect(MockModel.patch).toBeCalledWith({ deleted: true, updatedBy: currentUser.usernameIdp });
    expect(MockModel.whereIn).toBeCalledTimes(1);
    expect(MockModel.whereIn).toBeCalledWith('id', submissionIds);
    expect(spy).toBeCalledWith(submissionIds);
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
