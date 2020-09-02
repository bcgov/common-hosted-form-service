const { v4: uuidv4 } = require('uuid');

const CREATED_BY = 'migration-002';

exports.up = function(knex) {
  return Promise.resolve()
    .then(() => {
      return knex('form_identity_provider').del();
    })
    .then(() => {
      return knex('form_role_user').del();
    })
    .then(() => {
      return knex('role_permission').del();
    })
    .then(() => {
      return knex('identity_provider').del();
    })
    .then(()=> {
      return knex('permission').del();
    })
    .then(()=> {
      return knex('role').del();
    })
    .then(()=> {
      return knex('user').del();
    })
    .then(() => {
      return knex('form_submission').del();
    })
    .then(() => {
      return knex('form_version').del();
    })
    .then(() => {
      return knex('form').del();
    })
    .then(() => {
      const items = [
        {
          createdBy: CREATED_BY,
          code: 'public',
          display: 'Public',
          active: true,
          idp: 'public'
        },
        {
          createdBy: CREATED_BY,
          code: 'idir',
          display: 'IDIR',
          active: true,
          idp: 'idir'
        }
      ];
      return knex('identity_provider').insert(items);
    })
    .then(() => {
      const items = [
        {
          createdBy: CREATED_BY,
          code: 'owner',
          display: 'Owner',
          description: 'Owns the form',
          active: true
        },
        {
          createdBy: CREATED_BY,
          code: 'team_manager',
          display: 'Team Manager',
          description: 'Manages Team members for the form',
          active: true
        },
        {
          createdBy: CREATED_BY,
          code: 'form_designer',
          display: 'Form Designer',
          description: 'Designs the form',
          active: true
        },
        {
          createdBy: CREATED_BY,
          code: 'submission_reviewer',
          display: 'Reviewer',
          description: 'Can review and manage all form submissions',
          active: true
        },
        {
          createdBy: CREATED_BY,
          code: 'form_submitter',
          display: 'Submitter',
          description: 'Can fill out and submit the form',
          active: true
        }
      ];
      return knex('role').insert(items).returning('code');
    })
    .then(() => {
      const items = [
        {
          createdBy: CREATED_BY,
          code: 'form_read',
          display: 'Form Read',
          description: 'Can view the form (read-only)',
          active: true
        },
        {
          createdBy: CREATED_BY,
          code: 'form_update',
          display: 'Form Update',
          description: 'Can edit/update the basic form metadata (not the design)',
          active: true
        },
        {
          createdBy: CREATED_BY,
          code: 'form_delete',
          display: 'Form Delete',
          description: 'Can delete the form',
          active: true
        },
        {
          createdBy: CREATED_BY,
          code: 'submission_create',
          display: 'Submission Create',
          description: 'Can fill out and submit this form',
          active: true
        },
        {
          createdBy: CREATED_BY,
          code: 'submission_read',
          display: 'Submission Read',
          description: 'Can view (all) form submissions (read-only)',
          active: true
        },
        {
          createdBy: CREATED_BY,
          code: 'submission_update',
          display: 'Submission Update',
          description: 'Can edit/update form submissions',
          active: true
        },
        {
          createdBy: CREATED_BY,
          code: 'submission_delete',
          display: 'Submission Delete',
          description: 'Can delete form submissions',
          active: true
        },
        {
          createdBy: CREATED_BY,
          code: 'design_create',
          display: 'Design Create',
          description: 'Can create a form design',
          active: true
        },
        {
          createdBy: CREATED_BY,
          code: 'design_read',
          display: 'Design Read',
          description: 'Can view the form design (read-only)',
          active: true
        },
        {
          createdBy: CREATED_BY,
          code: 'design_update',
          display: 'Design Update',
          description: 'Can edit/update the form design',
          active: true
        },
        {
          createdBy: CREATED_BY,
          code: 'design_delete',
          display: 'Design Delete',
          description: 'Can delete the form design',
          active: true
        },
        {
          createdBy: CREATED_BY,
          code: 'team_read',
          display: 'Team Read',
          description: 'Can view the team members (read-only)',
          active: true
        },
        {
          createdBy: CREATED_BY,
          code: 'team_update',
          display: 'Team Update',
          description: 'Can update the team members (add, remove)',
          active: true
        }
      ];
      return knex('permission').insert(items).returning('code');
    })
    .then(() => {
      const items = [];

      ['form_read', 'form_update', 'form_delete'].forEach(p => {
        const item = {
          id: uuidv4(),
          createdBy: CREATED_BY,
          role: 'owner',
          permission: p
        };
        items.push(item);
      });

      ['form_read', 'team_read', 'team_update'].forEach(p => {
        const item = {
          id: uuidv4(),
          createdBy: CREATED_BY,
          role: 'team_manager',
          permission: p
        };
        items.push(item);
      });

      ['form_read', 'design_create', 'design_read', 'design_update', 'design_delete'].forEach(p => {
        const item = {
          id: uuidv4(),
          createdBy: CREATED_BY,
          role: 'form_designer',
          permission: p
        };
        items.push(item);
      });

      ['form_read', 'submission_read', 'submission_update', 'submission_delete'].forEach(p => {
        const item = {
          id: uuidv4(),
          createdBy: CREATED_BY,
          role: 'submission_reviewer',
          permission: p
        };
        items.push(item);
      });

      ['form_read', 'submission_create'].forEach(p => {
        const item = {
          id: uuidv4(),
          createdBy: CREATED_BY,
          role: 'form_submitter',
          permission: p
        };
        items.push(item);
      });

      return knex('role_permission').insert(items).returning('id');
    });
};

exports.down = function(knex) {
  return Promise.resolve()
    .then(() => {
      return knex('form_identity_provider').del();
    })
    .then(() => {
      return knex('form_role_user').del();
    })
    .then(() => {
      return knex('role_permission').del();
    })
    .then(() => {
      return knex('identity_provider').del();
    })
    .then(()=> {
      return knex('permission').del();
    })
    .then(()=> {
      return knex('role').del();
    })
    .then(()=> {
      return knex('user').del();
    })
    .then(() => {
      return knex('form_submission').del();
    })
    .then(() => {
      return knex('form_version').del();
    })
    .then(() => {
      return knex('form').del();
    });
};
