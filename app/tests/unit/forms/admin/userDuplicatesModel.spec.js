const UserDuplicates = require('../../../../src/forms/common/models/views/userDuplicates');

describe('UserDuplicates model', () => {
  it('filters by resolution status', () => {
    const query = { where: jest.fn() };

    UserDuplicates.modifiers.filterResolved(query, false);

    expect(query.where).toHaveBeenCalledWith('isResolved', false);
  });

  it('uses the duplicate review ordering', () => {
    const query = { orderBy: jest.fn().mockReturnThis() };

    UserDuplicates.modifiers.orderDefault(query);

    expect(query.orderBy.mock.calls).toEqual([['canonicalIdp'], ['matchType'], ['matchKey'], ['lastActivityAt', 'desc']]);
  });
});
