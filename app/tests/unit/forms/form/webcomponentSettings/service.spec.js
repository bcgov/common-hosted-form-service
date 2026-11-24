const { UniqueViolationError } = require('objection');
const uuid = require('uuid');

const service = require('../../../../../src/forms/form/webcomponentSettings/service');

const queryHelpers = service._queryHelpers;
const currentUser = { usernameIdp: 'TESTER@idir' };
const formId = uuid.v4();

describe('webcomponentSettings service', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('normalizeOrigin', () => {
    it.each([
      ['https://www.example.com', 'https://www.example.com'],
      ['https://www.example.com/', 'https://www.example.com'],
      ['  https://WWW.Example.COM  ', 'https://www.example.com'],
      ['https://www.example.com:443', 'https://www.example.com'],
      ['https://www.example.com:8443', 'https://www.example.com:8443'],
      ['http://localhost:3000', 'http://localhost:3000'],
      ['http://127.0.0.1:8080', 'http://127.0.0.1:8080'],
      ['http://[::1]:5173', 'http://[::1]:5173'],
    ])('normalises %p to %p', (value, expected) => {
      expect(service.normalizeOrigin(value)).toBe(expected);
    });

    it.each([
      'http://www.example.com',
      'https://www.example.com/path',
      'https://www.example.com?x=1',
      'https://www.example.com#top',
      'https://user:pass@www.example.com',
      'https://*.example.com',
      'ftp://www.example.com',
      'www.example.com',
      'null',
      '',
      undefined,
      42,
      `https://${'a'.repeat(250)}.com`,
    ])('rejects %p', (value) => {
      expect(service.normalizeOrigin(value)).toBeNull();
    });

    it('rejects an international origin that is too long once converted', () => {
      const host = Array.from({ length: 125 }, (_v, i) => String.fromCodePoint(0x4e00 + i * 7)).join('');
      const value = `https://${host}.ca`;
      expect(value.length).toBeLessThanOrEqual(255);
      expect(service.normalizeOrigin(value)).toBeNull();
    });
  });

  describe('validateSettings', () => {
    it('returns normalised origins', () => {
      expect(service.validateSettings({ allowedOrigins: ['https://WWW.example.com/', 'http://localhost:3000'] })).toEqual(['https://www.example.com', 'http://localhost:3000']);
    });

    it('accepts an empty list', () => {
      expect(service.validateSettings({ allowedOrigins: [] })).toEqual([]);
    });

    it.each([[undefined], [{}], [{ allowedOrigins: 'https://www.example.com' }]])('rejects %p', (data) => {
      expect(() => service.validateSettings(data)).toThrow(expect.objectContaining({ status: 422 }));
    });

    it('rejects more than the maximum number of origins', () => {
      const allowedOrigins = Array.from({ length: service.MAX_ALLOWED_ORIGINS + 1 }, (_v, i) => `https://site${i}.example.com`);
      expect(() => service.validateSettings({ allowedOrigins })).toThrow(expect.objectContaining({ status: 422 }));
    });

    it('lists the invalid origins', () => {
      expect(() => service.validateSettings({ allowedOrigins: ['https://www.example.com', 'https://bad.example.com/path'] })).toThrow(
        expect.objectContaining({ status: 422, invalidOrigins: ['https://bad.example.com/path'] })
      );
    });

    it('rejects origins that are duplicates once normalised', () => {
      expect(() => service.validateSettings({ allowedOrigins: ['https://www.example.com', 'https://WWW.example.com:443'] })).toThrow(
        expect.objectContaining({ status: 422, duplicateOrigins: ['https://www.example.com'] })
      );
    });
  });

  describe('readSettings', () => {
    it('returns the settings', async () => {
      const settings = { id: uuid.v4(), formId, allowedOrigins: ['https://www.example.com'] };
      jest.spyOn(queryHelpers, 'findSettingsByFormId').mockResolvedValue(settings);
      expect(await service.readSettings(formId)).toEqual(settings);
    });

    it('returns null when there are no settings', async () => {
      jest.spyOn(queryHelpers, 'findSettingsByFormId').mockResolvedValue(undefined);
      expect(await service.readSettings(formId)).toBeNull();
    });
  });

  describe('readAllowedOrigins', () => {
    it('returns the allowed origins', async () => {
      jest.spyOn(queryHelpers, 'findSettingsByFormId').mockResolvedValue({ allowedOrigins: ['https://www.example.com'] });
      expect(await service.readAllowedOrigins(formId)).toEqual(['https://www.example.com']);
    });

    it('returns an empty list when there are no settings', async () => {
      jest.spyOn(queryHelpers, 'findSettingsByFormId').mockResolvedValue(undefined);
      expect(await service.readAllowedOrigins(formId)).toEqual([]);
    });
  });

  describe('upsert', () => {
    beforeEach(() => {
      jest.spyOn(queryHelpers, 'updateSettings').mockResolvedValue(1);
      jest.spyOn(queryHelpers, 'createSettings').mockResolvedValue({});
    });

    it('creates settings when none exist', async () => {
      const saved = { formId, allowedOrigins: ['https://www.example.com'] };
      jest.spyOn(queryHelpers, 'findSettingsByFormId').mockResolvedValueOnce(undefined).mockResolvedValueOnce(saved);

      const result = await service.upsert(formId, { allowedOrigins: ['https://WWW.example.com'] }, currentUser);

      expect(queryHelpers.createSettings).toHaveBeenCalledWith(
        expect.objectContaining({ formId, allowedOrigins: ['https://www.example.com'], createdBy: currentUser.usernameIdp })
      );
      expect(queryHelpers.updateSettings).not.toHaveBeenCalled();
      expect(result).toEqual(saved);
    });

    it('updates existing settings', async () => {
      const existing = { id: uuid.v4(), formId, allowedOrigins: [] };
      jest.spyOn(queryHelpers, 'findSettingsByFormId').mockResolvedValueOnce(existing).mockResolvedValueOnce(existing);

      await service.upsert(formId, { allowedOrigins: ['https://www.example.com'] }, currentUser);

      expect(queryHelpers.updateSettings).toHaveBeenCalledWith(existing.id, { allowedOrigins: ['https://www.example.com'], updatedBy: currentUser.usernameIdp });
      expect(queryHelpers.createSettings).not.toHaveBeenCalled();
    });

    it('updates the row another save created first', async () => {
      const created = { id: uuid.v4(), formId, allowedOrigins: ['https://first.example.com'] };
      const saved = { ...created, allowedOrigins: ['https://www.example.com'] };
      jest.spyOn(queryHelpers, 'findSettingsByFormId').mockResolvedValueOnce(undefined).mockResolvedValueOnce(created).mockResolvedValueOnce(saved);
      queryHelpers.createSettings.mockRejectedValueOnce(
        new UniqueViolationError({ nativeError: new Error('duplicate key'), client: 'postgres', table: 'form_webcomponent_settings', columns: ['formId'] })
      );

      const result = await service.upsert(formId, { allowedOrigins: ['https://www.example.com'] }, currentUser);

      expect(queryHelpers.updateSettings).toHaveBeenCalledWith(created.id, { allowedOrigins: ['https://www.example.com'], updatedBy: currentUser.usernameIdp });
      expect(result).toEqual(saved);
    });

    it('rejects invalid settings before reading or writing', async () => {
      jest.spyOn(queryHelpers, 'findSettingsByFormId');
      await expect(service.upsert(formId, { allowedOrigins: ['http://www.example.com'] }, currentUser)).rejects.toThrow(expect.objectContaining({ status: 422 }));
      expect(queryHelpers.findSettingsByFormId).not.toHaveBeenCalled();
      expect(queryHelpers.createSettings).not.toHaveBeenCalled();
    });

    it('passes on other database errors', async () => {
      jest.spyOn(queryHelpers, 'findSettingsByFormId').mockResolvedValue(undefined);
      queryHelpers.createSettings.mockRejectedValueOnce(new Error('db down'));

      await expect(service.upsert(formId, { allowedOrigins: [] }, currentUser)).rejects.toThrow('db down');
      expect(queryHelpers.updateSettings).not.toHaveBeenCalled();
    });
  });
});
