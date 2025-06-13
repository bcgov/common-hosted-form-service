const uuid = require('uuid');
const CREATED_BY = '999-dev-seed-data';

const ID = {
  users: [],
  forms: [],
  versions: [],
};

exports.seed = function (knex) {
  return Promise.resolve()
    .then(() => {
      return knex('form_identity_provider').where('createdBy', CREATED_BY).del();
    })
    .then(() => {
      return knex('form_role_user').where('createdBy', CREATED_BY).del();
    })
    .then(() => {
      return knex('role_permission').where('createdBy', CREATED_BY).del();
    })
    .then(() => {
      return knex('identity_provider').where('createdBy', CREATED_BY).del();
    })
    .then(() => {
      return knex('permission').where('createdBy', CREATED_BY).del();
    })
    .then(() => {
      return knex('role').where('createdBy', CREATED_BY).del();
    })
    .then(() => {
      return knex('user').where('createdBy', CREATED_BY).del();
    })
    .then(() => {
      return knex('form_submission').where('createdBy', CREATED_BY).del();
    })
    .then(() => {
      return knex('form_version').where('createdBy', CREATED_BY).del();
    })
    .then(() => {
      return knex('form').where('createdBy', CREATED_BY).del();
    })
    .then(() => {
      return knex('form_subscription').where('createdBy', CREATED_BY).del();
    })
    .then(() => {
      const items = [
        {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          keycloakId: 'f417c2b6-2cdb-4141-b024-64abc6fa2bf2',
          username: 'chefsadmin',
          email: 'chefsadmin@chefsadmin.com',
          firstName: 'Chef',
          lastName: 'Admin',
          fullName: 'Chef Admin',
        },
        {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          keycloakId: '126362bf-e08a-42d4-a4de-57219ee7e177',
          username: 'chefsuser1',
          email: 'chefsuser1@chefsuser1.com',
          firstName: 'One',
          lastName: 'Chefsuser',
          fullName: 'One Chefsuser',
        },
        {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          keycloakId: '00337a98-8afd-4434-aef6-b99112a05c35',
          username: 'chefsuser2',
          email: 'chefsuser2@chefsuser2.com',
          firstName: 'Two',
          lastName: 'Chefsuser',
          fullName: 'Two Chefsuser',
        },
      ];
      return knex('user').insert(items).returning('id');
    })
    .then((ids) => {
      ID.users = ids;
    })
    .then(() => {
      const items = [
        {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          name: '1 Normal Form',
          description: 'This is a First Normal Form',
          active: true,
          labels: ['form', 'first', 'normal'],
        },
        {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          name: '2 Normal Form',
          description: 'This is a Second Normal Form',
          active: true,
          labels: ['form', 'second', 'normal'],
        },
        {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          name: '3 Normal Form',
          description: 'This is a Third Normal Form',
          active: true,
          labels: ['form', 'third', 'normal'],
        },
        {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          name: '4 Normal Form',
          description: 'This is a Fourth Normal Form',
          active: true,
          labels: ['form', 'forth', 'normal'],
        },
        {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          name: '5 Normal Form',
          description: 'This is a Fifth Normal Form',
          active: true,
          labels: ['form', 'fifth', 'normal'],
        },
        {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          name: 'Sample Feedback',
          description: 'Sample feedback form',
          active: true,
          labels: ['form', 'sample', 'feedback'],
        },
      ];
      return knex('form').insert(items).returning('id');
    })
    .then((ids) => {
      ID.forms = ids;
    })
    .then(() => {
      const items = [
        {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          formId: ID.forms[0].id,
          code: 'idir',
        },
        {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          formId: ID.forms[1].id,
          code: 'idir',
        },
        {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          formId: ID.forms[2].id,
          code: 'idir',
        },
        {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          formId: ID.forms[3].id,
          code: 'public',
        },
        {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          formId: ID.forms[4].id,
          code: 'public',
        },
        {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          formId: ID.forms[5].id,
          code: 'idir',
        },
      ];
      return knex('form_identity_provider').insert(items).returning('id');
    })
    .then(() => {
      const items = ID.forms.map((f) => {
        return {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          formId: f.id,
          version: 1,
          schema: {
            components: [{ fieldA: { label: 'A', type: 'String' } }, { fieldB: { label: 'B', type: 'Number' } }],
          },
        };
      });
      // set the last form to have a renderable schema
      // eslint-disable-next-line
      items[5].schema = {
        id: 'ek87fkl',
        key: 'checkbox',
        data: { email: '', submit: false, checkbox: false, hostedFormApi: false, feedbackOnFormIoTool: '', embeddingTheFormIntoACustomApp: false },
        name: '',
        tags: [],
        type: 'checkbox',
        input: true,
        label: 'Checkbox',
        logic: [],
        value: '',
        access: [
          { type: 'create_own', roles: [] },
          { type: 'create_all', roles: [] },
          { type: 'read_own', roles: [] },
          { type: 'read_all', roles: [] },
          { type: 'update_own', roles: [] },
          { type: 'update_all', roles: [] },
          { type: 'delete_own', roles: [] },
          { type: 'delete_all', roles: [] },
          { type: 'team_read', roles: [] },
          { type: 'team_write', roles: [] },
          { type: 'team_admin', roles: [] },
        ],
        hidden: false,
        prefix: '',
        suffix: '',
        unique: false,
        widget: null,
        dbIndex: false,
        isValid: true,
        overlay: { top: '', left: '', page: '', style: '', width: '', height: '' },
        tooltip: '',
        disabled: false,
        metadata: {},
        multiple: false,
        redrawOn: '',
        settings: {},
        shortcut: '',
        tabindex: '',
        validate: { json: '', custom: '', unique: false, multiple: false, required: false, customMessage: '', customPrivate: false, strictDateValidation: false },
        autofocus: false,
        encrypted: false,
        hideLabel: false,
        inputType: 'checkbox',
        modalEdit: false,
        protected: false,
        refreshOn: '',
        tableView: false,
        attributes: {},
        components: [
          {
            id: 'e66zt5b',
            key: 'feedbackOnFormIoTool',
            mask: false,
            rows: 3,
            type: 'textarea',
            input: true,
            label: 'Feedback on stand-alone forms in the FORM.IO tool:',
            editor: '',
            hidden: false,
            prefix: '',
            suffix: '',
            unique: false,
            widget: { type: 'input' },
            dbIndex: false,
            overlay: { top: '', left: '', style: '', width: '', height: '' },
            tooltip: '',
            wysiwyg: false,
            disabled: false,
            multiple: false,
            redrawOn: '',
            tabindex: '',
            validate: {
              custom: '',
              unique: false,
              pattern: '',
              maxWords: '',
              minWords: '',
              multiple: false,
              required: false,
              maxLength: '',
              minLength: '',
              customPrivate: false,
              strictDateValidation: false,
            },
            autofocus: false,
            encrypted: false,
            fixedSize: true,
            hideLabel: false,
            inputMask: '',
            inputType: 'text',
            modalEdit: false,
            protected: false,
            refreshOn: '',
            tableView: true,
            attributes: {},
            autoExpand: false,
            errorLabel: '',
            persistent: true,
            properties: {},
            spellcheck: true,
            validateOn: 'change',
            clearOnHide: true,
            conditional: { eq: '', show: null, when: null },
            customClass: '',
            description: '',
            inputFormat: 'html',
            placeholder: '',
            defaultValue: null,
            labelPosition: 'top',
            showCharCount: false,
            showWordCount: false,
            calculateValue: '',
            calculateServer: false,
            allowMultipleMasks: false,
            customDefaultValue: '',
            allowCalculateOverride: false,
          },
          {
            id: 'ee4xww',
            key: 'panel',
            tree: false,
            type: 'panel',
            input: false,
            label: 'Panel',
            theme: 'default',
            title: 'What would you use it for?',
            hidden: false,
            prefix: '',
            suffix: '',
            unique: false,
            widget: null,
            dbIndex: false,
            overlay: { top: '', left: '', style: '', width: '', height: '' },
            tooltip: '',
            disabled: false,
            multiple: false,
            redrawOn: '',
            tabindex: '',
            validate: { custom: '', unique: false, multiple: false, required: false, customPrivate: false, strictDateValidation: false },
            autofocus: false,
            encrypted: false,
            hideLabel: false,
            modalEdit: false,
            protected: false,
            refreshOn: '',
            tableView: false,
            attributes: {},
            breadcrumb: 'default',
            components: [
              {
                id: 'e09gy4e',
                key: 'embeddingTheFormIntoACustomApp',
                name: '',
                type: 'checkbox',
                input: true,
                label: 'Embedding the form into a custom app',
                value: '',
                hidden: false,
                prefix: '',
                suffix: '',
                unique: false,
                widget: null,
                dbIndex: false,
                overlay: { top: '', left: '', style: '', width: '', height: '' },
                tooltip: '',
                disabled: false,
                multiple: false,
                redrawOn: '',
                tabindex: '',
                validate: { custom: '', unique: false, multiple: false, required: false, customPrivate: false, strictDateValidation: false },
                autofocus: false,
                encrypted: false,
                hideLabel: false,
                inputType: 'checkbox',
                modalEdit: false,
                protected: false,
                refreshOn: '',
                tableView: false,
                attributes: {},
                errorLabel: '',
                persistent: true,
                properties: {},
                validateOn: 'change',
                clearOnHide: true,
                conditional: { eq: '', show: null, when: null },
                customClass: '',
                description: '',
                placeholder: '',
                defaultValue: false,
                dataGridLabel: true,
                labelPosition: 'right',
                showCharCount: false,
                showWordCount: false,
                calculateValue: '',
                calculateServer: false,
                allowMultipleMasks: false,
                customDefaultValue: '',
                allowCalculateOverride: false,
              },
              {
                id: 'eq69pum',
                key: 'hostedFormApi',
                name: '',
                type: 'checkbox',
                input: true,
                label: 'Hosting an API of the form for others to hit with their apps',
                value: '',
                hidden: false,
                prefix: '',
                suffix: '',
                unique: false,
                widget: null,
                dbIndex: false,
                overlay: { top: '', left: '', style: '', width: '', height: '' },
                tooltip: '',
                disabled: false,
                multiple: false,
                redrawOn: '',
                tabindex: '',
                validate: { custom: '', unique: false, multiple: false, required: false, customPrivate: false, strictDateValidation: false },
                autofocus: false,
                encrypted: false,
                hideLabel: false,
                inputType: 'checkbox',
                modalEdit: false,
                protected: false,
                refreshOn: '',
                tableView: false,
                attributes: {},
                errorLabel: '',
                persistent: true,
                properties: {},
                validateOn: 'change',
                clearOnHide: true,
                conditional: { eq: '', show: null, when: null },
                customClass: '',
                description: '',
                placeholder: '',
                defaultValue: false,
                dataGridLabel: true,
                labelPosition: 'right',
                showCharCount: false,
                showWordCount: false,
                calculateValue: '',
                calculateServer: false,
                allowMultipleMasks: false,
                customDefaultValue: '',
                allowCalculateOverride: false,
              },
            ],
            errorLabel: '',
            persistent: false,
            properties: {},
            validateOn: 'change',
            clearOnHide: false,
            collapsible: false,
            conditional: { eq: '', show: null, when: null },
            customClass: '',
            description: '',
            placeholder: '',
            defaultValue: null,
            labelPosition: 'top',
            showCharCount: false,
            showWordCount: false,
            calculateValue: '',
            calculateServer: false,
            allowMultipleMasks: false,
            customDefaultValue: '',
            allowCalculateOverride: false,
          },
          {
            id: 'ekofnl',
            key: 'email',
            mask: false,
            type: 'email',
            input: true,
            label: 'Email',
            hidden: false,
            prefix: '',
            suffix: '',
            unique: false,
            widget: { type: 'input' },
            dbIndex: false,
            kickbox: { enabled: false },
            overlay: { top: '', left: '', style: '', width: '', height: '' },
            tooltip: '',
            disabled: false,
            multiple: false,
            redrawOn: '',
            tabindex: '',
            validate: { custom: '', unique: false, pattern: '', multiple: false, required: false, maxLength: '', minLength: '', customPrivate: false, strictDateValidation: false },
            autofocus: false,
            encrypted: false,
            hideLabel: false,
            inputMask: '',
            inputType: 'email',
            modalEdit: false,
            protected: false,
            refreshOn: '',
            tableView: true,
            attributes: {},
            errorLabel: '',
            persistent: true,
            properties: {},
            spellcheck: true,
            validateOn: 'change',
            clearOnHide: true,
            conditional: { eq: '', show: null, when: null },
            customClass: '',
            description: '',
            inputFormat: 'plain',
            placeholder: '',
            defaultValue: null,
            labelPosition: 'top',
            showCharCount: false,
            showWordCount: false,
            calculateValue: '',
            calculateServer: false,
            allowMultipleMasks: false,
            customDefaultValue: '',
            allowCalculateOverride: false,
          },
          {
            id: 'emwz28',
            key: 'submit',
            size: 'md',
            type: 'button',
            block: false,
            input: true,
            label: 'Submit',
            theme: 'primary',
            action: 'submit',
            hidden: false,
            prefix: '',
            suffix: '',
            unique: false,
            widget: { type: 'input' },
            dbIndex: false,
            overlay: { top: '', left: '', style: '', width: '', height: '' },
            tooltip: '',
            disabled: false,
            leftIcon: '',
            multiple: false,
            redrawOn: '',
            tabindex: '',
            validate: { custom: '', unique: false, multiple: false, required: false, customPrivate: false, strictDateValidation: false },
            autofocus: false,
            encrypted: false,
            hideLabel: false,
            modalEdit: false,
            protected: false,
            refreshOn: '',
            rightIcon: '',
            tableView: false,
            attributes: {},
            errorLabel: '',
            persistent: false,
            properties: {},
            validateOn: 'change',
            clearOnHide: true,
            conditional: { eq: '', show: null, when: null },
            customClass: '',
            description: '',
            placeholder: '',
            defaultValue: null,
            dataGridLabel: true,
            labelPosition: 'top',
            showCharCount: false,
            showWordCount: false,
            calculateValue: '',
            calculateServer: false,
            disableOnInvalid: true,
            allowMultipleMasks: false,
            customDefaultValue: '',
            allowCalculateOverride: false,
          },
        ],
        controller: '',
        errorLabel: '',
        persistent: true,
        properties: {},
        validateOn: 'change',
        clearOnHide: true,
        conditional: { eq: '', json: '', show: null, when: null },
        customClass: '',
        description: '',
        placeholder: '',
        defaultValue: null,
        dataGridLabel: true,
        labelPosition: 'right',
        showCharCount: false,
        showWordCount: false,
        calculateValue: '',
        calculateServer: false,
        submissionAccess: [
          { type: 'create_own', roles: [] },
          { type: 'create_all', roles: [] },
          { type: 'read_own', roles: [] },
          { type: 'read_all', roles: [] },
          { type: 'update_own', roles: [] },
          { type: 'update_all', roles: [] },
          { type: 'delete_own', roles: [] },
          { type: 'delete_all', roles: [] },
          { type: 'team_read', roles: [] },
          { type: 'team_write', roles: [] },
          { type: 'team_admin', roles: [] },
        ],
        customConditional: '',
        allowMultipleMasks: false,
        customDefaultValue: '',
        allowCalculateOverride: false,
      };
      return knex('form_version').insert(items).returning('id');
    })
    .then((ids) => {
      ID.versions = ids;
      // set some version 2 records
      const items = ID.forms.map((f) => {
        return {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          formId: f.id,
          version: 2,
          schema: {
            components: [{ fieldA: { label: 'A', type: 'String' } }, { fieldB: { label: 'B', type: 'Number' } }, { fieldC: { label: 'C', type: 'Email' } }],
          },
        };
      });
      // remove a couple of items, don't want all with 2 versions.
      items.pop();
      items.pop();
      return knex('form_version').insert(items);
    })
    .then(() => {
      const items = [];
      // forms 0 - 5, set the owners
      [ID.users[0], ID.users[1], ID.users[2], ID.users[0], ID.users[0], ID.users[0]].forEach((u, i) => {
        const item = {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          formId: ID.forms[i].id,
          role: 'owner',
          userId: u.id,
        };
        items.push(item);
      });
      // forms 0 - 5, set the team_manager
      [ID.users[0], ID.users[0], ID.users[0], ID.users[0], ID.users[0], ID.users[0]].forEach((u, i) => {
        const item = {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          formId: ID.forms[i].id,
          role: 'team_manager',
          userId: u.id,
        };
        items.push(item);
      });

      // forms 0 - 5, set the form_designer
      [ID.users[1], ID.users[2], ID.users[1], ID.users[0], ID.users[0], ID.users[0]].forEach((u, i) => {
        const item = {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          formId: ID.forms[i].id,
          role: 'form_designer',
          userId: u.id,
        };
        items.push(item);
      });

      // forms 0 - 5, set the submission_approver
      [ID.users[0], ID.users[2], ID.users[1], ID.users[0], ID.users[0], ID.users[0]].forEach((u, i) => {
        const item = {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          formId: ID.forms[i].id,
          role: 'submission_approver',
          userId: u.id,
        };
        items.push(item);
      });

      // forms 0 - 5, set the submission_reviewer
      [ID.users[0], ID.users[2], ID.users[1], ID.users[0], ID.users[0], ID.users[0]].forEach((u, i) => {
        const item = {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          formId: ID.forms[i].id,
          role: 'submission_reviewer',
          userId: u.id,
        };
        items.push(item);
      });

      // forms 0,1,2, set the form_submitter
      [ID.users[0], ID.users[1], ID.users[2]].forEach((u) => {
        [ID.forms[0], ID.forms[1], ID.forms[2]].forEach((f) => {
          const item = {
            id: uuid.v4(),
            createdBy: CREATED_BY,
            formId: f.id,
            role: 'form_submitter',
            userId: u.id,
          };
          items.push(item);
        });
      });
      return knex('form_role_user').insert(items).returning('id');
    })
    .then(() => {
      const items = ['abc@def.com', '123@456.com', 'qwerty@asdfg.com'].map((item) => {
        const sid = uuid.v4();
        return {
          id: sid,
          createdBy: CREATED_BY,
          formVersionId: ID.versions[5].id,
          confirmationId: sid.substring(0, 8).toUpperCase(),
          draft: false,
          deleted: false,
          // eslint-disable-next-line
          submission: {
            data: { email: `${item}`, submit: true, hostedFormApi: false, feedbackOnFormIoTool: `My (${item}) feedback was entered here`, embeddingTheFormIntoACustomApp: true },
          },
        };
      });
      return knex('form_submission').insert(items);
    })
    .then(() => {
      const items = [
        {
          id: uuid.v4(),
          createdBy: CREATED_BY,
          subscribeEvent: 'client_form_submit_event',
          endpointUrl: 'http://test.com',
          endpointToken: 'AbCdEf123456',
          formId: ID.forms[0].id,
          key: 'Authorization',
        },
      ];
      return knex('form_subscription').insert(items);
    });
};
