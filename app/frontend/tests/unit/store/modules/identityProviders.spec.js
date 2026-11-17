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

  describe('restrictsFileDownloads', () => {
    it('is true for a provider flagged with extra.restrictFileDownloads', () => {
      idpStore.providers = idpStore.providers.map((p) =>
        p.code === 'bceid-basic'
          ? { ...p, extra: { ...p.extra, restrictFileDownloads: true } }
          : p
      );

      expect(idpStore.restrictsFileDownloads('bceidbasic')).toBe(true);
      expect(idpStore.restrictsFileDownloads('idir')).toBe(false);
    });

    it('is false for a provider without the flag', () => {
      expect(idpStore.restrictsFileDownloads('bceidbasic')).toBe(false);
    });

    it('is false for an unknown hint, no hint, or no providers', () => {
      expect(idpStore.restrictsFileDownloads('unknown')).toBe(false);
      expect(idpStore.restrictsFileDownloads(undefined)).toBe(false);
      idpStore.providers = null;
      expect(idpStore.restrictsFileDownloads('bceidbasic')).toBe(false);
    });
  });
});
