import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRouter } from 'vue-router';

import rbacService from '~/services/rbacService';
import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';
import { useTenantStore } from '~/store/tenant';
import Migrate from '~/views/form/Migrate.vue';

vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    replace: vi.fn(),
    push: vi.fn(),
  })),
}));

vi.mock('~/services/rbacService', () => ({
  default: {
    getMigrationPreview: vi.fn(),
    getMigrationTenantGroups: vi.fn(),
    executeMigration: vi.fn(),
  },
}));

const FORM_ID = 'form-abc-123';

const MOCK_TENANT = {
  id: 'tenant-1',
  name: 'Tenant One',
  roles: ['form_admin'],
};

const MOCK_IMPACT = {
  team: [
    { email: 'user@example.com', fullName: 'User One', idpCode: 'idir', isBceid: false, roles: ['owner'] },
  ],
  submissions: { total: 10, drafts: 3, withShareUsers: 2 },
};

const MOCK_PREPARE_RESPONSE = {
  data: {
    formName: 'Contractor Intake 2026',
    eligibleTenants: [MOCK_TENANT],
    impact: MOCK_IMPACT,
  },
};

const STUBS = {
  BaseSecure: {
    name: 'BaseSecure',
    template: '<div class="base-secure-stub"><slot /></div>',
  },
};

describe('Migrate.vue', () => {
  const pinia = createTestingPinia();
  setActivePinia(pinia);

  const tenantStore = useTenantStore(pinia);
  const authStore = useAuthStore(pinia);

  const MOCK_GROUPS_RESPONSE = {
    data: { groups: [], preSelectedGroupIds: [], teamMemberGroups: [] },
  };

  beforeEach(() => {
    tenantStore.$reset();
    tenantStore.isTenantFeatureEnabled = true;
    rbacService.getMigrationPreview.mockResolvedValue(MOCK_PREPARE_RESPONSE);
    rbacService.getMigrationTenantGroups.mockResolvedValue(MOCK_GROUPS_RESPONSE);
  });

  function mountComponent() {
    return mount(Migrate, {
      props: { f: FORM_ID },
      global: { plugins: [pinia], stubs: STUBS },
    });
  }

  describe('onMounted — tenant feature gate', () => {
    it('redirects to UserForms and skips prepare call when tenant feature is disabled', async () => {
      const replace = vi.fn();
      useRouter.mockImplementationOnce(() => ({ replace, push: vi.fn() }));
      tenantStore.isTenantFeatureEnabled = false;

      mountComponent();
      await flushPromises();

      expect(replace).toHaveBeenCalledWith({ name: 'UserForms' });
      expect(rbacService.getMigrationPreview).not.toHaveBeenCalled();
    });

    it('calls getMigrationPreview when tenant feature is enabled', async () => {
      mountComponent();
      await flushPromises();

      // Initial load is not a refresh, so it may use the cached tenant list.
      expect(rbacService.getMigrationPreview).toHaveBeenCalledWith(FORM_ID, {
        refresh: false,
      });
    });
  });

  describe('loadPrepareData', () => {
    it('populates eligibleTenants from response', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.eligibleTenants).toEqual(MOCK_PREPARE_RESPONSE.data.eligibleTenants);
    });

    it('populates impact from response', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.impact).toEqual(MOCK_IMPACT);
    });

    it('defaults impact to empty team and zero submission counts when response omits it', async () => {
      rbacService.getMigrationPreview.mockResolvedValueOnce({ data: { eligibleTenants: [] } });

      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.impact.team).toEqual([]);
      expect(wrapper.vm.impact.submissions.total).toBe(0);
      expect(wrapper.vm.impact.submissions.drafts).toBe(0);
      expect(wrapper.vm.impact.submissions.withShareUsers).toBe(0);
    });

    it('sets error and keeps eligibleTenants empty on prepare failure', async () => {
      const errMsg = 'Form is already migrated to a tenant.';
      rbacService.getMigrationPreview.mockRejectedValueOnce({
        response: { data: { detail: errMsg } },
      });

      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.loading).toBe(false);
      expect(wrapper.vm.eligibleTenants).toEqual([]);
    });

    it('loading is false after prepare resolves', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.loading).toBe(false);
    });
  });

  describe('form identity on the page', () => {
    it('renders the form name so the user can tell which form they are migrating', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      // The name is rendered through formNameCaption, and the shared i18n stub echoes
      // keys rather than interpolating, so assert the value the template is given.
      expect(wrapper.vm.formName).toBe('Contractor Intake 2026');
      expect(wrapper.text()).toContain('trans.formMigration.formNameCaption');
    });

    it('omits the name heading when the API returns no form name', async () => {
      rbacService.getMigrationPreview.mockResolvedValueOnce({
        data: { eligibleTenants: [MOCK_TENANT], impact: MOCK_IMPACT },
      });

      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.formName).toBe('');
      expect(wrapper.text()).not.toContain('trans.formMigration.formNameCaption');
    });
  });

  describe('Refresh pulls fresh data', () => {
    it('re-fetches the preview with refresh=true as well as the tenant groups', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      rbacService.getMigrationPreview.mockClear();
      rbacService.getMigrationTenantGroups.mockClear();

      await wrapper.vm.refreshTenantGroups();

      // Groups alone are not "the latest data" — the impact table and counts come
      // from the preview, and the cache must be bypassed for an explicit refresh.
      expect(rbacService.getMigrationTenantGroups).toHaveBeenCalledWith(FORM_ID, 'tenant-1');
      expect(rbacService.getMigrationPreview).toHaveBeenCalledWith(FORM_ID, {
        refresh: true,
      });
    });

    it('updates the impact counts shown after a refresh returns new numbers', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      rbacService.getMigrationPreview.mockResolvedValueOnce({
        data: {
          formName: 'Contractor Intake 2026',
          eligibleTenants: [MOCK_TENANT],
          impact: {
            team: MOCK_IMPACT.team,
            submissions: { total: 99, drafts: 7, withShareUsers: 4 },
          },
        },
      });

      await wrapper.vm.refreshTenantGroups();

      expect(wrapper.vm.impact.submissions).toEqual({
        total: 99,
        drafts: 7,
        withShareUsers: 4,
      });
    });

    it('picks up changed group membership for groups that stay assigned', async () => {
      // Regression: the assigned groups used to keep the objects captured when the
      // tenant was first selected, so a refresh could not change who was in them.
      rbacService.getMigrationTenantGroups.mockResolvedValueOnce({
        data: {
          groups: [{ id: 'g1', name: 'Form Admins', isFormAdmin: true, members: [] }],
          preSelectedGroupIds: ['g1'],
          teamMemberGroups: [],
        },
      });

      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      expect(wrapper.vm.assignedGroupUsers).toEqual([]);

      rbacService.getMigrationTenantGroups.mockResolvedValueOnce({
        data: {
          groups: [
            {
              id: 'g1',
              name: 'Form Admins',
              isFormAdmin: true,
              members: [{ ssoUserId: 's1', fullName: 'Ann Lee', email: 'ann@gov.bc.ca' }],
            },
          ],
          preSelectedGroupIds: ['g1'],
          teamMemberGroups: [],
        },
      });

      await wrapper.vm.refreshTenantGroups();

      expect(wrapper.vm.assignedGroupUsers.map((u) => u.email)).toEqual(['ann@gov.bc.ca']);
    });

    it('does not blank the page with the full-page loading state while refreshing', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      await wrapper.vm.refreshTenantGroups();

      expect(wrapper.vm.loading).toBe(false);
    });
  });

  describe('assigned users list', () => {
    const withMembers = (members) => ({
      data: {
        groups: [
          { id: 'g1', name: 'Form Admins', isFormAdmin: true, members },
        ],
        preSelectedGroupIds: ['g1'],
        teamMemberGroups: [],
      },
    });

    it('lists the distinct people in the assigned groups', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue(
        withMembers([
          { ssoUserId: 's1', fullName: 'Ann Lee', email: 'ann@gov.bc.ca' },
          { ssoUserId: 's2', fullName: 'Bob Roy', email: 'bob@gov.bc.ca' },
        ])
      );

      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      expect(wrapper.vm.assignedGroupUsers.map((u) => u.email)).toEqual([
        'ann@gov.bc.ca',
        'bob@gov.bc.ca',
      ]);
      expect(wrapper.text()).toContain('Ann Lee');
      expect(wrapper.text()).toContain('Bob Roy');
    });

    it('shows a person in two assigned groups once, tagged with both', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue({
        data: {
          groups: [
            {
              id: 'g1',
              name: 'Form Admins',
              isFormAdmin: true,
              members: [{ ssoUserId: 's1', fullName: 'Ann Lee', email: 'ann@gov.bc.ca' }],
            },
            {
              id: 'g2',
              name: 'Reviewers',
              isFormAdmin: false,
              members: [{ ssoUserId: 's1', fullName: 'Ann Lee', email: 'ann@gov.bc.ca' }],
            },
          ],
          preSelectedGroupIds: ['g1', 'g2'],
          teamMemberGroups: [],
        },
      });

      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      expect(wrapper.vm.assignedGroupUsers).toHaveLength(1);
      expect(wrapper.vm.assignedGroupUsers[0].groupNames).toEqual([
        'Form Admins',
        'Reviewers',
      ]);
    });

    it('renders an empty state when the assigned groups have no members', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue(withMembers([]));

      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      expect(wrapper.vm.assignedGroupUsers).toEqual([]);
      expect(wrapper.text()).toContain('trans.formMigration.assignedUsersEmpty');
    });

    it('flags groups whose membership could not be read, rather than calling them empty', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue(withMembers(null));

      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      expect(wrapper.vm.unreadableAssignedGroups).toHaveLength(1);
      expect(wrapper.text()).toContain('trans.formMigration.assignedUsersUnreadable');
    });
  });

  describe('already-migrated state', () => {
    const migratedResponse = {
      data: {
        alreadyMigrated: true,
        formName: 'Contractor Intake 2026',
        tenantId: 'tenant-1',
        migratedAt: '2026-09-20T10:00:00.000Z',
        migratedBy: 'ABC@idir',
      },
    };

    it('renders the migrated state instead of an error when the form is already migrated', async () => {
      rbacService.getMigrationPreview.mockResolvedValue(migratedResponse);

      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.alreadyMigrated).toBe(true);
      expect(wrapper.vm.error).toBeNull();
      expect(wrapper.text()).toContain('trans.formMigration.alreadyMigratedTitle');
    });

    it('hides the migration wizard once the form is migrated', async () => {
      rbacService.getMigrationPreview.mockResolvedValue(migratedResponse);

      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.showMigratedState).toBe(true);
      // The irreversible-action warning is meaningless after the fact.
      expect(wrapper.text()).not.toContain(
        'trans.formMigration.cannotBeUndoneWarning'
      );
    });

    it('surfaces who migrated it and when', async () => {
      rbacService.getMigrationPreview.mockResolvedValue(migratedResponse);

      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.migratedInfo).toMatchObject({
        tenantId: 'tenant-1',
        migratedBy: 'ABC@idir',
      });
    });

    it('returning to the page after migrating shows the migrated state, not an error', async () => {
      // Reproduces browser Back: the component remounts and re-fetches.
      rbacService.getMigrationPreview.mockResolvedValue(migratedResponse);

      const wrapper = mountComponent();
      await flushPromises();
      await wrapper.vm.loadPreviewData();

      expect(wrapper.vm.error).toBeNull();
      expect(wrapper.vm.alreadyMigrated).toBe(true);
    });
  });

  describe('stale response handling when switching tenants', () => {
    it('ignores a slow response for a tenant the user has already switched away from', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      let resolveSlow;
      rbacService.getMigrationTenantGroups
        .mockImplementationOnce(() => new Promise((r) => (resolveSlow = r)))
        .mockResolvedValueOnce({
          data: {
            groups: [{ id: 'fast', name: 'Fast Tenant Group', isFormAdmin: true, members: [] }],
            preSelectedGroupIds: ['fast'],
            teamMemberGroups: [],
          },
        });

      const slow = wrapper.vm.loadTenantGroups('tenant-slow');
      const fast = wrapper.vm.loadTenantGroups('tenant-fast');
      await fast;

      // The abandoned tenant's response lands last and must not overwrite the current one.
      resolveSlow({
        data: {
          groups: [{ id: 'slow', name: 'Slow Tenant Group', isFormAdmin: true, members: [] }],
          preSelectedGroupIds: ['slow'],
          teamMemberGroups: [],
        },
      });
      await slow;
      await flushPromises();

      expect(wrapper.vm.allTenantGroups.map((g) => g.id)).toEqual(['fast']);
    });
  });

  describe('membership that could not be read', () => {
    const unreadable = {
      data: {
        groups: [{ id: 'g1', name: 'Form Admins', isFormAdmin: true, members: null }],
        preSelectedGroupIds: ['g1'],
        teamMemberGroups: [],
      },
    };

    it('reports Unknown rather than asserting the member has no groups', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue(unreadable);

      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      expect(wrapper.vm.teamRowsWithStatus[0].transferStatus).toBe('unknown');
    });

    it('does not count members as at risk when membership is unknown', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue(unreadable);

      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      expect(wrapper.vm.atRiskCount).toBe(0);
    });

    it('does not claim nobody is enrolled when the group could not be read', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue(unreadable);

      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      expect(wrapper.text()).toContain('trans.formMigration.assignedUsersUnreadable');
      expect(wrapper.text()).not.toContain('trans.formMigration.assignedUsersEmpty');
    });
  });

  describe('migrated in another tab', () => {
    it('switches to the already-migrated view instead of showing the error text', async () => {
      rbacService.executeMigration.mockRejectedValueOnce({
        response: { data: { code: 'ALREADY_MIGRATED', detail: 'Form is already migrated to a tenant.' } },
      });

      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      // Queued only now: the initial mount already consumed one preview response.
      rbacService.getMigrationPreview.mockResolvedValueOnce({
        data: { alreadyMigrated: true, formName: 'X', tenantId: 'tenant-1', migratedAt: null, migratedBy: null },
      });

      await wrapper.vm.submitMigration();
      await flushPromises();

      expect(wrapper.vm.alreadyMigrated).toBe(true);
      expect(wrapper.vm.error).toBeNull();
    });
  });

  describe('UX revisions', () => {
    describe('confirm dialog group list', () => {
      const group = (id, isFormAdmin = false) => ({
        id,
        name: `Group_${id}`,
        isFormAdmin,
      });

      it('shows every group with no toggle when there are three or fewer', async () => {
        const wrapper = mountComponent();
        await flushPromises();
        wrapper.vm.assignedGroups = [group('a', true), group('b'), group('c')];
        await flushPromises();

        expect(wrapper.vm.visibleConfirmGroups).toHaveLength(3);
        expect(wrapper.vm.hiddenConfirmGroupCount).toBe(0);
      });

      it('shows three, Form Admin first, and expands to all on demand', async () => {
        const wrapper = mountComponent();
        await flushPromises();
        wrapper.vm.assignedGroups = [
          group('a'),
          group('b'),
          group('c'),
          group('d'),
          group('z', true),
          group('e'),
        ];
        await flushPromises();

        expect(wrapper.vm.visibleConfirmGroups.map((g) => g.id)).toEqual([
          'z',
          'a',
          'b',
        ]);
        expect(wrapper.vm.hiddenConfirmGroupCount).toBe(3);

        wrapper.vm.showAllConfirmGroups = true;
        await flushPromises();
        expect(wrapper.vm.visibleConfirmGroups).toHaveLength(6);
      });

      it('starts collapsed each time the dialog opens', async () => {
        const wrapper = mountComponent();
        await flushPromises();
        wrapper.vm.showAllConfirmGroups = true;

        wrapper.vm.requestMigration();

        expect(wrapper.vm.showAllConfirmGroups).toBe(false);
        expect(wrapper.vm.showConfirmDialog).toBe(true);
      });
    });

    it('Migrate another form leaves tenant mode and opens My Forms', async () => {
      // Only My Forms (no tenant) forms can be migrated, but success selects the new
      // tenant — so the button must clear it before listing forms.
      const push = vi.fn();
      useRouter.mockImplementationOnce(() => ({ replace: vi.fn(), push }));
      const formStore = useFormStore(pinia);
      const wrapper = mountComponent();
      await flushPromises();

      await wrapper.vm.goToMyForms();

      expect(tenantStore.clearSelectedTenant).toHaveBeenCalled();
      expect(formStore.getFormsForCurrentUser).toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith({ name: 'UserForms' });
      expect(
        tenantStore.clearSelectedTenant.mock.invocationCallOrder[0]
      ).toBeLessThan(
        formStore.getFormsForCurrentUser.mock.invocationCallOrder[0]
      );
    });

    it('enables Migrate without an acknowledgement checkbox', async () => {
      // The checkbox was removed; the confirm dialog is the single final check.
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      wrapper.vm.assignedGroups = [{ id: 'g1', name: 'Admins', isFormAdmin: true }];
      await flushPromises();

      expect(wrapper.vm.canSubmit).toBe(true);
      expect(wrapper.find('input[type="checkbox"].v-checkbox-btn').exists()).toBe(false);
      expect(wrapper.text()).not.toContain('trans.formMigration.confirmCheckbox');
    });

    it('still requires a Form Admin group', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      wrapper.vm.assignedGroups = [{ id: 'g1', name: 'Readers', isFormAdmin: false }];
      await flushPromises();

      expect(wrapper.vm.canSubmit).toBe(false);
    });

    it('does not set a placeholder on the tenant select', () => {
      // Label and placeholder rendered on top of each other while empty.
      const source = readFileSync(resolve(__dirname, '../../../../src/views/form/Migrate.vue'), 'utf8');
      const select = source.slice(source.indexOf('<v-select'), source.indexOf('</v-select>') + 11);

      expect(select).not.toContain(':placeholder');
    });

    it('opens the expectations panel by default', () => {
      const source = readFileSync(resolve(__dirname, '../../../../src/views/form/Migrate.vue'), 'utf8');

      expect(source).toMatch(/v-expansion-panels[\s\S]{0,160}:model-value="\[0\]"/);
    });

    it('shows the migration details card after a successful migration', async () => {
      rbacService.executeMigration.mockResolvedValue({});
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      await wrapper.vm.submitMigration();
      await flushPromises();

      expect(wrapper.vm.migrated).toBe(true);
      expect(wrapper.text()).toContain('trans.formMigration.resultDetailsTitle');
      expect(wrapper.text()).toContain('trans.formMigration.resultManageInChefs');
      expect(wrapper.text()).toContain('trans.formMigration.resultMigrateAnother');
    });

    it('reports who migrated the form from the stored record, not the browser', async () => {
      rbacService.executeMigration.mockResolvedValue({});
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      rbacService.getMigrationPreview.mockResolvedValueOnce({
        data: { alreadyMigrated: true, migratedBy: 'ABC@idir', migratedAt: '2026-05-26T17:42:00.000Z' },
      });
      await wrapper.vm.submitMigration();
      await flushPromises();

      expect(wrapper.vm.migrationResult.migratedBy).toBe('ABC@idir');
      expect(wrapper.vm.migratedByDisplay).toBe('ABC@idir');
    });

    it('still shows a success screen when the migration record cannot be read back', async () => {
      // The migration already succeeded; a failed read-back must not look like an error.
      rbacService.executeMigration.mockResolvedValue({});
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      rbacService.getMigrationPreview.mockRejectedValueOnce(new Error('boom'));
      await wrapper.vm.submitMigration();
      await flushPromises();

      expect(wrapper.vm.migrated).toBe(true);
      expect(wrapper.vm.error).toBeNull();
    });
  });

  describe('computed: canSubmit', () => {
    it('is false when no tenant selected', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.canSubmit).toBe(false);
    });

    it('is false when tenant selected but confirm checkbox unchecked', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      expect(wrapper.vm.canSubmit).toBe(false);
    });

    it('is false when confirmed but no assigned group has the Form Admin role', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      wrapper.vm.confirmed = true;
      wrapper.vm.assignedGroups = [{ id: 'g1', name: 'Group 1', isFormAdmin: false }];

      expect(wrapper.vm.canSubmit).toBe(false);
    });

    it('is true when a tenant is selected, confirmed, and a Form Admin group is assigned', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      wrapper.vm.confirmed = true;
      wrapper.vm.assignedGroups = [{ id: 'g1', name: 'Group 1', isFormAdmin: true }];

      expect(wrapper.vm.canSubmit).toBe(true);
    });
  });

  describe('computed: showNoGroupsWarning', () => {
    it('is false when no tenant is selected', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.showNoGroupsWarning).toBe(false);
    });

    it('is true when a tenant is selected and no assigned group has the Form Admin role', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      expect(wrapper.vm.assignedGroups).toEqual([]);
      expect(wrapper.vm.showNoGroupsWarning).toBe(true);
    });

    it('is false once a Form Admin group is assigned', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      wrapper.vm.assignedGroups = [{ id: 'g1', name: 'Group 1', isFormAdmin: true }];

      expect(wrapper.vm.showNoGroupsWarning).toBe(false);
    });
  });

  describe('BCeID Basic vs Business — access impact', () => {
    const TEAM_WITH_MIXED_IDPS = [
      { email: 'basic@example.com', fullName: 'Basic User', idpCode: 'bceid-basic', isBceid: true, isBceidBasic: true, roles: ['form_submitter'] },
      { email: 'biz@example.com', fullName: 'Business User', idpCode: 'bceid-business', isBceid: true, isBceidBasic: false, roles: ['form_submitter'] },
      { email: 'idir@example.com', fullName: 'IDIR User', idpCode: 'idir', isBceid: false, isBceidBasic: false, roles: ['owner'] },
    ];

    function mockPrepareWithTeam(team) {
      rbacService.getMigrationPreview.mockResolvedValue({
        data: {
          eligibleTenants: [MOCK_TENANT],
          impact: { team, submissions: { total: 0, drafts: 0, withShareUsers: 0 } },
        },
      });
    }

    it('only BCeID Basic members are unconditionally flagged as losing access', async () => {
      mockPrepareWithTeam(TEAM_WITH_MIXED_IDPS);
      const wrapper = mountComponent();
      await flushPromises();

      const statuses = Object.fromEntries(
        wrapper.vm.teamRowsWithStatus.map((m) => [m.email, m.transferStatus])
      );
      expect(statuses['basic@example.com']).toBe('loses_access');
      expect(statuses['biz@example.com']).not.toBe('loses_access');
      expect(statuses['idir@example.com']).not.toBe('loses_access');
    });

    it('BCeID Business follows the same group-membership logic as IDIR once a tenant is selected', async () => {
      mockPrepareWithTeam(TEAM_WITH_MIXED_IDPS);
      rbacService.getMigrationTenantGroups.mockResolvedValue({
        data: {
          groups: [{ id: 'g1', name: 'Admins', isFormAdmin: true }],
          preSelectedGroupIds: ['g1'],
          teamMemberGroups: [
            { email: 'biz@example.com', groupIds: ['g1'] },
            { email: 'idir@example.com', groupIds: ['g1'] },
          ],
        },
      });
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      const statuses = Object.fromEntries(
        wrapper.vm.teamRowsWithStatus.map((m) => [m.email, m.transferStatus])
      );
      expect(statuses['biz@example.com']).toBe('retained');
      expect(statuses['idir@example.com']).toBe('retained');
      expect(statuses['basic@example.com']).toBe('loses_access');
    });

    it('hasBceidBasicUsers / bceidBasicCount only count BCeID Basic, not Business', async () => {
      mockPrepareWithTeam(TEAM_WITH_MIXED_IDPS);
      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.hasBceidBasicUsers).toBe(true);
      expect(wrapper.vm.bceidBasicCount).toBe(1);
    });

    it('hasBceidBasicUsers is false when the team has BCeID Business but no BCeID Basic members', async () => {
      mockPrepareWithTeam(TEAM_WITH_MIXED_IDPS.filter((m) => m.email !== 'basic@example.com'));
      const wrapper = mountComponent();
      await flushPromises();

      expect(wrapper.vm.hasBceidBasicUsers).toBe(false);
      expect(wrapper.vm.bceidBasicCount).toBe(0);
    });
  });

  describe('Form Admin group check — via real GroupPicker UI', () => {
    const GROUPS_WITH_FORM_ADMIN = {
      data: {
        groups: [
          { id: 'g1', name: 'Admins', roles: ['form_admin'], isFormAdmin: true, isUserMember: true },
          { id: 'g2', name: 'Reviewers', roles: ['reviewer'], isFormAdmin: false, isUserMember: true },
        ],
        preSelectedGroupIds: ['g1'],
        teamMemberGroups: [],
      },
    };

    function arrowButtons(wrapper) {
      return wrapper.find('.arrows-col').findAll('button');
    }

    it('pre-selects the Form Admin group on initial load and allows submission', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue(GROUPS_WITH_FORM_ADMIN);

      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      expect(wrapper.vm.assignedGroups.map((g) => g.id)).toEqual(['g1']);
      expect(wrapper.vm.hasFormAdminGroupAssigned).toBe(true);
      expect(wrapper.vm.showNoGroupsWarning).toBe(false);
    });

    it('shows the warning and disables submit after removing the Form Admin group', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue(GROUPS_WITH_FORM_ADMIN);

      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      wrapper.vm.confirmed = true;

      // Select the assigned Form Admin group row, then click "remove selected".
      await wrapper.find('.form-admin-row input[type="checkbox"]').trigger('click');
      await flushPromises();
      await arrowButtons(wrapper)[2].trigger('click'); // removeSelected
      await flushPromises();

      expect(wrapper.vm.assignedGroups).toEqual([]);
      expect(wrapper.vm.hasFormAdminGroupAssigned).toBe(false);
      expect(wrapper.vm.showNoGroupsWarning).toBe(true);
      expect(wrapper.vm.canSubmit).toBe(false);
    });

    it('clears the warning and re-enables submit after re-adding the Form Admin group', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue(GROUPS_WITH_FORM_ADMIN);

      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      wrapper.vm.confirmed = true;

      // Remove it first.
      await wrapper.find('.form-admin-row input[type="checkbox"]').trigger('click');
      await flushPromises();
      await arrowButtons(wrapper)[2].trigger('click'); // removeSelected
      await flushPromises();
      expect(wrapper.vm.hasFormAdminGroupAssigned).toBe(false);

      // Now it's in the "Available" panel — select and add it back.
      await wrapper.find('.form-admin-row input[type="checkbox"]').trigger('click');
      await flushPromises();
      await arrowButtons(wrapper)[0].trigger('click'); // addSelected
      await flushPromises();

      expect(wrapper.vm.assignedGroups.map((g) => g.id)).toEqual(['g1']);
      expect(wrapper.vm.hasFormAdminGroupAssigned).toBe(true);
      expect(wrapper.vm.showNoGroupsWarning).toBe(false);
      expect(wrapper.vm.canSubmit).toBe(true);
    });
  });

  describe('refreshTenantGroups', () => {
    it('does nothing when no tenant is selected', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      rbacService.getMigrationTenantGroups.mockClear();
      await wrapper.vm.refreshTenantGroups();

      expect(rbacService.getMigrationTenantGroups).not.toHaveBeenCalled();
    });

    it('re-fetches groups for the currently selected tenant without clearing it', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue({
        data: {
          groups: [{ id: 'g1', name: 'Admins', isFormAdmin: true }],
          preSelectedGroupIds: ['g1'],
          teamMemberGroups: [],
        },
      });
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      rbacService.getMigrationTenantGroups.mockClear();
      rbacService.getMigrationTenantGroups.mockResolvedValue({
        data: {
          groups: [
            { id: 'g1', name: 'Admins', isFormAdmin: true },
            { id: 'g3', name: 'New Group', isFormAdmin: false },
          ],
          preSelectedGroupIds: ['g1'],
          teamMemberGroups: [],
        },
      });
      await wrapper.vm.refreshTenantGroups();

      expect(rbacService.getMigrationTenantGroups).toHaveBeenCalledWith(FORM_ID, 'tenant-1');
      expect(wrapper.vm.selectedTenantId).toBe('tenant-1');
      expect(wrapper.vm.assignedGroups.map((g) => g.id)).toEqual(['g1']);
    });

    it('drops assigned groups no longer present and sets staleGroupsRemoved', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue({
        data: {
          groups: [
            { id: 'g1', name: 'Admins', isFormAdmin: true },
            { id: 'g2', name: 'Reviewers', isFormAdmin: false },
          ],
          preSelectedGroupIds: ['g1', 'g2'],
          teamMemberGroups: [],
        },
      });
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      wrapper.vm.confirmed = true;

      expect(wrapper.vm.assignedGroups.map((g) => g.id)).toEqual(['g1', 'g2']);
      expect(wrapper.vm.staleGroupsRemoved).toBe(false);

      // g2 has since been deleted from the tenant.
      rbacService.getMigrationTenantGroups.mockResolvedValue({
        data: {
          groups: [{ id: 'g1', name: 'Admins', isFormAdmin: true }],
          preSelectedGroupIds: ['g1'],
          teamMemberGroups: [],
        },
      });
      await wrapper.vm.refreshTenantGroups();

      expect(wrapper.vm.assignedGroups.map((g) => g.id)).toEqual(['g1']);
      expect(wrapper.vm.staleGroupsRemoved).toBe(true);
    });

    it('does not flag staleGroupsRemoved when nothing was dropped', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue({
        data: {
          groups: [{ id: 'g1', name: 'Admins', isFormAdmin: true }],
          preSelectedGroupIds: ['g1'],
          teamMemberGroups: [],
        },
      });
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      await wrapper.vm.refreshTenantGroups();

      expect(wrapper.vm.staleGroupsRemoved).toBe(false);
      expect(wrapper.vm.assignedGroups.map((g) => g.id)).toEqual(['g1']);
    });

    it('sets error and leaves current data intact when the refresh call fails', async () => {
      rbacService.getMigrationTenantGroups.mockResolvedValue({
        data: {
          groups: [{ id: 'g1', name: 'Admins', isFormAdmin: true }],
          preSelectedGroupIds: ['g1'],
          teamMemberGroups: [],
        },
      });
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      rbacService.getMigrationTenantGroups.mockRejectedValueOnce({
        response: { data: { detail: 'CSTAR unavailable' } },
      });
      await wrapper.vm.refreshTenantGroups();

      expect(wrapper.vm.error).toBe('CSTAR unavailable');
      expect(wrapper.vm.assignedGroups.map((g) => g.id)).toEqual(['g1']);
      expect(wrapper.vm.refreshingGroups).toBe(false);
    });
  });

  describe('Team Members table reactivity to group assignment changes', () => {
    function arrows(wrapper) {
      return wrapper.find('.arrows-col').findAll('button');
    }

    beforeEach(() => {
      rbacService.getMigrationPreview.mockResolvedValue({
        data: {
          eligibleTenants: [MOCK_TENANT],
          impact: {
            team: [{ email: 'member@example.com', fullName: 'Team Member', idpCode: 'idir', isBceid: false, isBceidBasic: false, roles: ['form_submitter'] }],
            submissions: { total: 0, drafts: 0, withShareUsers: 0 },
          },
        },
      });
      rbacService.getMigrationTenantGroups.mockResolvedValue({
        data: {
          groups: [
            { id: 'g1', name: 'Admins', isFormAdmin: true },
            { id: 'g2', name: 'Reviewers', isFormAdmin: false },
          ],
          preSelectedGroupIds: ['g1'],
          // member@example.com belongs to g2 in this tenant, not the pre-selected g1.
          teamMemberGroups: [{ email: 'member@example.com', groupIds: ['g2'] }],
        },
      });
    });

    it('updates memberGroups.isAssigned and transferStatus live when a group moves via the real picker UI', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      // Initially: g1 assigned (pre-selected), member belongs to g2 (not assigned) -> needs_assignment.
      let row = wrapper.vm.teamRowsWithStatus.find((m) => m.email === 'member@example.com');
      expect(row.transferStatus).toBe('needs_assignment');
      expect(row.memberGroups).toEqual([{ id: 'g2', name: 'Reviewers', isAssigned: false }]);

      // Move g2 (currently in Available) into Assigned via the real GroupPicker UI.
      const g2Row = wrapper.findAll('.picker-list .v-list-item').find((el) => el.text().includes('Reviewers'));
      await g2Row.find('input[type="checkbox"]').trigger('click');
      await flushPromises();
      await arrows(wrapper)[0].trigger('click'); // Add Selected
      await flushPromises();

      row = wrapper.vm.teamRowsWithStatus.find((m) => m.email === 'member@example.com');
      expect(row.transferStatus).toBe('retained');
      expect(row.memberGroups).toEqual([{ id: 'g2', name: 'Reviewers', isAssigned: true }]);

      // Move g2 back out to Available (unassign).
      const assignedG2Row = wrapper.findAll('.picker-list .v-list-item').find((el) => el.text().includes('Reviewers'));
      await assignedG2Row.find('input[type="checkbox"]').trigger('click');
      await flushPromises();
      await arrows(wrapper)[2].trigger('click'); // Remove Selected
      await flushPromises();

      row = wrapper.vm.teamRowsWithStatus.find((m) => m.email === 'member@example.com');
      expect(row.transferStatus).toBe('needs_assignment');
      expect(row.memberGroups).toEqual([{ id: 'g2', name: 'Reviewers', isAssigned: false }]);
    });

    it('updates the table after refreshTenantGroups() picks up new server-side membership data', async () => {
      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();

      let row = wrapper.vm.teamRowsWithStatus.find((m) => m.email === 'member@example.com');
      expect(row.transferStatus).toBe('needs_assignment');

      // Simulate: elsewhere in CSTAR, the member got added to g1 (the assigned group) too.
      rbacService.getMigrationTenantGroups.mockResolvedValue({
        data: {
          groups: [
            { id: 'g1', name: 'Admins', isFormAdmin: true },
            { id: 'g2', name: 'Reviewers', isFormAdmin: false },
          ],
          preSelectedGroupIds: ['g1'],
          teamMemberGroups: [{ email: 'member@example.com', groupIds: ['g1', 'g2'] }],
        },
      });
      await wrapper.vm.refreshTenantGroups();
      await flushPromises();

      row = wrapper.vm.teamRowsWithStatus.find((m) => m.email === 'member@example.com');
      expect(row.transferStatus).toBe('retained');
      expect(row.memberGroups.sort((a, b) => a.id.localeCompare(b.id))).toEqual([
        { id: 'g1', name: 'Admins', isAssigned: true },
        { id: 'g2', name: 'Reviewers', isAssigned: false },
      ]);
    });
  });

  describe('computed: selectedTenant', () => {
    it('returns the matching tenant object from eligibleTenants', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      expect(wrapper.vm.selectedTenant).toEqual(MOCK_TENANT);
    });

    it('returns null when selectedTenantId has no match', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'unknown-id';
      expect(wrapper.vm.selectedTenant).toBeNull();
    });
  });

  describe('submitMigration', () => {
    beforeEach(() => {
      rbacService.executeMigration.mockResolvedValue({});
    });

    it('calls executeMigration with formId and tenantId only when no groups assigned', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises(); // let the watcher fire
      await wrapper.vm.submitMigration();

      expect(rbacService.executeMigration).toHaveBeenCalledWith(FORM_ID, {
        tenantId: 'tenant-1',
      });
    });

    it('switches to the migrated tenant via tenantStore.selectTenant', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      await wrapper.vm.submitMigration();

      expect(tenantStore.selectTenant).toHaveBeenCalledWith(MOCK_TENANT);
    });

    it('shows the result screen on success instead of redirecting away', async () => {
      // Migration is irreversible and reassigns access — the user needs to be told what
      // happened and who still needs a group, not silently dropped on another page.
      const push = vi.fn();
      useRouter.mockImplementationOnce(() => ({ replace: vi.fn(), push }));

      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      await wrapper.vm.submitMigration();

      expect(push).not.toHaveBeenCalled();
      expect(wrapper.vm.migrated).toBe(true);
      expect(wrapper.vm.migrationResult).toMatchObject({
        tenantName: MOCK_TENANT.name,
      });
    });

    it('still switches the session to the migrated tenant before showing the result', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      await wrapper.vm.submitMigration();

      expect(tenantStore.selectTenant).toHaveBeenCalledWith(MOCK_TENANT);
      expect(wrapper.vm.migrated).toBe(true);
    });

    it('sets error and does not redirect on executeMigration failure', async () => {
      const push = vi.fn();
      useRouter.mockImplementationOnce(() => ({ replace: vi.fn(), push }));
      rbacService.executeMigration.mockRejectedValueOnce({
        response: { data: { detail: 'Form is already migrated to a tenant.' } },
      });

      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      await wrapper.vm.submitMigration();

      expect(tenantStore.selectTenant).not.toHaveBeenCalled();
      expect(push).not.toHaveBeenCalled();
    });

    it('sets submitting to false after execution completes', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      await wrapper.vm.submitMigration();

      expect(wrapper.vm.submitting).toBe(false);
    });
  });

  describe('requestMigration / confirmMigration — final confirmation dialog', () => {
    it('opens the confirm dialog without submitting', async () => {
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.requestMigration();

      expect(wrapper.vm.showConfirmDialog).toBe(true);
      expect(rbacService.executeMigration).not.toHaveBeenCalled();
    });

    it('closes the dialog and submits on confirm', async () => {
      rbacService.executeMigration.mockResolvedValue({});
      const wrapper = mountComponent();
      await flushPromises();

      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      wrapper.vm.requestMigration();
      await wrapper.vm.confirmMigration();

      expect(wrapper.vm.showConfirmDialog).toBe(false);
      expect(rbacService.executeMigration).toHaveBeenCalledWith(FORM_ID, {
        tenantId: 'tenant-1',
      });
    });
  });

  describe('submitMigration — CSTAR session-expiry recovery', () => {
    beforeEach(() => {
      authStore.keycloak = { updateToken: vi.fn() };
    });

    it('offers an in-place retry (no reload) when the Keycloak token can be refreshed', async () => {
      rbacService.executeMigration.mockRejectedValueOnce({
        response: { data: { code: 'SESSION_EXPIRED' } },
      });
      authStore.keycloak.updateToken.mockResolvedValue(true);

      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      await wrapper.vm.submitMigration();

      expect(authStore.keycloak.updateToken).toHaveBeenCalledWith(30);
      expect(wrapper.vm.showRetryButton).toBe(true);
      expect(wrapper.vm.error).toBe(
        'trans.formMigration.sessionExpiredRetry'
      );
    });

    it('falls back to the reload prompt when the Keycloak token cannot be refreshed', async () => {
      rbacService.executeMigration.mockRejectedValueOnce({
        response: { data: { code: 'SESSION_EXPIRED' } },
      });
      authStore.keycloak.updateToken.mockRejectedValue(new Error('refresh failed'));

      const wrapper = mountComponent();
      await flushPromises();
      wrapper.vm.selectedTenantId = 'tenant-1';
      await flushPromises();
      await wrapper.vm.submitMigration();

      expect(wrapper.vm.showRetryButton).toBe(false);
      expect(wrapper.vm.error).toBe('trans.formMigration.sessionExpired');
    });
  });
});
