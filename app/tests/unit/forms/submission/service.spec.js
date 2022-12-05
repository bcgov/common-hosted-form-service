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


describe('createStatus', () => {
  it('should perform appropriate db queries', async () => {
    const data =  [
      [ { email: 'idowutimi@gmail.com' }, 0 ],
      [ 'oneRowPerLake', 0 ],
      [ 'dataGrid', 1 ],
      [ { fishType: 'cutthroat' }, 2 ],
      [ { numberKept: 1 }, 2 ],
      [ { numberCaught: 2 }, 2 ],
      [ { fishType: 'dollyVardon' }, 2 ],
      [ { numberKept: 1 }, 2 ],
      [ { numberCaught: 1 }, 2 ],
      [ { lakeName: 'Ruud City' }, 1 ],
      [ { closestTown: 'Vancouver' }, 1 ],
      [ { numberOfDays: 1 }, 1 ],
      [ 'dataGrid', 1 ],
      [ { fishType: 'smallmouthBass' }, 2 ],
      [ { numberKept: 3 }, 2 ],
      [ { numberCaught: 3 }, 2 ],
      [ { fishType: 'rainbow' }, 2 ],
      [ { numberKept: 4 }, 2 ],
      [ { numberCaught: 4 }, 2 ],
      [ { lakeName: 'Gulp' }, 1 ],
      [ { closestTown: 'Gulp' }, 1 ],
      [ { numberOfDays: 1 }, 1 ],
      [ { fishermansName: 'Bob Mary' }, 0 ],
      [ { didYouFishAnyBcLakesThisYear: 'yes' }, 0 ],
      [ { forWhichBcLakeRegionAreYouCompletingTheseQuestions: 8 }, 0 ]];
    service.genSubmissionToPdf = jest.fn().mockReturnValue(data);
    service.genSubmissionToPdf();
    expect(service.genSubmissionToPdf).toHaveBeenCalledTimes(1);
    expect(service.genSubmissionToPdf()).toBe(data);
  });
});



