let returnValue = undefined;

const retFn = (value) => {
  returnValue = value;
};

class MockModel {}

// Mocked Objection Functions
MockModel.findById = jest.fn().mockReturnThis();
MockModel.first = jest.fn().mockReturnThis();
MockModel.delete = jest.fn().mockReturnThis();
MockModel.deleteById = jest.fn().mockReturnThis();
MockModel.insert = jest.fn().mockReturnThis();
MockModel.insertGraph = jest.fn().mockReturnThis();
MockModel.insertGraphAndFetch = jest.fn().mockReturnThis();
MockModel.findById = jest.fn().mockReturnThis();
MockModel.modify = jest.fn().mockReturnThis();
MockModel.modifiers = jest.fn().mockReturnThis();
MockModel.orderBy = jest.fn().mockReturnThis();
MockModel.query = jest.fn().mockReturnThis();
MockModel.resolve = jest.fn().mockResolvedValue(returnValue);
MockModel.returning = jest.fn().mockReturnThis();
MockModel.skipUndefined = jest.fn().mockReturnThis();
MockModel.startTransaction = jest.fn();
MockModel.then = jest.fn((done) => { done(returnValue); });
MockModel.throwIfNotFound = jest.fn().mockReturnThis();
MockModel.where = jest.fn().mockReturnThis();
MockModel.withGraphFetched = jest.fn().mockReturnThis();

// Utility Functions
MockModel.mockClear = () => {
  Object.keys(MockModel).forEach((f) => {
    if (jest.isMockFunction(f)) f.mockClear();
  });
  returnValue = undefined;
};
MockModel.mockReset = () => {
  Object.keys(MockModel).forEach((f) => {
    if (jest.isMockFunction(f)) f.mockReset();
  });
  returnValue = undefined;
};
MockModel.mockResolvedValue = retFn;
MockModel.mockReturnValue = retFn;

module.exports = MockModel;
