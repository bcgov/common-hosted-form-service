
const toUser = (item, fields = {}) => {
  return {
    id: item.id,
    keycloakId: item.keycloakId,
    username: item.username,
    fullName: item.fullName,
    email: item.email,
    firstName: item.firstName,
    lastName: item.lastName,
    ...fields
  };
};

const toForm = (item, fields = {}) => {
  return {
    id: item.formId,
    name: item.formName,
    active: item.active,
    identityProviders: item.idps,
    formVersionId: item.formVersionId,
    version: item.version,
    ...fields
  };
};

const toFormAccess = (items) => {
  const result = [];

  if (items && items.length) {
    items.forEach(item => {
      let form = result.find(f => f.id === item.formId);
      if (!form) {
        form = toForm(item, { users: [] });
        result.push(form);
      }
      let user = form.users.find(u => u.id === item.id);
      if (!user) {
        user = toUser(item, { roles: [], permissions: [] });
        form.users.push(user);
      }
      user.roles = (item.roles) ? item.roles.sort() : [];
      user.permissions = (item.permissions) ? item.permissions.sort() : [];
    });
  }

  return result;
};

const toUserAccess = (items) => {
  const result = [];

  if (items && items.length) {
    items.forEach(item => {
      let user = result.find(u => u.id === item.id);
      if (!user) {
        user = toUser(item, {forms: []});
        result.push(user);
      }
      let form = user.forms.find(f => f.id === item.formId);
      if (!form) {
        form = toForm(item, {roles: [], permissions: []});
        user.forms.push(form);
      }
      form.roles = (item.roles) ? item.roles.sort() : [];
      form.permissions = (item.permissions) ? item.permissions.sort() : [];
    });
  }
  return result;
};

module.exports = {
  toForm: toForm,
  toUser: toUser,
  toFormAccess: toFormAccess,
  toUserAccess: toUserAccess
};
