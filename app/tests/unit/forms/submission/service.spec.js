const { MockModel, MockTransaction } = require('../../../common/dbHelper');


jest.mock('../../../../src/forms/common/models/tables/formSubmissionStatus', () => MockModel);

const service = require('../../../../src/forms/submission/service');

beforeEach(() => {
  MockModel.mockReset();
  MockTransaction.mockReset();
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

