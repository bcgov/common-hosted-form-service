const submissionTokenService = require('../../../src/components/submissionTokenService');

const SUBMISSION_ID = 'b8f0c1d2-3456-4789-9abc-def012345678';

describe('submissionTokenService', () => {
  describe('mint/verify round-trip', () => {
    test('a freshly minted token verifies for its submission id', () => {
      const token = submissionTokenService.mint(SUBMISSION_ID);
      expect(submissionTokenService.verify(token, SUBMISSION_ID)).toBe(true);
    });

    test('the token shape is id.exp.sig', () => {
      const token = submissionTokenService.mint(SUBMISSION_ID);
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe(SUBMISSION_ID);
      expect(Number.isInteger(Number(parts[1]))).toBe(true);
      expect(parts[2]).toMatch(/^[0-9a-f]{64}$/);
    });

    test('a fresh token is set to expire roughly TTL_MS from now', () => {
      const before = Date.now();
      const token = submissionTokenService.mint(SUBMISSION_ID);
      const after = Date.now();
      const exp = Number(token.split('.')[1]);
      expect(exp).toBeGreaterThanOrEqual(before + submissionTokenService.TTL_MS);
      expect(exp).toBeLessThanOrEqual(after + submissionTokenService.TTL_MS);
    });
  });

  describe('verify rejects', () => {
    test('a token whose id segment does not match the expected id', () => {
      const token = submissionTokenService.mint(SUBMISSION_ID);
      const other = '00000000-0000-4000-8000-000000000000';
      expect(submissionTokenService.verify(token, other)).toBe(false);
    });

    test('a token with an expiry in the past', () => {
      const token = submissionTokenService.mint(SUBMISSION_ID);
      const [, , sig] = token.split('.');
      const tampered = `${SUBMISSION_ID}.${Date.now() - 1000}.${sig}`;
      expect(submissionTokenService.verify(tampered, SUBMISSION_ID)).toBe(false);
    });

    test('a token with a forged signature', () => {
      const token = submissionTokenService.mint(SUBMISSION_ID);
      const [id, exp] = token.split('.');
      const forged = `${id}.${exp}.${'a'.repeat(64)}`;
      expect(submissionTokenService.verify(forged, SUBMISSION_ID)).toBe(false);
    });

    test('a token whose signature is the wrong length', () => {
      const token = submissionTokenService.mint(SUBMISSION_ID);
      const [id, exp] = token.split('.');
      const wrongLen = `${id}.${exp}.${'a'.repeat(10)}`;
      expect(submissionTokenService.verify(wrongLen, SUBMISSION_ID)).toBe(false);
    });

    test('a token whose expiry has been swapped with another valid future value', () => {
      const token = submissionTokenService.mint(SUBMISSION_ID);
      const [id, exp, sig] = token.split('.');
      const swapped = `${id}.${Number(exp) + 1000}.${sig}`;
      expect(submissionTokenService.verify(swapped, SUBMISSION_ID)).toBe(false);
    });

    test('a malformed token (wrong number of segments)', () => {
      expect(submissionTokenService.verify(`${SUBMISSION_ID}.nope`, SUBMISSION_ID)).toBe(false);
      expect(submissionTokenService.verify('not.a.real.token.at.all', SUBMISSION_ID)).toBe(false);
    });

    test('a non-string token', () => {
      expect(submissionTokenService.verify(undefined, SUBMISSION_ID)).toBe(false);
      expect(submissionTokenService.verify(null, SUBMISSION_ID)).toBe(false);
      expect(submissionTokenService.verify(12345, SUBMISSION_ID)).toBe(false);
    });

    test('a token with a non-numeric expiry segment', () => {
      const [, , sig] = submissionTokenService.mint(SUBMISSION_ID).split('.');
      expect(submissionTokenService.verify(`${SUBMISSION_ID}.notanumber.${sig}`, SUBMISSION_ID)).toBe(false);
    });
  });
});
