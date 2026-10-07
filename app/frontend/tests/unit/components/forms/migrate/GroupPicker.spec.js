import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import GroupPicker from '~/components/forms/migrate/GroupPicker.vue';

function mountPicker(props) {
  return mount(GroupPicker, { props });
}

function chipsFor(wrapper, groupName) {
  const row = wrapper
    .findAll('.v-list-item')
    .find((r) => r.text().includes(groupName));
  return row.findAll('.role-chips .v-chip').map((c) => c.text());
}

describe('GroupPicker.vue', () => {
  it("shows the current user's roles in each group, Form Admin first", () => {
    const wrapper = mountPicker({
      available: [],
      assigned: [
        {
          id: 'g1',
          name: 'Test_reviewer',
          isFormAdmin: true,
          userRoles: ['submission_reviewer', 'form_admin'],
        },
        {
          id: 'g2',
          name: 'Test_approver',
          isFormAdmin: false,
          userRoles: ['submission_approver'],
        },
      ],
    });

    // The shared i18n stub echoes keys, so assert the label keys.
    expect(chipsFor(wrapper, 'Test_reviewer')).toEqual([
      'trans.formMigration.formAdminBadge',
      'trans.formMigration.roleSubmissionReviewer',
    ]);
    expect(chipsFor(wrapper, 'Test_approver')).toEqual([
      'trans.formMigration.roleSubmissionApprover',
    ]);
  });

  it('shows an unrecognised CSTAR role by its code rather than hiding it', () => {
    const wrapper = mountPicker({
      available: [
        { id: 'g1', name: 'Custom', isFormAdmin: false, userRoles: ['auditor'] },
      ],
      assigned: [],
    });

    expect(chipsFor(wrapper, 'Custom')).toEqual(['auditor']);
  });

  it('shows no chips for a group the user is not a member of', () => {
    const wrapper = mountPicker({
      available: [
        { id: 'g1', name: 'Not mine', isFormAdmin: false, userRoles: [] },
      ],
      assigned: [],
    });

    expect(chipsFor(wrapper, 'Not mine')).toEqual([]);
  });

  it('falls back to the Form Admin badge when userRoles is absent', () => {
    const wrapper = mountPicker({
      available: [],
      assigned: [{ id: 'g1', name: 'Admins', isFormAdmin: true }],
    });

    expect(chipsFor(wrapper, 'Admins')).toEqual([
      'trans.formMigration.formAdminBadge',
    ]);
  });
});
