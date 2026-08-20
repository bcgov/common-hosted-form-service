jest.mock('../../../../../src/forms/common/models', () => ({
  FormSubmissionPackageSettings: { query: jest.fn() },
}));

const Problem = require('api-problem');
const service = require('../../../../../src/forms/feature/submitToEmail/settingsService');

describe('validate', () => {
  it('passes when disabled (template/recipients not required)', () => {
    expect(() => service.validate({ enabled: false })).not.toThrow();
    expect(() => service.validate({})).not.toThrow();
    expect(() => service.validate()).not.toThrow();
  });

  it('throws 422 when enabled without a template', () => {
    expect(() => service.validate({ enabled: true, emails: ['a@b.com'] })).toThrow(Problem);
    try {
      service.validate({ enabled: true, emails: ['a@b.com'] });
    } catch (e) {
      expect(e.status).toBe(422);
    }
  });

  it('throws 422 when enabled with a template but no recipients', () => {
    expect(() => service.validate({ enabled: true, templateId: 't', emails: [] })).toThrow(Problem);
    expect(() => service.validate({ enabled: true, templateId: 't' })).toThrow(Problem);
  });

  it('passes when enabled with a template and at least one recipient', () => {
    expect(() => service.validate({ enabled: true, templateId: 't', emails: ['a@b.com'] })).not.toThrow();
  });
});
