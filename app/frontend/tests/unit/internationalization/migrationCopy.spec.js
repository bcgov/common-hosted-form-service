import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import en from '~/internationalization/trans/chefs/en/en.json';

/**
 * Copy on the migration flow is specified verbatim in the "Form migration revisions"
 * Figma file, and component specs stub $t to echo its key — so a reworded or dropped
 * string is invisible to them. These assert the strings themselves.
 */
const migration = en.formMigration;
const LOCALES_DIR = resolve(__dirname, '../../../src/internationalization/trans/chefs');

describe('migration copy matches the Figma spec', () => {
  it.each([
    ['cannotBeUndoneWarning', 'Migration is permanent and cannot be undone'],
    ['pageTitle', 'Migrate form to tenant'],
    ['formNameCaption', 'Form name: {formName}'],
    ['selectTenant', 'Select tenant'],
    ['selectTenantHelper', 'Move this form to a tenant and choose which groups can access it.'],
    ['assignGroupsTitle', 'Group assignment'],
    ['impactTitle', 'Migration impact'],
    ['assignedUsersTitle', 'Members of the assigned groups'],
    ['colUser', 'User'],
    ['colGroups', 'Group(s)'],
    ['teamImpactTitle', 'Current form team members'],
    ['totalSubmissionsLabel', 'Submitted forms'],
    ['draftsLabel', 'Drafts in progress'],
    ['sharedSubmissionsLabel', 'Shared drafts'],
    ['afterMigrationTitle', 'What to expect after migration'],
    ['confirmTitle', 'Migrate this form?'],
    ['confirmButton', 'Migrate form'],
    ['cancelButton', 'Cancel'],
    ['resultTitle', 'Form migrated successfully'],
    ['resultDetailsTitle', 'Migration details'],
    ['resultManageInChefs', 'Manage form in CHEFS'],
    ['resultManageInCstar', 'Manage access in CSTAR'],
    ['resultMigrateAnother', 'Migrate another form'],
  ])('%s reads exactly as specified', (key, expected) => {
    expect(migration[key]).toBe(expected);
  });

  it('uses sentence case for the step headings', () => {
    // Title Case headings ("Select Tenant") were part of the old design.
    for (const key of ['selectTenant', 'assignGroupsTitle', 'impactTitle', 'pageTitle']) {
      const words = migration[key].split(' ').slice(1);
      const titleCased = words.filter((w) => /^[A-Z][a-z]/.test(w));
      expect(titleCased).toEqual([]);
    }
  });

  it('spells out the expectations as five plain statements', () => {
    const bullets = ['afterSubmissionsKept', 'afterExistingSharesKept', 'afterDraftShareGated', 'afterRolesNoLongerApply', 'afterManageInCstar'];

    for (const key of bullets) {
      expect(migration[key]).toBeTruthy();
      expect(migration[key].trim().endsWith('.')).toBe(true);
    }
  });

  it('drops the database wording the reviewer rejected', () => {
    // "Team role records remain in the database" described storage, not access.
    const all = JSON.stringify(migration).toLowerCase();

    expect(all).not.toContain('database');
    expect(migration.afterTeamRolesStay).toBeUndefined();
  });

  it('has no acknowledgement checkbox string left', () => {
    // The confirm dialog is the only confirmation now.
    expect(migration.confirmCheckbox).toBeUndefined();
  });

  it('describes submission data in terms of what survives migration', () => {
    expect(migration.totalSubmissionsHint).toBe('Submitted forms remain available after migration.');
    expect(migration.draftsHint).toBe('Submitters can still access their own drafts after migration.');
    expect(migration.sharedSubmissionsHint).toBe('Existing draft sharing remains in place. New shares are limited to members of the assigned groups.');
  });

  describe('confirm dialog', () => {
    it('labels each value so the summary reads as a list', () => {
      expect(migration.confirmFormLabel).toBe('Form:');
      expect(migration.confirmTenantLabel).toBe('Tenant:');
      expect(migration.confirmGroupsLabel).toBe('Groups:');
    });

    it('states the permanence in the dialog itself', () => {
      expect(migration.confirmConsequence).toBe('This form will be permanently linked to this tenant. Migration cannot be undone.');
    });
  });

  describe('success page', () => {
    it('labels every row of the migration details card', () => {
      expect(migration.resultFormName).toBe('Form name');
      expect(migration.resultTenant).toBe('Tenant');
      expect(migration.resultAssignedGroups).toBe('Assigned Groups');
      expect(migration.resultMigratedBy).toBe('Migrated by');
      expect(migration.resultDateTime).toBe('Date and time');
    });

    it('explains that access is now managed through CSTAR groups', () => {
      expect(migration.resultAccessNotice).toBe(
        'Access to this form is now managed through the assigned group(s) in CSTAR. Previous form team members who are not in an assigned group no longer have team access.'
      );
    });
  });
});

describe('locale coverage', () => {
  const localeFiles = readdirSync(LOCALES_DIR)
    .filter((d) => statSync(join(LOCALES_DIR, d)).isDirectory())
    .map((d) => {
      const file = readdirSync(join(LOCALES_DIR, d)).find((f) => f.endsWith('.json'));
      return file ? [d, join(LOCALES_DIR, d, file)] : null;
    })
    .filter(Boolean);

  it('finds every locale directory', () => {
    expect(localeFiles.length).toBeGreaterThan(10);
  });

  it.each(localeFiles)('%s defines the same formMigration keys as en', (_locale, path) => {
    // Missing keys fall back to English silently, so drift is invisible at runtime;
    // extra keys are copy the UI no longer renders.
    const parsed = JSON.parse(readFileSync(path, 'utf8').replace(/^﻿/, ''));

    expect(Object.keys(parsed.formMigration).sort()).toEqual(Object.keys(migration).sort());
  });
});
