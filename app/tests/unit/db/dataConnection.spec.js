const DataConnection = require('../../../src/db/dataConnection');

//
// resetConnection against a fake knex: destroy holds its callback so a test
// can decide when the reset finishes.
//
describe('DataConnection.resetConnection', () => {
  let dataConnection;
  let realKnex;
  let destroyCallbacks;

  beforeAll(() => {
    dataConnection = new DataConnection();
    realKnex = dataConnection.knex;
  });

  beforeEach(() => {
    destroyCallbacks = [];
    dataConnection.knex = {
      destroy: jest.fn((callback) => destroyCallbacks.push(callback)),
      initialize: jest.fn(),
    };
    dataConnection._resetting = false;
  });

  afterAll(async () => {
    dataConnection.knex = realKnex;
    await realKnex.destroy();
  });

  it('destroys and then initializes the pool', () => {
    dataConnection.resetConnection();

    expect(dataConnection.knex.destroy).toHaveBeenCalledTimes(1);
    expect(dataConnection.knex.initialize).not.toHaveBeenCalled();

    destroyCallbacks[0]();

    expect(dataConnection.knex.initialize).toHaveBeenCalledTimes(1);
  });

  it('ignores calls while a reset is running', () => {
    dataConnection.resetConnection();
    dataConnection.resetConnection();
    dataConnection.resetConnection();

    expect(dataConnection.knex.destroy).toHaveBeenCalledTimes(1);

    destroyCallbacks[0]();
    dataConnection.resetConnection();

    expect(dataConnection.knex.destroy).toHaveBeenCalledTimes(2);
  });

  it('accepts a new reset even if initialize throws', () => {
    dataConnection.knex.initialize.mockImplementation(() => {
      throw new Error('initialize failed');
    });

    dataConnection.resetConnection();
    expect(() => destroyCallbacks[0]()).toThrow('initialize failed');
    dataConnection.resetConnection();

    expect(dataConnection.knex.destroy).toHaveBeenCalledTimes(2);
  });
});
