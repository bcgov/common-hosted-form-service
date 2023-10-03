let returnValue = undefined;

const retFn = (value) => {
  returnValue = value;
};

/**
 * @class MockTransaction
 * Mock Objection Transaction
 */
class MockTransaction {}

// Mocked Objection Functions
MockTransaction.commit = jest.fn().mockReturnThis();
MockTransaction.rollback = jest.fn().mockReturnThis();

// Utility Functions
MockTransaction.mockClear = () => {
  Object.keys(MockTransaction).forEach((f) => {
    if (jest.isMockFunction(f)) f.mockClear();
  });
};
MockTransaction.mockReset = () => {
  Object.keys(MockTransaction).forEach((f) => {
    if (jest.isMockFunction(f)) f.mockReset();
  });
};

/**
 * @class MockModel
 * Mock Objection Model
 */
class MockModel {}

// Mocked Objection Functions
MockModel.findById = jest.fn().mockReturnThis();
MockModel.first = jest.fn().mockReturnThis();
MockModel.delete = jest.fn().mockReturnThis();
MockModel.deleteById = jest.fn().mockReturnThis();
MockModel.insert = jest.fn().mockReturnThis();
MockModel.insertAndFetch = jest.fn().mockReturnThis();
MockModel.insertGraph = jest.fn().mockReturnThis();
MockModel.insertGraphAndFetch = jest.fn().mockReturnThis();
MockModel.findById = jest.fn().mockReturnThis();
MockModel.modify = jest.fn().mockReturnThis();
MockModel.modifiers = jest.fn().mockReturnThis();
MockModel.orderBy = jest.fn().mockReturnThis();
MockModel.patch = jest.fn().mockReturnThis();
MockModel.patchAndFetchById = jest.fn().mockReturnThis();
MockModel.query = jest.fn().mockReturnThis();
MockModel.query.select = jest.fn().mockReturnThis();
MockModel.query.column = jest.fn().mockReturnThis();
MockModel.resolve = jest.fn().mockResolvedValue(returnValue);
MockModel.returning = jest.fn().mockReturnThis();
(MockModel.skipUndefined = jest.fn(() => {
  throw new Error('skipUndefined() is deprecated in Objection 3.0. Refactor to not use this method!');
})),
  (MockModel.startTransaction = jest.fn().mockResolvedValue(MockTransaction));
MockModel.then = jest.fn((done) => {
  done(returnValue);
});
MockModel.throwIfNotFound = jest.fn().mockReturnThis();
MockModel.update = jest.fn().mockReturnThis();
MockModel.where = jest.fn().mockReturnThis();
MockModel.whereIn = jest.fn().mockReturnThis();
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

module.exports = { MockModel, MockTransaction };
