const originAccess = require('../../../../../src/webcomponents/common/middleware/originAccess');
describe('webcomponents/common/middleware/originAccess', () => {
  it('calls next() (stub allows all)', () => {
    const req = { headers: {} };
    const res = {};
    const next = jest.fn();
    originAccess(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
