# CHEFS Identity Provider

Within the CHEFs application a user's identity provider determines a lot of their access within CHEFs. Keep in mind, this discussion is not on an individual form, this is what menu items, what navigation they have at the application level.

A User's Identity Provider (IDP) is who vouches for them. In a simplified manner: they provide a username and password (generally) and an Identity Provder verifies them and they end up with a token. Currently for CHEFs we have 3 Identity Providers: `IDIR`, `BCeID Basic` and `BCeID Business`. `IDIR` is for employees/contractors on the BC Government. In CHEFs, the `IDIR` Identity Provider allows for greater power within CHEFs; as far as the CHEFs application is concerned IDIR is the `primary` Identity Provider.

Previously, all IDP logic was hardcoded within the frontend code and was difficult to change and maintain.

**Example pseudocode:**

```
	if user has idp === 'IDIR' then
		enable create forms button
```

By removing the hardcode, we can add in new IDPs and redefine which IDP is the `primary`. This opens up CHEFs for installations in non-BC Government environments.

## Identity Provider Table

Columns are added to the Identity Provider table to support runtime configuration.

- `primary`: boolean, which IDP is the highest level access (currently IDIR)
- `login`: boolean, if this IDP should appear as a login option (Public does not)
- `permissions`: string array, what permissions within CHEFS (not forms) does this IDP have
- `roles`: string array, what Form Roles does this IDP have (designer, owner, submitter, etc)
- `tokenmap`: json blob. this contains the mapping of IDP token fields to userInfo fields.
- `extra`: json blob. this is where non-standard configuration goes. we don't want a column for everything.

### Application Permissions

We have removed this hardcoded dependency and create a set of Application Permissions to replace `if user has idp` logic. We can now use `if user has application permission`. Application Permissions are assigned to one or more IDPs.

```
    VIEWS_FORM_STEPPER: 'views_form_stepper',
    VIEWS_ADMIN: 'views_admin',
    VIEWS_FILE_DOWNLOAD: 'views_file_download',
    VIEWS_FORM_EMAILS: 'views_form_emails',
    VIEWS_FORM_EXPORT: 'views_form_export',
    VIEWS_FORM_MANAGE: 'views_form_manage',
    VIEWS_FORM_PREVIEW: 'views_form_preview',
    VIEWS_FORM_SUBMISSIONS: 'views_form_submissions',
    VIEWS_FORM_TEAMS: 'views_form_teamS',
    VIEWS_FORM_VIEW: 'views_form_view',
    VIEWS_USER_SUBMISSIONS: 'views_user_submissions',
```

The application permissions will enable/restrict different sections of the CHEFs application.

### Form Roles

Identity Provider also sets the scope of what roles a user can be assigned to an individual form. This was hardcoded and is now part of the Identity Provider configuration. These roles can be assigned to one or more IDPs.

```
    OWNER: 'owner',
    TEAM_MANAGER: 'team_manager',
    FORM_DESIGNER: 'form_designer',
    SUBMISSION_REVIEWER: 'submission_reviewer',
    FORM_SUBMITTER: 'form_submitter',
```

### Extra

This is a `json` field with no predetermined structure. For BC Gov, we use it for extra functionality for the BCeID IDPs.

There are UX "enhancements" (frontend) and user search restrictions (server side) that were hardcoded, so now moved into this `json`. Any use of `extra` should assume that data fields may not exist or have null values.

Currently, `IDIR` has no data in `extra`.

```
{
  formAccessSettings: 'idim',
  addTeamMemberSearch: {
    text: {
      minLength: 6,
      message: 'trans.manageSubmissionUsers.searchInputLength',
    },
    email: {
      exact: true,
      message: 'trans.manageSubmissionUsers.exactBCEIDSearch',
    },
  },
  userSearch: {
    filters: [
      { name: 'filterIdpUserId', param: 'idpUserId', required: 0 },
      { name: 'filterIdpCode', param: 'idpCode', required: 0 },
      { name: 'filterUsername', param: 'username', required: 2, exact: true, caseSensitive: false},
      { name: 'filterFullName', param: 'fullName', required: 0 },
      { name: 'filterFirstName', param: 'firstName', required: 0 },
      { name: 'filterLastName', param: 'lastName', required: 0 },
      { name: 'filterEmail', param: 'email', required: 2, exact: true, caseSensitive: false},
      { name: 'filterSearch', param: 'search', required: 0 },
    ],
    detail: 'Could not retrieve BCeID users. Invalid options provided.'
  }
}
```

### Tokenmap

As part of the transistion to a new managed Keycloak realm, we lose the ability to do mapping of Identity Provider attributes to tokens. We do expect our User Information to be standardized and independent of the IDP, so we need to to the mapping ourselves.

The `tokenmap` is a `json` blob that is effectively a `userInfo` property name mapped to a `token` attribute. Each Identity Provider must provide a mapping so we can build out our `userInfo` object (our current user).

```
// userInfo.property: token attribute
{
  idpUserId: 'bceid_user_guid',
  keycloakId: 'bceid_user_guid',
  username: 'bceid_username',
  firstName: null,
  lastName: null,
  fullName: 'name',
  email: 'email',
  idp: 'identity_provider',
}
```

Note that the `keycloakId` is a GUID and the standard realm does not provide the data as a true GUID, so we need to format it as we build out our `userInfo` object.

### code and idp

Each Identity Provider has a `code` and an `idp`. The `code` never changes and is the `id` and used for referential integrity. Previously, `code` and `idp` were exactly the same. Now that we no longer control the keycloak realm, the actual `idp` values have changed (for `bceid`).

The `idp` fields represents the name if the Identity Provider as found in Keycloak and as returned in the tokens. Within the frontend code, this value is used for idp `hint` - let Keycloak know which IDP the user wished to use for sign in.

The code (both server and frontend) is confusing since `code` and `idp` fields were used interchangeably as the values always matched. `IDIR` still does. In the userInfo/currentUser object `idp` property is actually `code`. Sigh. Added an `idpHint` property but this should be changed to frontend and backend are consistent as are the property/fields names. In the frontend Identity Provider `idp` is `hint` or `idpHint`.

Basically, be aware and cautious with `code`, `idp`, `hint` and `idpHint` until this is addressed.

## Frontend - idpStore

When the application is loaded, we query and store the Identity Providers. This can be found in `frontend/store/identityProviders.js`.

This has helper methods for building the login buttons, getting login hints, the primary IDP and getting data from `extra`. All access to the cached IDP data should come through this store.

## Backend - IdpService

Logic for new Identity Provider fields encapsulated in `components/idpService.js`. The queries and logic for parsing the token (use `tokenmap` field to transform token to userInfo). Also, `userSearch` is here as BCeID has specific requirements that are contained in the `extra` field.
