import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import { useIdpStore } from '~/store/identityProviders';

describe('identityProviders store', () => {
  setActivePinia(createPinia());
  const idpStore = useIdpStore();

  beforeEach(() => {
    idpStore.providers = [
      {
        code: 'idir',
        display: 'IDIR',
        idp: 'idir',
        primary: true,
        login: true,
        extra: { sortOrder: 10 },
      },
      {
        code: 'azureidir',
        display: 'IDIR MFA',
        idp: 'azureidir',
        primary: true,
        login: true,
        extra: { sortOrder: 10, canonicalCode: 'idir' },
      },
      {
        code: 'bceid-basic',
        display: 'Basic BCeID',
        idp: 'bceidbasic',
        primary: false,
        login: true,
        extra: { sortOrder: 30 },
      },
    ];
  });

  describe('findByCode', () => {
    it('should return canonicalCode as code when extra.canonicalCode is set', () => {
      const result = idpStore.findByCode('azureidir');

      expect(result.code).toBe('idir');
      expect(result.hint).toBe('azureidir');
      expect(result.display).toBe('IDIR MFA');
    });

    it('should return own code when no canonicalCode', () => {
      const result = idpStore.findByCode('idir');

      expect(result.code).toBe('idir');
      expect(result.hint).toBe('idir');
    });

    it('should return own code for non-primary providers', () => {
      const result = idpStore.findByCode('bceid-basic');

      expect(result.code).toBe('bceid-basic');
    });

    it('should return undefined for unknown code', () => {
      const result = idpStore.findByCode('unknown');

      expect(result).toBeUndefined();
    });
  });
});
