const { HUMAN_USER_SQL_PREDICATE, humanUserJoin } = require('../../../../src/forms/common/systemUsers');

describe('systemUsers', () => {
  describe('humanUserJoin', () => {
    it('joins the user and identity provider onto the caller supplied column', () => {
      const sql = humanUserJoin('fsu."userId"').replace(/\s+/g, ' ').trim();

      expect(sql).toBe('JOIN "user" hu ON hu.id = fsu."userId" JOIN identity_provider hip ON hip.code = hu."idpCode"');
    });

    it('works for any user id column, so every caller can share one definition', () => {
      expect(humanUserJoin('fru."userId"')).toContain('hu.id = fru."userId"');
    });

    it('leaves no unsubstituted placeholder behind', () => {
      expect(humanUserJoin('x."userId"')).not.toContain('{{userIdCol}}');
    });
  });

  describe('HUMAN_USER_SQL_PREDICATE', () => {
    it('selects on the login flag rather than a hardcoded list of accounts', () => {
      // identity_provider.login is false for api/gateway/public, so a newly seeded
      // service provider is excluded without any code change here.
      expect(HUMAN_USER_SQL_PREDICATE).toBe('hip.login = true');
      expect(HUMAN_USER_SQL_PREDICATE).not.toMatch(/api|gateway|public|username/i);
    });
  });
});
