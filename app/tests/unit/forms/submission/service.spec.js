const service = require('../../../../src/forms/submission/service');

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
  it('should call the internal _createSubmissionStatus method', async () => {
    const trx = {};
    service._createSubmissionStatus = jest.fn().mockReturnValue({ a: 'b' });
    const res = await service.createStatus('abc', { data: true }, { user: 'me' }, trx);

    expect(res).toEqual({ a: 'b' });
    expect(service._createSubmissionStatus).toHaveBeenCalledTimes(1);
    expect(service._createSubmissionStatus).toHaveBeenCalledWith('abc', { data: true }, { user: 'me' }, trx);
  });
});

