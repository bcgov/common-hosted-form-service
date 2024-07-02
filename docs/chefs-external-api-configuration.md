# CHEFS - Form Components calling External API

A CHEFS feature request allows Form Designers to call an External API in a secure manner. Out of the box, a Form Designer would add credentials (username/password), an API Key or an API token in plain text in a form component. This private data is stored in plain text in the form schema.

A proof of concept was implemented allowing the Form Designer to place the current user's (the Form Submitter) token in the request headers. This also allowed a Form Designer to execute Javascript to call any API programmatically. This opens a security backdoor for the Form Designer to surreptitiously access data and execute functions with the current user's token without their (or CHEFS) knowledge or consent.

The solution documented here allows a Form Designer to specify an External API outside of a form component and have that API called with the current user's (and form) context. There will be an approval process so the CHEFS team (and submitters) have an assurance that the External API performs no malicious activities.

To achieve this, Form Designers will configure their External API, get approval from CHEFS and configure their form components to call a CHEFS proxy that forwards the call to the External API.

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
    "code": "Submitted"
}
```

| Attribute    | Form Field            | Purpose                                                                                   |
| ------------ | --------------------- | ----------------------------------------------------------------------------------------- |
| formId       | N/A                   | CHEFS form id                                                                             |
| name         | Name                  | Name should be unique per form and should easily identify this API                        |
| endpointUrl  | Endpoint URL          | Endpoint URL for the API (could be a full path or just a base path)                       |
| sendApiKey   | Send API Key          | boolean - send an API Key in a header                                                     |
| apiKeyHeader | API Key Header Name   | the name for the API Key header                                                           |
| apiKey       | API Key Value         | The value for the API Key, stored encrypted in the db.                                    |
| sendUserInfo | Send User Information | boolean - send current user information in headers                                        |
| code         | N/A                   | Status Code. Only CHEFS Admin users can change this value. Used for the approval process. |

**Recommendation** - secure the External API with an API Key and send user information in plain text.

### User Info Object

User (and form) context is provided to the External API in headers. This information is passed as plain text in multiple headers.
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
| sub          | X-CHEFS-TOKEN-SUB         | the `Subject` attribute from the user token                        |
| iat          | X-CHEFS-TOKEN-IAT         | the `Issued At` timestamp from the user token                      |
| exp          | X-CHEFS-TOKEN-EXP         | the `Expired` timestamp attribute from the user token              |

**Note** - Although the current user (the form submitter) token is available, there is no guarantee that it has not timed out. It will be stored upon entry/load of the form and is not refreshed.

## Configuring Form Component

For this example, we assume populating a drop-down/select component...

**Data Source Type** = URL

**Data Source URL** = `{chefs host}/app/api/v1/proxy/external`

**Request Headers**

| Key                       | Value                                                 |
| ------------------------- | ----------------------------------------------------- |
| X-CHEFS-PROXY-DATA        | {{sessionStorage.getItem('X-CHEFS-PROXY-DATA')}}      |
| X-CHEFS-EXTERNAL-API-NAME | example-api - External API.name                       |
| X-CHEFS-EXTERNAL-API-PATH | optional - add this value to External API.endpointUrl |

**Value Property**, **Item Template** and all other configurations are up to the Form Designer.

`sessionStorage.getItem('X-CHEFS-PROXY-DATA')` is the User Info object in encrypted form that only CHEFS can decrypt. This is generated and stored on the form load. A call is made to the CHEFS backend using the current user's token (similar to fetching the form schema for rendering the form) and CHEFS encrypts the information. This prevents malicious form designers from having access to the user token but allows the form designer to provide context for their External API.

The `sessionStorage` is cleared when the user navigates away from the form.

The component will call the CHEFS proxy `{chefs host}/app/api/v1/proxy/external` with the headers, the proxy can decrypt the `X-CHEFS-PROXY-DATA` and formulate the call according to the External API configuration.

It is expected that the External API endpoint is a `GET`.

## HTTP Responses and errors

Since formio components will make calls during the form design and configuration of the formio components (ie when the Datasource is URL and the URL has been populated), there will be many failed attempts calling the proxy. The most common failures will happen when the headers have not been added to the component configuration, or the `X-CHEFS-EXTERNAL-API-NAME` header has been set but the External API has not been configured.

The following table will help you understand the HTTP statuses returned when calling `/api/v1/proxy/external`.

| Http Status | Meaning                                                                                                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 400         | Generally, the formio component has not been completely configured (missing headers) or the External API has not been configured.                                          |
| 407         | The External API is configured and exists but has not been approved.                                                                                                       |
| 502         | Call has gone through the CHEFS proxy but failed on the external server (ie 404 not found on your server). Check the message for information on the underlying HTTP Error. |
| 500         | Unexpected CHEFS server error.                                                                                                                                             |

A successful call through the CHEFS proxy to your External API will return the status code from your External API.
