


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
    public: item.public,
    active: item.active,
    formVersionId: item.formVersionId,
    version: item.version,
    ...fields
  };
};

const filterItems = (items, collectionName, permissionsFilter, rolesFilter) => {
  let pFilter = !permissionsFilter ? [] : Array.isArray(permissionsFilter) ? permissionsFilter : [permissionsFilter];
  let rFilter = !rolesFilter ? [] : Array.isArray(rolesFilter) ? rolesFilter : [rolesFilter];

  if (pFilter.length || rFilter.length) {
    return items.filter(item => {
      // check the forms, filter where user has permission or role
      item[collectionName] = item[collectionName].filter(f => {
        return f.permissions.some(p => pFilter.findIndex(v => p.toLowerCase() === v.toLowerCase()) > -1) ||
          f.roles.some(r => rFilter.findIndex(v => r.toLowerCase() === v.toLowerCase()) > -1);
      });
      return item[collectionName].length;
    });
  } else {
    return items;
  }
};

const toUserForms = (userPerms, userRoles, permissionsFilter, rolesFilter) => {
  if (!(userPerms || userRoles) && !(userPerms.length || userRoles.length)) {
    return null;
  }

  const result = [];

  if (userPerms && userPerms.length) {
    userPerms.forEach(item => {
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
      form.permissions = (item.permissions) ? item.permissions.sort() : [];
    });
  }

  if (userRoles && userRoles.length) {
    userRoles.forEach(item => {
      let user = result.find(u => u.id === item.id);
      if (!user) {
        user = toUser(item);
        result.push(user);
      }
      let form = user.forms.find(f => f.id === item.formId);
      if (!form) {
        form = toForm(item);
        user.forms.push(form);
      }
      form.roles = (item.roles) ? item.roles.sort() : [];
    });
  }
  return filterItems(result, 'forms', permissionsFilter, rolesFilter);
};

const toFormUsers = (userPerms, userRoles, permissionsFilter, rolesFilter) => {
  if (!(userPerms || userRoles) && !(userPerms.length || userRoles.length)) {
    return null;
  }

  const result = [];

  if (userPerms && userPerms.length) {
    userPerms.forEach(item => {
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
      user.permissions = (item.permissions) ? item.permissions.sort() : [];
    });
  }

  if (userRoles && userRoles.length) {
    userRoles.forEach(item => {
      let form = result.find(f => f.id === item.formId);
      if (!form) {
        form = toForm(item);
        result.push(form);
      }
      let user = form.users.find(u => u.id === item.id);
      if (!user) {
        user = toUser(item);
        form.users.push(user);
      }
      user.roles = (item.roles) ? item.roles.sort() : [];
    });
  }

  return filterItems(result, 'users', permissionsFilter, rolesFilter);
};

module.exports = {
  filterItems: filterItems,
  toForm: toForm,
  toFormUsers: toFormUsers,
  toUser: toUser,
  toUserForms: toUserForms,
};
