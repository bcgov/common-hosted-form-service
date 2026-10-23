const stripCredentials = require('../../../../../src/webcomponents/common/middleware/stripCredentials');

describe('webcomponents/common/middleware/stripCredentials', () => {
  it('removes credential headers and keeps the rest', () => {
    const req = {
      headers: {
        authorization: 'Bearer host.app.token',
        'x-chefs-gateway-token': 'gateway-token',
        origin: 'https://www.example.com',
        'content-type': 'application/json',
      },
    };
    const next = jest.fn();

    stripCredentials(req, {}, next);

    expect(req.headers).toEqual({ origin: 'https://www.example.com', 'content-type': 'application/json' });
    expect(next).toHaveBeenCalledWith();
  });
});
