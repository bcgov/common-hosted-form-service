# CHEFs User and Standard Realm Tokens
<table>
<tr>
<th> Custom Realm </th> <th> Standard Realm (SSO) </th>
</tr>
<tr>
<td><pre lang="json">
{
  "exp": 1709324197,
  "iat": 1709323897,
  "auth_time": 1709323896,
  "jti": "32353e01-3ebf-402f-9ef0-1d56c595aa55",
  "iss": "https://dev.loginproxy.gov.bc.ca/auth/realms/chefs",
  "aud": "chefs",
  "sub": "bdd91117-55ed-47fd-ae23-365a25fae566",
  "typ": "Bearer",
  "azp": "chefs-frontend",
  "nonce": "2bfa957e-b8bf-4072-8720-94adee440c4d",
  "session_state": "8799a22f-5f93-4c04-813b-c637b1b81687",
  "resource_access": {
    "chefs": {
      "roles": [
        "admin",
        "user"
      ]
    }
  },
  "scope": "openid chefs",
  "sid": "8799a22f-5f93-4c04-813b-c637b1b81687",
  "identity_provider": "idir",
  "idp_username": "JPERRY",
  "name": "Joe Perry",
  "idp_userid": "584861AA34E546F8BDA6A7004DC9C6C9",
  "preferred_username": "584861aa34e546f8bda6a7004dc9c6c9@idir",
  "given_name": "Joe",
  "family_name": "Perry",
  "email": "joe.perry@gov.bc.ca"
}
</pre></td>
<td><pre lang="json">
{
  "exp": 1709322907,
  "iat": 1709322607,
  "auth_time": 1709322607,
  "jti": "5f4088e8-8e55-49fa-8df5-9ebfa6f585b5",
  "iss": "https://dev.loginproxy.gov.bc.ca/auth/realms/standard",
  "aud": "chefs-frontend-5299",
  "sub": "584861aa34e546f8bda6a7004dc9c6c9@idir",
  "typ": "Bearer",
  "azp": "chefs-frontend-5299",
  "nonce": "33974cb4-7607-4f1f-80e3-c129e40436cf",
  "session_state": "1893ab3b-410f-48c8-8274-cad94f4812ab",
  "scope": "openid idir bceidbusiness email profile bceidbasic",
  "sid": "1893ab3b-410f-48c8-8274-cad94f4812ab",
  "idir_user_guid": "584861AA34E546F8BDA6A7004DC9C6C9",
  "client_roles": [
    "admin"
  ],
  "identity_provider": "idir",
  "idir_username": "JPERRY",
  "email_verified": false,
  "name": "Perry, Joe CITZ:EX",
  "preferred_username": "584861aa34e546f8bda6a7004dc9c6c9@idir",
  "display_name": "Perry, Joe CITZ:EX",
  "given_name": "Joe",
  "family_name": "Perry",
  "email": "joe.perry@gov.bc.ca"
}
</pre></td>
</tr>
<tr>
<td><pre lang="json">
{
  "id": "c6042253-da3f-49d3-bb7d-595ec68fd780",
  "usernameIdp": "JPERRY@idir",
  "idpUserId": "584861AA34E546F8BDA6A7004DC9C6C9",
  "keycloakId": "bdd91117-55ed-47fd-ae23-365a25fae566",
  "username": "JPERRY",
  "firstName": "Joe",
  "lastName": "Perry",
  "fullName": "Joe Perry",
  "email": "joe.perry@gov.bc.ca",
  "idp": "idir",
  "public": false,
  "forms": []
}
</pre></td>
<td><pre lang="json">
{
  "id": "a0c195aa-57d9-4a70-8169-588876917765",
  "usernameIdp": "JPERRY@idir",
  "idpUserId": "584861AA34E546F8BDA6A7004DC9C6C9",
  "keycloakId": "584861AA-34E5-46F8-BDA6-A7004DC9C6C9",
  "username": "JPERRY",
  "firstName": "Joe",
  "lastName": "Perry",
  "fullName": "Perry, Joe CITZ:EX",
  "email": "joe.perry@gov.bc.ca",
  "idp": "idir",
  "public": false,
  "idpHint": "idir",
  "forms": []
}</pre></td>
</tr>
</table>

# BCeID Basic
<table>
<tr>
<th> Custom Realm </th> <th> Standard Realm (SSO) </th>
</tr>
<tr>
<td><pre lang="json">
{
  "exp": 1709324355,
  "iat": 1709324055,
  "auth_time": 1709324042,
  "jti": "ac68f321-4e42-4b5c-907f-34c0485410af",
  "iss": "https://dev.loginproxy.gov.bc.ca/auth/realms/chefs",
  "aud": "chefs",
  "sub": "5b3d4a62-974b-4c81-adf5-3e2587d5363c",
  "typ": "Bearer",
  "azp": "chefs-frontend",
  "nonce": "86984a12-77de-4910-8ae5-88d3e204038c",
  "session_state": "28cafa4e-0ef8-4ab3-8a14-9d125fbbb8ad",
  "resource_access": {
    "chefs": {
      "roles": [
        "user"
      ]
    }
  },
  "scope": "openid chefs",
  "sid": "28cafa4e-0ef8-4ab3-8a14-9d125fbbb8ad",
  "identity_provider": "bceid-basic",
  "idp_username": "joe.perry",
  "name": "Joe Perry",
  "idp_userid": "11D34CC4510D4943A53362BDECD676C6",
  "preferred_username": "11d34cc4510d4943a53362bdecd676c6@bceidbasic",
  "given_name": "Joe Perry",
  "email": "joe.perry@gmail.com"
}</pre></td>
<td><pre lang="json">
{
  "exp": 1709323834,
  "iat": 1709323534,
  "auth_time": 1709323533,
  "jti": "889f9919-fcc3-4f4b-b6ac-7d2be0a51ca0",
  "iss": "https://dev.loginproxy.gov.bc.ca/auth/realms/standard",
  "aud": "chefs-frontend-5299",
  "sub": "11d34cc4510d4943a53362bdecd676c6@bceidbasic",
  "typ": "Bearer",
  "azp": "chefs-frontend-5299",
  "nonce": "cba89d3f-dd38-44f6-81cb-d412df5c0570",
  "session_state": "00fad75b-25c5-42d7-af05-8e992e283a01",
  "scope": "openid idir bceidbusiness email profile bceidbasic",
  "sid": "00fad75b-25c5-42d7-af05-8e992e283a01",
  "client_roles": [
    "admin"
  ],
  "bceid_user_guid": "11D34CC4510D4943A53362BDECD676C6",
  "identity_provider": "bceidbasic",
  "bceid_username": "joe.perry",
  "email_verified": false,
  "name": "Joe Perry",
  "preferred_username": "11d34cc4510d4943a53362bdecd676c6@bceidbasic",
  "display_name": "Joe Perry",
  "given_name": "Joe Perry",
  "family_name": "",
  "email": "joe.perry@gmail.com"
}</pre></td>
</tr>
<tr>
<td><pre lang="json">
{
  "id": "cdaeea76-eadb-4eb5-b8e6-bde57f1d65c8",
  "usernameIdp": "joe.perry@bceid-basic",
  "idpUserId": "11D34CC4510D4943A53362BDECD676C6",
  "keycloakId": "5b3d4a62-974b-4c81-adf5-3e2587d5363c",
  "username": "joe.perry",
  "firstName": "Joe Perry",
  "fullName": "Joe Perry",
  "email": "joe.perry@gmail.com",
  "idp": "bceid-basic",
  "public": false,
  "forms": []
}</pre></td>
<td><pre lang="json">
{
  "id": "6a6a8134-5dcb-4e77-8ac8-44d59391690c",
  "usernameIdp": "joe.perry@bceid-basic",
  "idpUserId": "11D34CC4510D4943A53362BDECD676C6",
  "keycloakId": "11D34CC4-510D-4943-A533-62BDECD676C6",
  "username": "joe.perry",
  "fullName": "Joe Perry",
  "email": "joe.perry@gmail.com",
  "idp": "bceid-basic",
  "public": false,
  "idpHint": "bceidbasic",
  "forms": []
}</pre></td>
</tr>
</table>


# BCeID Business
<table>
<tr>
<th> Custom Realm </th> <th> Standard Realm (SSO) </th>
</tr>
<tr>
<td><pre lang="json">
{
  "exp": 1709324544,
  "iat": 1709324244,
  "auth_time": 1709324232,
  "jti": "60918b9c-82b5-4fa6-aec7-64aa54ec031a",
  "iss": "https://dev.loginproxy.gov.bc.ca/auth/realms/chefs",
  "aud": "chefs",
  "sub": "429b39bc-fa98-4169-a25e-0139f0ae689d",
  "typ": "Bearer",
  "azp": "chefs-frontend",
  "nonce": "e43e0a35-5d4e-4a56-82d7-b258444f4ac6",
  "session_state": "7bb75437-8fc7-44a5-b96b-5f885d9e534f",
  "resource_access": {
    "chefs": {
      "roles": [
        "user"
      ]
    }
  },
  "scope": "openid chefs",
  "sid": "7bb75437-8fc7-44a5-b96b-5f885d9e534f",
  "identity_provider": "bceid-business",
  "idp_username": "stevieray",
  "name": "Stevie Ray-Vaughan",
  "idp_userid": "F8F0E333E79C4AD183D19C9377498785",
  "preferred_username": "f8f0e333e79c4ad183d19c9377498785@bceidbusiness",
  "given_name": "Stevie Ray-Vaughan",
  "email": "stevie.ray@gov.bc.ca"
}</pre></td>
<td><pre lang="json">
{
  "exp": 1709323929,
  "iat": 1709323629,
  "auth_time": 1709323628,
  "jti": "64064578-67b4-4248-a267-125a5a87848e",
  "iss": "https://dev.loginproxy.gov.bc.ca/auth/realms/standard",
  "aud": "chefs-frontend-5299",
  "sub": "f8f0e333e79c4ad183d19c9377498785@bceidbusiness",
  "typ": "Bearer",
  "azp": "chefs-frontend-5299",
  "nonce": "54e10ed1-c0a7-4fce-9c4a-21d8e85ac076",
  "session_state": "f684d70a-c894-47d1-af38-f746f038b176",
  "scope": "openid idir bceidbusiness email profile bceidbasic",
  "sid": "f684d70a-c894-47d1-af38-f746f038b176",
  "bceid_business_guid": "B50E1574C1A944189BC661DED01345FB",
  "bceid_business_name": "texasflood",
  "bceid_user_guid": "F8F0E333E79C4AD183D19C9377498785",
  "bceid_username": "stevieray",
  "email_verified": false,
  "preferred_username": "f8f0e333e79c4ad183d19c9377498785@bceidbusiness",
  "display_name": "Stevie Ray-Vaughan",
  "given_name": "Stevie Ray-Vaughan",
  "client_roles": [
    "admin"
  ],
  "identity_provider": "bceidbusiness",
  "name": "Stevie Ray-Vaughan",
  "family_name": "",
  "email": "stevie.ray@gov.bc.ca"
}</pre></td>
</tr>
<tr>
<td><pre lang="json">
{
  "id": "ed1dfcbb-d2e0-448e-b4f2-7b5808d7f4a3",
  "usernameIdp": "stevieray@bceid-business",
  "idpUserId": "F8F0E333E79C4AD183D19C9377498785",
  "keycloakId": "429b39bc-fa98-4169-a25e-0139f0ae689d",
  "username": "stevieray",
  "firstName": "Stevie Ray-Vaughan",
  "fullName": "Stevie Ray-Vaughan",
  "email": "stevie.ray@gov.bc.ca",
  "idp": "bceid-business",
  "public": false,
  "forms": []
}</pre></td>
<td><pre lang="json">
{
  "id": "8a2e1c04-ace2-414a-a5f0-9627e2f8b3ba",
  "usernameIdp": "stevieray@bceid-business",
  "idpUserId": "F8F0E333E79C4AD183D19C9377498785",
  "keycloakId": "F8F0E333-E79C-4AD1-83D1-9C9377498785",
  "username": "stevieray",
  "fullName": "Stevie Ray-Vaughan",
  "email": "stevie.ray@gov.bc.ca",
  "idp": "bceid-business",
  "public": false,
  "idpHint": "bceidbusiness",
  "forms": []
}</pre></td>
</tr>
</table>


## Token Key Differences

### idp\_userid / idir\_user\_guid / bceid\_user\_guid

In the custom realm, we mapped `idp_userid` to the `idpUserId`.

There is no `idp_userid` attribute in standard realm tokens. But `idp_userid` was mapped from `idir_user_guid` and `bceid_user_guid` (depending on the IDP). 

As we parse tokens we will be setting the `idpUserId` correctly and it since that value comes from the IDP and not Keycloak, it matches in both realms.

### idp\_username

`idp_username` is a custom mapped field so it doesn't exist in standard realm tokens, it is used to populate the userInfo field: `username`. In the standard realm we pull from `idir_username` or `bceid_username`.

### display\_name

Standard realm returns a `display_name` attribute, but it appears to be the same as `name`.

### IDIR name / display\_name

The standard realm IDIR provider returns a name with Ministry information:

`Perry, Joe CITZ:EX`

this maps to userInfo `fullName` which is very different that our custom realm mapping (`Joe Perry`).

### sub / keycloakId
In custom realm the subject is a GUID. We use this as a `keycloakId`.

`"sub": "bdd91117-55ed-47fd-ae23-365a25fae566",`

In the standard realm the subject matches the `preferred_username` and is not a GUID. However, `idir_user_guid` and `bceid_user_guid` are *almost* GUIDs and can be transformed easily. So we can use this as the `keycloakId`.

`keycloakId` is no longer a useful field, it was only used to jump into the custom realm Keycloak Admin console which is no longer allowed for us in the standard realm.


**MIGRATION NOTE** update `keycloakId` to match `idpUserId` as `idpUserId` will match between realms.

### identity\_provider

In custom realm, `BCeID Basic` = `bceid-basic` and `BCeID Business` = `bceid-business`.

In standard realm they are `bceidbasic` and `bceidbusiness` respectively. Hints passed to Keycloak match the `identity_provider` and need updating. 


### resource\_access / client\_roles

```
  "resource_access": {
    "chefs": {
      "roles": [
        "admin",
        "user"
      ]
    }
  },
  
  ...
  
  "client_roles": [
    "admin"
  ],  
```

`resource_access` no longer exists, but we have `client_roles`. There is no `user` role, and roles are not qualified by a specific resource (ie. `chefs`) they are just a list of role names.
 

## User table and UserInfo/CurrentUser

In our custom realm, no matter what Identity Provider was used, the token contained the same attributes. Mapping a token to a userInfo object (ie. currentUser) is straightforward.

In the standard realm, we need dynamic mapping. To achieve this, we now store a map in our IdentityProvider table: `tokenmap`. This is how we determine which token attribute value becomes the userInfo attribute value.

One key point is the `keycloakId` field requires a GUID, in the mapping (mapped to `idpUserId`) we take a field that is GUID-like and format it to be a GUID. 

### idpUserId
The `idpUserId` field is our non-key unique field and is used to actually identify the user from the token. Since it comes from the Identity Provider it is consistent across realms.

### userInfo idp and idpHint

In the custom realm, as we parse out the token to make the userInfo object we add in a field: `idpHint` that contains the actual token `identity_provider`. The now poorly named `idp` attribute contains the `code` from the IdentityProvider table.

A work item should be created to make the userInfo object consistent with the token and frontend code where we have IDPs as `code`, `display` and `hint`. It may be more trouble than it is worth to rename the column and the views, but the transformation codes (token -> userInfo) should return an object consistent with naming conventions used in frontend logic so we always know if we are using our CHEFs IdentityProvider table `code` value or `hint` value.

## Data Migration

Since `keycloakId` is no longer a useful field and that is the only realm specific data, we are good for data migration. `keycloakId` will be updated as `idpUserId` (`idir_user_guid` or `bceid_user_guid` in GUID format). Any other data (`name`) will also be updated during the normal course of login.

**API call flow **

* get current user
	* get bearer token
	* validate token
* set request user
	* get token payload
	* login
		* parse token (use the IDP `tokenmap`)
		* get user id (find by `idpUserId`
			* create user if not found
			* update user fields if found


`idpUserId` remains the same across realms since it comes from the Identity Provider, all user fields will be updated if the user exists, otherwise we create a new one. 