module.exports = {
  // Tables
  DocumentTemplate: require('./tables/documentTemplate'),
  FileStorage: require('./tables/fileStorage'),
  Form: require('./tables/form'),
  FormApiKey: require('./tables/formApiKey'),
  FormEmailTemplate: require('./tables/formEmailTemplate'),
  FormIdentityProvider: require('./tables/formIdentityProvider'),
  FormSubmission: require('./tables/formSubmission'),
  FormStatusCode: require('./tables/formStatusCode'),
  FormSubmissionStatus: require('./tables/formSubmissionStatus'),
  FormSubmissionUser: require('./tables/formSubmissionUser'),
  FormRoleUser: require('./tables/formRoleUser'),
  FormVersion: require('./tables/formVersion'),
  FormVersionDraft: require('./tables/formVersionDraft'),
  IdentityProvider: require('./tables/identityProvider'),
  Note: require('./tables/note'),
  Permission: require('./tables/permission'),
  Role: require('./tables/role'),
  StatusCode: require('./tables/statusCode'),
  SubmissionAudit: require('./tables/submissionAudit'),
  User: require('./tables/user'),
  UserFormPreferences: require('./tables/userFormPreferences'),
  Label: require('./tables/label'),
  FormComponentsProactiveHelp: require('./tables/formComponentsProactiveHelp'),
  FormSubscription: require('./tables/formSubscription'),
  ExternalAPI: require('./tables/externalAPI'),
  ExternalAPIStatusCode: require('./tables/externalAPIStatusCode'),
  FormMetadata: require('./tables/formMetadata'),
  FormEncryptionKey: require('./tables/formEncryptionKey'),
  FormEventStreamConfig: require('./tables/formEventStreamConfig'),

  // Views
  FormSubmissionUserPermissions: require('./views/formSubmissionUserPermissions'),
  PublicFormAccess: require('./views/publicFormAccess'),
  SubmissionData: require('./views/submissionData'),
  SubmissionMetadata: require('./views/submissionMetadata'),
  UserFormAccess: require('./views/userFormAccess'),
  UserSubmissions: require('./views/userSubmissions'),
  AdminExternalAPI: require('./views/adminExternalAPI'),
};
