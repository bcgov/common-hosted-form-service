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

### Quick start (embed and render)

**Simplified One-Line Embedding**

The easiest way to embed a CHEFS form, inspired by Form.io's approach:

```html
<script src="/app/embed/chefs-form-viewer-embed.min.js?form-id=11111111-1111-1111-1111-111111111111&api-key=YOUR_API_KEY"></script>
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
  api-key="YOUR_API_KEY"
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
  el.apiKey = 'YOUR_API_KEY';
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

Notes

- For production, use the minified script: `/app/embed/chefs-form-viewer.min.js` (generated during build, not in source repo).
- For development, use the non-minified script: `/app/embed/chefs-form-viewer.js`.
- When using dev servers or PR environments, the component auto-detects a base of `/app` or `/pr-####` from `window.location`.

### Attributes (configuration)

- `form-id` (string, required): CHEFS/Form.io form identifier.
- `api-key` (string, required): pairs with `form-id` for same-origin Basic auth.
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

- `load()` → Fetch schema and initialize.
- `reload()` → Destroy then load again.
- `submit()` → Programmatic submit (sets submit key true, posts to backend).
- `draft()` → Programmatic draft (sets submit key false, posts to backend).
- `setSubmission(data)` → Apply data to instance.
- `getSubmission()` → Read current submission from the instance.

### Events

- `formio:beforeLoad` (cancelable)
- `formio:beforeSubmit` (cancelable, supports `waitUntil(promise)`, detail: `{ submission }`)
- `formio:loadSchema` (detail: `{ form, schema }`)
- `formio:beforeInit` (cancelable, supports `waitUntil(promise)`)
- `formio:ready` (detail: `{ form }`)
- `formio:render`, `formio:change`
- `formio:submit` (detail: `{ submission }`)
- `formio:submitDone` (detail: `{ submission }`)
- `formio:error` (detail: `{ error }`)

Cancelable events support `waitUntil(promise)` to gate the action asynchronously. If any pushed promise resolves to `false` or rejects, the action is blocked.

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

### Backend overview (Express routes)

Mounted under `/webcomponents` for complete isolation from `/api`:

- `GET /webcomponents/v1/form-viewer/:formId/schema` → returns `{ form, schema }` for a published form (uses the CHEFS Forms service). Rejects invalid UUIDs.
- `POST /webcomponents/v1/form-viewer/:formId/submit` → posts `{ submission }` to create a submission against the published version. Uses a mock "external" user.
- `GET /webcomponents/v1/form-viewer/components` → serves the built `chefs-form-viewer-components.use.min.js` if present.
- `GET /embed/chefs-index.css` → serves the complete CHEFS CSS bundle (Bootstrap, Vuetify, Form.io, custom styles).
- `GET /embed/chefs-theme.css` → serves CHEFS theme CSS with CSS variables and theming.
- `GET /webcomponents/v1/assets/formio.js` → serves Form.io JavaScript from local node_modules.
- `GET /webcomponents/v1/assets/font-awesome/css/font-awesome.min.css` and `/v1/assets/font-awesome/fonts/:file` → serves Font Awesome CSS/fonts locally.

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

### Using Token and User in Form.io JavaScript

The `token` and `user` objects you provide are made available in Form.io's evalContext, allowing you to use them in:

- **Conditional Logic**: Show/hide components based on user roles or properties
- **Calculated Values**: Pre-fill fields with user information
- **Custom Validation**: Validate based on user context
- **Advanced Logic**: Any custom JavaScript in Form.io components

> **IMPORTANT SECURITY NOTE**: The `token` parameter is intended for **parsed token data only** (like Keycloak's `tokenParsed` object), not raw authorization tokens. In CHEFS, we pass the parsed JWT payload containing user metadata, roles, and claims - never the base64-encoded JWT string that could be used for API authorization. Follow this same approach: provide only the decoded token payload for Form.io logic, never actual authorization credentials.

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

### Authentication

- Default: if requests are same-origin with the detected/overridden `base-url`, the component sends `Authorization: Basic base64(formId:apiKey)`.
- Hook: set `el.onBuildAuthHeader = (url) => ({ Authorization: '...' })` to supply custom headers.

### Endpoints (override if needed)

The component computes defaults from `base-url` (or autodetected base). You can override via `el.endpoints = { ... }` for any of:

- `mainCss`, `formioJs`, `componentsJs`, `themeCss`, `iconsCss`
- `schema`, `submit`, `readSubmission`

Example:

```js
el.endpoints = {
  mainCss: 'https://mycdn.com/custom-chefs-styles.css',
  formioJs: 'https://mycdn.com/formio.js',
  iconsCss:
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
  themeCss: 'https://example.com/theme.css',
};
```

### Code Generator and Demos

#### **Embed Code Generator**

Use the interactive code generator at [`/app/embed/chefs-form-viewer-generator.html`](./chefs-form-viewer-generator.html) to:

- Configure all available parameters via a visual form
- Generate embed code for all three methods (embed script, component HTML, programmatic)
- Copy-paste ready code snippets
- Launch live demos with your configuration

#### **Demo Pages**

- **Interactive Embed Demo**: [`/app/embed/chefs-form-viewer-embed-demo.html`](./chefs-form-viewer-embed-demo.html) - One-line embedding with URL parameters
- **Traditional Component Demo**: [`/app/embed/chefs-form-viewer-demo.html`](./chefs-form-viewer-demo.html) - Direct component usage with attribute toggles and event logging

### Build Process

The CHEFS Form Viewer web component requires a build process to generate production assets and extract theme CSS. This happens automatically during the main CHEFS application build.

#### **Build Steps**

1. **Frontend Build** (`npm run build`)

   - Compiles the main CHEFS application (Vue.js, Vuetify, Bootstrap, etc.)
   - Generates bundled CSS files in `app/frontend/dist/assets/`
   - **Copies all files** from `app/frontend/public/embed/` to `app/frontend/dist/embed/` (standard Vite behavior)

2. **Theme Extraction** (`npm run postbuild` → `extract-theme.js`)

   - Reads the main CSS bundle from `dist/assets/index-*.css`
   - **Generates `chefs-index.css` directly in `dist/embed/`** (complete CHEFS CSS bundle)
   - **Generates `chefs-theme.css` directly in `dist/embed/`** (extracted CSS variables with Shadow DOM compatibility)
   - Processes only `:root` and `[data-bs-theme="light"]` selectors for light theme support

3. **Component Minification** (`npm run postbuild` → `npm run build:embed`)
   - **Minifies `public/embed/chefs-form-viewer.js` → `dist/embed/chefs-form-viewer.min.js`**
   - **Minifies `public/embed/chefs-form-viewer-embed.js` → `dist/embed/chefs-form-viewer-embed.min.js`**
   - Generates source maps for debugging directly in `dist/embed/`

#### **Generated Files**

The build process creates these production assets in `app/frontend/dist/embed/`:

- **`chefs-index.css`**: Complete CHEFS CSS bundle (Bootstrap, Vuetify, Form.io, custom styles)
- **`chefs-theme.css`**: Extracted CSS variables and Shadow DOM compatibility fixes
- **`chefs-form-viewer.min.js`**: Minified web component
- **`chefs-form-viewer-embed.min.js`**: Minified embed script
- **Source maps**: `.min.js.map` files for debugging

**Important**: These files are **generated during build** and are **not stored in source control**. They only exist in `dist/embed/` after running the build process.

#### **Docker Build Integration**

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
| [`chefs-form-viewer-demo.html`](./chefs-form-viewer-demo.html)             | Traditional component demo            | `/app/embed/chefs-form-viewer-demo.html`       |
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
