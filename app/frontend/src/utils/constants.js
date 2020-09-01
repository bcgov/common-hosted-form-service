//
// Constants
//

// API Route paths
const ApiRoutes = Object.freeze({
  FORMS: '/forms'
});

// Permissions a user can have on a form
const FormPermissions = Object.freeze({
  FORMVIEW: 'formView',
  FORMSUBMIT: 'formSubmit',
  SUBMISSIONVIEW: 'submissionView',
  SUBMISSIONMANAGE: 'submissionManage',
  SUBMISSIONDELETE: 'submissionDelete',
  DESIGNVIEW: 'designView',
  DESIGNEDIT: 'designEdit',
  DESIGNDELETE: 'designDelete',
  TEAMVIEW: 'teamView',
  TEAMMANAGE: 'teamManage'
});

export { ApiRoutes, FormPermissions };
