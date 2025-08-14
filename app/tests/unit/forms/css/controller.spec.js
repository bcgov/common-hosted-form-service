const controller = require('../../../../src/forms/css/controller');
const service = require('../../../../src/components/cssService');

const req = {
  query: { firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@example.com', guid: '1234-5678-9012' },
};

describe('query idir users', () => {
  it('should call queryIdirUsers method ', async () => {
    let res = jest.fn();
    let next = jest.fn();
    service.queryIdirUsers = jest.fn().mockReturnValue({
      data: [
        {
          username: '1234-5678-9012@idir',
          email: 'jane.smith@xample.com',
          firstName: 'Jane',
          lastName: 'Smith',
          attributes: {
            display_name: ['Jane Smith'],
            idir_user_guid: ['1234-5678-9012'],
            idir_username: ['JASMITH'],
          },
        },
      ],
    });
    await controller.queryIdirUsers(req, res, next);
    expect(service.queryIdirUsers).toBeCalledTimes(1);
  });
});
