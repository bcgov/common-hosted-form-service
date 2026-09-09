import { describe, expect, it, vi } from 'vitest';

import { entryTitle } from '~/offline/entryDisplay';

// Load-bearing invariant across every offline UI surface: the entry id (a UUID)
// must never appear in a rendered title. Regression here would leak PII-adjacent
// identifiers into the pending list and the sync progress modal.
describe('offline/entryDisplay - entryTitle', () => {
  const id = 'a1b2c3d4-1111-4111-8111-222222222222';

  it('returns the user note verbatim when present', () => {
    const t = vi.fn();
    expect(entryTitle({ id, note: 'my draft', formName: 'Contact' }, t)).toBe('my draft');
    expect(t).not.toHaveBeenCalled();
  });

  it('formats a form-name default when note is absent, and never includes the UUID', () => {
    const t = vi.fn().mockReturnValue('Queued submission for Contact Form');
    const result = entryTitle({ id, formName: 'Contact Form' }, t);
    expect(result).toBe('Queued submission for Contact Form');
    expect(t).toHaveBeenCalledWith('trans.offlineSubmission.pendingDefaultDescription', { formName: 'Contact Form' });
    expect(result).not.toContain(id);
  });

  it('falls back to the no-name i18n key when both note and formName are absent, and never includes the UUID', () => {
    const t = vi.fn().mockReturnValue('Queued submission');
    const result = entryTitle({ id }, t);
    expect(result).toBe('Queued submission');
    expect(t).toHaveBeenCalledWith('trans.offlineSubmission.pendingDefaultDescriptionNoName');
    expect(result).not.toContain(id);
  });

  it('treats an empty-string note as absent (does not render "" as the title)', () => {
    const t = vi.fn().mockReturnValue('Queued submission for X');
    const result = entryTitle({ id, note: '', formName: 'X' }, t);
    expect(result).toBe('Queued submission for X');
  });
});
