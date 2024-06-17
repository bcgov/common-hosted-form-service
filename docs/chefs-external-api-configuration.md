# CHEFS - Form Components calling External API

A CHEFS feature request allows Form Designers to call an External API in a secure manner. Out of the box, a Form Designer would add credentials (username/password), an API Key or an API token in plain text in a form component. This private data is stored in plain text in the form schema.

A proof of concept was implemented allowing the Form Designer to place the current user's (the Form Submitter) token in the request headers. This also allowed a Form Designer to execute Javascript to call any API programmatically. This opens a security backdoor for the Form Designer to surreptitiously access data and execute functions with the current user's token without their (or CHEFS) knowledge or consent.

The solution documented here allows a Form Designer to specify an External API outside of a form component and have that API called with the current user's (and form) context. There will be an approval process so the CHEFS team (and submitters) have an assurance that the External API performs no malicious activities.

To achieve this, Form Designers will configure their External API, get approval from CHEFS and configure their form components to call a CHEFS proxy that forwards the call to the External API.

Any private data required in the configuration (i.e. API Key) will be stored as encrypted data in the CHEFS database. It will not be a part of the form schema.

This External API is associated with a single form, but as other hierarchies are introduced in CHEFS (form bundles, tenants, etc), we can associate them with those items and prevent redundancy.

## External API Configuration

### Manage Form

When a form is saved, External APIs can be managed on the Manage Form screen. See the External APIs section.

This will list all External APIs associated with this form (with Edit and Delete actions), a button (+) to add a new External API.
In the table you will see the Name, the API Endpoint URL and the current status of the API. APIs will only work when status is `Approved`; however, form components can be configured to use the API in any state.

Edit and Create will open a dialog where you can enter and submit your configuration. New External APIs are always created with status of `Submitted` - in the abscence of automated notifications please reach out to the CHEFS Admin team when you want your API reviewed for approval.

See the following table for description of the External API form fields.

### Configure an External API (Technical)

`POST /forms/{{formId}}/externalAPIs`

```
{
    "formId": "{{formId}}",
    "name": "example-api",
    "endpointUrl": "https://8c4dbf4f34ca.ngrok.app/api/",
    "sendApiKey": true,
    "apiKeyHeader": "X-API-KEY",
    "apiKey": "<some longish key value>",
    "sendUserInfo": true,
    "userInfoEncrypted": false,
    "userInfoHeader": "X-USER-INFO",
    "userInfoEncryptionKey": "999999999",
    "userInfoEncryptionAlgo": "aes-256-gcm",
    "code": "Submitted"
}
```

| Attribute              | Form Field                            | Purpose                                                                                   |
| ---------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------- |
| formId                 | N/A                                   | CHEFS form id                                                                             |
| name                   | Name                                  | Name should be unique per form and should easily identify this API                        |
| endpointUrl            | Endpoint URL                          | Endpoint URL for the API (could be a full path or just a base path)                       |
| sendApiKey             | Send API Key                          | boolean - send an API Key in a header                                                     |
| apiKeyHeader           | API Key Header Name                   | the name for the API Key header                                                           |
| apiKey                 | API Key Value                         | The value for the API Key, stored encrypted in the db.                                    |
| sendUserInfo           | Send User Information                 | boolean - send current user information in headers                                        |
| userInfoEncrypted      | Encrypt User Information              | boolean - whether we encrypt the current user information                                 |
| userInfoHeader         | Encrypt User Information Header Name  | when userInfoEncrypted = true, this is the name for the user info header                  |
| userInfoEncryptionKey  | User Information Encryption Key       | encryption key supplied by Form Designer, stored encrypted in the db.                     |
| userInfoEncryptionAlgo | User Information Encryption Algorithm | A CHEFS supported encryption algorithm.                                                   |
| code                   | N/A                                   | Status Code. Only CHEFS Admin users can change this value. Used for the approval process. |

**Recommendation** - secure the External API with an API Key and send user information in plain text.

### User Info Object

User (and form) context is provided to the External API in headers. This information can be encrypted and passed as a single header (the receiving API will decrypt) or plain text in multiple headers.
The user information initially comes from the user's token, as such the values for each attribute may differ depending on which Identity Provider authenticated them.

| Attribute    | Header                    | Purpose                                                            |
| ------------ | ------------------------- | ------------------------------------------------------------------ |
| formId       | X-CHEFS-FORM-FORMID       | the current CHEFS form id                                          |
| versionId    | X-CHEFS-FORM-VERSIONID    | the version id of the form - optional, only populated if available |
| submissionId | X-CHEFS-FORM-SUBMISSIONID | submission id - optional, only populated if available              |
| userId       | X-CHEFS-USER-USERID       | User ID from the Identity Provider (ex. abcdef@idir)               |
| username     | X-CHEFS-USER-USERNAME     | username/login name (ex. ASMITTY)                                  |
| firstName    | X-CHEFS-USER-FIRSTNAME    | user's first name (ex. Alex)                                       |
| lastName     | X-CHEFS-USER-LASTNAME     | user's last name (ex. Smitty)                                      |
| fullName     | X-CHEFS-USER-FULLNAME     | user's Full name (ex. Smitty, Alex CITZ:EX)                        |
| email        | X-CHEFS-USER-EMAIL        | user's email (ex. alex.smitty@gov.bc.ca)                           |
| idp          | X-CHEFS-USER-IDP          | the Identity Provider code (ex. 'idir')                            |

**Note** - Although the current user (the form submitter) token is available, there is no guarantee that it has not timed out. It will be stored upon entry/load of the form and is not refreshed.

#### User Info Encryption

The Form Designer will provide the encryption key for the selected encryption algorithm. This algorithm and key will encrypt the User Info into an encrypted value and passed in a single header (with header name = `userInfoHeader` value).

The receiving api will have the same encryption key and algorithm and will decrypt on their end. They can then parse the decrypted user info object.

The `userInfoEncryptionKey` is stored in the CHEFS database in an encrypted format. Only CHEFS can read and write the encrypted value. Decrypting the value is done only on demand when creating the header payload.

Currently there is only one algorithm: `AES-256-gcm`. A node implementation can be found in the CHEFS source code (see [encryptionService/Aes256Gcm](../app/src/components/encryptionService.js)). It is up to the owner of the External API to provide their own implementation.

Keys for `aes-256-gcm` should be sha256 hashes: 256 bits/32 bytes/64 characters.

## Configuring Form Component

For this example, we assume populating a drop down/select component...

**Data Source Type** = URL

**Data Source URL** = `{chefs host}/app/api/v1/proxy/external`

**Request Headers**

| Key                       | Value                                                 |
| ------------------------- | ----------------------------------------------------- |
| X-CHEFS-PROXY-DATA        | {{sessionStorage.getItem('X-CHEFS-PROXY-DATA')}}      |
| X-CHEFS-EXTERNAL-API-NAME | example-api - External API.name                       |
| X-CHEFS-EXTERNAL-API-PATH | optional - add this value to External API.endpointUrl |

**Value Property**, **Item Template** and all other configuration is up to the Form Designer.

`sessionStorage.getItem('X-CHEFS-PROXY-DATA')` is the User Info object in encrypted form that only CHEFS can decrypt. This is generated and stored on the form load. A call is made to the CHEFS backend using the current user's token (similar to fetching the form schema for rendering the form) and CHEFS encrypts the information. This prevents malicious form designers from having access to the user token but allows the form designer to provide context for their External API.

The `sessionStorage` is cleared when the user navigates away from the form.

The component will call the CHEFS proxy `{chefs host}/app/api/v1/proxy/external` with the headers, the proxy can decrypt the `X-CHEFS-PROXY-DATA` and formulate the call according to the External API configuration.

It is expected that the External API endpoint is a `GET`.
