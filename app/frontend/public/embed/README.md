# CHEFS Form Viewer Web Component

## Embeddable Form Viewer

The CHEFS Form Viewer web component lets any product or site render CHEFS-hosted Form.io forms with minimal effort and a consistent, accessible experience. It:

- Reduces embedding complexity: a single custom element is all you need.
- Improves reliability and UX: isolates styles by default (Shadow DOM) while still allowing themes.
- Standardizes behavior: submission, events, and asset loading are handled consistently across apps.
- Avoids CSP/CORS surprises: ships with same-origin asset routes to load Form.io and Font Awesome in constrained environments.

## What it is

`<chefs-form-viewer>` is a standards-based web component that renders a Form.io form, handles submission to the CHEFS backend, and exposes lifecycle events for integration. It injects CSS/JS assets, supports optional themes, and safely loads icon fonts when rendering inside Shadow DOM.

Key features

- Shadow DOM by default with optional isolation CSS for extra determinism.
- Self-hosted assets: Form.io CSS/JS and Font Awesome (for Form.io icon classes) served from backend routes.
- Optional theme layer (e.g., BC Gov theme) loaded after base styles.
- Minimal event contract with cancelable hooks and async gating (waitUntil).
- Read-only rendering, programmatic submit/draft, and prefill via `submission-id`.

### Requirements (must-have)

- The form must be designed and published in CHEFS.
- You must have a valid API key for the form. The component builds a Basic auth header from `form-id:api-key` for same-origin requests, or you can supply a custom `onBuildAuthHeader` hook.

#### Authentication Options

**Option 1: Auth Token (Recommended)**

- Use your `form-id` and `api-key` to obtain a short-lived JWT token
- Token automatically refreshes before expiry
- More secure as tokens expire and are refreshed

**Getting an Auth Token:**

```javascript
// POST to the token endpoint with Basic auth
const response = await fetch(
  'CHEFS_SERVER_URL/gateway/v1/auth/token/forms/YOUR_FORM_ID',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa('YOUR_FORM_ID:YOUR_API_KEY'),
    },
    body: JSON.stringify({ formId: 'YOUR_FORM_ID' }),
  }
);

const data = await response.json();
const authToken = data.token; // Use this as the auth-token attribute
```

**Option 2: API Key (Fallback)**

- Use `form-id` and `api-key` directly for Basic authentication
- Less secure as credentials are long-lived
- Component builds Basic auth header from `form-id:api-key` for same-origin requests

**Custom Authentication:**

- Supply a custom `onBuildAuthHeader` hook for advanced scenarios

### Quick start (embed and render)

**Simplified One-Line Embedding**

The easiest way to embed a CHEFS form, inspired by Form.io's approach:

```html
<script src="/app/embed/chefs-form-viewer-embed.min.js?form-id=11111111-1111-1111-1111-111111111111&auth-token=YOUR_JWT_TOKEN"></script>
```

That's it! The embed script automatically loads the component, creates the element, applies your parameters, and calls `.load()`.

For a complete interactive demo with all available parameters, see: [`/app/embed/chefs-form-viewer-embed-demo.html`](./chefs-form-viewer-embed-demo.html)

**Traditional approach**

1. Include the component script (minified) on your page:

```html
<script src="/app/embed/chefs-form-viewer.min.js"></script>
```

2. Add the element and call `load()`:

```html
<chefs-form-viewer
  form-id="11111111-1111-1111-1111-111111111111"
  auth-token="YOUR_JWT_TOKEN"
  language="en"
  token='{"sub":"user123","roles":["admin"],"email":"user@example.com"}'
  user='{"name":"John Doe","department":"IT"}'
  isolate-styles
></chefs-form-viewer>

<script>
  const el = document.querySelector('chefs-form-viewer');
  el.load();
  // Optional: listen to lifecycle
  el.addEventListener('formio:ready', (e) => console.log('ready', e.detail));
</script>
```

**Alternative programmatic approach:**

```html
<chefs-form-viewer id="my-form"></chefs-form-viewer>

<script>
  const el = document.getElementById('my-form');
  el.formId = '11111111-1111-1111-1111-111111111111';
  el.authToken = 'YOUR_JWT_TOKEN';
  el.token = {
    sub: '123456789',
    roles: [],
    email: 'nicholas.cognito@gov.bc.ca',
  };
  el.user = {
    idpUserId: '123456789',
    username: 'NCOGNITO',
    firstName: 'Nicholas',
    lastName: 'Cognito',
    fullName: 'Nicholas Cognito',
    email: 'nicholas.cognito@gov.bc.ca',
    idp: {
      code: 'idir',
      display: 'IDIR',
      hint: 'idir',
    },
    public: false,
  };
  el.load();
</script>
```

**Note:** To get an `auth-token`, use your `form-id` and `api-key` to call the token endpoint as shown in the [Requirements](#requirements-must-have) section.

Notes

- For production, use the minified script: `/app/embed/chefs-form-viewer.min.js` (generated during build, not in source repo).
- For development, use the non-minified script: `/app/embed/chefs-form-viewer.js`.
- When using dev servers or PR environments, the component auto-detects a base of `/app` or `/pr-####` from `window.location`.

### Attributes (configuration)

- `form-id` (string, required): CHEFS/Form.io form identifier.
- `auth-token` (string, preferred): JWT authentication token from CHEFS backend. Automatically refreshes before expiry.
- `api-key` (string, fallback): API access key for Basic authentication. Only required if `auth-token` is not provided.
- `submission-id` (string): prefill the form using an existing submission.
- `read-only` (boolean): render as read-only.
- `language` (string): i18n code (default `en`).
- `base-url` (string): override the autodetected base, e.g. `https://host/app` or `https://host/pr-1234`.
- `debug` (boolean): enable verbose console logging; can also set `window.CHEFS_VIEWER_DEBUG = true`.
- `no-shadow` (boolean): render in light DOM (global page CSS may apply). In this mode styles are injected into `document.head`.
- `submit-button-key` (string): data key used to distinguish submit vs draft (default `submit`).
- `theme-css` (string): absolute URL to a theme stylesheet loaded after base styles.
- `isolate-styles` (boolean): when in Shadow DOM, adds minimal isolation (`:host { all: initial }`) and a normalized container baseline.
- `no-icons` (boolean): do not load Font Awesome (Form.io icon classes won't render).
- `token` (string): JSON string containing a **parsed token object** for Form.io evalContext (custom JavaScript access). **Warning**: Use parsed token payload only, never raw JWT strings.
- `user` (string): JSON string containing a user object for Form.io evalContext (custom JavaScript access).

Boolean attribute semantics: presence, `"true"`, empty string, or `"1"` are treated as true.

### Programmatic API

- `load()` → Fetch schema and initialize Form.io instance.
- `reload()` → Destroy current instance then load again.
- `submit()` → Programmatic submit (sets submit key true, posts to backend).
- `draft()` → Programmatic draft (sets submit key false, posts to backend).
- `setSubmission(data)` → Apply data to Form.io instance.
- `getSubmission()` → Read current submission from the Form.io instance.
- `refreshAuthToken()` → Manually refresh the authentication token.
- `destroy()` → Destroy the Form.io instance and clean up resources.

### Events

**Core Lifecycle Events:**

- `formio:beforeLoad` (cancelable) - Before loading begins
- `formio:beforeLoadSchema` (cancelable) - Before schema fetch
- `formio:loadSchema` (detail: `{ form, schema }`) - After schema is loaded
- `formio:beforeInit` (cancelable, supports `waitUntil(promise)`) - Before Form.io initialization
- `formio:ready` (detail: `{ form }`) - When form is ready for interaction
- `formio:render` (detail: `{ form }`) - When form renders
- `formio:change` (detail: `{ changed, submission }`) - When form data changes

**Submission Events:**

- `formio:beforeSubmit` (cancelable, supports `waitUntil(promise)`, detail: `{ submission }`) - Before submission begins
- `formio:submit` (detail: `{ submission }`) - When submission starts
- `formio:submitDone` (detail: `{ submission }`) - When submission succeeds
- `formio:error` (detail: `{ error }`) - When any error occurs

**Navigation Events:**

- `formio:beforeNext` (cancelable, supports `waitUntil(promise)`, detail: `{ currentPage, submission }`) - Before moving to next page
- `formio:beforePrev` (cancelable, supports `waitUntil(promise)`, detail: `{ currentPage, submission }`) - Before moving to previous page

**Authentication Events:**

- `formio:authTokenRefreshed` (detail: `{ authToken, oldToken }`) - When auth token is refreshed

**Asset Loading Events:**

- `formio:assetStateChange` (detail: `{ from, to, assets, errors }`) - When asset loading state changes

**SimpleFile Events:**

- `formio:beforeFileUpload` (cancelable, supports `waitUntil(promise)`, detail: `{ formData, config, action }`) - Before file upload
- `formio:beforeFileDownload` (cancelable, supports `waitUntil(promise)`, detail: `{ fileId, config, action }`) - Before file download
- `formio:beforeFileDelete` (cancelable, supports `waitUntil(promise)`, detail: `{ fileInfo, fileId, action }`) - Before file deletion

**Event Details:**

- Cancelable events can be prevented by calling `event.preventDefault()`
- Events supporting `waitUntil(promise)` allow async operations via `event.detail.waitUntil(promise)`
- If any promise passed to `waitUntil()` resolves to `false` or rejects, the action is blocked
- All events bubble and are composed for cross-boundary communication

### Asset loading and why we self-host

By default, the component loads these assets in this order:

1. Complete CHEFS CSS bundle (chefs-index.css - includes Bootstrap, Vuetify, Form.io, custom styles)
2. Font Awesome CSS (for Form.io icon classes) unless `no-icons`
3. Form.io JS (if not already present)
4. CHEFS theme CSS (chefs-theme.css - CSS variables and theming)
5. Custom components bundle (chefs-form-viewer-components)

We serve Form.io CSS/JS and Font Awesome from same-origin Express routes to:

- Avoid CORS/CSP blocking in embedded contexts.
- Ensure fonts work in Shadow DOM: the component registers a document-level `@font-face` (`id="cfv-fa-face"`) for `FontAwesome` when the default icons CSS is used. This stabilizes glyph rendering (e.g., button spinners) across browsers.

If `no-icons` is set, the icons CSS/fonts are not loaded and a tiny neutralizing rule ensures glyphs don’t appear in Shadow DOM.

### Backend Endpoints

The component uses a comprehensive set of backend endpoints that are automatically configured based on the `base-url` (or auto-detected from the current location). All endpoints can be overridden via the `endpoints` property.

#### Default Endpoint Configuration

The component automatically generates endpoint URLs using this pattern:

- **Base URL**: Auto-detected from `window.location` (e.g., `/app` or `/pr-1234`) or set via `base-url` attribute
- **Form ID**: From `form-id` attribute (replaces `:formId` in URLs)
- **Submission ID**: From `submission-id` attribute (replaces `:submissionId` in URLs)

#### Overrideable Endpoints

You can override any endpoint by setting the `endpoints` property:

```javascript
const viewer = document.querySelector('chefs-form-viewer');
viewer.endpoints = {
  // Asset endpoints
  mainCss: 'https://mycdn.com/custom-chefs-styles.css',
  formioJs: 'https://mycdn.com/formio.js',
  componentsJs: 'https://mycdn.com/components.js',
  themeCss: 'https://mycdn.com/theme.css',
  iconsCss: 'https://mycdn.com/font-awesome.css',

  // API endpoints
  schema: 'https://api.example.com/forms/:formId/schema',
  submit: 'https://api.example.com/forms/:formId/submit',
  readSubmission:
    'https://api.example.com/forms/:formId/submissions/:submissionId',

  // File operation endpoints
  files: 'https://api.example.com/files',
  uploadFile: 'https://api.example.com/files/upload',
  getFile: 'https://api.example.com/files/:fileId',
  deleteFile: 'https://api.example.com/files/:fileId',

  // Component-specific endpoints
  bcgeoaddress: 'https://api.example.com/geocoder/address',
};
```

Although this allows complete customization, the most likely overrides will be for `themeCss` and `iconsCss` allowing overrides to the look and feel to better match your hosting application.

#### Endpoint Categories

**Asset Endpoints** (for loading CSS/JS resources):

- `mainCss` - Complete CHEFS CSS bundle (Bootstrap, Vuetify, Form.io, custom styles)
- `formioJs` - Form.io JavaScript library
- `componentsJs` - CHEFS custom components bundle
- `themeCss` - CHEFS theme CSS with CSS variables
- `iconsCss` - Font Awesome CSS for Form.io icons
- `formioJsFallback` - CDN fallback for Form.io JS
- `iconsCssFallback` - CDN fallback for Font Awesome CSS

**API Endpoints** (for form operations):

- `schema` - Fetch form schema and metadata
- `submit` - Submit form data
- `readSubmission` - Load existing submission data

**File Operation Endpoints** (for SimpleFile component):

- `files` - Base URL for file operations
- `uploadFile` - Upload new files
- `getFile` - Download files by ID
- `deleteFile` - Delete files by ID

**Component-Specific Endpoints**:

- `bcgeoaddress` - BC Geocoder address search API

#### Backend Route Details

**Form Operations:**

- `GET /webcomponents/v1/form-viewer/:formId/schema` → Returns `{ form, schema }` for published forms
- `POST /webcomponents/v1/form-viewer/:formId/submit` → Creates new submission
- `GET /webcomponents/v1/form-viewer/:formId/submission/:submissionId` → Loads existing submission

**Asset Serving:**

- `GET /webcomponents/v1/assets/chefs-index.css` → Complete CHEFS CSS bundle
- `GET /webcomponents/v1/assets/chefs-theme.css` → CHEFS theme CSS
- `GET /webcomponents/v1/assets/formio.js` → Form.io JavaScript
- `GET /webcomponents/v1/assets/font-awesome/css/font-awesome.min.css` → Font Awesome CSS
- `GET /webcomponents/v1/assets/font-awesome/fonts/:file` → Font Awesome font files

**File Operations:**

- `POST /webcomponents/v1/files?formId=:formId` → Upload files (with virus scanning)
- `GET /webcomponents/v1/files/:fileId` → Download files
- `DELETE /webcomponents/v1/files/:fileId` → Delete files

**Component APIs:**

- `GET /webcomponents/v1/bcgeoaddress/advance/address` → BC Geocoder address search

#### Security & Authentication

All endpoints require proper authentication:

- **Bearer Token**: Preferred method using `auth-token` attribute
- **Basic Auth**: Fallback using `form-id:api-key` combination
- **CORS**: All routes support cross-origin requests with proper headers
- **File Security**: Upload endpoints include virus scanning and validation
- **Permissions**: File operations validate against form submission permissions

#### Error Handling

Standard HTTP status codes:

- `401` - Authentication required or invalid
- `403` - Insufficient permissions
- `404` - Resource not found
- `409` - File failed virus scan
- `413` - File too large
- `415` - Unsupported file type

_IMPORTANT_ Embedded forms are `Public` and file uploads will act accordingly, so API permissions only. No user specific permissions can be enforced. See [Authentication](README.md#authentication). And see [SimpleFile](README.md#simplefile) for an example leveraging events to secure file interactions.

Security notes

- `originAccess` middleware is currently permissive, but placed for future per-form origin allowlists (coming soon).
- All static asset routes set long-lived caching headers where appropriate.

### Theming and styles

- Base viewer styles are scoped to the component. Use `theme-css` or the default theme endpoint to change look/feel.
- For Shadow DOM, use `:host` and selectors like `:host .formio-form ...` to avoid leaking/breaking global styles.
- The component injects a small rule so FA icons inherit the button text color (`currentColor`) in Shadow DOM, ensuring spinners are visible.

### Prefill and read-only

- Set `submission-id` to prefill. The component prefetches the submission and applies data immediately, on the next tick, and once after first render to reduce races with Form.io internals.
- Set `read-only` to render without allowing edits.

### Simplified Embedding Advanced Configuration

When using the simplified embed script, you can provide advanced configuration via the global `ChefsViewerConfig` object:

```html
<script>
  window.ChefsViewerConfig = {
    // Set token and user objects
    token: { sub: 'user123', roles: ['admin'], email: 'user@example.com' },
    user: { name: 'John Doe', department: 'IT' },

    // Before hook - modify configuration before loading
    before: function (element, params) {
      console.log('About to load form:', params);
      element.isolateStyles = true;
    },

    // After hook - add event listeners after form loads
    after: function (element, formioInstance) {
      element.addEventListener('formio:submitDone', function (e) {
        alert('Form submitted successfully!');
        window.location = '/thank-you';
      });
    },
  };
</script>
<script src="/app/embed/chefs-form-viewer-embed.min.js?form-id=YOUR_FORM_ID&api-key=YOUR_API_KEY"></script>
```

### Form Metadata Access

The component provides three ways to access form metadata (name, description, etc.):

#### Method 1: Element Properties (Available after formio:loadSchema)

```javascript
const element = document.querySelector('chefs-form-viewer');
console.log(element.formName); // "Contact Form"
console.log(element.formDescription); // "Submit your inquiry"
console.log(element.formMetadata); // { name: "Contact Form", ... }
```

#### Method 2: Global Event (Dispatched on globalThis)

```javascript
globalThis.addEventListener('chefs-form-viewer:metadata-loaded', function (e) {
  console.log(e.detail.formName); // "Contact Form"
  console.log(e.detail.formDescription); // "Submit your inquiry"
  console.log(e.detail.form); // Full form object
});
```

#### Method 3: Global Callback (Set before script loads)

```javascript
globalThis.ChefsViewerConfig = {
  onMetadataLoaded: function (metadata) {
    console.log(metadata.formName); // "Contact Form"
    console.log(metadata.formDescription); // "Submit your inquiry"
  },
};
```

### Using Token and User in Form.io JavaScript

The `token` and `user` objects you provide are made available in Form.io's evalContext, allowing you to use them in:

- **Conditional Logic**: Show/hide components based on user roles or properties
- **Calculated Values**: Pre-fill fields with user information
- **Custom Validation**: Validate based on user context
- **Advanced Logic**: Any custom JavaScript in Form.io components

> **IMPORTANT SECURITY NOTE**: The `token` parameter is intended for **parsed token data only** (like Keycloak's `tokenParsed` object), not raw authorization tokens. In CHEFS, we pass the parsed JWT payload containing user metadata, roles, and claims - never the base64-encoded JWT string that could be used for API authorization. Follow this same approach: provide only the decoded token payload for Form.io logic, never actual authorization credentials.

> **ANOTHER IMPORTANT SECURITY NOTE**: The `token` parameter is **NOT** the `auth-token`. The `auth-token` is not a user-based token, it is to verify the web component can load this form.

**Examples:**

```javascript
// Conditional display based on user role
show = token.roles && token.roles.includes('my-important-role');

// Pre-fill a field with user email
value = token.email || '';

// Show component only for specific department
show = user.department === 'IT';

// Complex logic combining token and user data
if (token.roles.includes('manager') && user.department === 'HR') {
  value = 'Manager Access Granted';
} else {
  value = 'Standard Access';
}

// INCORRECT: Never pass raw JWT strings
// token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."  // DON'T DO THIS

// CORRECT: Pass parsed token payload only
// token: { sub: "user123", roles: ["admin"], email: "user@gov.bc.ca", ... }
```

### Authorization

The component supports two authentication methods with automatic token refresh capabilities:

#### Authentication Methods

**1. Bearer Token (Preferred)**

- Set via `auth-token` attribute or `authToken` property
- Short-lived JWT token obtained from CHEFS backend
- Automatically refreshes 60 seconds before expiry
- More secure as tokens expire and are refreshed

**Note:** To get an `auth-token`, use your `form-id` and `api-key` to call the token endpoint as shown in the [Requirements](#requirements-must-have) section.

**2. Basic Authentication (Fallback)**

- Set via `api-key` attribute or `apiKey` property
- Uses `form-id:api-key` for Basic auth header
- Static credentials that don't expire
- Less secure as credentials are long-lived

#### Authentication Priority

The component automatically chooses the best available method:

1. **Bearer Token** - If `auth-token` is provided, uses `Authorization: Bearer <token>`
2. **Basic Auth** - If only `api-key` is provided, uses `Authorization: Basic <base64(formId:apiKey)>`
3. **Custom Hook** - If `onBuildAuthHeader` is set, uses custom header function
4. **No Auth** - If neither is provided, requests are sent without authentication

#### Automatic Token Refresh

When using Bearer tokens, the component automatically:

- **Parses JWT expiry** from the token payload
- **Schedules refresh** 60 seconds before expiry (minimum 10 seconds)
- **Refreshes token** by calling `/gateway/v1/auth/refresh` endpoint
- **Updates all requests** with the new token without re-registering plugins
- **Emits events** when tokens are refreshed (`formio:authTokenRefreshed`)

#### Custom Authentication

For advanced scenarios, you can provide a custom authentication function:

```javascript
const viewer = document.querySelector('chefs-form-viewer');
viewer.onBuildAuthHeader = (url) => {
  // Custom logic to determine auth headers
  if (url.includes('/api/')) {
    return { Authorization: 'Bearer custom-token' };
  }
  return {};
};
```

#### Authentication Events

- `formio:authTokenRefreshed` - Fired when token is successfully refreshed
  - Detail: `{ authToken: 'new-token', oldToken: 'previous-token' }`
- `formio:error` - Fired when token refresh fails

#### Security Notes

- **Token Storage**: Tokens are stored in memory only, not persisted
- **Automatic Cleanup**: Refresh timers are cleared when component is destroyed
- **Same-Origin Only**: Authentication only applies to requests to the component's base URL
- **Dynamic Headers**: Auth headers are resolved fresh for each request, ensuring current tokens are used

### SimpleFile

The SimpleFile component provides secure file upload, download, and delete operations with event-based security controls.

**Available Events:**

- `formio:beforeFileUpload` - Fired before file upload with `{ formData, config, action }`
- `formio:beforeFileDownload` - Fired before file download with `{ fileId, config, action }`
- `formio:beforeFileDelete` - Fired before file deletion with `{ fileInfo, fileId, action }`

**Authentication:**
The SimpleFile component automatically uses the component's authentication via the `chefsToken()` function, which returns the current auth header.

**Security Example:**

```js
const viewer = document.querySelector('chefs-form-viewer');

// Example 1: Security check before upload
viewer.addEventListener('formio:beforeFileUpload', (event) => {
  const { formData, config } = event.detail;

  // Security check: file size limit
  const file = formData.get('files');
  if (file.size > 10 * 1024 * 1024) {
    // 10MB limit
    event.preventDefault(); // Cancel the upload
    alert('File too large');
    return;
  }

  // Async security check
  event.detail.waitUntil(
    fetch('/api/security/check-upload-permission')
      .then((res) => res.ok)
      .catch(() => false)
  );
});

// Example 2: Authorization check before download
viewer.addEventListener('formio:beforeFileDownload', (event) => {
  const { fileId } = event.detail;

  // Check user permissions
  if (!currentUser.canDownloadFiles) {
    event.preventDefault();
    return;
  }

  // Async permission check
  event.detail.waitUntil(checkFilePermissions(fileId));
});

// Example 3: Confirmation before delete
viewer.addEventListener('formio:beforeFileDelete', (event) => {
  const { fileId } = event.detail;

  // Show confirmation dialog
  const confirmed = confirm('Are you sure you want to delete this file?');
  if (!confirmed) {
    event.preventDefault();
  }
});
```

### Code Generator and Demos

#### **Embed Code Generator**

Use the interactive code generator at [`/app/embed/chefs-form-viewer-generator.html`](./chefs-form-viewer-generator.html) to:

- Configure all available parameters via a visual form
- Generate embed code for all three methods (embed script, component HTML, programmatic)
- Copy-paste ready code snippets
- Launch live demos with your configuration
- Allows client-side fetching of `auth-token` to launch the embedded demo.

#### **Demo Pages**

- **Interactive Embed Demo**: [`/app/embed/chefs-form-viewer-embed-demo.html`](./chefs-form-viewer-embed-demo.html) - One-line embedding with URL parameters

## Required Parameters

- `form-id`: CHEFS form UUID (required)
- `auth-token`: JWT authentication token (preferred; see below)
- `api-key`: API access key (fallback, only if `auth-token` is not available)

## Optional Parameters

- `submission-id`: Load specific submission (for editing/viewing)
- `read-only`: Render form as read-only (true/false)
- `language`: Form language (en, fr, etc.)
- `base-url`: Override API base URL
- `debug`: Enable debug logging (true/false)
- `isolate-styles`: Use Shadow DOM isolation (true/false)
- `no-icons`: Disable Font Awesome icons (true/false)
- `theme-css`: Custom theme CSS URL
- `token`: URL-encoded JSON JWT token object
- `user`: URL-encoded JSON user object

## Authentication

The embed script requires authentication to access protected forms. You must provide either an `auth-token` (preferred) or an `api-key`.

**auth-token (JWT, Preferred):**

- Pass a JWT as the `auth-token` parameter. This is the recommended method for secure embedding.
- The `auth-token` should be fetched by your backend server using the protected `api-key` and `form-id` via:
  `POST /app/gateway/v1/auth/token/forms/<form-id>`; this endpoint is proteced with CHEFS API Access (Basic Authentication where `username`=`form-id`, `password`=`api-key`)
- The backend should return the short-lived, refreshable token to the frontend for embedding and authenticating form access.

**api-key (Basic Auth, Fallback):**

- Pass your CHEFS API key as the `api-key` parameter only if `auth-token` is not available. This is used for same-origin Basic authentication.

If both `auth-token` and `api-key` are provided, the embed script will use `auth-token`.

## Security Best Practices

- Never expose your `api-key` in client-side code or public repositories.
- Always use your backend to fetch a short-lived `auth-token` and pass it to the frontend for embedding.
- Use HTTPS for all requests and embedding.
  The build process is integrated into the Docker build pipeline:

```dockerfile
# Frontend build (includes theme extraction)
RUN npm run build
# Component minification
RUN npm run build:embed
```

All generated assets are automatically copied to the correct locations for serving by the Express backend.

### Source Code Organization

#### **Source Files** (in `app/frontend/public/embed/`)

These files are stored in source control and copied to `dist/embed/` during build:

| File                                                                       | Purpose                               | HTTP Path                                      |
| -------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------- |
| [`chefs-form-viewer.js`](./chefs-form-viewer.js)                           | Main web component (development)      | `/app/embed/chefs-form-viewer.js`              |
| [`chefs-form-viewer-embed.js`](./chefs-form-viewer-embed.js)               | Simplified embed script (development) | `/app/embed/chefs-form-viewer-embed.js`        |
| [`chefs-form-viewer-generator.html`](./chefs-form-viewer-generator.html)   | Code generator tool                   | `/app/embed/chefs-form-viewer-generator.html`  |
| [`chefs-form-viewer-embed-demo.html`](./chefs-form-viewer-embed-demo.html) | Interactive embed demo                | `/app/embed/chefs-form-viewer-embed-demo.html` |
| [`README.md`](./README.md)                                                 | This documentation                    | `/app/embed/README.md`                         |

#### **Generated Files** (created in `dist/embed/` during build)

These files are **not in source control** and are created by the build process:

| File                                 | Purpose                            | HTTP Path                                       | Created By            |
| ------------------------------------ | ---------------------------------- | ----------------------------------------------- | --------------------- |
| `chefs-form-viewer.min.js`           | Minified component (production)    | `/app/embed/chefs-form-viewer.min.js`           | `npm run build:embed` |
| `chefs-form-viewer-embed.min.js`     | Minified embed script (production) | `/app/embed/chefs-form-viewer-embed.min.js`     | `npm run build:embed` |
| `chefs-form-viewer.min.js.map`       | Source map for debugging           | `/app/embed/chefs-form-viewer.min.js.map`       | `npm run build:embed` |
| `chefs-form-viewer-embed.min.js.map` | Source map for debugging           | `/app/embed/chefs-form-viewer-embed.min.js.map` | `npm run build:embed` |
| `chefs-index.css`                    | Complete CHEFS CSS bundle          | `/app/embed/chefs-index.css`                    | `extract-theme.js`    |
| `chefs-theme.css`                    | CSS variables and theming          | `/app/embed/chefs-theme.css`                    | `extract-theme.js`    |

#### **Build Scripts and Tools**

| File                                                   | Purpose                                        |
| ------------------------------------------------------ | ---------------------------------------------- |
| `app/frontend/scripts/extract-theme.js`                | Orchestrates CSS copying and theme extraction  |
| `app/frontend/src/embed/themeExtractor.js`             | Core theme extraction and CSS processing logic |
| `app/frontend/tests/unit/embed/themeExtractor.spec.js` | Unit tests for theme extraction functionality  |
| `app/frontend/tests/fixtures/chefs-index.fixture.css`  | Test fixture for theme extraction testing      |

#### **For CHEFS Developers**

- **Source files**: Edit files in `app/frontend/public/embed/`
- **Generated files**: Available in `app/frontend/dist/embed/` after running `npm run build`
- **Development**: Use non-minified files (`.js`) for easier debugging
- **Production**: Use minified files (`.min.js`, `.css`) for better performance

#### **For Embedding Developers**

- **All files are served from `/app/embed/`** (or `/pr-####/embed/` in PR environments)
- **CSS and minified JS files are only available after CHEFS build process**
- **Use `.min.js` files in production** for better performance and smaller downloads
- **CSS files (`chefs-index.css`, `chefs-theme.css`) are automatically generated** and contain the complete CHEFS styling

**Note**: Generated files (`.min.js`, `.css`) are created during the build process and are not stored in the source repository.
